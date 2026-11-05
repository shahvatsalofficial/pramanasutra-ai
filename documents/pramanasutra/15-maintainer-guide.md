# Maintainer guide

<!-- summary: How to change a rule, refresh proof and HTML docs, and cut a PramanaSutra AI release without claiming results you did not run. -->

## Layout a maintainer actually edits

| Path | Edit when |
|---|---|
| `packages/cli/lib/scanner.mjs` | Rules, walk limits, gate logic, ignore file |
| `packages/cli/lib/evidence.mjs` | Evidence schema |
| `packages/cli/lib/policy.mjs` | Policy keys |
| `packages/cli/lib/report.mjs` | Wording or layout of `report.md` and `report.html` |
| `packages/cli/bin/pramanasutra.mjs` | Flags and exit codes |
| `packages/cli/lib/installer.mjs` | IDE paths |
| `.agents/skills/` | Skill text. This is the canonical copy |
| `tests/cli.test.mjs` | Every behavior change |
| `fixtures/` | A labeled tree for a rule. Excluded from the product gate by `.pramanasutraignore` |
| `documents/pramanasutra/*.md` | These pages. Then rebuild HTML |
| `scripts/generate-proof.mjs` | How samples and the self-audit are produced |
| `scripts/ci-gate.mjs` | How CI turns a test run into evidence |
| `scripts/build-docs.mjs` | HTML chrome. The words live in the Markdown |

`packages/*` other than `cli` are notes. Do not import them from the CLI until they have tests and a status-page change from planned to implemented.

## Change a rule

1. Write the smallest fixture that should match, and one that should not.
2. Add or extend a test in `tests/cli.test.mjs` before you celebrate the regex.
3. Change `scanner.mjs`.
4. Add the rule to [the catalog](07-rule-catalog.md) in the same change, including what it misses.
5. Run `node --test tests/cli.test.mjs`.
6. Run `node scripts/generate-proof.mjs` so samples and `eval-results.json` match.
7. If the self-audit gate changes, read why before you commit it. A new `NO_GO` on the product itself means the rule hit the product, not only the fixture. Fixtures are ignored. Product tests are not.

Do not weaken a test to match a sloppy pattern. Do not special-case this repository inside the scanner. Use `.pramanasutraignore` for example trees, and keep the limitation text.

## Change the report

`markdown()` and `html()` must show the same decision, the same location, and the same fix. The tests look for `NO_GO`, a `path:line`, and the remediation sentence. Escaping is not optional: a new interpolated field goes through `escMd` or `escapeHtml`. Add a hostile string to the escape test when you add a field.

Keep the report free of remote URLs for CSS, fonts and scripts. It is opened from disk and it is quoted as local.

## Change the docs

Edit the numbered Markdown. Do not hand-edit `documents/pramanasutra/html` or the mirrored files under `docs/`. Those are generated.

```bash
node scripts/build-docs.mjs
```

The script also writes redirects from the old `docs/handbook/*.html` names. If you rename a page, update the `moved` map in the script or the old URL 404s on Pages.

Pages must stay readable without JavaScript: the article HTML is server-side (here, build-time). JavaScript only adds search, theme and copy buttons.

## Checks before a commit that claims a fix

```bash
node --test tests/cli.test.mjs
node scripts/ci-gate.mjs
node scripts/generate-proof.mjs
node scripts/build-docs.mjs
```

`ci-gate` runs the tests again. That is deliberate. It is the path CI uses.

## Release

Follow [CI and release](12-ci-and-release.md). Version strings that must move together: `package.json`, `CHANGELOG.md`, `CITATION.cff`. The CLI reads the version from `package.json` at runtime, so the help text does not have its own copy. The docs site prints `package.json` too.

Do not commit `reports/` or `pramanasutra-reports/`. They are gitignored local output. Do commit `documents/pramanasutra/audit` and `samples`, because those are the public proof.

## Reviewing someone else's change

- A new ready-path without a test is a defect.
- A claim of IDE support, certification, or trademark clearance in a doc page is a defect unless the artifact exists.
- A dependency added "to make the HTML nicer" needs a third-party notice and a reason that beats the zero-dependency promise. System fonts and inline CSS are the current answer.
- Generated HTML that does not match the Markdown means the generator was not run. Ask for the rebuild. Do not patch the HTML by hand.

## Secrets

Do not commit `.env`, tokens, or a real customer tree as a fixture. The unsafe-names fixture uses punctuation in a file name on purpose. It is not a credential.
