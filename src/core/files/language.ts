import path from "node:path";
import { Language } from "../types";

const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".py": "python",
};

export function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] ?? "unknown";
}

export function getSupportedExtensions(languages: Language[]): Set<string> {
  const output = new Set<string>();

  for (const [extension, language] of Object.entries(EXTENSION_LANGUAGE_MAP)) {
    if (languages.includes(language)) {
      output.add(extension);
    }
  }

  return output;
}

export function isSupportedFile(filePath: string, languages: Language[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const supported = getSupportedExtensions(languages);
  return supported.has(ext);
}
