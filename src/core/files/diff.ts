import path from "node:path";
import { runCommand } from "../utils/command";

function parseGitOutput(output: string, cwd: string): string[] {
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((relativePath) => path.resolve(cwd, relativePath));
}

export async function getChangedFiles(cwd: string, staged = false): Promise<string[]> {
  const args = staged
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"]
    : ["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"];

  try {
    const output = await runCommand("git", args, cwd);
    return parseGitOutput(output, cwd);
  } catch {
    return [];
  }
}
