# CLI reference

<!-- summary: Every pramanasutra command, flag, exit code, policy key and environment fact. -->

Binary: `pramanasutra` (`packages/cli/bin/pramanasutra.mjs`). Without installation use `npx github:shahvatsalofficial/pramanasutra-ai <command>` or `node packages/cli/bin/pramanasutra.mjs <command>`.

## Commands

| Command | Purpose |
|---|---|
| `help` | Print usage |
| `doctor [--json]` | Check Node version and platform; confirms no AI key is needed |
| `agents list [--json]` | List the 17 bundled skills |
| `scan --path <dir> [--out <dir>] [--no-report] [--json]` | Static QA audit and reports |
| `release-check --path <dir> [--evidence <file>] [--policy <file>] [--out <dir>] [--no-report] [--json]` | Scan plus release gate |
| `verify --evidence <file> [--json]` | Validate an evidence file |
| `init --ide <name> --target <dir> [--force]` | Copy skills into a project |

## Flags

| Flag | Applies to | Meaning |
|---|---|---|
| `--path` | scan, release-check | Directory to inspect. Must be a real directory |
| `--out` | scan, release-check | Report directory (default `./pramanasutra-reports`) |
| `--no-report` | scan, release-check | Do not write report files |
| `--evidence` | release-check, verify | Test-evidence JSON file |
| `--policy` | release-check | Policy JSON file |
| `--ide` | init | `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic`, `all` |
| `--target` | init | Existing directory to install into |
| `--force` | init | Overwrite existing skill directories |
| `--json` | most | Print JSON instead of text |

`scan` rejects `--evidence` and `--policy` with exit 1 because they only affect the gate.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success or `READY_FOR_HUMAN_APPROVAL` |
| 1 | Invalid input or error |
| 2 | `NO_GO` (release-check) |
| 3 | `REVIEW_REQUIRED` (release-check) |

`scan` exits 0 even when it has findings. Use `release-check` to gate a build.

## Skill install locations

| `--ide` | Directory under `--target` |
|---|---|
| claude | `.claude/skills/` |
| cursor | `.cursor/skills/` |
| codex | `.agents/skills/` |
| gemini | `.gemini/skills/` |
| copilot | `.github/skills/` |
| generic | `.agents/skills/` |
| all | all of the above |

The installer refuses symlinked destination components, refuses a non-directory target, and never overwrites without `--force`.

## Policy keys

| Key | Type | Default | Meaning |
|---|---|---|---|
| `name` | string | recommended | Label shown in reports |
| `releaseRequiresExecutedEvidence` | boolean | true | Passing evidence needed for ready |
| `blockOnFocusedTests` | boolean | true | Focused tests give `NO_GO` |
| `blockOnSkippedTests` | boolean | false | Skipped tests give `NO_GO` |
| `requireCi` | boolean | true | Missing CI means review required |
| `requireLicense` | boolean | true | Missing license means review required |
| `requireTests` | boolean | true | No test files means review required |
| `schemaVersion` | "1.0.0" | | Accepted for documentation |
| `allowAutomatedDeployment` | must be `false` | | Cannot be weakened |
| `manualApprovalsRequired` | must be `true` | | Cannot be weakened |

Any other key, or a wrong type, makes the command fail with exit 1.

## Examples

```bash
pramanasutra scan --path . --out reports/qa
pramanasutra release-check --path . --evidence ci-evidence.json --policy policies/strict.json
pramanasutra verify --evidence ci-evidence.json --json
pramanasutra init --ide all --target ../my-app
```

## Environment

No environment variables are read. No files are read outside `--path`, `--evidence`, `--policy` and the bundled skills. No network access.
