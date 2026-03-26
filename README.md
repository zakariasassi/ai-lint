# AICheck

AI-powered CLI for code review, fix suggestions, and security scanning.

Suggested open-source names:
- AICheck
- Lintelligence
- GuardLint AI

## Features

- `aicheck init` to scaffold `.aicheckrc.json`
- `aicheck review` for code quality analysis
- `aicheck fix` for AI fix suggestions (+ optional safe auto-apply)
- `aicheck scan` for security and best-practice checks
- Config-driven behavior via `.aicheckrc.json`
- Provider abstraction (`openai` now, local models later)
- Git changed-file analysis (`--changed` / `--staged`)
- Optional pre-commit hook (`aicheck init --install-hook`)
- Cache + rate limiting + retries + timeout
- JSON output mode for CI/CD (`--json`)
- Plugin-ready architecture
- Multi-language support: JS, TS, Python

## Project Structure

```text
src/
  cli/
    commands/
      init.ts
      review.ts
      fix.ts
      scan.ts
    runMode.ts
    program.ts
  core/
    cache/
      fileCache.ts
    config/
      defaultConfig.ts
      loader.ts
    engine/
      engine.ts
    files/
      discover.ts
      diff.ts
      language.ts
      chunk.ts
    hooks/
      preCommit.ts
    output/
      formatter.ts
    utils/
      command.ts
      hash.ts
      json.ts
      retry.ts
    rateLimiter.ts
    types.ts
  providers/
    base.ts
    openaiProvider.ts
    rulesOnlyProvider.ts
    factory.ts
  rules/
    helpers.ts
    codeReviewRule.ts
    securityRule.ts
    namingConventionRule.ts
    performanceRule.ts
    formattingRule.ts
    index.ts
  plugins/
    manager.ts
    types.ts
  index.ts
```

## Install

```bash
npm install
npm run build
npm link
```

Now `aicheck` is available globally in your terminal.

## Quick Start

```bash
aicheck init
aicheck review
aicheck scan --changed
aicheck fix --apply
```

## Config

`.aicheckrc.json` example:

```json
{
  "provider": "openai",
  "model": "gpt-5",
  "apiKeyEnvVar": "OPENAI_API_KEY",
  "apiBaseUrl": "https://api.openai.com/v1",
  "rulesOnlyModeOnFailure": true,
  "maxFileSizeKB": 256,
  "chunkSizeChars": 7000,
  "rateLimitRpm": 60,
  "retry": {
    "attempts": 3,
    "delayMs": 800,
    "timeoutMs": 30000
  },
  "cache": {
    "enabled": true,
    "ttlHours": 24,
    "path": ".aicheck/cache.json"
  },
  "rules": {
    "codeReview": true,
    "securityScan": true,
    "namingConvention": "strict",
    "performanceHints": true
  },
  "triggers": {
    "onSave": false,
    "onCommit": true
  },
  "exclude": ["node_modules", "dist", ".git"],
  "include": ["src"],
  "languages": ["javascript", "typescript", "python"],
  "plugins": []
}
```

## Command Reference

### `aicheck init`

Create config file.

```bash
aicheck init
# force overwrite
aicheck init --force
# also install pre-commit hook
aicheck init --install-hook
```

### `aicheck review [target]`

Run code review checks with rules + AI.

```bash
aicheck review
aicheck review ./src --changed --fail-on error
aicheck review --json
```

### `aicheck fix [target]`

Generate fix suggestions and optionally apply safe built-in fixes.

```bash
aicheck fix
aicheck fix --apply
aicheck fix --changed --offline
```

### `aicheck scan [target]`

Run security + best-practice scan.

```bash
aicheck scan
aicheck scan --staged --fail-on critical
```

## JSON Output Example

```json
{
  "mode": "scan",
  "rootPath": "/path/to/repo",
  "configPath": "/path/to/repo/.aicheckrc.json",
  "analyses": [
    {
      "filePath": "/path/to/repo/src/app.ts",
      "language": "typescript",
      "findings": [
        {
          "id": "security-hardcoded-secret-12",
          "source": "rule",
          "ruleId": "security-scan",
          "filePath": "/path/to/repo/src/app.ts",
          "line": 12,
          "message": "Potential hardcoded credential detected.",
          "severity": "critical",
          "suggestion": "Move secrets to environment variables or a secret manager.",
          "category": "security"
        }
      ]
    }
  ],
  "summary": {
    "filesScanned": 1,
    "findingsTotal": 1,
    "bySeverity": {
      "info": 0,
      "warning": 0,
      "error": 0,
      "critical": 1
    },
    "appliedFixes": 0,
    "durationMs": 452
  },
  "warnings": []
}
```

## OpenAI Provider Notes

Set your key:

```bash
export OPENAI_API_KEY="<your_key>"
```

By default AICheck uses:
- `provider: openai`
- `model: gpt-5`
- Responses API endpoint: `/v1/responses`

If the key is missing or provider fails and `rulesOnlyModeOnFailure` is enabled, AICheck gracefully falls back to rules-only mode.

## Plugin System

Add plugin package names or local paths in `plugins`:

```json
{
  "plugins": ["./plugins/my-aicheck-plugin.js"]
}
```

Plugin module shape:

```ts
import type { AICheckPlugin } from "aicheck/plugin-api";

const plugin: AICheckPlugin = {
  name: "my-plugin",
  rules: []
};

export default plugin;
```

## Publish on npm

1. Update `name`, `author`, and `version` in `package.json`.
2. Build and validate:
   ```bash
   npm run clean && npm run build
   npm pack
   ```
3. Login and publish:
   ```bash
   npm login
   npm publish --access public
   ```
4. For scoped packages (`@scope/aicheck`), keep `--access public`.

## Automated npm Release (GitHub Actions)

The repository includes [`.github/workflows/release.yml`](/Users/zakariasassi/Desktop/ai-tooling/.github/workflows/release.yml) for automatic publishing.

Setup:
1. Create an npm automation token from npm account settings.
2. Add repository secret `NPM_TOKEN` in GitHub.
3. Bump `package.json` version.
4. Create a GitHub Release with tag `vX.Y.Z` matching `package.json` version.

What the workflow does:
- Installs dependencies, runs typecheck/build, and verifies release tag.
- Runs `npm pack --dry-run`.
- Publishes to npm with provenance using `npm publish --access public --provenance`.

## License

MIT
