import { Command } from "commander";
import { executeModeCommand } from "../runMode";

export function registerFixCommand(program: Command): void {
  program
    .command("fix [target]")
    .description("Suggest fixes with AI and optionally apply safe local fixes.")
    .option("-c, --config <path>", "Custom config path")
    .option("--json", "Emit JSON output")
    .option("--changed", "Analyze changed files from git diff")
    .option("--staged", "Analyze staged files only")
    .option("--offline", "Disable AI provider and run rules-only mode")
    .option("--max-files <count>", "Limit number of analyzed files")
    .option("--fail-on <severity>", "Exit with code 1 if threshold is met (default: error)")
    .option("--apply", "Apply safe built-in fixes (formatting cleanup)")
    .action(async (target: string | undefined, options) => {
      await executeModeCommand("fix", target, options);
    });
}

