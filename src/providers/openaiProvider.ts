import { AIProvider, AIRequest, ProviderResponse } from "../core/types";
import { buildSystemInstruction, parseProviderText } from "./base";

type OpenAIProviderOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

function buildUserPrompt(mode: "review" | "fix" | "security", request: AIRequest): string {
  const goalByMode: Record<typeof mode, string> = {
    review:
      "Perform a concise code review focused on readability, correctness risks, and maintainability.",
    fix: "Suggest practical fixes and refactors for the code chunk.",
    security: "Perform security analysis with severity and remediation guidance.",
  };

  return [
    goalByMode[mode],
    `File: ${request.filePath}`,
    `Language: ${request.language}`,
    `Chunk: ${request.chunkIndex + 1}/${request.totalChunks}`,
    "Code:",
    request.content,
  ].join("\n");
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const asRecord = payload as Record<string, unknown>;
  if (typeof asRecord.output_text === "string") {
    return asRecord.output_text;
  }

  const output = asRecord.output;
  if (!Array.isArray(output)) {
    return "";
  }

  const chunks: string[] = [];
  for (const outputItem of output) {
    if (!outputItem || typeof outputItem !== "object") {
      continue;
    }

    const content = (outputItem as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") {
        chunks.push(text);
      }
    }
  }

  return chunks.join("\n").trim();
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly options: OpenAIProviderOptions) {}

  private async request(
    mode: "review" | "fix" | "security",
    request: AIRequest,
  ): Promise<ProviderResponse> {
    const response = await fetch(`${this.options.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: this.options.model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: buildSystemInstruction(mode) }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: buildUserPrompt(mode, request) }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as unknown;
    const rawText = extractOutputText(payload);
    return parseProviderText(rawText);
  }

  async analyzeCode(input: AIRequest): Promise<ProviderResponse> {
    return this.request("review", input);
  }

  async suggestFixes(input: AIRequest): Promise<ProviderResponse> {
    return this.request("fix", input);
  }

  async securityScan(input: AIRequest): Promise<ProviderResponse> {
    return this.request("security", input);
  }
}

