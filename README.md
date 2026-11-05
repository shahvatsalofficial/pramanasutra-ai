<div align="center">

# PramanaSutra AI

### QA and release-readiness agent for Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI

Evidence-first review with `file:line` findings. The audit is a Markdown file and an HTML file, plus JSON for tools. No extra API key.

[![CI](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml)
[![CI macOS](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci-macos.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci-macos.yml)
[![CodeQL](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

[**Documentation**](https://shahvatsalofficial.github.io/pramanasutra-ai/) · [Start here](documents/pramanasutra/00-start-here.md) · [HTML docs](documents/pramanasutra/html/index.html) · [This repo's audit (Markdown)](documents/pramanasutra/audit/report.md) · [This repo's audit (HTML)](documents/pramanasutra/audit/report.html) · [Proof](documents/pramanasutra/11-testing-and-proof.md)

</div>

---

PramanaSutra AI (from *pramana*, "valid proof") is an open-source **QA and release-readiness agent**. It ships 17 portable [Agent Skills](https://agentskills.io/specification), led by **PramanaSutra Prime**, and a deterministic offline CLI. The CLI reads a repository, does not run its tests, and writes **`report.md`**, **`report.html`** and **`report.json`** of the same audit. The release gate is `NO_GO`, `REVIEW_REQUIRED` or `READY_FOR_HUMAN_APPROVAL`. A ready result still needs a person. It is never a deploy order.

> **No extra API key.** Skills use the IDE's own model. The CLI makes no network calls and has no telemetry.

Created by **[Vatsal Shah](https://github.com/shahvatsalofficial)**. Apache-2.0. Version 0.3.0. Public repository: [github.com/shahvatsalofficial/pramanasutra-ai](https://github.com/shahvatsalofficial/pramanasutra-ai).

## Why

| Problem | What PramanaSutra does |
|---|---|
| An assistant says the tests passed without running them | Static findings and supplied evidence stay in different sections. The gate cannot go ready without a valid evidence file |
| `test.only` slips into main | `FOCUSED_TEST` cites `file:line` and the default policy returns `NO_GO` |
| A green board hides what was not checked | Every report lists capabilities as executed, not-run, not-supported, or evidence-supplied |
| Another key, another bill | Zero runtime dependencies |

## Proof

| Evidence | Result |
|---|---|
| Unit tests on the captured Windows run | **38 tests, 37 passed, 0 failed, 1 skipped** (symlink creation was prohibited). Output: [proof/test-results.txt](documents/pramanasutra/proof/test-results.txt) |
| Labeled fixtures | 6 of 6 match the expected rules and decision. Precision and recall are 1 **on those author-written fixtures**, which is a regression lock, not field accuracy. [eval-results.json](documents/pramanasutra/proof/eval-results.json) |
| This repository, with that test output as evidence | `READY_FOR_HUMAN_APPROVAL`, 0 findings, after `fixtures/` and `examples/sample-app/` were excluded and named in the report. [audit Markdown](documents/pramanasutra/audit/report.md), [audit HTML](documents/pramanasutra/audit/report.html) |
| Required CI | Ubuntu and Windows, Node 20 and 22, then the same release gate. [Actions](https://github.com/shahvatsalofficial/pramanasutra-ai/actions) |
| macOS | Separate workflow. On 2026-11-04 the old in-matrix jobs were cancelled while queued, with zero steps ([run 41884015367](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/runs/41884015367)). A later green macOS run is evidence. A cancelled queue is not |
| Runtime dependencies | 0 |
| Network calls by the CLI | 0 |

Not yet proven: live behavior in each IDE, accuracy on large real repositories, an independent security review, trademark clearance, npm publication. Details: [testing and proof](documents/pramanasutra/11-testing-and-proof.md) and [legal](documents/pramanasutra/10-legal-and-compliance.md).

## 60-second start

Node.js 20+.

```bash
npx github:shahvatsalofficial/pramanasutra-ai release-check --path .
```

Writes `./pramanasutra-reports/report.md`, `report.html` and `report.json`. Exit `2` is `NO_GO`, `3` is `REVIEW_REQUIRED`, `0` is `READY_FOR_HUMAN_APPROVAL`.

```bash
npx github:shahvatsalofficial/pramanasutra-ai init --ide claude --target .
```

`--ide` is `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic` or `all`.

From a clone:

```bash
node packages/cli/bin/pramanasutra.mjs doctor
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/focused-test --no-report
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/clean-project --evidence fixtures/clean-project/evidence.json --no-report
npm test
```

The first check exits 2. The second exits 0.

## Reports

Every `scan` and `release-check` writes the three files together unless you pass `--no-report`. Default directory: `./pramanasutra-reports` in the current working directory, not inside the scanned tree.

| File | Use |
|---|---|
| `report.md` | Pull requests and plain reading |
| `report.html` | Browser. No remote assets. Light, dark, print |
| `report.json` | CI. Schema 1.0.0 |

Open a finished example: [Markdown](documents/pramanasutra/samples/focused-test/report.md), [HTML](documents/pramanasutra/samples/focused-test/report.html). How to read them: [CLI and reports](documents/pramanasutra/06-cli-and-reports.md).

## Release gate

| Decision | Exit | Meaning |
|---|---|---|
| `NO_GO` | 2 | Blocking static finding, or supplied evidence shows failure |
| `REVIEW_REQUIRED` | 3 | Evidence missing, untrusted, empty, or scan incomplete, or policy requires tests, CI or a license that were not found |
| `READY_FOR_HUMAN_APPROVAL` | 0 | Passing `local-executed` or `ci-ingested` evidence and clean policy checks. A human still approves |

`external-unverified` evidence cannot reach ready. The gate object always has `automatedDeploymentAuthorized: false`.

## Skills

`pramanasutra-prime` plus strategy, unit, flow, api, visual, access, load, data, secure, regression, flake, defect, pipeline, release, evidence, verify. Canonical source: [`.agents/skills`](.agents/skills). Catalog: [skills and agents](documents/pramanasutra/08-skills-and-agents.md).

| Host | Skill path | Verified live? |
|---|---|---|
| Claude Code | `.claude/skills` | No |
| Cursor | `.cursor/skills` | No |
| OpenAI Codex | `.agents/skills` | No |
| GitHub Copilot | `.github/skills` | No |
| Gemini CLI | `.gemini/skills` | No |

## Documentation

The pack a future reader, a site, or a crawler should use is [documents/pramanasutra](documents/pramanasutra/00-start-here.md). HTML of the same pages: [documents/pramanasutra/html](documents/pramanasutra/html/index.html) and [the GitHub Pages site](https://shahvatsalofficial.github.io/pramanasutra-ai/).

| | |
|---|---|
| Executive | [01](documents/pramanasutra/01-executive-summary.md) |
| Functional spec | [02](documents/pramanasutra/02-functional-specification.md) |
| Architecture | [03](documents/pramanasutra/03-architecture.md) |
| Technical reference | [04](documents/pramanasutra/04-technical-reference.md) |
| User guide | [05](documents/pramanasutra/05-user-guide.md) |
| Security | [09](documents/pramanasutra/09-security-and-privacy.md) |
| Legal | [10](documents/pramanasutra/10-legal-and-compliance.md) |
| Roadmap | [13](documents/pramanasutra/13-roadmap-and-status.md) |
| FAQ | [14](documents/pramanasutra/14-faq-and-glossary.md) |

Machine-readable summary: [llms.txt](llms.txt).

## Legal

Apache-2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)). No runtime dependencies ([third-party notices](THIRD_PARTY_NOTICES.md)). Claude, Cursor, OpenAI, Codex, GitHub, Copilot, Gemini and other product names belong to their owners. This project is not affiliated with or endorsed by them. "PramanaSutra" is not claimed as a registered trademark and has not been clearance-searched. Output is decision support, not a certification and not legal advice. Provided "AS IS". Full notice: [legal and compliance](documents/pramanasutra/10-legal-and-compliance.md).

## Contributing

[Maintainer guide](documents/pramanasutra/15-maintainer-guide.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md). Citation: [CITATION.cff](CITATION.cff).
