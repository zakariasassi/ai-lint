import { Finding, Rule, RuleContext } from "../core/types";
import { collectRegexMatches } from "./helpers";

function buildPerformanceFinding(
  context: RuleContext,
  suffix: string,
  line: number,
  message: string,
  suggestion: string,
): Finding {
  return {
    id: `performance-${suffix}-${line}`,
    source: "rule",
    ruleId: "performance-hints",
    filePath: context.filePath,
    line,
    message,
    severity: "warning",
    suggestion,
    category: "performance",
  };
}

export const performanceRule: Rule = {
  id: "performance-hints",
  description: "Detects common performance anti-patterns.",
  modes: ["review", "scan", "fix"],
  async evaluate(context) {
    if (!context.config.rules.performanceHints) {
      return [];
    }

    const findings: Finding[] = [];
    const { content } = context;

    const syncFsMatches = collectRegexMatches(
      content,
      /\bfs\.(readFileSync|writeFileSync|readdirSync|statSync)\s*\(/g,
    );
    for (const match of syncFsMatches) {
      findings.push(
        buildPerformanceFinding(
          context,
          "sync-fs",
          match.line,
          "Synchronous fs API detected.",
          "Use async fs APIs to avoid blocking the event loop.",
        ),
      );
    }

    const nestedLoopMatches = collectRegexMatches(content, /for\s*\([^)]*\)\s*{[\s\S]{0,200}for\s*\(/g);
    for (const match of nestedLoopMatches) {
      findings.push(
        buildPerformanceFinding(
          context,
          "nested-loop",
          match.line,
          "Potential nested loop hotspot detected.",
          "Consider indexing or memoization to reduce time complexity.",
        ),
      );
    }

    const awaitInLoopMatches = collectRegexMatches(
      content,
      /for\s*\([^)]*\)\s*{[\s\S]{0,200}\bawait\b/g,
    );
    for (const match of awaitInLoopMatches) {
      findings.push(
        buildPerformanceFinding(
          context,
          "await-loop",
          match.line,
          "Sequential await in loop detected.",
          "Use Promise.all with bounded concurrency when possible.",
        ),
      );
    }

    return findings;
  },
};

