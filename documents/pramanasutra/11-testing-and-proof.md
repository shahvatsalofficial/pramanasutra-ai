# Testing and proof

<!-- summary: How PramanaSutra AI is tested, the captured results, the labeled fixtures, and the limits of that evidence. Numbers below come from scripts/generate-proof.mjs, not from memory. -->

Trust the files, then the prose. If they disagree, the files win, and this page is stale.

| Artifact | What it is |
|---|---|
| [proof/test-results.txt](proof/test-results.txt) | The stdout of `node --test --test-reporter=spec tests/cli.test.mjs`, with the Node version and OS on the first lines |
| [proof/eval-results.json](proof/eval-results.json) | Per-fixture expected rules versus found rules, plus precision and recall **on those fixtures** |
| [audit/report.md](audit/report.md) | Release check of this repository using that test run as evidence |
| [audit/report.html](audit/report.html) | The same audit |
| [samples/](samples) | The six fixtures rendered to Markdown, HTML and JSON |

Regenerate all of them with:

```bash
node scripts/generate-proof.mjs
```

The sample reports pin `generatedAt` to `2026-11-06T00:00:00.000Z` so a review is not a wall of timestamp noise. The test-results file is not pinned. It is the command output.

## Captured unit run

On the run committed with version 0.3.0 the summary was:

- tests: 38
- pass: 37
- fail: 0
- skipped: 1

The skipped test is `nested symlink is skipped rather than followed`. The runtime could not create a symlink (`Symlink creation prohibited by OS permissions`). The test skips instead of failing. On a machine that allows symlinks the same test runs and must show the link was not followed. Do not quote "37 passed" as a universal CI number. Quote the file, and quote the CI run for Ubuntu and Windows.

The command does not use a network and does not need `npm install`.

## What the tests lock

The suite in `tests/cli.test.mjs` covers doctor, the 17 skills' frontmatter, focused and skipped tests, missing tests/CI/license, the three exit codes, HTML and Markdown escaping, default report paths, evidence classification, policy rejection, Java/C#/Ruby file names, the multi-language fixture, ignore-file traversal, binary test files, and `pytest.skip` / `test.todo`.

It does not cover a live IDE. It does not measure recall on a corpus the author did not write.

## Labeled fixtures

| Fixture | Expected rules | Expected gate |
|---|---|---|
| `fixtures/clean-project` | none | `READY_FOR_HUMAN_APPROVAL` (its `evidence.json` is passing and `ci-ingested`) |
| `fixtures/focused-test` | `FOCUSED_TEST` | `NO_GO` |
| `fixtures/missing-ci` | `NO_CI` | `REVIEW_REQUIRED` |
| `fixtures/missing-tests` | `NO_TESTS` | `REVIEW_REQUIRED` |
| `fixtures/unsafe-names` | `FOCUSED_TEST` | `NO_GO` |
| `fixtures/multi-language` | `SKIPPED_TEST` three times, `NO_CI`, `NO_LICENSE` | `REVIEW_REQUIRED` |

`eval-results.json` records true positives, false positives and false negatives against that table. A value of 1.0 for precision and recall means every expected rule was found and no extra rule was found **in these six trees**. The file's `caveat` field says the fixtures were written by the rule author. Repeat that caveat wherever you quote the ratio. It is a regression lock.

## Self-audit

`generate-proof.mjs` scans the repository root, attaches evidence built from the test summary (`source: local-executed`, counts copied from the reporter, not typed), and writes `documents/pramanasutra/audit`. `.pramanasutraignore` excludes `fixtures/` and `examples/sample-app/` because those trees contain deliberate `test.only` lines. The limitation section of the audit says they were excluded. Read that section or you will misread a ready gate.

The HTML documentation is generated after the audit file. A file count in the audit does not include pages that did not exist yet. Run `npm run proof` again after a large file add if you need the count to match the tree you are looking at.

`node scripts/ci-gate.mjs` is the same idea for CI: run the tests, parse `pass` and `fail` from the reporter, refuse to continue if the summary cannot be parsed, then `release-check` this repo. Exit code is the gate. On the maintainer run that gate was `READY_FOR_HUMAN_APPROVAL` with 0 findings. CI must show the same for the commit you care about. Do not paste this sentence over a red Actions run.

## What would falsify the claims

- A unit test fails. The claim "37 passed" is then false for that run.
- A fixture in the table gains or loses a rule. `eval-results.json` will show `pass: false` and the script exits 1.
- `ci-gate` cannot parse the reporter. It exits 1 and writes no ready evidence. That is preferred to a made-up count.
- A ready gate appears while `releaseGate.evidenceState` is not `passing`. That would be a defect. The tests forbid it for the cases they construct.

## Not in this proof

Field accuracy, mutation testing, a comparison against a commercial SAST tool, performance on a monorepo of tens of thousands of files beyond the documented caps, and any IDE transcript. Those are absent, not implied.
