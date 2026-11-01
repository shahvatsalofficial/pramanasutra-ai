<div align="center">

# PramanaSutra AI

### AI QA & release-readiness agent for Claude Code, Cursor, Codex, GitHub Copilot & Gemini CLI

**Test Everything. Prove Quality. Release Confidently.** Evidence-first QA review with `file:line` proof. No extra API key.

[![CI](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml)
[![CodeQL](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

</div>

---

PramanaSutra AI (from *pramana*, "valid proof") is an open-source **AI QA engineer and release-readiness agent**. It ships 17 portable [Agent Skills](https://agentskills.io/specification), led by **PramanaSutra Prime**, plus a **deterministic, offline CLI** that statically audits a repository's test hygiene, ingests test-run evidence, and issues a conservative release gate: `NO_GO`, `REVIEW_REQUIRED` or `READY_FOR_HUMAN_APPROVAL`.

> **No extra API key.** Inside a supported AI IDE, the skills use that IDE's own model. The CLI is offline, read-only on the scanned project, never executes its tests, and has no telemetry.

Created by **[Vatsal Shah](https://github.com/shahvatsalofficial)**. Apache-2.0.

## Why

| Problem | What PramanaSutra does |
|---|---|
| AI says "all tests pass" without running anything | Static findings and executed evidence are kept separate; the gate never goes green without valid evidence |
| `test.only` / skipped tests slip into main | Rules flag focused and skipped tests (JS/TS, pytest, unittest, JUnit, Go) with `file:line` |
| "Green" dashboards hide what was not checked | Capabilities are reported as `executed` / `not-run` / `not-supported` |
| Another tool, another key, another bill | Zero runtime dependencies, offline, no key |

## 60-second start

Requires Node.js 20+.

```bash
# audit any repo: read-only, offline
npx github:shahvatsalofficial/pramanasutra-ai release-check --path . --out reports

# install the skills for your AI IDE
npx github:shahvatsalofficial/pramanasutra-ai init --ide claude --target .
```

Then ask your assistant:

> PramanaSutra Prime: assess this repository's test quality and release readiness. Stay read-only, cite file and line, separate observed facts from executed results, and ask before running any tests.

From a clone:

```bash
node packages/cli/bin/pramanasutra.mjs doctor
node packages/cli/bin/pramanasutra.mjs release-check --path examples/sample-app --out reports/demo   # exit 2 = NO_GO (intentional)
node packages/cli/bin/pramanasutra.mjs verify --evidence examples/evidence/passing.json
npm test
```

## Release gate

| Decision | Exit | Meaning |
|---|---|---|
| `NO_GO` | 2 | Focused tests, or supplied evidence shows failures |
| `REVIEW_REQUIRED` | 3 | Evidence missing/unverified/inconclusive, or no tests/CI/license, or incomplete scan |
| `READY_FOR_HUMAN_APPROVAL` | 0 | Passing `local-executed`/`ci-ingested` evidence **and** clean static checks. A human still approves. Never an automatic deploy |

```bash
pramanasutra release-check --path . --evidence test-evidence.json
```

Evidence schema: [report-schema](docs/report-schema.md). Details: [quality gates](docs/quality-gates.md).

## The agent team

`pramanasutra-prime` (orchestrator) plus `strategy`, `unit`, `flow`, `api`, `visual`, `access`, `load`, `data`, `secure`, `regression`, `flake`, `defect`, `pipeline`, `release`, `evidence`, `verify`. Canonical sources live in [`.agents/skills`](.agents/skills); catalog in [agent-catalog](docs/agent-catalog.md).

## CLI

| Command | Purpose |
|---|---|
| `doctor` | Environment check |
| `agents list` | List bundled skills |
| `scan --path <dir> [--out <dir>]` | Static QA audit; JSON, Markdown, escaped HTML reports |
| `release-check --path <dir> [--evidence <file>]` | Scan plus release gate (exit codes above) |
| `verify --evidence <file>` | Validate an evidence file |
| `init --ide <claude\|cursor\|codex\|gemini\|copilot\|generic\|all> --target <dir>` | Copy skills; refuses to overwrite without `--force` |

## Supported hosts

| Host | Skill path | Verified in live host? |
|---|---|---|
| Claude Code | `.claude/skills` | No |
| Cursor | `.cursor/skills` | No |
| OpenAI Codex | `.agents/skills` | No |
| GitHub Copilot | `.github/skills` | No |
| Gemini CLI | `.gemini/skills` | No |

## Security

Scan is read-only on the target, skips symlinks, never runs project scripts, caps file size and count, and escapes all HTML. See [execution safety](docs/execution-safety.md), [trust model](docs/trust-model.md) and [SECURITY.md](SECURITY.md).

## Limitations

- Heuristic rules, not a parser; expect false positives and negatives.
- Does **not** run tests, browsers, load tests, accessibility or security scanners. Those are *planned* ([status](docs/status.md)).
- Does not certify quality, security or compliance.
- Cross-OS CI is configured; results appear in the Actions tab once run.

## FAQ

**Is this a testing framework?** No. It reviews test hygiene and release evidence, and guides your AI assistant; it complements Jest, pytest, JUnit, Playwright and others.

**Does it send my code anywhere?** No. The CLI makes no network calls.

**How do I cite it?** See [CITATION.cff](CITATION.cff).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md) and [GOVERNANCE.md](GOVERNANCE.md). The full engineering spec is [docs/master-claude-prompt.md](docs/master-claude-prompt.md). Machine-readable summary: [llms.txt](llms.txt).
