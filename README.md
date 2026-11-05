# PramanaSutra AI

QA and release-readiness agent for Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI.

[![CI](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml)
[![CodeQL](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml/badge.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/pramanasutra.svg)](https://www.npmjs.com/package/pramanasutra)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

Evidence-first review with `file:line` findings. The audit is a Markdown file, an HTML file, and JSON for tools. No extra API key.

[Documentation](https://shahvatsalofficial.github.io/pramanasutra-ai/) · [Start here](https://shahvatsalofficial.github.io/pramanasutra-ai/00-start-here.html) · [GitHub](https://github.com/shahvatsalofficial/pramanasutra-ai) · [npm](https://www.npmjs.com/package/pramanasutra)

PramanaSutra AI (from *pramana*, "valid proof") is an open-source **QA and release-readiness agent**. It ships 17 portable [Agent Skills](https://agentskills.io/specification), led by **PramanaSutra Prime**, and a deterministic offline CLI. The CLI reads a repository, does not run its tests, and writes **`report.md`**, **`report.html`** and **`report.json`** of the same audit. The release gate is `NO_GO`, `REVIEW_REQUIRED` or `READY_FOR_HUMAN_APPROVAL`. A ready result still needs a person. It is never a deploy order.

> **No extra API key.** Skills use the IDE's own model. The CLI makes no network calls and has no telemetry.

Created by **[Vatsal Shah](https://github.com/shahvatsalofficial)**. Apache-2.0. Version 0.3.3.

## Install

Node.js 20 or newer.

```bash
npx pramanasutra release-check --path .
```

```bash
npm install -g pramanasutra
pramanasutra release-check --path .
```

Writes `./pramanasutra-reports/report.md`, `report.html` and `report.json` in the current directory. Exit `2` is `NO_GO`, `3` is `REVIEW_REQUIRED`, `0` is `READY_FOR_HUMAN_APPROVAL`.

```bash
npx pramanasutra init --ide cursor --target .
```

`--ide` is `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic` or `all`.

From a clone of the repository:

```bash
node packages/cli/bin/pramanasutra.mjs doctor
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/focused-test --no-report
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/clean-project --evidence fixtures/clean-project/evidence.json --no-report
npm test
```

The first check exits 2. The second exits 0.

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
| Unit tests on the captured Windows run | **38 tests, 37 passed, 0 failed, 1 skipped** (symlink creation was prohibited). [test-results.txt](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/documents/pramanasutra/proof/test-results.txt) |
| Labeled fixtures | 6 of 6 match the expected rules and decision. Precision and recall are 1 **on those author-written fixtures**, which is a regression lock, not field accuracy. [eval-results.json](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/documents/pramanasutra/proof/eval-results.json) |
| This repository, with that test output as evidence | `READY_FOR_HUMAN_APPROVAL`, 0 findings, after `fixtures/` and `examples/sample-app/` were excluded and named in the report. [Audit Markdown](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/documents/pramanasutra/audit/report.md), [audit HTML](https://shahvatsalofficial.github.io/pramanasutra-ai/audit/report.html) |
| Required CI | Ubuntu and Windows, Node 20 and 22, then the same release gate. [Actions](https://github.com/shahvatsalofficial/pramanasutra-ai/actions) |
| macOS in GitHub Actions | Not scheduled. Jobs were cancelled with zero steps: [41884015367](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/runs/41884015367) (queued) and [42098256304](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/runs/42098256304) (cancelled in about a second, no runner). That is not a test result |
| Runtime dependencies | 0 |
| Network calls by the CLI | 0 |

Not yet proven: live behavior in each IDE, accuracy on large real repositories, an independent security review, trademark clearance. Details: [testing and proof](https://shahvatsalofficial.github.io/pramanasutra-ai/11-testing-and-proof.html) and [legal](https://shahvatsalofficial.github.io/pramanasutra-ai/10-legal-and-compliance.html).

## Reports

Every `scan` and `release-check` writes the three files together unless you pass `--no-report`. Default directory: `./pramanasutra-reports` in the current working directory, not inside the scanned tree.

| File | Use |
|---|---|
| `report.md` | Pull requests and plain reading |
| `report.html` | Browser. No remote assets. Light, dark, print |
| `report.json` | CI. Schema 1.0.0 |

Open a finished example: [Markdown](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/documents/pramanasutra/samples/focused-test/report.md), [HTML](https://shahvatsalofficial.github.io/pramanasutra-ai/samples/focused-test/report.html). How to read them: [CLI and reports](https://shahvatsalofficial.github.io/pramanasutra-ai/06-cli-and-reports.html).

## Release gate

| Decision | Exit | Meaning |
|---|---|---|
| `NO_GO` | 2 | Blocking static finding, or supplied evidence shows failure |
| `REVIEW_REQUIRED` | 3 | Evidence missing, untrusted, empty, or scan incomplete, or policy requires tests, CI or a license that were not found |
| `READY_FOR_HUMAN_APPROVAL` | 0 | Passing `local-executed` or `ci-ingested` evidence and clean policy checks. A human still approves |

`external-unverified` evidence cannot reach ready. The gate object always has `automatedDeploymentAuthorized: false`.

## Skills

`pramanasutra-prime` plus strategy, unit, flow, api, visual, access, load, data, secure, regression, flake, defect, pipeline, release, evidence, verify. Canonical source: [`.agents/skills`](https://github.com/shahvatsalofficial/pramanasutra-ai/tree/main/.agents/skills). Catalog: [skills and agents](https://shahvatsalofficial.github.io/pramanasutra-ai/08-skills-and-agents.html).

| Host | Skill path | Verified live? |
|---|---|---|
| Claude Code | `.claude/skills` | No |
| Cursor | `.cursor/skills` | No |
| OpenAI Codex | `.agents/skills` | No |
| GitHub Copilot | `.github/skills` | No |
| Gemini CLI | `.gemini/skills` | No |

## Documentation

The maintained pack is [documents/pramanasutra](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/documents/pramanasutra/00-start-here.md). The same pages as HTML: [GitHub Pages](https://shahvatsalofficial.github.io/pramanasutra-ai/).

| | |
|---|---|
| Executive | [01](https://shahvatsalofficial.github.io/pramanasutra-ai/01-executive-summary.html) |
| Functional spec | [02](https://shahvatsalofficial.github.io/pramanasutra-ai/02-functional-specification.html) |
| Architecture | [03](https://shahvatsalofficial.github.io/pramanasutra-ai/03-architecture.html) |
| Technical reference | [04](https://shahvatsalofficial.github.io/pramanasutra-ai/04-technical-reference.html) |
| User guide | [05](https://shahvatsalofficial.github.io/pramanasutra-ai/05-user-guide.html) |
| Security | [09](https://shahvatsalofficial.github.io/pramanasutra-ai/09-security-and-privacy.html) |
| Legal | [10](https://shahvatsalofficial.github.io/pramanasutra-ai/10-legal-and-compliance.html) |
| Roadmap | [13](https://shahvatsalofficial.github.io/pramanasutra-ai/13-roadmap-and-status.html) |
| FAQ | [14](https://shahvatsalofficial.github.io/pramanasutra-ai/14-faq-and-glossary.html) |

Machine-readable summary: [llms.txt](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/llms.txt).

## Legal

Apache-2.0 ([LICENSE](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/LICENSE), [NOTICE](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/NOTICE)). No runtime dependencies ([third-party notices](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/THIRD_PARTY_NOTICES.md)). Claude, Cursor, OpenAI, Codex, GitHub, Copilot, Gemini and other product names belong to their owners. This project is not affiliated with or endorsed by them. "PramanaSutra" is not claimed as a registered trademark and has not been clearance-searched. Output is decision support, not a certification and not legal advice. Provided "AS IS". Full notice: [legal and compliance](https://shahvatsalofficial.github.io/pramanasutra-ai/10-legal-and-compliance.html).

## Contributing

[Maintainer guide](https://shahvatsalofficial.github.io/pramanasutra-ai/15-maintainer-guide.html), [CONTRIBUTING.md](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/CONTRIBUTING.md), [SECURITY.md](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/SECURITY.md). Citation: [CITATION.cff](https://github.com/shahvatsalofficial/pramanasutra-ai/blob/main/CITATION.cff).
