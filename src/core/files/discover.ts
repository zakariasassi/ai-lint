import fs from "node:fs/promises";
import path from "node:path";
import { AICheckConfig } from "../types";
import { isSupportedFile } from "./language";

function normalizeRelative(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function shouldExclude(relativePath: string, exclude: string[]): boolean {
  const normalized = normalizeRelative(relativePath);

  for (const pattern of exclude) {
    const clean = normalizeRelative(pattern).replace(/^\.\//, "").replace(/\/+$/, "");

    if (!clean) {
      continue;
    }

    if (
      normalized === clean ||
      normalized.startsWith(`${clean}/`) ||
      normalized.includes(`/${clean}/`)
    ) {
      return true;
    }
  }

  return false;
}

async function walkDirectory(
  currentPath: string,
  projectRoot: string,
  config: AICheckConfig,
  output: Set<string>,
): Promise<void> {
  let entries;

  try {
    entries = await fs.readdir(currentPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolute = path.join(currentPath, entry.name);
    const relative = path.relative(projectRoot, absolute);

    if (shouldExclude(relative, config.exclude)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(absolute, projectRoot, config, output);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!isSupportedFile(absolute, config.languages)) {
      continue;
    }

    const stat = await fs.stat(absolute);
    if (stat.size > config.maxFileSizeKB * 1024) {
      continue;
    }

    output.add(absolute);
  }
}

export async function discoverFiles(projectRoot: string, config: AICheckConfig): Promise<string[]> {
  const files = new Set<string>();
  const includeRoots = config.include.length > 0 ? config.include : ["."];

  for (const includePath of includeRoots) {
    const absolute = path.resolve(projectRoot, includePath);
    await walkDirectory(absolute, projectRoot, config, files);
  }

  return [...files].sort((a, b) => a.localeCompare(b));
}
