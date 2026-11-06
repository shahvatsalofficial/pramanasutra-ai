# PramanaSutra AI: QA & Release Audit Report

This audit is four files with the same facts: **report.md** (this file), **report.html** (open in a browser), **report.json** (for tools) and **report.sarif.json** (SARIF 2.1.0 for code scanning). A static finding is text the scanner saw. It is not a test PramanaSutra ran.

| | |
|---|---|
| Project | `PramanaSutra-AI` |
| Generated | 2026-11-06T00:00:00.000Z |
| Tool | PramanaSutra AI 0.3.4 (schema 1.0.0) |
| **Release decision** | **READY_FOR_HUMAN_APPROVAL** |
| Policy | recommended |
| Supplied test evidence | passing |

> **READY_FOR_HUMAN_APPROVAL.** All policy checks passed. A human must still approve; this is never a deploy order.

## Summary

- Files inspected: 320
- Test files detected: 1
- CI workflows detected: 3
- Manifests detected: 1
- Findings: 0 (critical 0, high 0, medium 0, low 0, info 0)
- Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.

## Supplied test evidence

These numbers come from the evidence file the operator supplied. PramanaSutra did not run that command.

| Field | Value |
|---|---|
| Source | `local-executed` |
| Command | `node --test --test-reporter=spec tests/cli.test.mjs` |
| Executed at | 2026-11-06T00:00:00.000Z |
| Exit code | 0 |
| Passed | 43 |
| Failed | 0 |
| Skipped | 0 |
| Environment | win32 v24.15.0 |

Evidence binding: unbound. This JSON is not tied to a CI identity. A passing file is not proof the command ran.

## Findings at a glance

No static issues detected. This does **not** mean the project is release-ready; other checks were not run.

## Findings

None.

## Test files seen

- `tests/cli.test.mjs`

## CI workflows seen

- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/publish.yml`

## Capabilities

| Capability | State | What that means |
|---|---|---|
| staticAudit | executed | Source text was inspected with heuristic rules. |
| testExecution | evidence-supplied | not-run means this tool did not execute tests. evidence-supplied means an evidence file was attached. |
| browser | not-supported | No browser was launched. |
| securityScan | not-run | This is not a vulnerability scanner. |
| performanceTest | not-run | No load or timing test was run. |
| aiInference | not-run | The CLI did not call a model. |

## Release gate reasons

- All policy checks satisfied by supplied evidence and static inspection. A human must still approve and deploy.

## Limitations

- Excluded 2 path(s) listed in .pramanasutraignore. Excluded content was not inspected.
- Heuristic checks do not prove the absence of bugs or release readiness.
- No target tests, security scanners, browser, load tests or deploy checks were run by this tool.
- This report is decision support, not a compliance certification or legal advice.

---
*Created by Vatsal Shah. Generated locally; nothing was sent over the network. Same audit: report.html, report.json and report.sarif.json.*
