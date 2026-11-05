# Functional specification

<!-- summary: Actors, use cases, functional requirements and acceptance criteria for PramanaSutra AI 0.3.0. Planned work is marked planned and is not described as shipped. -->

This specification describes version 0.3.0 as implemented. A requirement marked **planned** is not available. Tests that mention a requirement are named so a reader can find them in `tests/cli.test.mjs`.

## Actors

| Actor | Goal | What they can do |
|---|---|---|
| Developer | Know if a change is even a candidate for release | Run the CLI locally. Read `report.md` or `report.html` |
| AI assistant inside an IDE | Plan QA without inventing results | Follow a skill. The skill forbids claiming a test ran without a tool result |
| CI job | Fail the build on a blocking finding, and record evidence | Run tests, pass the counts as `--evidence`, fail on exit 2 |
| Reviewer | Understand a gate without installing Node | Open the HTML report or the Markdown report |
| Maintainer | Keep the rules honest | Add a fixture and a test before changing a rule. See the [maintainer guide](15-maintainer-guide.md) |
| Release approver | Decide | Read the gate. The tool will not approve for them |

## Use cases

### UC-1 Static audit

The developer points the CLI at a directory. The tool walks the tree, skips symlinks, skips ignored paths, and reports focused tests, skipped tests, missing tests, missing CI and a missing license. It writes `report.md`, `report.html` and `report.json` together. It does not execute the project.

### UC-2 Release check with evidence

The developer, or CI, has already run the test command. They write a JSON evidence file (or the CI helper writes it from the real output) and pass `--evidence`. The gate combines the static findings and that file. Passing evidence from `local-executed` or `ci-ingested`, plus a clean required static picture, yields `READY_FOR_HUMAN_APPROVAL` and exit 0. The report shows the counts from the file and states that PramanaSutra did not run the command.

### UC-3 Install skills

The developer runs `init --ide <host> --target <existing directory>`. The tool copies the canonical skills from `.agents/skills` into the host's directory. If a skill directory already exists, the copy stops unless `--force` is set. The target must be a real directory, not a file and not a symlink. A symlink anywhere on the destination path is refused.

### UC-4 Policy

A team commits `policies/strict.json` or their own file. `--policy` loads it. Unknown keys, wrong types, and any attempt to set `allowAutomatedDeployment` to true or `manualApprovalsRequired` to false are errors. Exit code 1. The default policy is `recommended` when `--policy` is omitted.

### UC-5 Exclude examples

A repository that contains labeled bad examples (this one does) lists them in `.pramanasutraignore`. The report's limitations say how many paths were excluded. Excluded content is not inspected. The author of the ignore file is responsible for not hiding the tests that matter.

## Functional requirements

| ID | Statement | Status | Acceptance |
|---|---|---|---|
| FR-1 | `doctor` reports Node, platform, offline, and that no model is called | Implemented | Test `doctor succeeds without a provider key` |
| FR-2 | `version` and `--version` print the version from `package.json` | Implemented | Test `version and --version print the package version` |
| FR-3 | `agents list` lists 17 skills whose folder name matches frontmatter | Implemented | Test `agents catalog includes Prime and 16 specialists` |
| FR-4 | `scan` and `release-check` require `--path` to a real directory | Implemented | Missing path exits 1, no stack trace |
| FR-5 | Default output is `./pramanasutra-reports` in the current working directory, not inside the scanned project | Implemented | Test `scan writes md, html and json reports by default` |
| FR-6 | The three report files are always written together unless `--no-report` | Implemented | Tests assert `report.md`, `report.html`, `report.json` |
| FR-7 | HTML and Markdown escape `<`, `>` and quotes from file names, titles and evidence commands | Implemented | Escape tests, including a portable path test that does not need a forbidden file name |
| FR-8 | The scanned path stored in the report is the directory's base name, not the absolute path | Implemented | Test `reports do not disclose absolute target paths by default` |
| FR-9 | A focused test (`test.only`, `it.only`, `describe.only`, `fit`, `fdescribe`) is high severity and `NO_GO` under the default policy | Implemented | Fixture `focused-test`, exit code 2 |
| FR-10 | A skipped or todo test is reported and is not described as an executed test | Implemented | `it.skip`, `test.todo`, pytest, unittest, JUnit, Go |
| FR-11 | No recognised tests, no recognised CI, and no root license are separate findings | Implemented | Fixture cases and unit tests |
| FR-12 | Without evidence, a clean static project is `REVIEW_REQUIRED`, never ready | Implemented | Exit code 3 |
| FR-13 | Passing `ci-ingested` or `local-executed` evidence, with failed = 0, exit 0, passed > 0, and a clean policy picture, is `READY_FOR_HUMAN_APPROVAL` and still `automatedDeploymentAuthorized: false` | Implemented | Exit code 0 test |
| FR-14 | Failing evidence is `NO_GO` even when the static scan is clean | Implemented | Exit code 2 |
| FR-15 | `external-unverified` evidence and zero-pass evidence stay `REVIEW_REQUIRED` | Implemented | Unit tests |
| FR-16 | `--evidence` and `--policy` are rejected on `scan` | Implemented | Unit test |
| FR-17 | Symlinks are not followed | Implemented | Skipped when the OS denies symlink creation |
| FR-18 | `.pramanasutraignore` excludes prefixes and rejects `..` | Implemented | Unit test |
| FR-19 | Binary test files (NUL byte) are not decoded as source; the scan is marked partial | Implemented | Unit test |
| FR-20 | Skill install does not overwrite and does not follow a symlinked destination | Implemented | Installer tests |
| FR-21 | The CLI executes the target project's tests | **Planned** | Must stay `not-run` until a real executor exists |
| FR-22 | Browser, accessibility measurement, load, security scan | **Planned** or explicitly not supported | Capabilities in every report |
| FR-23 | Hosted server, Ollama, extra model API | **Planned** | Not in the CLI |

## Out of scope

- Replacing Jest, pytest, JUnit, Playwright or a CI provider.
- Mutating the scanned project. The only writes are the report directory, and `init` into the target the user named.
- Secret detection, dependency CVE scanning, SBOM, provenance attestations, SLSA.
- Deciding production rollout, feature flags, or customer communication.
- Legal conclusions about the user's product. See [Legal](10-legal-and-compliance.md).

## Policies shipped in the box

`policies/recommended.json` blocks focused tests, requires executed evidence, requires tests, CI and a license, and does not block on skipped tests.

`policies/strict.json` is the same and also blocks on skipped tests, so a skip becomes `NO_GO` even when evidence passes.

Both set `allowAutomatedDeployment` to false. The loader will not accept true.

## User-visible errors

Errors go to stderr as `PramanaSutra error: <message>` and exit 1. The message is the thrown error's message, not a stack, for the cases tests cover (missing path, bad evidence, bad policy, unknown option). A bug that throws an unexpected exception is also caught and printed as that one line, which hides the stack from the user. Maintainers reproduce with the unit suite.

## Acceptance of the documentation itself

A reader who has not seen the source can: install, run a check, open both report files, explain the three gate words, point at a sample for each gate, and state two things the tool does not do. The pages linked from [Start here](00-start-here.md) are the checklist.
