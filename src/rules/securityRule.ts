import { Finding, Rule, RuleContext } from "../core/types";
import { collectRegexMatches } from "./helpers";

function buildSecurityFinding(
  context: RuleContext,
  suffix: string,
  line: number,
  message: string,
  severity: Finding["severity"],
  suggestion: string,
): Finding {
  return {
    id: `security-${suffix}-${line}`,
    source: "rule",
    ruleId: "security-scan",
    filePath: context.filePath,
    line,
    message,
    severity,
    suggestion,
    category: "security",
  };
}

export const securityRule: Rule = {
  id: "security-scan",
  description: "Security-focused static analysis checks.",
  modes: ["scan", "review", "fix"],
  async evaluate(context) {
    if (!context.config.rules.securityScan) {
      return [];
    }

    const findings: Finding[] = [];
    const { content } = context;

    const secretMatches = collectRegexMatches(
      content,
      /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"']{8,}["']/gi,
    );
    for (const match of secretMatches) {
      findings.push(
        buildSecurityFinding(
          context,
          "hardcoded-secret",
          match.line,
          "Potential hardcoded credential detected.",
          "critical",
          "Move secrets to environment variables or a secret manager.",
        ),
      );
    }

    const evalMatches = collectRegexMatches(content, /\beval\s*\(/g);
    for (const match of evalMatches) {
      findings.push(
        buildSecurityFinding(
          context,
          "eval",
          match.line,
          "Use of eval() is unsafe.",
          "critical",
          "Replace eval() with a safe parser or explicit control flow.",
        ),
      );
    }

    const functionCtorMatches = collectRegexMatches(content, /\bnew Function\s*\(/g);
    for (const match of functionCtorMatches) {
      findings.push(
        buildSecurityFinding(
          context,
          "function-ctor",
          match.line,
          "Dynamic Function constructor detected.",
          "error",
          "Avoid dynamic code execution paths.",
        ),
      );
    }

    const insecureHttpMatches = collectRegexMatches(content, /http:\/\//g);
    for (const match of insecureHttpMatches) {
      findings.push(
        buildSecurityFinding(
          context,
          "http",
          match.line,
          "Insecure HTTP URL detected.",
          "warning",
          "Use HTTPS unless this endpoint is guaranteed to be local-only.",
        ),
      );
    }

    return findings;
  },
};

