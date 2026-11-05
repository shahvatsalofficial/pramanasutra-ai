# User guide

<!-- summary: How to install PramanaSutra AI, run a release check, read the Markdown and HTML reports, supply evidence, and install skills. Node.js 20 or newer. No API key. -->

## Before you start

Install Node.js 20 or newer. Check with `node --version`. You do not need an API key, an account, or `npm install` inside this repository.

From a clone of this repository the command is:

```bash
node packages/cli/bin/pramanasutra.mjs doctor
```

From anywhere, once the repository is public on GitHub:

```bash
npx github:shahvatsalofficial/pramanasutra-ai doctor
```

After the publish workflow has released `0.3.2`, `npx pramanasutra doctor` is the same command.

`npx` downloads the repository. The CLI that then runs still does not call a model and does not scan until you ask it to.

## Check a project

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path path/to/project
```

You get a paragraph on the terminal and three files in `./pramanasutra-reports/`:

| File | Open it with |
|---|---|
| `report.md` | The pull request, an editor, or GitHub |
| `report.html` | Any browser. Light and dark follow the system. It prints |
| `report.json` | A script. Same facts as the other two |

Choose another folder with `--out reports/feature-a`. Skip the files with `--no-report` if you only want the exit code.

The terminal line always includes `Tests executed by this tool: NO`. If you did not pass `--evidence`, the gate cannot be ready.

## Read the result

Open `report.html` first if you are a person. The first block is the decision:

- **NO_GO** (exit 2). Something blocking was seen, usually a focused test, or the evidence file says the tests failed. Do not release on this output.
- **REVIEW_REQUIRED** (exit 3). The static picture is not blocking, but evidence is missing, untrusted, empty, or the scan was partial, or tests, CI or a license are missing under the policy. A person has to look.
- **READY_FOR_HUMAN_APPROVAL** (exit 0). The policy's checks passed. It is still not permission to deploy.

Then read "Supplied test evidence". If it says no file was supplied, the pass/fail counts you might imagine are not in this report. Then read the findings table: severity, rule, file:line, and the fix. The limitations at the bottom are part of the result, not a footnote to skip.

Samples you can open without scanning anything:

| Situation | Markdown | HTML |
|---|---|---|
| Focused test, NO_GO | [report.md](samples/focused-test/report.md) | [report.html](samples/focused-test/report.html) |
| Clean project plus passing evidence | [report.md](samples/clean-project/report.md) | [report.html](samples/clean-project/report.html) |
| Tests exist, CI does not | [report.md](samples/missing-ci/report.md) | [report.html](samples/missing-ci/report.html) |
| CI exists, tests do not | [report.md](samples/missing-tests/report.md) | [report.html](samples/missing-tests/report.html) |
| Odd file names, still a focused test | [report.md](samples/unsafe-names/report.md) | [report.html](samples/unsafe-names/report.html) |
| Python, Java and Go skips | [report.md](samples/multi-language/report.md) | [report.html](samples/multi-language/report.html) |

This repository's own audit: [audit/report.md](audit/report.md) and [audit/report.html](audit/report.html).

## Supply evidence

The CLI will not run your tests. You run them, then describe the result. Minimum shape:

```json
{
  "schemaVersion": "1.0.0",
  "source": "local-executed",
  "command": "npm test",
  "executedAt": "2026-11-06T12:00:00Z",
  "exitCode": 0,
  "passed": 37,
  "failed": 0,
  "skipped": 1
}
```

`source` is `local-executed` when you ran it on a machine you control, or `ci-ingested` when the counts came from the CI log. Use `external-unverified` when you cannot stand behind the file; the gate will stay in review.

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path . --evidence evidence.json
```

Check a file alone:

```bash
node packages/cli/bin/pramanasutra.mjs verify --evidence evidence.json
```

In this repository, `node scripts/ci-gate.mjs` runs the unit tests and builds that file from the summary. It does not hand-type the counts. Copy that pattern in your own CI rather than committing a stale evidence file.

## Choose a policy

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path . --evidence evidence.json --policy policies/strict.json
```

Strict mode turns skipped tests into `NO_GO`. Recommended mode reports them and does not block on them. Write your own file with only the keys in the [technical reference](04-technical-reference.md). A typo in a key is an error, on purpose.

## Install the skills

```bash
node packages/cli/bin/pramanasutra.mjs init --ide claude --target /path/to/your/app
```

The target must already exist. The command copies folders. It does not call the model. If you already have a `pramanasutra-prime` skill there, it stops. Read the existing file before you pass `--force`.

Then tell the assistant, in your own words or this one:

> PramanaSutra Prime: assess this repository's test quality and release readiness. Stay read-only, cite file and line, separate observed facts from executed results, and ask before running any tests.

The skill is supposed to refuse to invent a pass. If a host ignores the skill, that is a host limitation. It is listed as not verified in [Roadmap and status](13-roadmap-and-status.md).

## Exclude paths

Put `.pramanasutraignore` at the root of the project you scan. Example:

```text
# generated fixtures, not the product
fixtures/
examples/sample-app/
```

The report will say how many paths were excluded. If you exclude your real tests, the gate can look healthier than the project is. That is your file. Read the limitation line.

## Fix a NO_GO for a focused test

1. Open the path in the finding, for example `tests/a.test.js:2`.
2. Remove `.only`, `fit` or `fdescribe`.
3. Run the project's real test command and keep the output.
4. Run `release-check` again with `--evidence` pointing at a file that matches that output.

Removing `.only` without running the suite only clears the static finding. Without evidence the gate becomes `REVIEW_REQUIRED`, which is still not ready. That is the correct outcome.

## When something fails

| Symptom | What it usually means |
|---|---|
| `Node 20+ required` | `doctor` saw an older Node. Install 20 or newer |
| `Scan target must be a real directory` | The path is missing, a file, or a symlink |
| `Invalid evidence` | A field is missing or the wrong type. `verify` prints the reason |
| `Invalid policy` | Unknown key, or a safety flag set to an unsafe value |
| Exit 3 and you expected 0 | No evidence, evidence not from a trusted source, zero passes, partial scan, or missing tests, CI or license |
| HTML looks empty of findings | The scan found none. Read the limitations and the evidence block before you treat that as healthy |
| Tests "passed" inside an AI chat but the CLI says not-run | The chat is not evidence. Pass `--evidence` or do not claim the run |

More terms: [FAQ](14-faq-and-glossary.md).
