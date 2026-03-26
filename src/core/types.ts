export const SEVERITY_ORDER = ["info", "warning", "error", "critical"] as const;

export type Severity = (typeof SEVERITY_ORDER)[number];
export type CommandMode = "review" | "fix" | "scan";
export type SourceType = "rule" | "ai";

export interface FixEdit {
  kind: "replace-file";
  replacement: string;
  description?: string;
}

export interface Finding {
  id: string;
  source: SourceType;
  ruleId: string;
  filePath: string;
  message: string;
  severity: Severity;
  line?: number;
  column?: number;
  suggestion?: string;
  category?: string;
  fix?: FixEdit;
}

export interface ProviderFinding {
  message: string;
  severity?: Severity;
  line?: number;
  column?: number;
  suggestion?: string;
  category?: string;
}

export interface AIRequest {
  filePath: string;
  language: Language;
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface ProviderResponse {
  findings: ProviderFinding[];
  summary?: string;
  rawText?: string;
}

export interface AIProvider {
  readonly name: string;
  analyzeCode(input: AIRequest): Promise<ProviderResponse>;
  suggestFixes(input: AIRequest): Promise<ProviderResponse>;
  securityScan(input: AIRequest): Promise<ProviderResponse>;
}

export interface RetryConfig {
  attempts: number;
  delayMs: number;
  timeoutMs: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlHours: number;
  path: string;
}

export interface RuleConfig {
  codeReview: boolean;
  securityScan: boolean;
  namingConvention: "off" | "relaxed" | "strict";
  performanceHints: boolean;
}

export interface TriggerConfig {
  onSave: boolean;
  onCommit: boolean;
}

export interface AICheckConfig {
  provider: string;
  model: string;
  apiKeyEnvVar: string;
  apiBaseUrl: string;
  rulesOnlyModeOnFailure: boolean;
  maxFileSizeKB: number;
  chunkSizeChars: number;
  rateLimitRpm: number;
  retry: RetryConfig;
  cache: CacheConfig;
  rules: RuleConfig;
  triggers: TriggerConfig;
  exclude: string[];
  include: string[];
  languages: Language[];
  plugins: string[];
}

export interface CliRunOptions {
  configPath?: string;
  json?: boolean;
  changed?: boolean;
  staged?: boolean;
  offline?: boolean;
  apply?: boolean;
  failOn?: Severity;
  maxFiles?: number;
}

export type Language = "javascript" | "typescript" | "python" | "unknown";

export interface RuleContext {
  filePath: string;
  language: Language;
  content: string;
  config: AICheckConfig;
  mode: CommandMode;
}

export interface Rule {
  id: string;
  description: string;
  modes: CommandMode[];
  evaluate(context: RuleContext): Promise<Finding[]>;
}

export interface PluginContext {
  config: AICheckConfig;
}

export interface AICheckPlugin {
  name: string;
  rules?: Rule[];
  setup?(context: PluginContext): Promise<void> | void;
}

export interface FileAnalysis {
  filePath: string;
  language: Language;
  findings: Finding[];
}

export interface RunSummary {
  filesScanned: number;
  findingsTotal: number;
  bySeverity: Record<Severity, number>;
  appliedFixes: number;
  durationMs: number;
}

export interface RunResult {
  mode: CommandMode;
  rootPath: string;
  configPath: string;
  analyses: FileAnalysis[];
  summary: RunSummary;
  warnings: string[];
}
