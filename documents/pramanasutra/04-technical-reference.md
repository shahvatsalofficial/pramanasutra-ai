# Technical reference

<!-- summary: Modules, report schema, evidence schema, policy keys, scan limits and exit codes for the PramanaSutra AI CLI. -->

Source of the running tool: `packages/cli/`. Node.js ES modules. No `npm install` is required to run it, because there are no dependencies. Dev-time checks are `node --test`.

## Modules

| File | Responsibility |
|---|---|
| `packages/cli/bin/pramanasutra.mjs` | Argument parsing, commands, process exit code. Version string is read from root `package.json` |
| `packages/cli/lib/scanner.mjs` | Directory walk, test-file classification, rules, `evaluateGate` |
| `packages/cli/lib/evidence.mjs` | Load and validate evidence. Classify it as absent, failing, inconclusive, unverified or passing |
| `packages/cli/lib/policy.mjs` | Default policy and fail-closed loader |
| `packages/cli/lib/report.mjs` | `markdown()`, `html()`, `writeReports()`. `escapeHtml` is exported and tested |
| `packages/cli/lib/installer.mjs` | Map of IDE directories and the copy routine |
| `scripts/ci-gate.mjs` | Runs the unit tests, builds evidence from that output, release-checks this repo |
| `scripts/generate-proof.mjs` | Regenerates sample reports, `proof/` and `documents/pramanasutra/audit` |
| `scripts/build-docs.mjs` | Builds this HTML site from the numbered Markdown files |

## Exit codes

| Code | When |
|---|---|
| 0 | `doctor` on Node 20+, `help`, `version`, `agents`, `init`, `verify` success, `scan` finished, `release-check` with `READY_FOR_HUMAN_APPROVAL` |
| 1 | Bad arguments, unreadable input, invalid evidence, invalid policy, doctor on Node older than 20, unknown command |
| 2 | `release-check` decision `NO_GO` |
| 3 | `release-check` decision `REVIEW_REQUIRED` |

`scan` does not use 2 or 3. It always exits 0 after a successful inspection so a search can be informational. Use `release-check` when the exit code must mean the gate.

## Report object (schema 1.0.0)

Written as `report.json`. The Markdown and HTML are renderings of this object, plus a few fixed explanation sentences.

| Field | Meaning |
|---|---|
| `schemaVersion` | `"1.0.0"` |
| `product` | `PramanaSutra AI` |
| `toolVersion` | Version from `package.json` at scan time |
| `generatedAt` | ISO-8601 UTC |
| `scannedPath` | Base name of the target directory only |
| `capabilities` | Map of capability to `executed`, `not-run`, `not-supported` or `evidence-supplied` |
| `inventory.fileCount` | Files that were listed, after ignore rules and skip directories |
| `inventory.testFiles` | Relative paths classified as tests |
| `inventory.manifests` | `package.json`, `pyproject.toml`, `go.mod`, Gradle, Maven, Cargo, Gemfile, Composer, pubspec, `.sln`, `.csproj`, `requirements.txt` |
| `inventory.ciWorkflows` | GitHub Actions under `.github/workflows`, plus GitLab, Jenkins, Azure Pipelines, Bitbucket Pipelines file names |
| `inventory.partial` | True when the walk truncated, skipped a large or binary test file, or could not read a directory |
| `inventory.ignoredPaths` | Count of file or directory entries skipped because of `.pramanasutraignore` |
| `findings[]` | `id`, `ruleId`, `severity`, `confidence`, `title`, `description`, `evidence.path`, `evidence.line`, `recommendation`, `status` |
| `limitations[]` | Sentences about skips, truncation, ignore |
| `releaseGate` | `decision`, `policy`, `reasons[]`, `requiresHumanApproval`, `executedTestEvidence`, `evidenceState`, `automatedDeploymentAuthorized` |
| `evidence` | Present only when `--evidence` was accepted. Echoes source, command, time, exit code, passed, failed, skipped, environment, commit. Omitted on a plain scan |

