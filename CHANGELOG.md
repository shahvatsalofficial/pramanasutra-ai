# Changelog

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
