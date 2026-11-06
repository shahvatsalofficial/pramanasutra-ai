# PramanaSutra AI: QA & Release Audit Report

This audit is four files with the same facts: **report.md** (this file), **report.html** (open in a browser), **report.json** (for tools) and **report.sarif.json** (SARIF 2.1.0 for code scanning). A static finding is text the scanner saw. It is not a test PramanaSutra ran.

| | |
|---|---|
| Project | `unsafe-names` |
| Generated | 2026-11-06T00:00:00.000Z |
| Tool | PramanaSutra AI 0.3.4 (schema 1.0.0) |
| **Release decision** | **NO_GO** |
| Policy | recommended |
| Supplied test evidence | absent |

> **NO_GO.** Blocking issue found. Do not release until it is fixed and re-checked.

## Summary

- Files inspected: 5
- Test files detected: 2
- CI workflows detected: 1
- Manifests detected: 1
- Findings: 1 (critical 0, high 1, medium 0, low 0, info 0)
- Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.

## Supplied test evidence

No evidence file was supplied. Counts below are not test results. The release gate cannot treat the suite as passed.

Evidence binding: none. No evidence file was supplied.

## Findings at a glance

| Severity | Rule | Where | Fix |
|---|---|---|---|
| high | `FOCUSED_TEST` | `tests/a &amp; b (x) $y 'q'.test.js:2` | Remove .only / fit / fdescribe, then execute the full suite. |

## Findings

### Focused test found

- **Rule:** `FOCUSED_TEST` | **Severity:** high | **Confidence:** medium | **Status:** observed
- **Where:** `tests/a &amp; b (x) $y 'q'.test.js:2`
- **Why it matters:** A focused test declaration may silently omit other tests.
- **Fix:** Remove .only / fit / fdescribe, then execute the full suite.

## Test files seen

- `tests/a &amp; b (x) $y 'q'.test.js`
- `tests/ünïcode 测试.test.js`

## CI workflows seen

- `.github/workflows/ci.yml`

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

- Found 1 blocking static finding(s) under policy "recommended".

## Limitations

- Heuristic checks do not prove the absence of bugs or release readiness.
- No target tests, security scanners, browser, load tests or deploy checks were run by this tool.
- This report is decision support, not a compliance certification or legal advice.

---
*Created by Vatsal Shah. Generated locally; nothing was sent over the network. Same audit: report.html, report.json and report.sarif.json.*