Adding `toolVersion` and `evidence` does not change `schemaVersion`. Consumers that ignore unknown fields keep working. Consumers that reject unknown fields will need a change; none are shipped in this repo.

## Evidence file

| Field | Rule |
|---|---|
| `schemaVersion` | Must be `"1.0.0"` |
| `source` | `local-executed`, `ci-ingested`, or `external-unverified` |
| `command` | Non-empty string. Shown in the report. Escaped. It is not executed |
| `executedAt` | ISO-8601 timestamp |
| `exitCode` | Integer. Non-zero is failing even if `failed` is 0 |
| `passed`, `failed` | Integers ≥ 0 |
| `skipped` | Optional integer ≥ 0 |
| `environment`, `commit` | Optional strings |

Classification order: no file → `absent`. `failed > 0` or `exitCode !== 0` → `failing`. `passed === 0` → `inconclusive`. `external-unverified` → `unverified`. Otherwise → `passing`. Only `passing` can unlock the ready state, and only together with the policy's static requirements.

## Policy keys

Boolean keys, defaulting to the recommended policy when omitted: `releaseRequiresExecutedEvidence`, `blockOnFocusedTests`, `blockOnSkippedTests`, `requireCi`, `requireLicense`, `requireTests`.

`name` is a string up to 80 characters.

Fixed keys, accepted only at the safe value: `schemaVersion` must be `"1.0.0"` if present, `allowAutomatedDeployment` must be false, `manualApprovalsRequired` must be true. Any other key is an error.

## Scan limits

| Limit | Value |
|---|---|
| Max depth | 22 |
| Max files listed | 20,000 |
| Max test file read | 2,000,000 bytes |
| Max evidence file | 1,000,000 bytes |
| Max policy file | 100,000 bytes |
| Max ignore file | 100,000 bytes |

Skipped directory names: `.git`, `node_modules`, `.venv`, `venv`, `dist`, `build`, `target`, `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`, `reports`, `pramanasutra-reports`, `.idea`, `.gradle`, `vendor`, `bin`, `obj`.

## Test detection

A file is a test if the relative path (forward slashes) matches a test directory (`test`, `tests`, `__tests__`, `spec`, `specs`, `e2e`), or a name like `*.test.*`, `*.spec.*`, `*_test.go`, `test_*.py`, `*_spec.rb`, or a class-style name such as `UserServiceTest.java`. Look-alikes such as `Submit.java` are not tests. The check is a regex, not a language module.

Rules run only on test files whose extension is in the source list: JS/TS and JSX/TSX, Python, Go, Rust, Ruby, PHP, Java, Kotlin, Swift, Dart, C#, Vue, Svelte.

## Ignore file

`.pramanasutraignore` at the scan root. Blank lines and `#` comments are ignored. A line ending in `/` excludes that directory and everything under it. Any other line excludes that relative path and its children. Backslashes are normalized. `..` and absolute paths throw.

This repository's file excludes `fixtures/` and `examples/sample-app/` because those trees contain intentional `test.only` examples.

## Installer map

| `--ide` | Directory under the target |
|---|---|
| `claude` | `.claude/skills` |
| `cursor` | `.cursor/skills` |
| `codex` | `.agents/skills` |
| `gemini` | `.gemini/skills` |
| `copilot` | `.github/skills` |
| `generic` | `.agents/skills` |
| `all` | Each distinct path above |

`codex` and `generic` share a path, so `all` does not copy that directory twice. Copying onto the canonical source directory itself is a no-op for that one destination.

## Commands the shell accepts

See [CLI and reports](06-cli-and-reports.md) for examples. Unknown options fail. `--help`, `-h`, `--version` and `-v` are commands, not errors. Values are required for `--path`, `--out`, `--ide`, `--target`, `--evidence` and `--policy`.
