import { Finding, Rule, RuleContext } from "../core/types";
import { collectRegexMatches } from "./helpers";

function isCamelCase(name: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isSnakeCase(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name);
}

function toCamelCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_-]+([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function buildNamingFinding(
  context: RuleContext,
  line: number,
  message: string,
  severity: Finding["severity"],
  suggestion: string,
): Finding {
  return {
    id: `naming-${line}-${message}`,
    source: "rule",
    ruleId: "naming-convention",
    filePath: context.filePath,
    line,
    message,
    severity,
    suggestion,
    category: "style",
  };
}

export const namingConventionRule: Rule = {
  id: "naming-convention",
  description: "Checks naming style conventions.",
  modes: ["review", "fix"],
  async evaluate(context) {
    const mode = context.config.rules.namingConvention;
    if (mode === "off") {
      return [];
    }

    const severity: Finding["severity"] = mode === "strict" ? "error" : "warning";
    const findings: Finding[] = [];
    const { content } = context;

    if (context.language === "javascript" || context.language === "typescript") {
      const declarationRegex =
        /\b(?:const|let|var|function)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
      const matches = collectRegexMatches(content, declarationRegex);

      for (const match of matches) {
        const name = match.value.replace(/\b(?:const|let|var|function)\s+/, "").trim();
        if (name && !isCamelCase(name)) {
          findings.push(
            buildNamingFinding(
              context,
              match.line,
              `Identifier '${name}' does not follow camelCase.`,
              severity,
              `Rename to '${toCamelCase(name)}'.`,
            ),
          );
        }
      }
    }

    if (context.language === "python") {
      const declarationRegex = /\b(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
      const matches = collectRegexMatches(content, declarationRegex);

      for (const match of matches) {
        const name = match.value.replace(/\b(?:def|class)\s+/, "").trim();
        if (name && !isSnakeCase(name) && !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
          findings.push(
            buildNamingFinding(
              context,
              match.line,
              `Identifier '${name}' does not follow snake_case.`,
              severity,
              `Rename to '${toSnakeCase(name)}'.`,
            ),
          );
        }
      }
    }

    return findings;
  },
};

