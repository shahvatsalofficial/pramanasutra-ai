# CI and release

<!-- summary: How PramanaSutra AI uses GitHub Actions, why macOS is not scheduled, how to fail a build on NO_GO, and how this project itself is released. -->

## Workflows in this repository

| File | What it gates | Badge |
|---|---|---|
| `.github/workflows/ci.yml` | Ubuntu and Windows, Node 20 and 22. Unit tests, `doctor`, then `scripts/ci-gate.mjs` | The CI badge on the README |
| `.github/workflows/codeql.yml` | CodeQL `javascript-typescript` on Ubuntu | CodeQL badge |
| `.github/dependabot.yml` | Update PRs for Actions | None |

`actions/checkout` and `actions/setup-node` are pinned to commit SHAs. Timeouts are 20 minutes. Concurrency cancels a superseded run on the same ref.

## Why macOS is not scheduled

On 4 November 2026, Actions run [41884015367](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/runs/41884015367) finished as a failure. Ubuntu and Windows jobs succeeded. Both `macos-latest` jobs were **cancelled with zero steps**. They never checked out the repo. That failure painted the only CI badge red.

A separate `macos-14` workflow was tried on the 0.3.0 push. Run [42098256304](https://github.com/shahvatsalofficial/pramanasutra-ai/actions/runs/42098256304) cancelled both jobs in about a second. `runner_name` was empty. No step ran. Scheduling that workflow again would only add a red badge. It was removed. macOS test execution in GitHub Actions is **unverified**. The unit suite has been run on the maintainer's Windows machine, and the required workflow covers Ubuntu and Windows.

## What the gate job proves

`scripts/ci-gate.mjs`:

1. Runs `node --test --test-reporter=spec tests/cli.test.mjs`.
2. Reads the last `pass` and `fail` counts from that output.
3. If it cannot read them, exits 1. It does not invent a passing evidence file.
4. Writes a temporary evidence file with `source: ci-ingested` and those counts.
5. Runs `release-check` on the repository root with that file.
6. Exits with the gate code.

Because `fixtures/` and `examples/sample-app/` contain intentional focused tests, they are listed in `.pramanasutraignore`. The gate is about the product, and the report names the exclusion. A pull request that adds `test.only` under `tests/` or `packages/` fails this job with exit 2.

## Use it on your repository

Run your tests in the job you already trust. Then either:

- call your own small script that writes evidence from that output, the way `ci-gate.mjs` does, or
- fail only when you are ready to maintain an evidence file

Example pattern, after your tests have already run and you have written `evidence.json` honestly:

```yaml
- name: PramanaSutra release check
  run: npx github:shahvatsalofficial/pramanasutra-ai release-check --path . --evidence evidence.json --out pramanasutra-reports
```

Exit 2 fails the step. Exit 3 also fails a step, because it is non-zero. If you want review to be a comment and only `NO_GO` to be red, branch on the status in the shell and upload `report.md` as an artifact either way:

```bash
set +e
npx github:shahvatsalofficial/pramanasutra-ai release-check --path . --evidence evidence.json --out pramanasutra-reports
code=$?
set -e
if [ "$code" -eq 2 ]; then exit 2; fi
if [ "$code" -eq 1 ]; then exit 1; fi
exit 0
```

Exit 3 is then visible in the log and the report, and the job stays green. Do this on purpose. Do not "fix" a red gate by deleting findings.

Upload `pramanasutra-reports/report.md` and `report.html` as build artifacts so reviewers can read them without re-running.

## GitHub Pages

Pages serves the `/docs` directory on `main`. `scripts/build-docs.mjs` writes the site to `documents/pramanasutra/html` and copies it to `docs/`, including `index.html`, `sitemap.xml` and `robots.txt`. Old handbook URLs under `docs/handbook/` redirect to the new pages.

The site URL is `https://shahvatsalofficial.github.io/pramanasutra-ai/`.

`robots.txt` allows general crawlers and names common answer-engine crawlers as allowed. The content is public documentation. Do not put a private report in `docs/`.

## Releasing this project

1. Update `package.json`, `CHANGELOG.md` and `CITATION.cff` to the same version.
2. `node --test tests/cli.test.mjs`
3. `node scripts/generate-proof.mjs`
4. `node scripts/build-docs.mjs`
5. Read `documents/pramanasutra/audit/report.md`. If the gate is not what you expect, stop.
6. Commit, push to `main`.
7. Wait until the required CI workflow is green. Do not claim macOS CI passed.
8. `gh release create vX.Y.Z` with the changelog as notes.

npm publish of `@vatsalshah/pramanasutra` is a separate step and needs an npm login. Until that succeeds, the README must keep saying the package is not on npm and the install path is `npx github:shahvatsalofficial/pramanasutra-ai`. A release on GitHub is not an npm release.

## What this project will not automate

Deploy, tag signing, and a SLSA provenance statement are not implemented. Do not add a badge that implies them.
