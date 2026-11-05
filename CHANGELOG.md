# Changelog

## 0.3.3 - 2026-11-06

### Fixed
- The npm page for `pramanasutra` showed a blank README. The file began with a raw HTML `<div align="center">`, which npmjs.com does not render. The README is Markdown only, and its links are absolute so they work on the package page.

## 0.3.2 - 2026-11-06

### Added
- `.github/workflows/publish.yml` publishes `pramanasutra` when a GitHub Release is published. Login is npm trusted publishing (OIDC). There is no stored npm token. `ci.yml` still only runs tests.

### Fixed
- `@vatsalshah/pramanasutra` cannot be published. npm user `shahvatsal` does not own that scope (registry 404).
- `@shahvatsal/pramanasutra@0.3.1` was published, then deleted, because the install name showed the scope. The public package name is the unscoped name `pramanasutra`.
- `bin` path no longer starts with `./`, which npm 11 rewrote and reported as removed.

## 0.3.0 - 2026-11-06

### Added
- Canonical documentation pack at `documents/pramanasutra/`: executive, functional, architecture, technical, user, rules, skills, security, legal, proof, CI, roadmap, FAQ and maintainer pages, in Markdown and generated HTML.
- Self-audit of this repository as `documents/pramanasutra/audit/report.md` and `report.html`, produced by the CLI from a real unit-test run.
- Sample audits copied beside the docs. Evidence counts are now a section in both Markdown and HTML reports, not only a state word.
- `.pramanasutraignore` so labeled bad fixtures are excluded from a scan and the exclusion is written into the report. `..` entries are rejected.
- `scripts/ci-gate.mjs`: CI runs the tests, parses the summary, and release-checks this repo. It exits 1 if it cannot read the counts.
- Skip detection for `test.todo` / `xtest`, `pytest.skip()`, `pytest.xfail()`, `self.skipTest` and `raise unittest.SkipTest`.
- Binary test files (NUL byte) are skipped and the scan is marked partial, so the gate cannot go ready.
- `version` and `--version`. `doctor` includes the version from `package.json`.

### Fixed
- Required CI no longer requests macOS. Run 41884015367 failed because both macOS jobs were cancelled in the queue with zero steps. A follow-up workflow on `macos-14` was cancelled the same way in about a second, with no runner (run 42098256304), so that workflow was removed. Ubuntu and Windows stay required. macOS execution is unverified in Actions.
- `--help` and `--version` were rejected as unknown options.
- Markdown reports escape `<` and `>` so a hostile path is not raw HTML on GitHub.
- The malicious-filename escape test no longer depends on creating a file the OS forbids, so it runs on Windows.

### Changed
- Reports lead with how to read them, a findings table, the test files seen, and the workflows seen.
- `actions/checkout` and `actions/setup-node` are pinned to commit SHAs.
- Documentation HTML does not load a chart library from a CDN.

## 0.2.0 - 2026-11-04

### Added
- `release-check --evidence <file>` and `verify --evidence <file>`: schema-validated test-evidence ingestion. The gate can now reach `READY_FOR_HUMAN_APPROVAL`, only with passing `local-executed` or `ci-ingested` evidence and clean static checks.
- `--policy <file>`: fail-closed policy loader (unknown keys rejected, safety flags cannot be weakened). New policy keys `blockOnSkippedTests`, `requireCi`, `requireLicense`, `requireTests`.
- Reports are now written by default to `./pramanasutra-reports` as `report.md`, `report.html` and `report.json`; `--no-report` disables. Redesigned Markdown and HTML reports (summary, capabilities, findings with fixes, gate reasons, limitations; light/dark, printable).
- Skip detection for pytest, unittest, JUnit and Go; test-file detection for Java, Kotlin, C#, Swift, Scala, PHP, Dart and Ruby naming conventions.
- Six labeled fixtures, generated sample reports (`examples/sample-output`), captured test results and fixture evaluation (`docs/proof`).
- Full handbook (13 pages) and a generated HTML documentation site in `docs/`; `llms.txt`, `CITATION.cff`, `THIRD_PARTY_NOTICES.md`, `SUPPORT.md`, CodeQL and Dependabot.

### Fixed
- CI failed on Windows/Node 20 because `node --test tests/*.test.mjs` depended on shell globbing; the test file is now named explicitly.
- `scan` no longer recurses into its own `pramanasutra-reports` output.
- Reports no longer print "tests not run" ambiguously when evidence is supplied.

### Changed
- GitHub Actions bumped to `checkout@v7`, `setup-node@v7`, `codeql-action@v4`.

## 0.1.0 - Starter snapshot

- Dependency-free local QA scanner, conservative release gate, Markdown/JSON/HTML reports, portable specialist skills, IDE skill installer and CLI tests.
