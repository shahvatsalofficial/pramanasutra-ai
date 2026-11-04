# Contributor guide

<!-- summary: How to set up, test, add rules, skills and host adapters, and submit changes to PramanaSutra AI. -->

## Setup

```bash
git clone https://github.com/shahvatsalofficial/pramanasutra-ai.git
cd pramanasutra-ai
npm test
node packages/cli/bin/pramanasutra.mjs doctor
```

No `npm install` is needed: there are no dependencies.

## Rules of the road

1. **Evidence first.** Never write code or docs that imply tests ran when they did not.
2. **Fail closed.** New inputs are validated; unknown values are errors.
3. **No new dependencies** without a written reason in the pull request.
4. **No network, no telemetry** in the CLI.
5. **Every behavior change has a test** in `tests/cli.test.mjs`.
6. **Docs move with code.** Update the handbook page and `docs/status.md`.

## Add a rule

1. Add the regex and finding in `packages/cli/lib/scanner.mjs`. Keep it line-based and anchored.
2. Add a fixture under `fixtures/` and an entry in `scripts/generate-proof.mjs`.
3. Add unit tests for a hit and a look-alike that must not hit.
4. Document it in [rule catalog](12-rule-catalog.md), including false positives.
5. Run `node scripts/generate-proof.mjs` and commit the regenerated proof.

## Add or change a skill

1. Edit `.agents/skills/<name>/SKILL.md`. Frontmatter needs `name` (equal to the folder) and `description`.
2. State triggers, inputs, safe workflow, output contract and boundaries.
3. Never instruct an agent to run tests, install software or contact the network without user approval.
4. `npm test` checks names and frontmatter.

## Add a host adapter

1. Read the vendor's current documentation and note the access date.
2. Add the path to `ADAPTERS` in `installer.mjs`.
3. Test install, collision refusal and `--force`.
4. Mark it **adapter** until someone has tested it live and recorded the result.

## Rebuild docs and proof

```bash
node scripts/generate-proof.mjs   # test results, fixture evaluation, sample reports
node scripts/build-docs.mjs       # HTML site from docs/**/*.md
```

## Pull requests

Describe the change, show `npm test` output, list affected docs, and state which platforms you tested on. Security issues: follow `SECURITY.md`, not a public issue.

## Style

Plain ESM, small functions, clear errors with no stack traces for expected failures, UTF-8, LF line endings. Handle spaces and non-ASCII in paths.

## Conduct

See `CODE_OF_CONDUCT.md`. Contributions are accepted under Apache-2.0.
