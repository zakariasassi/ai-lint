import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/loader";
import { FileCache } from "../cache/fileCache";
import { chunkText } from "../files/chunk";
import { discoverFiles } from "../files/discover";
import { getChangedFiles } from "../files/diff";
import { detectLanguage } from "../files/language";
import { RateLimiter } from "../rateLimiter";
import {
  CliRunOptions,
  CommandMode,
  Finding,
  ProviderFinding,
  ProviderResponse,
  RunResult,
  Severity,
} from "../types";
import { sha256 } from "../utils/hash";
import { withRetry, withTimeout } from "../utils/retry";
import { createProvider } from "../../providers/factory";
import { loadPluginRules } from "../../plugins/manager";
import { rulesForMode } from "../../rules";

function emptySeverityCounts(): Record<Severity, number> {
  return {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };
}

function toAIFindings(
  filePath: string,
  mode: CommandMode,
  chunkIndex: number,
  providerFindings: ProviderFinding[],
): Finding[] {
  return providerFindings
    .filter((item) => Boolean(item.message))
    .map((item, index) => ({
      id: `ai-${mode}-${chunkIndex}-${index}-${item.line ?? 0}`,
      source: "ai",
      ruleId: `ai-${mode}`,
      filePath,
      message: item.message,
      severity: item.severity ?? "warning",
      line: item.line,
      column: item.column,
      suggestion: item.suggestion,
      category: item.category ?? mode,
    }));
}

function buildCacheKey(
  providerName: string,
  model: string,
  mode: CommandMode,
  filePath: string,
  chunkIndex: number,
  chunk: string,
): string {
  return sha256(
    JSON.stringify({
      providerName,
      model,
      mode,
      filePath,
      chunkIndex,
      chunk,
    }),
  );
}

async function applySafeFixIfAvailable(
  filePath: string,
  sourceContent: string,
  findings: Finding[],
): Promise<{ content: string; applied: boolean }> {
  const lastFixable = [...findings]
    .reverse()
    .find((finding) => finding.fix?.kind === "replace-file");

  if (!lastFixable?.fix) {
    return { content: sourceContent, applied: false };
  }

  if (lastFixable.fix.replacement === sourceContent) {
    return { content: sourceContent, applied: false };
  }

  await fs.writeFile(filePath, lastFixable.fix.replacement, "utf8");
  return { content: lastFixable.fix.replacement, applied: true };
}

export async function runEngine(
  mode: CommandMode,
  rootPath: string,
  options: CliRunOptions,
): Promise<RunResult> {
  const startedAt = Date.now();
  const warnings: string[] = [];
  const { config, configPath, exists } = await loadConfig(rootPath, options.configPath);

  if (!exists) {
    warnings.push(`Config not found. Using defaults (${configPath}).`);
  }

  const { provider, warnings: providerWarnings } = createProvider(config, {
    offline: options.offline,
  });
  warnings.push(...providerWarnings);

  const pluginResult = await loadPluginRules(config, rootPath);
  warnings.push(...pluginResult.warnings);

  const activeRules = rulesForMode(mode, pluginResult.rules);
  const cache = new FileCache(
    path.resolve(rootPath, config.cache.path),
    config.cache.ttlHours,
    config.cache.enabled,
  );
  await cache.load();

  const limiter = new RateLimiter(config.rateLimitRpm);
  let candidateFiles = await discoverFiles(rootPath, config);

  if (options.changed || options.staged) {
    const changedFiles = new Set(
      await getChangedFiles(rootPath, options.staged === true),
    );
    candidateFiles = candidateFiles.filter((filePath) => changedFiles.has(filePath));
  }

  if (typeof options.maxFiles === "number" && options.maxFiles > 0) {
    candidateFiles = candidateFiles.slice(0, options.maxFiles);
  }

  const analyses: RunResult["analyses"] = [];
  let appliedFixes = 0;

  for (const filePath of candidateFiles) {
    const originalContent = await fs.readFile(filePath, "utf8");
    const language = detectLanguage(filePath);
    let content = originalContent;

    const ruleFindings: Finding[] = [];

    for (const rule of activeRules) {
      const findings = await rule.evaluate({
        filePath,
        language,
        content,
        config,
        mode,
      });
      ruleFindings.push(...findings);
    }

    if (mode === "fix" && options.apply) {
      const fixResult = await applySafeFixIfAvailable(filePath, content, ruleFindings);
      if (fixResult.applied) {
        appliedFixes += 1;
        content = fixResult.content;
      }
    }

    const aiFindings: Finding[] = [];
    if (provider.name !== "rules-only") {
      const chunks = chunkText(content, config.chunkSizeChars);
      const callProvider =
        mode === "scan"
          ? provider.securityScan.bind(provider)
          : mode === "fix"
            ? provider.suggestFixes.bind(provider)
            : provider.analyzeCode.bind(provider);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex];
        const cacheKey = buildCacheKey(
          provider.name,
          config.model,
          mode,
          filePath,
          chunkIndex,
          chunk,
        );
        const cached = cache.get<ProviderResponse>(cacheKey);

        if (cached) {
          aiFindings.push(
            ...toAIFindings(filePath, mode, chunkIndex, cached.findings),
          );
          continue;
        }

        try {
          const response = await limiter.schedule(async () =>
            withRetry(
              () =>
                withTimeout(
                  callProvider({
                    filePath,
                    language,
                    content: chunk,
                    chunkIndex,
                    totalChunks: chunks.length,
                  }),
                  config.retry.timeoutMs,
                ),
              config.retry.attempts,
              config.retry.delayMs,
            ),
          );

          cache.set(cacheKey, response);
          aiFindings.push(
            ...toAIFindings(filePath, mode, chunkIndex, response.findings),
          );
        } catch (error) {
          if (!config.rulesOnlyModeOnFailure) {
            throw error;
          }

          warnings.push(
            `AI provider failed for ${path.relative(rootPath, filePath)}: ${(error as Error).message}`,
          );
          break;
        }
      }
    }

    analyses.push({
      filePath,
      language,
      findings: [...ruleFindings, ...aiFindings],
    });
  }

  await cache.save();

  const bySeverity = emptySeverityCounts();
  let findingsTotal = 0;

  for (const analysis of analyses) {
    for (const finding of analysis.findings) {
      bySeverity[finding.severity] += 1;
      findingsTotal += 1;
    }
  }

  return {
    mode,
    rootPath,
    configPath,
    analyses,
    summary: {
      filesScanned: analyses.length,
      findingsTotal,
      bySeverity,
      appliedFixes,
      durationMs: Date.now() - startedAt,
    },
    warnings,
  };
}

