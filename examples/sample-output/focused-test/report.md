# PramanaSutra AI: QA & Release Audit Report

| | |
|---|---|
| Project | `focused-test` |
| Generated | 2026-11-01T00:00:00.000Z |
| Tool | PramanaSutra AI (schema 1.0.0) |
| **Release decision** | **NO_GO** |
| Policy | recommended |
| Supplied test evidence | absent |

> Blocking issue found. Do not release until it is fixed and re-checked.

## Summary

- Files inspected: 4
- Test files detected: 1
- CI workflows detected: 1
- Manifests detected: 1
- Findings: 1 (critical 0, high 1, medium 0, low 0, info 0)
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

### Focused test found

- **Rule:** `FOCUSED_TEST` | **Severity:** high | **Confidence:** medium | **Status:** observed
- **Where:** `tests/a.test.js:2`
- **Why it matters:** A focused test declaration may silently omit other tests.
- **Fix:** Remove .only / fit / fdescribe, then execute the full suite.

## Release gate reasons

- Found 1 blocking static finding(s) under policy "recommended".

## Limitations

- Heuristic checks do not prove the absence of bugs or release readiness.
- No target tests, security scanners, browser, load tests or deploy checks were run by this tool.
- This report is decision support, not a compliance certification.

---
*Created by Vatsal Shah. Generated locally; nothing was sent over the network.*
