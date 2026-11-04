<div align="center">

# PramanaSutra AI

### AI QA & release-readiness agent for Claude Code, Cursor, Codex, GitHub Copilot & Gemini CLI

**Test Everything. Prove Quality. Release Confidently.** Evidence-first QA review with `file:line` proof. No extra API key.

[![CI](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml)
[![CodeQL](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)
![Tests](https://img.shields.io/badge/tests-32%20passing-brightgreen)

[**Documentation site**](https://shahvatsalofficial.github.io/pramanasutra-ai/) &middot; [Handbook](docs/handbook/README.md) &middot; [Proof and test results](docs/handbook/08-testing-and-proof.md) &middot; [Sample report](examples/sample-output/focused-test/report.md)

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

## Proof, not promises

| Evidence | Result |
|---|---|
| Automated tests (`npm test`) | **34 tests: 32 passed, 0 failed, 2 skipped** by OS limits ([captured output](docs/proof/test-results.txt)) |
| CI matrix | Ubuntu, macOS, Windows x Node 20 and 22 ([Actions](https://github.com/shahvatsalofficial/pramanasutra-ai/actions)) |
| Labeled fixtures | 6 of 6 give exactly the expected rules and decision ([results](docs/proof/eval-results.json)) |
| Static analysis | CodeQL on push, pull request and weekly |
| Runtime dependencies | **0** |
| Network calls by the CLI | **0** |

**Read the fine print.** The fixtures were written by the rule author, so perfect precision and recall is a *regression guarantee*, not real-world accuracy. **Not yet proven:** live behavior in each AI IDE, accuracy on large real repositories, an independent security review, and trademark clearance. See [testing and proof](docs/handbook/08-testing-and-proof.md).

## 60-second start

Requires Node.js 20+.

```bash
# audit any repo: read-only, offline, no API key. Writes ./pramanasutra-reports/report.{md,html,json}
npx github:shahvatsalofficial/pramanasutra-ai release-check --path .

# install the skills for your AI IDE
npx github:shahvatsalofficial/pramanasutra-ai init --ide claude --target .
```

Then ask your assistant:

> PramanaSutra Prime: assess this repository's test quality and release readiness. Stay read-only, cite file and line, separate observed facts from executed results, and ask before running any tests.

From a clone:

```bash
node packages/cli/bin/pramanasutra.mjs doctor
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/focused-test    # exit 2 = NO_GO (intentional)
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/clean-project --evidence fixtures/clean-project/evidence.json   # exit 0
npm test
```

## Reports: Markdown and HTML for people, JSON for tools

Every `scan` and `release-check` writes three files to `./pramanasutra-reports` (change with `--out`, disable with `--no-report`):

| File | For |
|---|---|
| `report.md` | Pull requests, tickets, plain reading |
| `report.html` | Sharing and printing; light and dark; every value escaped |
| `report.json` | CI and tooling (schema 1.0.0) |

Examples you can open now: [Markdown](examples/sample-output/focused-test/report.md), [JSON](examples/sample-output/focused-test/report.json), and the [HTML source](examples/sample-output/focused-test/report.html) (download and open in a browser).

Abridged real output:

```text
PramanaSutra release-check: 4 file(s), 1 test file(s), 1 finding(s). Gate: NO_GO.
Tests executed by this tool: NO. Evidence: absent.

FOCUSED_TEST  high  medium  tests/a.test.js:2  Focused test found
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
| `release-check --path <dir> [--evidence <file>] [--policy <file>]` | Scan plus release gate (exit codes above) |
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
- It is not published to npm; run it with `npx github:shahvatsalofficial/pramanasutra-ai`.
- Names are not trademark-cleared; see [legal](docs/handbook/07-security-privacy-legal.md).

## Legal

Licensed under **Apache-2.0** ([LICENSE](LICENSE), [NOTICE](NOTICE)). No runtime dependencies are bundled ([third-party notices](THIRD_PARTY_NOTICES.md)). Claude, Cursor, OpenAI Codex, GitHub Copilot, Gemini and other product names belong to their owners and are used only to describe compatibility; this project is not affiliated with or endorsed by them. The name "PramanaSutra" is not a registered trademark and has not been trademark-cleared ([details](docs/legal/trademark-and-name-clearance.md)). Output is decision support, not a certification, compliance attestation or legal advice. Provided "as is".

## Documentation

[Executive summary](docs/handbook/01-executive-summary.md) &middot; [Functional spec](docs/handbook/02-functional-specification.md) &middot; [Technical spec](docs/handbook/03-technical-specification.md) &middot; [Architecture](docs/handbook/04-architecture.md) &middot; [User guide](docs/handbook/05-user-guide.md) &middot; [CLI reference](docs/handbook/06-cli-reference.md) &middot; [Security, privacy, legal](docs/handbook/07-security-privacy-legal.md) &middot; [Testing and proof](docs/handbook/08-testing-and-proof.md) &middot; [Roadmap](docs/handbook/09-compatibility-and-roadmap.md) &middot; [Contributing](docs/handbook/10-contributor-guide.md) &middot; [Glossary and FAQ](docs/handbook/11-glossary-and-faq.md) &middot; [Rule catalog](docs/handbook/12-rule-catalog.md)

## FAQ

**Is this a testing framework?** No. It reviews test hygiene and release evidence, and guides your AI assistant; it complements Jest, pytest, JUnit, Playwright and others.

**Does it send my code anywhere?** No. The CLI makes no network calls.

**How do I cite it?** See [CITATION.cff](CITATION.cff).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md) and [GOVERNANCE.md](GOVERNANCE.md). The full engineering spec is [docs/master-claude-prompt.md](docs/master-claude-prompt.md). Machine-readable summary: [llms.txt](llms.txt).
