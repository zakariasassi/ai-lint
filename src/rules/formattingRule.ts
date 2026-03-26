import { Finding, Rule } from "../core/types";

export const formattingRule: Rule = {
  id: "formatting",
  description: "Safe formatting cleanup (trailing spaces + EOF newline).",
  modes: ["fix"],
  async evaluate(context) {
    const lines = context.content.split("\n");
    const normalizedLines = lines.map((line) => line.replace(/[ \t]+$/g, ""));
    let normalized = normalizedLines.join("\n");

    if (!normalized.endsWith("\n")) {
      normalized += "\n";
    }

    if (normalized === context.content) {
      return [];
    }

    const finding: Finding = {
      id: `formatting-cleanup-${context.filePath}`,
      source: "rule",
      ruleId: "formatting",
      filePath: context.filePath,
      severity: "info",
      message: "Formatting cleanup is available.",
      suggestion: "Run 'aicheck fix --apply' to apply safe formatting changes.",
      category: "formatting",
      fix: {
        kind: "replace-file",
        replacement: normalized,
        description: "Trim trailing spaces and ensure newline at EOF.",
      },
    };

    return [finding];
  },
};

