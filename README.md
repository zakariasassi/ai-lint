# AICheck

AI-powered CLI for code review, fix suggestions, and security scanning.

## Overview

AICheck is inspired by tools like ESLint and Prettier, but adds an AI analysis layer to help teams catch risky patterns, improve maintainability, and automate review workflows.

It supports:
- AI code review (`review`)
- AI-assisted fix suggestions (`fix`)
- security and best-practices scanning (`scan`)
- rules-only fallback mode for offline or no-key environments
- CI-friendly JSON output
- optional Git pre-commit integration

## Installation

### From npm (recommended)

```bash
npm install -g aicheck
```

### From source

```bash
npm install
npm run build
npm link
```

## Quick Start

```bash
aicheck init
export OPENAI_API_KEY="<your_key>"
aicheck review
```

Useful examples:

```bash
aicheck scan --changed
aicheck fix --apply
aicheck review --json --fail-on error
```

## CLI Commands

| Command | Purpose |
|---|---|
| `aicheck init` | Create `.aicheckrc.json` |
| `aicheck init --install-hook` | Install pre-commit hook |
| `aicheck review [target]` | Run code quality review |
| `aicheck fix [target]` | Suggest fixes, optionally apply safe fixes |
| `aicheck scan [target]` | Run security + best-practice scan |

Common flags:
- `--changed` analyze changed files only
- `--staged` analyze staged files only
- `--offline` disable AI provider (rules-only mode)
- `--json` machine-readable output for CI
- `--fail-on <severity>` control CI failure threshold

## Configuration

Create `.aicheckrc.json` via `aicheck init`.

Example:

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

## GitHub Release & npm Publish

This repo includes automated release publishing with GitHub Actions:
- Workflow: `.github/workflows/release.yml`
- Trigger: GitHub Release (`published`) or manual workflow dispatch
- Steps: verify, build, `npm pack --dry-run`, `npm publish --provenance`

Required setup:
1. Create an npm automation token.
2. Add it as repository secret: `NPM_TOKEN`.
3. Ensure release tag matches package version (`vX.Y.Z`).

## Architecture

```text
src/
  cli/         # command definitions and CLI entry wiring
  core/        # config, engine, output, file discovery, cache, hooks
  providers/   # AI provider abstraction + OpenAI + rules-only
  rules/       # built-in static analysis rules
  plugins/     # plugin loading and extension points
```

## License

MIT
