# PramanaSutra AI: QA & Release Audit Report

| | |
|---|---|
| Project | `multi-language` |
| Generated | 2026-11-01T00:00:00.000Z |
| Tool | PramanaSutra AI (schema 1.0.0) |
| **Release decision** | **REVIEW_REQUIRED** |
| Policy | recommended |
| Supplied test evidence | absent |

> Evidence is missing or incomplete. A human must review before any release decision.

## Summary

- Files inspected: 3
- Test files detected: 3
- CI workflows detected: 0
- Manifests detected: 0
- Findings: 5 (critical 0, high 0, medium 1, low 4, info 0)
- Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.

## Capabilities

| Capability | State |
|---|---|
| staticAudit | executed |
| testExecution | not-run |
| browser | not-supported |
| securityScan | not-run |
| performanceTest | not-run |
| aiInference | not-run |

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

## Release gate reasons

- No executed-test evidence supplied (use --evidence).
- No recognized CI workflow detected.
- No license file at root.

## Limitations

- Heuristic checks do not prove the absence of bugs or release readiness.
- No target tests, security scanners, browser, load tests or deploy checks were run by this tool.
- This report is decision support, not a compliance certification.

---
*Created by Vatsal Shah. Generated locally; nothing was sent over the network.*
