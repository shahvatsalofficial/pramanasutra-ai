# Roadmap and status

<!-- summary: Honest status of PramanaSutra AI 0.3.0. Implemented, planned, and explicitly not claimed. -->

Status words mean only what they say. **Implemented** has a command or file and a test or a committed artifact. **Planned** is a directory, a sentence, or an intention. It does not run. **Not claimed** is something people might assume that this project refuses.

## Implemented in 0.3.0

| Capability | Evidence |
|---|---|
| CLI: version, doctor, agents, scan, release-check, verify, init | `packages/cli`, `npm test` |
| Offline static rules in the [catalog](07-rule-catalog.md) | Unit tests and six fixtures |
| Evidence ingestion and fail-closed policy | Unit tests, `policies/` |
| `report.md`, `report.html`, `report.json` written together | Unit tests, `samples/`, `audit/` |
| Evidence counts shown in the Markdown and HTML | Unit test `release report quotes supplied evidence` |
| `.pramanasutraignore` | Unit test, this repo's ignore file |
| Skill pack, 17 files, installer for six host paths | `agents list` test, installer tests |
| Required CI on Ubuntu and Windows, Node 20 and 22, with a real release gate | `.github/workflows/ci.yml` |
| macOS workflow that does not control the main badge | `.github/workflows/ci-macos.yml` |
| CodeQL workflow | `.github/workflows/codeql.yml` |
| This documentation set, Markdown and HTML | `documents/pramanasutra/` |
| Public GitHub repository | `https://github.com/shahvatsalofficial/pramanasutra-ai` |

## Planned

These README-level packages exist as notes only. The CLI does not import them.

| Item | Not yet |
|---|---|
| Executing the target's tests | Would run arbitrary code. Needs an explicit, separate, opt-in design |
| Browser and device checks | No driver is bundled |
| Accessibility measurement | The access skill plans. It does not score |
| Performance measurement | The load skill plans. It does not generate load |
| Coverage, flake detection from history, mutation testing | No storage, no history |
| SBOM and SLSA provenance | No release attestation workflow |
| A long-running server or a local model adapter | `packages/server` is a note |
| npm publish | Package name is declared. Registry publish is not done |
| Live smoke test in each IDE | Install paths only |

## Not claimed

| Claim | Why it is absent |
|---|---|
| Certification or compliance | Reports say they are decision support |
| Independent security review | None has been commissioned |
| Trademark clearance | [Legal](10-legal-and-compliance.md) |
| Field precision equal to the fixture score | The fixture score is a regression lock |
| macOS CI always green | The queue has cancelled jobs with zero steps |
| The assistant always obeys the skill | The host is outside this process |

## Near-term work, in order

1. Keep the required CI green on the 0.3.0 gate, and record the first real macOS success or the next cancellation without calling either one the other.
2. Publish to npm only after `npm whoami` succeeds for the maintainer, then change the README install lines.
3. One live smoke note per IDE: did `init` land where the host reads, and did a trivial prompt cite a file. Until that note exists, the compatibility table stays "not verified".
4. A rule only with a true-positive fixture and a false-positive fixture. No drive-by patterns.

## Compatibility summary

| Environment | Status |
|---|---|
| Node 20 and 22 on Ubuntu and Windows in CI | Required workflow. Trust the latest green run, not this sentence |
| Node on the maintainer's Windows machine | The captured proof file |
| macOS 14 in CI | Separate workflow. Check Actions |
| Claude Code, Cursor, Codex, Copilot, Gemini CLI | Copy paths implemented. Behavior not verified |

Older handbook pages under `docs/handbook/*.md` are earlier write-ups. The numbered files in this folder are the ones to update.
