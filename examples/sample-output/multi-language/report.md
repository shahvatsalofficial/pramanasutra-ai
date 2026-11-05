# PramanaSutra AI: QA & Release Audit Report

This audit is three files with the same facts: **report.md** (this file), **report.html** (open in a browser) and **report.json** (for CI). A static finding is text the scanner saw. It is not a test PramanaSutra ran.

| | |
|---|---|
| Project | `multi-language` |
| Generated | 2026-11-06T00:00:00.000Z |
| Tool | PramanaSutra AI 0.3.0 (schema 1.0.0) |
| **Release decision** | **REVIEW_REQUIRED** |
| Policy | recommended |
| Supplied test evidence | absent |

> **REVIEW_REQUIRED.** Evidence is missing or incomplete. A human must review before any release decision.

## Summary

- Files inspected: 3
- Test files detected: 3
- CI workflows detected: 0
- Manifests detected: 0
- Findings: 5 (critical 0, high 0, medium 1, low 4, info 0)
- Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.

## Supplied test evidence

No evidence file was supplied. Counts below are not test results. The release gate cannot treat the suite as passed.

## Findings at a glance

| Severity | Rule | Where | Fix |
|---|---|---|---|
| low | `SKIPPED_TEST` | `pkg/b_test.go:3` | Confirm the skip is intended, tracked and does not conceal a required case. |
| low | `SKIPPED_TEST` | `src/UserServiceTest.java:2` | Confirm the skip is intended, tracked and does not conceal a required case. |
| low | `SKIPPED_TEST` | `tests/test_api.py:3` | Confirm the skip is intended, tracked and does not conceal a required case. |
| medium | `NO_CI` | `.` | Verify your CI configuration and enforce required test gates. |
| low | `NO_LICENSE` | `.` | Review intended licensing and add the correct LICENSE file before publication. |

## Findings

### Skipped test found

- **Rule:** `SKIPPED_TEST` | **Severity:** low | **Confidence:** medium | **Status:** observed
- **Where:** `pkg/b_test.go:3`
- **Why it matters:** A skipped test needs review before release.
- **Fix:** Confirm the skip is intended, tracked and does not conceal a required case.

### Skipped test found

- **Rule:** `SKIPPED_TEST` | **Severity:** low | **Confidence:** medium | **Status:** observed
- **Where:** `src/UserServiceTest.java:2`
- **Why it matters:** A skipped test needs review before release.
- **Fix:** Confirm the skip is intended, tracked and does not conceal a required case.

### Skipped test found

- **Rule:** `SKIPPED_TEST` | **Severity:** low | **Confidence:** medium | **Status:** observed
- **Where:** `tests/test_api.py:3`
- **Why it matters:** A skipped test needs review before release.
- **Fix:** Confirm the skip is intended, tracked and does not conceal a required case.

### No recognized CI workflow discovered

- **Rule:** `NO_CI` | **Severity:** medium | **Confidence:** medium | **Status:** observed
- **Where:** `.`
- **Why it matters:** No recognized CI configuration was found in the files scanned.
- **Fix:** Verify your CI configuration and enforce required test gates.

### No license file at root

- **Rule:** `NO_LICENSE` | **Severity:** low | **Confidence:** high | **Status:** observed
- **Where:** `.`
- **Why it matters:** A recognized open-source license file was not found at the root.
- **Fix:** Review intended licensing and add the correct LICENSE file before publication.

## Test files seen

- `pkg/b_test.go`
- `src/UserServiceTest.java`
- `tests/test_api.py`

## CI workflows seen

None recognised (GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, Bitbucket Pipelines).

## Capabilities

| Capability | State | What that means |
|---|---|---|
| staticAudit | executed | Source text was inspected with heuristic rules. |
| testExecution | not-run | not-run means this tool did not execute tests. evidence-supplied means an evidence file was attached. |
| browser | not-supported | No browser was launched. |
| securityScan | not-run | This is not a vulnerability scanner. |
| performanceTest | not-run | No load or timing test was run. |
| aiInference | not-run | The CLI did not call a model. |

## Release gate reasons

- No executed-test evidence supplied (use --evidence).
- No recognized CI workflow detected.
- No license file at root.

## Limitations

- Heuristic checks do not prove the absence of bugs or release readiness.
- No target tests, security scanners, browser, load tests or deploy checks were run by this tool.
- This report is decision support, not a compliance certification or legal advice.

---
*Created by Vatsal Shah. Generated locally; nothing was sent over the network. Same audit: report.html and report.json.*
