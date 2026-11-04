# Technical specification

<!-- summary: Modules, algorithms, hard limits, data schemas and error handling of the PramanaSutra AI v0.2.0 CLI. -->

## Stack

- Plain ES modules (`.mjs`), Node.js 20 or newer, **zero runtime dependencies**, no build step.
- Test runner: built-in `node --test`. Test file: `tests/cli.test.mjs`.
- Choice rationale: a zero-dependency executable starter is easy to audit and has no supply-chain surface. A move to TypeScript is possible once the module boundaries stabilize.

## Modules

| File | Responsibility |
|---|---|
| `packages/cli/bin/pramanasutra.mjs` | Argument parsing, command dispatch, exit codes |
| `packages/cli/lib/scanner.mjs` | Directory walk, test/CI/manifest detection, rules, gate evaluation |
| `packages/cli/lib/evidence.mjs` | Evidence file loading, validation, classification |
| `packages/cli/lib/policy.mjs` | Fail-closed policy loading |
| `packages/cli/lib/report.mjs` | Markdown, HTML and JSON report writers |
| `packages/cli/lib/installer.mjs` | Skill installation for host-specific paths |
| `scripts/generate-proof.mjs` | Regenerates test results, fixture evaluation and sample reports |
| `scripts/build-docs.mjs` | Builds the HTML documentation site from Markdown |

## Scanner algorithm

1. Resolve the target and require a real directory (symlink roots are refused).
2. Iterative depth-first walk, children sorted by name for deterministic output.
3. Skip symbolic links (counted, never followed).
4. Skip directories: `.git`, `node_modules`, `.venv`, `venv`, `dist`, `build`, `target`, `coverage`, `.next`, `.nuxt`, `.turbo`, `.cache`, `reports`, `pramanasutra-reports`, `.idea`, `.gradle`, `vendor`, `bin`, `obj`.
5. Classify files: test files by path and name conventions, manifests, CI workflows, license.
6. Read **only test files** of known source extensions, line by line, applying rules.
7. Build the report object and the limitations list.

### Hard limits

| Limit | Value | When hit |
|---|---|---|
| Max depth | 22 | Scan marked partial |
| Max files | 20,000 | Scan marked partial |
| Max test-file size read | 2,000,000 bytes | File skipped, reported in limitations |
| Evidence file size | 1,000,000 bytes | Rejected |
| Policy file size | 100,000 bytes | Rejected |

A partial scan can never reach `READY_FOR_HUMAN_APPROVAL`.

## Data schemas

### Report (`report.json`, schema 1.0.0)

Top-level keys: `schemaVersion`, `product`, `generatedAt`, `scannedPath` (base name only), `capabilities`, `inventory`, `findings`, `limitations`, `releaseGate`.

- `capabilities`: `staticAudit`, `testExecution`, `browser`, `securityScan`, `performanceTest`, `aiInference`, each one of `executed`, `not-run`, `not-supported`, `evidence-supplied`.
- `findings[]`: `id`, `ruleId`, `severity`, `confidence`, `title`, `description`, `evidence {path, line}`, `recommendation`, `status`.
- `releaseGate`: `decision`, `policy`, `reasons[]`, `requiresHumanApproval`, `executedTestEvidence`, `evidenceState`, `automatedDeploymentAuthorized`.

### Evidence (input)

`schemaVersion` ("1.0.0"), `source` (`local-executed`, `ci-ingested`, `external-unverified`), `command`, `executedAt` (ISO-8601), `exitCode` (integer), `passed`, `failed`, optional `skipped`, `environment`, `commit`.

### Policy (input)

Booleans: `releaseRequiresExecutedEvidence`, `blockOnFocusedTests`, `blockOnSkippedTests`, `requireCi`, `requireLicense`, `requireTests`. Fixed safety keys that cannot be weakened: `allowAutomatedDeployment` must be `false`, `manualApprovalsRequired` must be `true`. `name` is a label. Unknown keys are an error.

## Error handling

All failures are caught in `main()`, printed as `PramanaSutra error: <message>` and returned as exit code 1. No stack traces are shown for expected errors.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success, or `READY_FOR_HUMAN_APPROVAL` |
| 1 | Invalid input or runtime error |
| 2 | `NO_GO` |
| 3 | `REVIEW_REQUIRED` |

## Determinism

Sorted traversal, fixed rule order, no randomness. The only varying field is `generatedAt`.

## Known technical limits

- Rules are line-based regular expressions, not language parsers. Multi-line constructs and unusual formatting can be missed or misread.
- Only a fixed set of naming conventions identify test files. Unconventional layouts yield `NO_TESTS` false positives.
- Windows cannot represent some file names (for example those containing `"`); those cases are tested on POSIX only.
