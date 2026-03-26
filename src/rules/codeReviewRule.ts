import { Finding, Rule, RuleContext } from "../core/types";
import { collectRegexMatches } from "./helpers";

function buildFinding(
  context: RuleContext,
  suffix: string,
  line: number,
  message: string,
  severity: Finding["severity"],
  suggestion?: string,
): Finding {
  return {
    id: `code-review-${suffix}-${line}`,
    source: "rule",
    ruleId: "code-review",
    filePath: context.filePath,
    line,
    message,
    severity,
    suggestion,
    category: "quality",
  };
}

export const codeReviewRule: Rule = {
  id: "code-review",
  description: "Basic static code review checks.",
  modes: ["review", "fix"],
  async evaluate(context) {
    if (!context.config.rules.codeReview) {
      return [];
    }

    const findings: Finding[] = [];
    const { content } = context;

    const consoleLogMatches = collectRegexMatches(content, /console\.log\s*\(/g);
    for (const match of consoleLogMatches) {
      findings.push(
        buildFinding(
          context,
          "console-log",
          match.line,
          "console.log detected in source file.",
          "warning",
          "Remove debug logs or replace with structured logger.",
        ),
      );
    }

    const todoMatches = collectRegexMatches(content, /\b(TODO|FIXME)\b/g);
    for (const match of todoMatches) {
      findings.push(
        buildFinding(
          context,
          "todo",
          match.line,
          "TODO/FIXME marker found.",
          "info",
          "Track this item in an issue and link its reference.",
        ),
      );
    }

    if (context.language === "typescript") {
      const anyMatches = collectRegexMatches(content, /:\s*any\b/g);
      for (const match of anyMatches) {
        findings.push(
          buildFinding(
            context,
            "any-type",
            match.line,
            "TypeScript any type detected.",
            "warning",
            "Replace 'any' with a concrete type or a generic constraint.",
          ),
        );
      }
    }

    const totalLines = content.split("\n").length;
    if (totalLines > 600) {
      findings.push(
        buildFinding(
          context,
          "large-file",
          1,
          `Large file detected (${totalLines} lines).`,
          "warning",
          "Split this file into smaller modules to simplify maintenance.",
        ),
      );
    }

    return findings;
  },
};

