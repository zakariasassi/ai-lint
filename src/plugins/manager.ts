import path from "node:path";
import { AICheckConfig, AICheckPlugin, Rule } from "../core/types";

export type PluginLoadResult = {
  rules: Rule[];
  warnings: string[];
};

async function loadSinglePlugin(pluginName: string, cwd: string): Promise<AICheckPlugin> {
  const isPathLike = pluginName.startsWith(".") || pluginName.startsWith("/");
  const importTarget = isPathLike ? path.resolve(cwd, pluginName) : pluginName;

  const mod = await import(importTarget);
  const plugin = (mod.default ?? mod) as AICheckPlugin;

  if (!plugin || typeof plugin !== "object" || !plugin.name) {
    throw new Error(`Invalid plugin module: ${pluginName}`);
  }

  return plugin;
}

export async function loadPluginRules(config: AICheckConfig, cwd: string): Promise<PluginLoadResult> {
  const rules: Rule[] = [];
  const warnings: string[] = [];

  for (const pluginName of config.plugins) {
    try {
      const plugin = await loadSinglePlugin(pluginName, cwd);

      if (plugin.setup) {
        await plugin.setup({ config });
      }

      if (plugin.rules?.length) {
        rules.push(...plugin.rules);
      }
    } catch (error) {
      warnings.push(`Failed to load plugin '${pluginName}': ${(error as Error).message}`);
    }
  }

  return { rules, warnings };
}
