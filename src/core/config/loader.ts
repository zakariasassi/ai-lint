import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CONFIG } from "./defaultConfig";
import { AICheckConfig } from "../types";

const CONFIG_FILE_NAME = ".aicheckrc.json";

type LoadConfigResult = {
  config: AICheckConfig;
  configPath: string;
  exists: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T {
  const output = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(extra)) {
    const baseValue = output[key];

    if (isObject(baseValue) && isObject(value)) {
      output[key] = deepMerge(baseValue, value);
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

function normalizeConfig(raw: AICheckConfig): AICheckConfig {
  return {
    ...raw,
    exclude: Array.isArray(raw.exclude) ? raw.exclude : DEFAULT_CONFIG.exclude,
    include: Array.isArray(raw.include) ? raw.include : DEFAULT_CONFIG.include,
    languages: Array.isArray(raw.languages) ? raw.languages : DEFAULT_CONFIG.languages,
    plugins: Array.isArray(raw.plugins) ? raw.plugins : DEFAULT_CONFIG.plugins,
  };
}

export async function loadConfig(cwd: string, customPath?: string): Promise<LoadConfigResult> {
  const configPath = customPath ? path.resolve(cwd, customPath) : path.join(cwd, CONFIG_FILE_NAME);

  try {
    const file = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(file) as Record<string, unknown>;
    const mergedRecord = deepMerge(
      DEFAULT_CONFIG as unknown as Record<string, unknown>,
      parsed,
    );
    const merged = mergedRecord as unknown as AICheckConfig;

    return {
      config: normalizeConfig(merged),
      configPath,
      exists: true,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new Error(`Failed to load config at ${configPath}: ${(error as Error).message}`);
    }

    return {
      config: DEFAULT_CONFIG,
      configPath,
      exists: false,
    };
  }
}

export async function writeDefaultConfig(configPath: string, force = false): Promise<void> {
  try {
    if (!force) {
      await fs.access(configPath);
      throw new Error(`Config already exists at ${configPath}. Use --force to overwrite.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  await fs.writeFile(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf8");
}

export { CONFIG_FILE_NAME };
