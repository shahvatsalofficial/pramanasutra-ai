# Roadmap and status

<!-- summary: Honest status of PramanaSutra AI 0.3.4. Implemented, planned, and explicitly not claimed. -->

Status words mean only what they say. **Implemented** has a command or file and a test or a committed artifact. **Planned** is a directory, a sentence, or an intention. It does not run. **Not claimed** is something people might assume that this project refuses.

## Implemented in 0.3.4

| Capability | Evidence |
|---|---|
| CLI: version, doctor, agents, scan, release-check, verify, init | `packages/cli`, `npm test` |
| Offline static rules in the [catalog](07-rule-catalog.md), including CircleCI, Buildkite, Drone and Woodpecker file names | Unit tests and six fixtures |
| Evidence ingestion and fail-closed policy | Unit tests, `policies/` |
| Evidence binding sentence: `none`, `unbound`, or `ci-environment` | Unit test. `ci-environment` is not a signature |
| `report.md`, `report.html`, `report.json`, `report.sarif.json` written together | Unit tests, `samples/`, `audit/` |
| `--changed` lists `git diff` names and says when git is unavailable | Unit test. Not a test selector |
| `scan` and `release-check` exit 2 or 3 for a failing gate. Exit 0 is `READY_FOR_HUMAN_APPROVAL` only | Help text and `packages/cli/bin/pramanasutra.mjs` |
| `.pramanasutraignore` | Unit test, this repo's ignore file |
| 17 skills with distinct Safe workflow sections | Installer tests and the uniqueness assertion |
| Required CI on Ubuntu and Windows, Node 20 and 22, with a real release gate | `.github/workflows/ci.yml` |
| CI gate writes `github` when the four `GITHUB_*` variables exist | `scripts/ci-gate.mjs` |
| macOS in GitHub Actions | Not scheduled. Runs 41884015367 and 42098256304 cancelled with zero steps |
| CodeQL workflow | `.github/workflows/codeql.yml` |
| Documentation site with a product front page plus this handbook | `scripts/build-docs.mjs` |
| Public GitHub repository | `https://github.com/shahvatsalofficial/pramanasutra-ai` |
| npm publish workflow | `.github/workflows/publish.yml`. It has not been proven by a green run. A GitHub Release is what starts it, and npm must already list this repo as a trusted publisher |

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
| Live smoke test in each IDE | Install paths only |

## Not claimed

| Claim | Why it is absent |
|---|---|
| Certification or compliance | Reports say they are decision support |
| Independent security review | None has been commissioned |
| Trademark clearance | [Legal](10-legal-and-compliance.md) |
| Field precision equal to the fixture score | The fixture score is a regression lock |
| macOS CI passed | Those jobs never started a runner |
| npm package `@vatsalshah/pramanasutra` | Registry returned 404. The account is `shahvatsal` |
| Signed or GitHub-verified evidence | `ci-environment` only echoes four strings. `verify` checks schema. A person can still type them |
| The twelve `packages/*` notes (`runner`, `server`, `reporter`, `quality-gates`, `release`, `impact`, `integrators`, `evidence`, `discovery`, `core`, `static-audit`, `test-generation`) | READMEs only. The CLI does not import them |
| The assistant always obeys the skill | The host is outside this process |

## Near-term work, in order

1. Keep the required CI green on Ubuntu and Windows. Add macOS back only when a runner actually starts and the log shows test output.
2. Confirm `npm view pramanasutra version` matches `package.json` after each release. Do not publish `@vatsalshah/pramanasutra`.
3. One live smoke note per IDE: did `init` land where the host reads, and did a trivial prompt cite a file. Until that note exists, the compatibility table stays "not verified".
4. A rule only with a true-positive fixture and a false-positive fixture. No drive-by patterns.

## Compatibility summary

| Environment | Status |
|---|---|
| Node 20 and 22 on Ubuntu and Windows in CI | Required workflow. Trust the latest green run, not this sentence |
| Node on the maintainer's Windows machine | The captured proof file |
| macOS in CI | Not scheduled. Unverified |
| Claude Code, Cursor, Codex, Copilot, Gemini CLI | Copy paths implemented. Behavior not verified |

Older handbook pages under `docs/handbook/*.md` are earlier write-ups. The numbered files in this folder are the ones to update.
