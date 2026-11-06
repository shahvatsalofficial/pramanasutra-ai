# Rule catalog

<!-- summary: Every static rule PramanaSutra AI 0.3.4 can emit, with severity, what the line looks like, a committed sample, and the misses to expect. -->

Rules are regular expressions on a single line of a file already classified as a test. They are not ASTs. Confidence is `medium` unless noted. Status on a finding is `observed`, which means "the pattern matched", not "a test was executed".

A line that is a string in the middle of other code does not match, because the pattern is anchored at the start of the line (after whitespace). A line that is only the declaration does match. That is why a fixture string inside `const fixture = 'test.only(...)'` is not a finding, and a real `test.only` line is.

## FOCUSED_TEST

| | |
|---|---|
| Severity | high |
| Default gate | `NO_GO` when `blockOnFocusedTests` is true (the default) |
| Why | A focused test runs one case and silently drops the rest. CI can be green and meaningless |
| Matches | Line starts with optional `await`, then `describe.only(`, `test.only(`, `it.only(`, or `fit(`, `fdescribe(` |
| Fix text | Remove `.only` / `fit` / `fdescribe`, then execute the full suite |
| Sample | [samples/focused-test](samples/focused-test/report.md) |

Does not match `test.only` split across two lines, a custom wrapper such as `only(test(`, or a focused test in a language outside the pattern (for example Rust `#[ignore]` is not this rule). A team that uses a helper named `test.only` for something else will get a false positive.

## SKIPPED_TEST

| | |
|---|---|
| Severity | low |
| Default gate | Reported. Blocks only when `blockOnSkippedTests` is true (`policies/strict.json`) |
| Why | A skip can be an honest pending test or a buried failure. The tool cannot tell |
| Matches | `describe.skip(`, `test.skip(`, `it.skip(`, `test.todo(`, `xit(`, `xtest(`, `xdescribe(` |
| Also matches | `@pytest.mark.skip`, `@pytest.mark.xfail` (including `skipif`, because `skip` is a prefix), `@unittest.skip...`, `@Ignore`, `@Disabled`, `t.Skip(` and `t.SkipNow(` (Go), `pytest.skip(`, `pytest.xfail(`, `self.skipTest(`, `raise unittest.SkipTest` |
| Fix text | Confirm the skip is intended, tracked, and does not hide a required case |
| Sample | [samples/multi-language](samples/multi-language/report.md) (pytest decorator, JUnit `@Disabled`, Go `t.Skip`) |

Does not match a skip buried in a helper, `pending(` in Mocha, `it.skip` if the call is not at the start of the line, or Rust `#[ignore]`. `@Disabled` with a trailing word and a word boundary will not match `@DisabledIf`.

## NO_TESTS

| | |
|---|---|
| Severity | medium |
| Default gate | `REVIEW_REQUIRED` when `requireTests` is true and the test list is empty |
| Why | The supported naming conventions found nothing. The project may still have tests under an unknown layout |
| Evidence | `path` is `.`, no line |
| Fix text | Confirm the framework location; add and execute relevant tests |
| Sample | [samples/missing-tests](samples/missing-tests/report.md) |

False positive: tests live in a folder this regex does not treat as tests, and none of the file names match. False negative: a file is named like a test and contains no assertions. The rule does not read assertions.

## NO_CI

| | |
|---|---|
| Severity | medium |
| Default gate | `REVIEW_REQUIRED` when `requireCi` is true and no workflow file matched |
| Recognises | `.github/workflows/*.yml` and `.yaml`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `bitbucket-pipelines.yml`, `.circleci/config.yml`, `.buildkite/pipeline.yml`, `.drone.yml`, `woodpecker.yml` |
| Does not recognise | A CI config with another name, a workflow that exists only in a hosted UI, or a file that is present but never runs |
| Sample | [samples/missing-ci](samples/missing-ci/report.md) |

Finding a workflow file does not mean the workflow runs tests. The rule is presence, not semantics.

## NO_LICENSE

| | |
|---|---|
| Severity | low |
| Confidence | high (it is a file name check) |
| Default gate | `REVIEW_REQUIRED` when `requireLicense` is true |
| Recognises | `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `COPYING` at the repository root only, any case |
| Sample | [samples/multi-language](samples/multi-language/report.md) includes this finding together with the skips |

A license inside `docs/` or a `package.json` `"license"` field without a file is not detected. The recommendation is to review intended licensing, not to invent a license the project did not choose.

## Gate interaction

Blocking findings are evaluated before evidence. A high finding (or a focused test while that block is on, or a skip while the strict block is on) is `NO_GO` even if evidence passes. If nothing blocks and evidence is `failing`, the decision is still `NO_GO`. Only then does the gate look at missing evidence, a partial scan, missing tests, missing CI and a missing license. Any of those yield `REVIEW_REQUIRED`. If none of them fire, the decision is `READY_FOR_HUMAN_APPROVAL`.

## Adding a rule

Do not add a rule that the tests do not lock with a true positive and a false positive. The [maintainer guide](15-maintainer-guide.md) is the procedure. Update this page in the same change, then rebuild the HTML.
