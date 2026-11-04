# Executive summary

<!-- summary: Why PramanaSutra AI exists, what value it gives, what it deliberately does not do, and the risks of adopting it. -->

## The problem

AI coding assistants write and review tests quickly, but they often claim "all tests pass" without running anything, miss `test.only` and skipped tests that silently shrink coverage, and produce release advice with no proof behind it. Teams then ship on confidence that was never earned.

## The product

PramanaSutra AI is an **evidence-first QA and release-readiness agent**:

- **17 Agent Skills** (a chief orchestrator and 16 specialists) that make an AI IDE follow a disciplined QA method.
- **A deterministic offline CLI** that inspects a project read-only, reports test-hygiene findings with file and line, accepts test-run evidence from your own runner or CI, and issues a conservative release gate.
- **Reports in three formats**: Markdown and HTML for people, JSON for tools.

## Value

| Benefit | How it is delivered |
|---|---|
| Fewer silent coverage losses | Detects focused and skipped tests across JS/TS, pytest, unittest, JUnit and Go |
| No false confidence | The gate stays at `REVIEW_REQUIRED` unless valid executed-test evidence is supplied |
| Auditability | Every finding has rule ID, severity, confidence, evidence location and remediation |
| Low adoption cost | Node 20+, zero runtime dependencies, no account, no API key, no network |
| Safe by default | Read-only on your project; never runs project scripts; escapes all HTML |
| Human accountability | Best outcome is `READY_FOR_HUMAN_APPROVAL`; deployment is never automated |

## What it deliberately does not do (v0.2.0)

- It does not run your tests. Test execution is planned and will require explicit approval.
- It does not perform browser, visual, accessibility, performance or security testing.
- It does not certify quality, security or compliance.
- It does not give legal, financial or investment advice.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Heuristic rules produce false positives or negatives | Confidence labels, published limits, labeled fixtures, user review required |
| Users read a clean scan as "release ready" | Reports repeat that static checks do not prove readiness; the gate needs evidence |
| Supplied evidence is forged or stale | Provenance field; `external-unverified` can never reach ready; human approval always required |
| Skill instructions drift from the CLI | One canonical skill source, tests check names, frontmatter and install paths |
| Name or trademark conflict | Not trademark-cleared; see [name clearance](../legal/trademark-and-name-clearance.md) |

## Status

Version 0.2.0 is an **executable starter**: the CLI, reports, gate, policy and installer work and are tested on Windows, macOS and Linux in CI. Live behavior in each AI IDE is not yet smoke-tested. See [compatibility and roadmap](09-compatibility-and-roadmap.md).

## Decision guide

Adopt now if you want a cheap, offline guard against silent test rot and over-confident AI release advice. Wait for later versions if you need automated test execution, browser/E2E, accessibility or performance measurement, or a hosted server.
