# Testing and proof

<!-- summary: Real test results, labeled-fixture evaluation, sample reports and the exact commands to reproduce everything in PramanaSutra AI. -->

Everything on this page is reproducible from a clean clone. Nothing is estimated or invented.

## Headline results

| Evidence | Result | Where |
|---|---|---|
| Automated tests (`npm test`) | **34 tests: 32 passed, 0 failed, 2 skipped** | [`docs/proof/test-results.txt`](../proof/test-results.txt) |
| Why 2 are skipped | Symlink creation needs OS privileges on Windows; file names with `"` are impossible on Windows. Both run on Linux and macOS in CI | test names in the capture |
| Labeled fixtures | **6 of 6** produce exactly the expected rules and decision | [`docs/proof/eval-results.json`](../proof/eval-results.json) |
| Precision / recall on labeled fixtures | 1.0 / 1.0 | same file; see caveat below |
| CI matrix | Ubuntu, macOS, Windows x Node 20, 22 | [Actions](https://github.com/shahvatsalofficial/pramanasutra-ai/actions) |
| CodeQL | Runs on push, pull request and weekly | [Actions](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/workflows/codeql.yml) |
| Runtime dependencies | **0** | `package.json` |
| Network calls from the CLI | **0** (no `http`, `net`, `fetch` or `child_process` in `packages/`) | source |

### Read the fine print

The fixtures were written by the rule author. Perfect precision and recall on them is a **regression guarantee**, not a measure of real-world accuracy. Real repositories will produce false positives and false negatives. No large-scale evaluation on public repositories has been done yet, and no independent labeler has reviewed results.

## What the test suite covers

| Area | Tests |
|---|---|
| CLI | `doctor`, `agents list`, unknown flags, missing values, missing paths without stack traces |
| Scanner | focused tests, skipped tests (JS, pytest, Go), no tests, no CI, no license, look-alike strings, symlinks, naming conventions, file-name look-alikes |
| Evidence | valid, failing, zero-pass, external-unverified, malformed, non-JSON |
| Gate | exit codes 0, 2 and 3; never ready without evidence |
| Policy | strict vs recommended, unknown keys, weakened safety flags, wrong types, bundled policies |
| Reports | defaults, `--no-report`, no write into the scanned project, HTML escaping, content of MD and HTML |
| Installer | install, collision refusal, invalid target |
| Skills | unique names, frontmatter, safe-workflow section |
| Fixtures | six committed projects with expected results |

## The labeled fixtures

| Fixture | Purpose | Expected rules | Expected decision |
|---|---|---|---|
| `clean-project` (with `evidence.json`) | Clean control | none | `READY_FOR_HUMAN_APPROVAL` |
| `focused-test` | `test.only` | `FOCUSED_TEST` | `NO_GO` |
| `missing-ci` | No pipeline | `NO_CI` | `REVIEW_REQUIRED` |
| `missing-tests` | No tests | `NO_TESTS` | `REVIEW_REQUIRED` |
| `unsafe-names` | Spaces, `&`, `$`, quotes, Unicode in names | `FOCUSED_TEST` | `NO_GO` |
| `multi-language` | pytest, JUnit, Go skips | 3x `SKIPPED_TEST`, `NO_CI`, `NO_LICENSE` | `REVIEW_REQUIRED` |

## Sample reports

Generated from the fixtures with a fixed timestamp, committed in [`examples/sample-output`](https://github.com/shahvatsalofficial/pramanasutra-ai/tree/main/examples/sample-output):

- `focused-test/report.md`, `report.html`, `report.json` (a `NO_GO`)
- `clean-project/` (a `READY_FOR_HUMAN_APPROVAL` with supplied CI evidence)
- `missing-ci/`, `missing-tests/`, `unsafe-names/`, `multi-language/`

Abridged `NO_GO` output:

```text
PramanaSutra release-check: 4 file(s), 1 test file(s), 1 finding(s). Gate: NO_GO.
Tests executed by this tool: NO. Evidence: absent.
FOCUSED_TEST  high  medium  tests/a.test.js:2   Focused test found
```

## Reproduce

```bash
git clone https://github.com/shahvatsalofficial/pramanasutra-ai.git
cd pramanasutra-ai
npm test
node scripts/generate-proof.mjs      # rewrites docs/proof and examples/sample-output
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/focused-test --no-report ; echo "exit=$?"
```

Expected: the last command prints `Gate: NO_GO` and `exit=2`.

## History worth knowing

The first CI run failed on Windows with Node 20 because `node --test tests/*.test.mjs` relies on shell glob expansion that Windows does not do. It was fixed by naming the test file explicitly. The fix and the failed run are in the commit history.

## Not yet proven

Behavior inside each live AI IDE; accuracy on real-world repositories; an independent security review; performance on very large repositories (limits exist, benchmarks do not); accessibility audit of the HTML output.
