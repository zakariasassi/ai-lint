import { AIProvider, AIRequest, ProviderResponse } from "../core/types";

const EMPTY_RESPONSE: ProviderResponse = {
  findings: [],
  summary: "rules-only mode",
};

export class RulesOnlyProvider implements AIProvider {
  readonly name = "rules-only";

  async analyzeCode(_input: AIRequest): Promise<ProviderResponse> {
    return EMPTY_RESPONSE;
  }

  async suggestFixes(_input: AIRequest): Promise<ProviderResponse> {
    return EMPTY_RESPONSE;
  }

  async securityScan(_input: AIRequest): Promise<ProviderResponse> {
    return EMPTY_RESPONSE;
  }
}

