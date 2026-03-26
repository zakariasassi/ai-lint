import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runCommand(command: string, args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 4 * 1024 * 1024,
    });

    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${stderr}`.trim());
  }
}
