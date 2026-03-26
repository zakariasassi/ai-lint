import { CommandMode, Rule } from "../core/types";
import { codeReviewRule } from "./codeReviewRule";
import { securityRule } from "./securityRule";
import { namingConventionRule } from "./namingConventionRule";
import { performanceRule } from "./performanceRule";
import { formattingRule } from "./formattingRule";

export const BUILTIN_RULES: Rule[] = [
  codeReviewRule,
  securityRule,
  namingConventionRule,
  performanceRule,
  formattingRule,
];

export function rulesForMode(mode: CommandMode, extraRules: Rule[] = []): Rule[] {
  return [...BUILTIN_RULES, ...extraRules].filter((rule) => rule.modes.includes(mode));
}

