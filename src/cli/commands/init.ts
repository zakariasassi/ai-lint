import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { CONFIG_FILE_NAME, writeDefaultConfig } from "../../core/config/loader";
import { installPreCommitHook } from "../../core/hooks/preCommit";

type InitOptions = {
  force?: boolean;
  installHook?: boolean;
};

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create .aicheckrc.json in the current project.")
    .option("-f, --force", "Overwrite existing config")
    .option("--install-hook", "Install pre-commit git hook")
    .action(async (options: InitOptions) => {
      const cwd = process.cwd();
      const configPath = path.join(cwd, CONFIG_FILE_NAME);

      try {
        await writeDefaultConfig(configPath, options.force === true);
        console.log(chalk.green(`Created ${configPath}`));

        if (options.installHook) {
          const hookPath = await installPreCommitHook(cwd);
          console.log(chalk.green(`Installed pre-commit hook at ${hookPath}`));
        }

        console.log("");
        console.log(`Next steps:`);
        console.log(`  1. Set OPENAI_API_KEY in your environment.`);
        console.log(`  2. Run 'aicheck review' to analyze your project.`);
      } catch (error) {
        console.error(chalk.red(`aicheck init failed: ${(error as Error).message}`));
        process.exitCode = 2;
      }
    });
}

