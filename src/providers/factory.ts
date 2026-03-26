import { AICheckConfig, AIProvider } from "../core/types";
import { OpenAIProvider } from "./openaiProvider";
import { RulesOnlyProvider } from "./rulesOnlyProvider";

type ProviderFactoryResult = {
  provider: AIProvider;
  warnings: string[];
};

export function createProvider(
  config: AICheckConfig,
  options: { offline?: boolean } = {},
): ProviderFactoryResult {
  const warnings: string[] = [];

  if (options.offline) {
    warnings.push("Running in offline mode (rules-only).");
    return { provider: new RulesOnlyProvider(), warnings };
  }

  if (config.provider === "openai") {
    const apiKey = process.env[config.apiKeyEnvVar];
    if (!apiKey) {
      warnings.push(
        `Missing ${config.apiKeyEnvVar}; switching to rules-only mode.`,
      );
      return { provider: new RulesOnlyProvider(), warnings };
    }

    return {
      provider: new OpenAIProvider({
        apiKey,
        baseUrl: config.apiBaseUrl,
        model: config.model,
      }),
      warnings,
    };
  }

  warnings.push(
    `Unknown provider '${config.provider}'; switching to rules-only mode.`,
  );
  return { provider: new RulesOnlyProvider(), warnings };
}

