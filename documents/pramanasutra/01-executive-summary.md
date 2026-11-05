# Executive summary

<!-- summary: What PramanaSutra AI is for a decision maker: the problem, the product, what the gate means, what evidence exists, and what must not be claimed in a rollout. -->

## The problem

Teams ask an AI assistant whether a change is safe to release. The assistant often answers from the look of the code. It has not run the tests. A focused test (`test.only`, `fit`, `fdescribe`) can make a suite look green while almost nothing ran. A dashboard can be green because the failing job was not required. People then treat the story as evidence.

PramanaSutra AI is a counter to that habit. It separates three things that get mixed together:

- what a static reading of the repository **observed**
- what a test command **actually returned**, and only when someone supplies that result
- what a **human** still has to approve

## The product

| Piece | What a buyer gets | What they do not get |
|---|---|---|
| Agent Skills (17) | Instructions a supported IDE can load, so the assistant plans QA, cites files, and asks before running tests | A private model, a hosted agent, or a guarantee the IDE obeyed the skill |
| CLI | An offline scan and a release gate, with Markdown, HTML and JSON of the same audit | Test execution, coverage, a browser, a vulnerability scan, or a deploy |
| Reports | A page a reviewer can read without the CLI | A certificate, an audit attestation, or legal advice |
| Policy | A fail-closed JSON file. Unknown keys are rejected. "Allow automatic deploy" cannot be turned on | A workflow engine or an approval product |

Price of the software: zero. License: Apache-2.0. Operator cost: Node.js 20+ and the IDE subscription the team already pays, if they use the skills. The CLI needs neither.

## The decision, in one table

| Gate | Exit code | Plain meaning | Typical next step |
|---|---|---|---|
| `NO_GO` | 2 | A blocking static finding (by default a focused test) or supplied evidence that failed | Fix, re-run the tests, re-check |
| `REVIEW_REQUIRED` | 3 | Evidence missing, not trusted, or the scan is incomplete; or no tests, CI or license when the policy requires them | A person looks, or the missing input is supplied |
| `READY_FOR_HUMAN_APPROVAL` | 0 | Policy checks passed, including passing evidence from `local-executed` or `ci-ingested` | A named person approves. The tool will not deploy |

`external-unverified` evidence can never produce the ready state. Zero passed tests cannot. A clean static scan **without** an evidence file cannot. That is deliberate.

## What leadership can say

Supported by the artifacts in [Testing and proof](11-testing-and-proof.md):

- The unit suite on the captured Windows run: 38 tests, 37 passed, 0 failed, 1 skipped (OS refused a symlink).
- Ubuntu and Windows CI are required checks on Node 20 and 22. The job runs the tests and then the release gate with that output as evidence.
- On 4 November 2026 the previous release's macOS jobs were cancelled by GitHub while queued, with zero steps (Actions run `41884015367`). macOS is now a separate workflow so a runner outage does not fail the required badge. A green macOS run is evidence. A cancelled queue is not, and this document does not claim one.
- Six author-written fixtures produce exactly the expected rules. State the caveat in the same sentence: perfect precision here is a regression lock, not field accuracy.
- The CLI's own release check of this repository, given that test evidence, was `READY_FOR_HUMAN_APPROVAL`. Read [audit/report.md](audit/report.md).

## What leadership must not say

- "It proved the product is bug-free." It did not run the product's tests unless an evidence file says a command ran, and even then it trusts the file's counts.
- "It passed a penetration test." It is not a security scanner. The secure skill coordinates *gaps*. It does not attack.
- "It is WCAG certified" or "SOC 2 certified" or "ISO certified." No such claim exists.
- "Every IDE was verified." The install paths are implemented. Live host behavior is not.
- "The name is trademark-cleared." It is not. See [Legal](10-legal-and-compliance.md).
- "macOS CI is green" unless the separate workflow's latest run actually succeeded.

## Adoption shape

A sensible first use is read-only: run `release-check` in CI, publish `report.md` on the pull request, and block the merge only on exit code `2` (`NO_GO`). Treat exit code `3` as a comment, not a red build, until the team supplies evidence on purpose. Do not give the tool permission to deploy. The policy loader rejects a flag that would authorize unattended deployment, and the gate object always sets `automatedDeploymentAuthorized` to false.

## Cost of being wrong

A false positive (a line that looks like `test.only` but is not) delays a release until a person looks. A false negative (a focused test written in a form the heuristic misses, or a test file it does not recognise) can let a weak suite through **if** someone also supplies passing evidence. The report lists what was not run: browser, security scan, performance, model calls. Reviewers who only read the gate word, and skip the limitations, will over-trust it. The HTML report puts the decision and the "tests were not executed by this tool" sentence on the first screen for that reason.
