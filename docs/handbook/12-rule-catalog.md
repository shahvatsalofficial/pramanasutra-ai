# Rule catalog

<!-- summary: Every static rule in PramanaSutra AI, with severity, confidence, what it matches, known false positives and the fix. -->

All rules are line-based, deterministic and run **only on test files**. Each finding carries `ruleId`, `severity`, `confidence`, `evidence {path, line}`, `description`, `recommendation` and `status: observed`.

| Rule | Severity | Confidence | Blocks under `recommended`? |
|---|---|---|---|
| `FOCUSED_TEST` | high | medium | Yes (`NO_GO`) |
| `SKIPPED_TEST` | low | medium | No (yes under `strict`) |
| `NO_TESTS` | medium | medium | Review required |
| `NO_CI` | medium | medium | Review required |
| `NO_LICENSE` | low | high | Review required |

## FOCUSED_TEST

**Matches:** a line starting with `describe.only(`, `test.only(`, `it.only(` (optionally `await`), `fit(` or `fdescribe(`.

**Why it matters:** the runner executes only the focused test; the rest silently do not run, so a green result proves little.

**Fix:** remove the focus marker and run the full suite.

**False positives:** a matching line inside a multi-line template string. A match embedded in a single-line string literal is ignored (tested).

**False negatives:** focus markers built dynamically, `.only` on a later line than the call, and frameworks with other markers.

## SKIPPED_TEST

**Matches:**

| Ecosystem | Pattern |
|---|---|
| Jest, Vitest, Mocha, node:test | `describe/test/it.skip(`, `xit(`, `xdescribe(` |
| pytest | `@pytest.mark.skip`, `@pytest.mark.xfail` |
| unittest | `@unittest.skip...` |
| JUnit | `@Ignore`, `@Disabled` |
| Go | `t.Skip(`, `t.SkipNow(` |

**Why it matters:** skipped tests are untested behavior; each needs an owner and a reason.

**Fix:** confirm the skip is intended, tracked and time-limited.

## NO_TESTS

**Matches:** no file recognised as a test file.

**Test-file recognition:** a path component `test`, `tests`, `__tests__`, `spec`, `specs` or `e2e`; names containing `.test.` or `.spec.`; `*_test.go`, `*_test.py`, `*_test.rb`, `*_test.dart`, `*_spec.rb`, `test_*.py`; and class-style names ending in `Test`, `Tests`, `Spec` or `IT` for `java`, `kt`, `cs`, `swift`, `scala`, `php`, `dart` (case-sensitive, so `Submit.java` is not a test).

**False positives:** unconventional layouts, and ecosystems where tests live beside code with no naming convention (for example Rust unit tests inside `src/`).

## NO_CI

**Matches:** none of `.github/workflows/*.yml|yaml`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `bitbucket-pipelines.yml`.

**Fix:** add CI that runs the tests and make it a required check. Other CI systems are not recognised.

## NO_LICENSE

**Matches:** no root file named `LICENSE`, `LICENSE.md`, `LICENSE.txt` or `COPYING`.

**Fix:** choose a license deliberately and add it before publishing.

## Planned rules

No-assertion tests, test-order dependence, unbounded sleeps, snapshot churn, mock-only tests, coverage regressions. None exist yet.
