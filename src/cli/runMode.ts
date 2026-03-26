import path from "node:path";
import chalk from "chalk";
import { runEngine } from "../core/engine/engine";
import { formatHumanResult, formatJsonResult, highestSeverity, severityAtOrAbove } from "../core/output/formatter";
import { CliRunOptions, CommandMode, Severity } from "../core/types";

type RawModeOptions = CliRunOptions & {
  failOn?: Severity | string;
  maxFiles?: number | string;
};

const VALID_SEVERITIES: Severity[] = ["info", "warning", "error", "critical"];

function normalizeFailOn(value: unknown): Severity {
  if (typeof value !== "string") {
    return "error";
  }

  const normalized = value.toLowerCase();
  if (!VALID_SEVERITIES.includes(normalized as Severity)) {
    throw new Error(
      `Invalid --fail-on value '${value}'. Use one of: ${VALID_SEVERITIES.join(", ")}`,
    );
  }

  return normalized as Severity;
}

function normalizeMaxFiles(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

export async function executeModeCommand(
  mode: CommandMode,
  targetPath: string | undefined,
  rawOptions: RawModeOptions,
): Promise<void> {
  try {
    const options: CliRunOptions = {
      ...rawOptions,
      failOn: normalizeFailOn(rawOptions.failOn),
      maxFiles: normalizeMaxFiles(rawOptions.maxFiles),
    };

    const rootPath = path.resolve(process.cwd(), targetPath ?? ".");
    const result = await runEngine(mode, rootPath, options);

    if (options.json) {
      console.log(formatJsonResult(result));
    } else {
      console.log(formatHumanResult(result));
    }

    const threshold = options.failOn ?? "error";
    const allFindings = result.analyses.flatMap((analysis) => analysis.findings);
    const highest = highestSeverity(allFindings);

    if (highest && severityAtOrAbove(highest, threshold)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(chalk.red(`aicheck failed: ${(error as Error).message}`));
    process.exitCode = 2;
  }
}

