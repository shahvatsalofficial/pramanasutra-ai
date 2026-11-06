# CLI and reports

<!-- summary: Every PramanaSutra AI command and flag, and how report.md, report.html, report.json and report.sarif.json present the same audit. -->

Binary name: `pramanasutra`. From a clone: `node packages/cli/bin/pramanasutra.mjs`.

## Commands

| Command | What it does | Exit |
|---|---|---|
| `version`, `--version`, `-v` | Prints `PramanaSutra AI` and the version | 0 |
| `help`, `--help`, `-h` | Prints usage | 0 |
| `doctor [--json]` | Node major version, platform, offline, no model | 0 if Node ≥ 20, else 1 |
| `agents list [--json]` | Canonical skill names | 0 |
| `scan --path <dir> [--changed] [--out <dir>] [--no-report] [--json]` | Static audit plus a gate with no evidence file. Same exit codes as `release-check` | 0, 2, 3, or 1 |
| `release-check --path <dir> [--evidence <file>] [--policy <file>] [--changed] [--out <dir>] [--no-report] [--json]` | Audit plus gate. This is the CI command | 0, 2, 3, or 1 |
| `verify --evidence <file> [--json]` | Schema-check an evidence file. Does not scan | 0 or 1 |
| `init --ide <name> --target <dir> [--force]` | Copy skills. `--ide` is `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic` or `all` | 0 or 1 |

`--json` prints the object instead of the sentence. For `release-check --json`, the process exit code is still the gate. Do not parse the exit code from the JSON alone; use `releaseGate.decision` if you need the word, and the process status if you need CI to fail.

`--evidence` and `--policy` on `scan` are errors. They belong to `release-check` so a scan cannot quietly change meaning.

## Flags that take a value

`--path`, `--out`, `--ide`, `--target`, `--evidence`, `--policy`. The value is the next argument. A missing value is an error. `--force`, `--json`, `--no-report` and `--changed` take no value. `--changed` is only meaningful on `scan` and `release-check`.

## Where files are written

Default: `pramanasutra-reports` under the **current working directory**, resolved to an absolute path at write time. The scanned project is not the default output location, so a scan of a foreign tree does not drop files into it.

The four names are fixed: `report.md`, `report.html`, `report.json`, `report.sarif.json`. They are written in that order, in one directory, in one call. If the directory cannot be created, nothing is reported as success. SARIF is a rendering of the findings for other tools. The CLI does not upload it and does not fetch the SARIF schema.

## How to read report.md

1. The first table is identity: project base name, time, tool version, schema, **Release decision**, policy, evidence state.
2. The blockquote repeats the decision in a sentence.
3. **Summary** counts files, test files, workflows, manifests and findings by severity. It states that this tool did not execute tests.
4. **Supplied test evidence** is either an explicit "no file" or a table of source, command, time, exit code, passed, failed, skipped, and GitHub fields when present. Those numbers are from the file. They are not a new test run. The next paragraph is the binding: `none` (no file), `unbound` (no `github` object), or `ci-environment` (repository, commit, run id and workflow are all set). `ci-environment` is still not checked with GitHub. A person can type those four strings.
5. **Findings at a glance** is the table to paste into a review: severity, rule, `path:line`, fix.
6. **Findings** repeats each item with why it matters.
7. **Test files seen** and **CI workflows seen** show what the classification actually matched, up to 40 paths, then a count of the rest.
8. **Capabilities** translates `not-run` and `not-supported`.
9. **Release gate reasons** is the list that produced the decision.
10. **Limitations** includes walk limits, ignore exclusions, and the standing disclaimer.

Characters that would be HTML in a file name are escaped in the Markdown too, so a hostile path does not become a tag when GitHub renders the file.

## How to read report.html

Same sections, in the same order. The decision is a banner with a text label, not color alone. Stats are the counts. There is a skip link, a system light/dark theme, and a print style. No script is required to read it, and the file does not load a remote stylesheet or font. Open it from disk.

Do not host the HTML from an untrusted scan on a site that other people browse if the report might contain internal paths. The tool strips the absolute target path, but evidence `command`, `environment` and `commit` are whatever the evidence file contained, escaped for HTML and still visible as text.

## How to read report.json

Parse it. Do not scrape the Markdown. Fields are listed in the [technical reference](04-technical-reference.md). `releaseGate.automatedDeploymentAuthorized` is false. `releaseGate.requiresHumanApproval` is true. If your automation treats a ready decision as permission to deploy, it is ignoring those fields.

## Worked terminal session

Against the focused-test fixture, from a clone:

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/focused-test --no-report
```

Expect exit code 2 and a line containing `Gate: NO_GO` and `Tests executed by this tool: NO`. The fixture is a bad example on purpose. The full rendered reports are already committed under [samples/focused-test](samples/focused-test/report.md).

Against the clean fixture with its evidence file:

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path fixtures/clean-project --evidence fixtures/clean-project/evidence.json --no-report
```

Expect exit code 0 and `READY_FOR_HUMAN_APPROVAL`.

## What the report will not contain

A coverage percentage, a flaky-test rate, a screenshot, a CVE list, a performance number, or a sentence that the suite passed, unless that sentence is the evidence table quoting the file you passed in. If a field is absent, it was not measured.
