import { ProviderFinding, ProviderResponse, Severity } from "../core/types";
import { extractFirstJsonObject } from "../core/utils/json";

const ALLOWED_SEVERITY = new Set<Severity>(["info", "warning", "error", "critical"]);

type RawProviderPayload = {
  findings?: ProviderFinding[];
  summary?: string;
};

function normalizeSeverity(value: unknown): Severity {
  if (typeof value === "string" && ALLOWED_SEVERITY.has(value as Severity)) {
    return value as Severity;
  }

  return "warning";
}

function normalizeFindings(payload: RawProviderPayload): ProviderFinding[] {
  if (!Array.isArray(payload.findings)) {
    return [];
  }

  const findings: ProviderFinding[] = [];
  for (const item of payload.findings) {
    if (!item || typeof item.message !== "string") {
      continue;
    }

    findings.push({
      message: item.message.trim(),
      severity: normalizeSeverity(item.severity),
      line: typeof item.line === "number" ? item.line : undefined,
      column: typeof item.column === "number" ? item.column : undefined,
      suggestion: typeof item.suggestion === "string" ? item.suggestion : undefined,
      category: typeof item.category === "string" ? item.category : undefined,
    });
  }

  return findings;
}

export function parseProviderText(rawText: string): ProviderResponse {
  const parsed = extractFirstJsonObject(rawText);
  const payload = (parsed ?? {}) as RawProviderPayload;
  const findings = normalizeFindings(payload);
  const summary = typeof payload.summary === "string" ? payload.summary : undefined;

  return {
    findings,
    summary,
    rawText,
  };
}

export function buildSystemInstruction(taskName: string): string {
  return [
    `You are AICheck, an assistant for ${taskName}.`,
    "Return strict JSON only.",
    "Format:",
    '{"findings":[{"message":"...","severity":"info|warning|error|critical","line":1,"column":1,"suggestion":"...","category":"..."}],"summary":"..."}',
    "Never include markdown fences.",
  ].join(" ");
}

