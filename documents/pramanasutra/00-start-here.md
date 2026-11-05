# Start here

<!-- summary: PramanaSutra AI is an open-source QA and release-readiness agent: 17 portable skills plus an offline CLI that writes a Markdown report, an HTML report and JSON, and a human release gate. Created by Vatsal Shah. Apache-2.0. -->

PramanaSutra AI (from Sanskrit *pramana*, "valid proof") is an open-source **QA and release-readiness agent**. It has two parts that do different jobs:

1. **Seventeen Agent Skills**, led by PramanaSutra Prime, for Claude Code, Cursor, OpenAI Codex, GitHub Copilot and Gemini CLI. The skill uses the IDE's own model. There is no extra API key.
2. **A deterministic command-line tool** that reads a project, does not run its tests, and writes three files of the same audit: `report.md`, `report.html` and `report.json`. A release check then returns `NO_GO`, `REVIEW_REQUIRED` or `READY_FOR_HUMAN_APPROVAL`.

Created by Vatsal Shah. Licensed Apache-2.0. Version 0.3.3. npm package: `pramanasutra`. The command line has **zero runtime dependencies** and makes **no network calls**.

> **Important:** The tool does not certify quality, security or compliance. `READY_FOR_HUMAN_APPROVAL` means the configured checks passed. A person still decides. It is never a deploy order.

## Who should read what

| If you are | Read |
|---|---|
| Deciding whether to adopt it | [Executive summary](01-executive-summary.md), then [Legal](10-legal-and-compliance.md) |
| Writing requirements or a QA process | [Functional specification](02-functional-specification.md) |
| Reviewing the design | [Architecture](03-architecture.md), then [Technical reference](04-technical-reference.md) |
| Going to run it today | [User guide](05-user-guide.md) |
| Wiring it to CI | [CI and release](12-ci-and-release.md) and [CLI and reports](06-cli-and-reports.md) |
| Asking what a finding means | [Rule catalog](07-rule-catalog.md) |
| Asking what the skills do | [Skills and agents](08-skills-and-agents.md) |
| A security reviewer | [Security and privacy](09-security-and-privacy.md) |
| Asking "can I trust the numbers?" | [Testing and proof](11-testing-and-proof.md) and the [audit of this repo](audit/report.md) |
| Maintaining the project | [Maintainer guide](15-maintainer-guide.md) |
| Looking up a word | [FAQ and glossary](14-faq-and-glossary.md) |

## Sixty seconds

Node.js 20 or newer.

```bash
npx pramanasutra release-check --path .
```

That writes `./pramanasutra-reports/report.md`, `report.html` and `report.json` in the current directory, not inside the project you scanned. Open the HTML file in a browser. The exit code is `2` for `NO_GO`, `3` for `REVIEW_REQUIRED`, `0` for `READY_FOR_HUMAN_APPROVAL`.

To copy the skills into an IDE:

```bash
npx pramanasutra init --ide cursor --target .
```

Use `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic` or `all`. The copy refuses to overwrite an existing skill unless you pass `--force`.

## What is already proven

The captured run on the maintainer's Windows machine is in [proof/test-results.txt](proof/test-results.txt): **38 tests, 37 passed, 0 failed, 1 skipped**. The skip is the symlink test, because creating a symlink was prohibited by the OS. Six labeled fixtures match the expected rules and gate with no false positives and no false negatives **on those fixtures**. That is a regression check written by the same author as the rules. It is not a measure of accuracy on arbitrary repositories.

With that same test output supplied as evidence, a release check of this repository returned `READY_FOR_HUMAN_APPROVAL`. The report is [audit/report.md](audit/report.md) and [audit/report.html](audit/report.html). Focused-test examples under `fixtures/` and `examples/sample-app/` are excluded by `.pramanasutraignore` so they are not treated as product failures. The report says they were excluded.

## What is not proven

- Live behavior inside each AI IDE. The installer copies files. Nobody has published a smoke test that a host loaded the skill and followed it.
- Accuracy on large real repositories. The rules are line heuristics, not parsers.
- An independent security review.
- Trademark clearance of the name PramanaSutra. See [Legal](10-legal-and-compliance.md).

## The documentation set

| # | Document | Question it answers |
|---|---|---|
| 00 | Start here | What is this, and where do I go? |
| 01 | Executive summary | Should we use it, and what must we not claim? |
| 02 | Functional specification | What must it do, for whom, and what is out of scope? |
| 03 | Architecture | How do the pieces connect, and which boundaries matter? |
| 04 | Technical reference | Modules, schemas, limits, exit codes |
| 05 | User guide | Install, run, read, fix, repeat |
| 06 | CLI and reports | Every flag, and how to read `report.md` and `report.html` |
| 07 | Rule catalog | Every static rule, with an example and its limit |
| 08 | Skills and agents | The 17 skills and the safety contract |
| 09 | Security and privacy | Threats, controls, what is left over |
| 10 | Legal and compliance | License, names, disclaimers. Not a legal opinion |
| 11 | Testing and proof | Real output, fixtures, how to reproduce |
| 12 | CI and release | GitHub Actions, why macOS is not scheduled, exit codes in a pipeline |
| 13 | Roadmap and status | Implemented, planned, and not claimed |
| 14 | FAQ and glossary | Short answers and terms |
| 15 | Maintainer guide | How to change a rule, rebuild docs, and release |

Machine-readable summary for tools: [llms.txt](../../llms.txt) at the repository root.
