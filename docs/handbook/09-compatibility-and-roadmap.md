# Compatibility and roadmap

<!-- summary: Supported platforms and AI hosts with honest verification status, plus the phased roadmap for PramanaSutra AI. -->

## Platforms

| Platform | Node 20 | Node 22 | Evidence |
|---|---|---|---|
| Ubuntu (GitHub-hosted) | CI | CI | [CI workflow](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/ci.yml) |
| macOS (GitHub-hosted) | CI | CI | same |
| Windows (GitHub-hosted) | CI | CI | same |
| Local Windows 11, Node 24 | n/a | n/a | `docs/proof/test-results.txt` |

CI configuration alone is not proof: check the badge and Actions tab for current results.

## AI hosts

"Adapter" means the installer writes skills to the layout documented by the vendor. It does **not** mean the host was exercised live.

| Host | Skill path | Level | Live smoke test |
|---|---|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` | adapter | Pending |
| Cursor | `.cursor/skills/<name>/SKILL.md` | adapter | Pending |
| OpenAI Codex | `.agents/skills/<name>/SKILL.md` | adapter | Pending |
| GitHub Copilot | `.github/skills/<name>/SKILL.md` | adapter | Pending |
| Gemini CLI | `.gemini/skills/<name>/SKILL.md` | adapter | Pending |
| Any other tool | portable `SKILL.md` + `AGENTS.md` | generic | Not claimed |

Vendor layouts change. Re-check the vendor documentation before relying on a path.

## Languages the static rules understand

JavaScript/TypeScript (Jest, Vitest, Mocha, node:test), Python (pytest, unittest), Java/Kotlin (JUnit), Go. Test-file *detection* also covers C#, Swift, Scala, PHP, Dart and Ruby naming conventions; skip/focus *rules* for those are not implemented.

## Roadmap

Each phase ships code, tests, docs and a runnable example. Dates are intentionally absent.

| Phase | Theme | Status |
|---|---|---|
| A | Foundation: CLI, scanner, reports, gate, skills, installer | Done in 0.2.0 |
| B | Evidence and policy: ingestion, validation, fail-closed policy | Done in 0.2.0 |
| C | JUnit XML and TAP parsing so evidence is generated, not typed | Planned |
| D | Consent-based runner with command allowlist, timeouts, output caps, sandbox warnings | Planned |
| E | Change impact: map a git diff to tests | Planned |
| F | Flaky-test clinic: rerun policy with recorded evidence | Planned |
| G | Release engineering: waivers with owner and expiry, artifact hashes, SBOM ingestion | Planned |
| H | Browser/E2E, accessibility, performance and visual integrations | Planned |
| I | Authenticated server mode and local/cloud model adapters | Planned |

## Next concrete change

JUnit XML evidence ingestion: `release-check --junit results.xml` that derives `passed`, `failed` and `skipped` from the file, with tests for malformed XML, huge files and entity-expansion attacks.
