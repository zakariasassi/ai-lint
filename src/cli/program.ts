import { Command } from "commander";
import pkg from "../../package.json";
import { registerInitCommand } from "./commands/init";
import { registerReviewCommand } from "./commands/review";
import { registerFixCommand } from "./commands/fix";
import { registerScanCommand } from "./commands/scan";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("aicheck")
    .description("AI-powered code review, fix suggestions, and security scan CLI.")
    .version(pkg.version);

  registerInitCommand(program);
  registerReviewCommand(program);
  registerFixCommand(program);
  registerScanCommand(program);

  return program;
}

