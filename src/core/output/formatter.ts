import path from "node:path";
import chalk from "chalk";
import { Finding, RunResult, SEVERITY_ORDER, Severity } from "../types";

const SEVERITY_COLOR: Record<Severity, (value: string) => string> = {
  info: chalk.cyan,
  warning: chalk.yellow,
  error: chalk.red,
  critical: chalk.bgRed.white,
};

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_RANK[b] - SEVERITY_RANK[a];
}

function formatFinding(rootPath: string, finding: Finding): string[] {
  const relative = path.relative(rootPath, finding.filePath) || finding.filePath;
  const location = finding.line ? `:${finding.line}${finding.column ? `:${finding.column}` : ""}` : "";
  const severityLabel = finding.severity.toUpperCase().padEnd(8, " ");
  const colorize = SEVERITY_COLOR[finding.severity] ?? ((text: string) => text);

  const lines = [
    `  ${colorize(severityLabel)} ${chalk.bold(relative + location)} ${finding.message} ${chalk.dim(`(${finding.ruleId})`)}`,
  ];

  if (finding.suggestion) {
    lines.push(`    ${chalk.dim("suggestion:")} ${finding.suggestion}`);
  }

  return lines;
}

export function highestSeverity(findings: Finding[]): Severity | undefined {
  if (findings.length === 0) {
    return undefined;
  }

  return findings
    .map((finding) => finding.severity)
    .sort(compareSeverity)[0];
}

export function severityAtOrAbove(current: Severity, threshold: Severity): boolean {
  return SEVERITY_RANK[current] >= SEVERITY_RANK[threshold];
}

export function formatHumanResult(result: RunResult): string {
  const lines: string[] = [];

  lines.push(chalk.bold(`AICheck ${result.mode} report`));
  lines.push(chalk.dim(`Config: ${result.configPath}`));
  lines.push(chalk.dim(`Root:   ${result.rootPath}`));
  lines.push("");

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      lines.push(`${chalk.yellow("WARN")} ${warning}`);
    }
    lines.push("");
  }

  const findings = result.analyses.flatMap((analysis) => analysis.findings);

  if (findings.length === 0) {
    lines.push(chalk.green("No findings."));
  } else {
    const sorted = [...findings].sort((a, b) => {
      const severitySort = compareSeverity(a.severity, b.severity);
      if (severitySort !== 0) {
        return severitySort;
      }

      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }

      return (a.line ?? 0) - (b.line ?? 0);
    });

    for (const finding of sorted) {
      lines.push(...formatFinding(result.rootPath, finding));
    }
  }

  lines.push("");
  lines.push(chalk.bold("Summary"));

  for (const severity of SEVERITY_ORDER) {
    const value = result.summary.bySeverity[severity];
    const colorize = SEVERITY_COLOR[severity] ?? ((text: string) => text);
    lines.push(`  ${colorize(severity.padEnd(8, " "))}: ${value}`);
  }

  lines.push(`  files    : ${result.summary.filesScanned}`);
  lines.push(`  findings : ${result.summary.findingsTotal}`);
  lines.push(`  fixes    : ${result.summary.appliedFixes}`);
  lines.push(`  duration : ${result.summary.durationMs}ms`);

  return lines.join("\n");
}

export function formatJsonResult(result: RunResult): string {
  return JSON.stringify(result, null, 2);
}
