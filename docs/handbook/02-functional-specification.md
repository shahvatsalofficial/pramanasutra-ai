# Functional specification

<!-- summary: Every user-visible requirement of PramanaSutra AI v0.2.0 with inputs, outputs, decision rules and scenarios. -->

## Actors

| Actor | Goal |
|---|---|
| Developer | Find test-hygiene problems before merging |
| QA lead | Get an auditable, readable report |
| Release manager | Know whether evidence supports a release and what is missing |
| CI system | Fail a build on `NO_GO` or `REVIEW_REQUIRED` via exit codes |
| AI IDE assistant | Follow the QA method defined by the skills |

## Functional requirements

| ID | Requirement | Verified by |
|---|---|---|
| F-01 | `doctor` reports Node version, platform and that no AI key is needed | CLI test |
| F-02 | `agents list` lists the 17 bundled skills | CLI test |
| F-03 | `scan` inventories files, test files, manifests and CI workflows without executing anything | scanner tests |
| F-04 | `scan` flags focused tests (`.only`, `fit`, `fdescribe`) as high severity with file and line | scanner tests |
| F-05 | `scan` flags skipped tests in JS/TS, pytest, unittest, JUnit and Go as low severity | scanner tests |
| F-06 | `scan` reports missing tests, missing CI and missing license | scanner tests |
| F-07 | Every run writes `report.md`, `report.html`, `report.json` (default `./pramanasutra-reports`) | CLI tests |
| F-08 | HTML reports escape all untrusted text | XSS test |
| F-09 | `release-check` returns exit 2 for `NO_GO`, 3 for `REVIEW_REQUIRED`, 0 for `READY_FOR_HUMAN_APPROVAL` | CLI tests |
| F-10 | `release-check --evidence` accepts a validated test-evidence file | evidence tests |
| F-11 | The gate never reaches ready without passing evidence from `local-executed` or `ci-ingested` | gate tests |
| F-12 | `verify --evidence` validates an evidence file and exits 1 if invalid | CLI tests |
| F-13 | `--policy` loads a fail-closed JSON policy | policy tests |
| F-14 | `init` copies skills to a host-specific path and refuses to overwrite without `--force` | installer tests |
| F-15 | Invalid input exits 1 with a one-line message and no stack trace | CLI tests |

## Release decision rules

Evaluated in this order:

1. Any blocking static finding under the active policy gives `NO_GO`.
2. Supplied evidence with failures or a non-zero exit code gives `NO_GO`.
3. Otherwise collect missing items: evidence not passing (if the policy requires it), incomplete scan, no tests, no CI, no license.
4. Any missing item gives `REVIEW_REQUIRED`.
5. Nothing missing gives `READY_FOR_HUMAN_APPROVAL`.

`requiresHumanApproval` is always `true`; `automatedDeploymentAuthorized` is always `false`.

## Evidence states

| State | Meaning | Effect |
|---|---|---|
| `absent` | No evidence supplied | `REVIEW_REQUIRED` |
| `failing` | Failures or non-zero exit code | `NO_GO` |
| `inconclusive` | Zero passed tests | `REVIEW_REQUIRED` |
| `unverified` | Source is `external-unverified` | `REVIEW_REQUIRED` |
| `passing` | Exit 0, passed above 0, failed 0, trusted source | Counts toward ready |

## Scenarios

**Clean project with passing CI evidence.** Tests, CI and license present; no findings; evidence `ci-ingested`, 12 passed. Result: `READY_FOR_HUMAN_APPROVAL`, exit 0.

**Focused test left in.** `test.only(...)` in `tests/a.test.js:2`. Result: `NO_GO`, exit 2, finding with remediation "Remove .only".

**No evidence supplied.** Clean static scan. Result: `REVIEW_REQUIRED`, exit 3, reason "No executed-test evidence supplied".

**Unsafe file names.** A test named `a & b (x) $y 'q'.test.js`. Result: scanned normally; HTML shows the name escaped.

## Out of scope in v0.2.0

Running tests, browsers, load tests, accessibility audits, security scanners, SBOM or provenance generation, a server API, model inference from the CLI.
