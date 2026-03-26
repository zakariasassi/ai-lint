import { Command } from "commander";
import { executeModeCommand } from "../runMode";

export function registerReviewCommand(program: Command): void {
  program
    .command("review [target]")
    .description("Analyze codebase for code review findings using rules + AI.")
    .option("-c, --config <path>", "Custom config path")
    .option("--json", "Emit JSON output")
    .option("--changed", "Analyze changed files from git diff")
    .option("--staged", "Analyze staged files only")
    .option("--offline", "Disable AI provider and run rules-only mode")
    .option("--max-files <count>", "Limit number of analyzed files")
    .option("--fail-on <severity>", "Exit with code 1 if threshold is met (default: error)")
    .action(async (target: string | undefined, options) => {
      await executeModeCommand("review", target, options);
    });
}

