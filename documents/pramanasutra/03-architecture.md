# Architecture

<!-- summary: Components, data flow, trust boundaries and design decisions for the PramanaSutra AI CLI and skills. The CLI does not call a model and does not run the target's tests. -->

## What exists at runtime

There is one program: `packages/cli/bin/pramanasutra.mjs`. It loads four libraries and nothing else. There is no database, no daemon, no plugin loader and no network stack in the scan path.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 460" role="img" aria-labelledby="archTitle archDesc">
<title id="archTitle">PramanaSutra components</title>
<desc id="archDesc">Skills stay in the IDE. The CLI reads the repo, optional policy and evidence, evaluates a gate, and writes Markdown, HTML and JSON locally.</desc>
<style>text{font-family:ui-sans-serif,system-ui,sans-serif}</style>
<rect width="880" height="460" fill="#f7f4ee"/>
<rect x="24" y="24" width="250" height="120" rx="12" fill="#fff" stroke="#0f3d3e"/>
<text x="40" y="56" font-size="15" font-weight="700" fill="#0f3d3e">AI IDE</text>
<text x="40" y="80" font-size="13" fill="#1c1915">Claude, Cursor, Codex,</text>
<text x="40" y="100" font-size="13" fill="#1c1915">Copilot, Gemini CLI</text>
<text x="40" y="124" font-size="12" fill="#5e584e">Model stays in the IDE</text>
<rect x="24" y="168" width="250" height="100" rx="12" fill="#fff" stroke="#0f3d3e"/>
<text x="40" y="200" font-size="15" font-weight="700" fill="#0f3d3e">17 Agent Skills</text>
<text x="40" y="224" font-size="13" fill="#1c1915">.agents/skills is canonical</text>
<text x="40" y="244" font-size="12" fill="#5e584e">init copies them. It does not run them</text>
<rect x="330" y="70" width="250" height="210" rx="12" fill="#0f3d3e"/>
<text x="348" y="104" font-size="16" font-weight="700" fill="#f4fffe">pramanasutra CLI</text>
<text x="348" y="132" font-size="13" fill="#d5efec">scanner.mjs walk + rules</text>
<text x="348" y="156" font-size="13" fill="#d5efec">policy.mjs fail-closed</text>
<text x="348" y="180" font-size="13" fill="#d5efec">evidence.mjs schema</text>
<text x="348" y="204" font-size="13" fill="#d5efec">evaluateGate</text>
<text x="348" y="236" font-size="13" fill="#f4fffe">No network. No test exec.</text>
<rect x="630" y="24" width="226" height="78" rx="12" fill="#fff" stroke="#92400e"/>
<text x="646" y="52" font-size="14" font-weight="700" fill="#92400e">Policy JSON</text>
<text x="646" y="76" font-size="12" fill="#1c1915">optional --policy</text>
<rect x="630" y="118" width="226" height="78" rx="12" fill="#fff" stroke="#92400e"/>
<text x="646" y="146" font-size="14" font-weight="700" fill="#92400e">Evidence JSON</text>
<text x="646" y="170" font-size="12" fill="#1c1915">optional --evidence</text>
<rect x="630" y="214" width="226" height="110" rx="12" fill="#fff" stroke="#166534"/>
<text x="646" y="244" font-size="14" font-weight="700" fill="#166534">Reports</text>
<text x="646" y="268" font-size="13" fill="#1c1915">report.md</text>
<text x="646" y="288" font-size="13" fill="#1c1915">report.html</text>
<text x="646" y="308" font-size="13" fill="#1c1915">report.json</text>
<rect x="24" y="310" width="832" height="124" rx="12" fill="#fff" stroke="#ddd4c4"/>
<text x="40" y="342" font-size="14" font-weight="700" fill="#1c1915">Target repository (read-only)</text>
<text x="40" y="368" font-size="13" fill="#1c1915">Files, test names, CI config, LICENSE. Symlinks skipped. .pramanasutraignore prefixes excluded.</text>
<text x="40" y="392" font-size="13" fill="#1c1915">The report stores the folder's base name, not the absolute path.</text>
<text x="40" y="416" font-size="12" fill="#5e584e">Writes go to the output directory the operator chose, default ./pramanasutra-reports in the current working directory.</text>
</svg>

The diagram is inline. The page does not fetch a chart library. The reports box lists Markdown, HTML and JSON. The same write also emits `report.sarif.json` (SARIF 2.1.0).

## Trust boundaries

| Boundary | Rule |
|---|---|
| Target tree to scanner | Read-only. Symlinks skipped, not followed. Directories in the skip list (`.git`, `node_modules`, build outputs, `pramanasutra-reports`) are not entered |
| Ignore file to scanner | Prefixes only. `..`, absolute paths and NUL are rejected. The file is data, not code |
| Evidence file to gate | Schema-checked JSON, max 1 MB, must be a regular file. The counts are believed as data. The provenance is only as good as `source` |
| Policy file to gate | Fail closed. Safety flags cannot be weakened |
| Report to the reader | Every string that came from the repo or the evidence file is escaped in HTML and in Markdown |
| IDE to skill | The skill is text. The model is the IDE's. PramanaSutra does not see that traffic |
| CLI to network | No HTTP client is used by the scan, gate, report or installer |

## Command flow

`scan` calls `scanProject`, runs `evaluateGate` with no evidence (so the decision is at best `REVIEW_REQUIRED` unless something is already `NO_GO`), and writes reports. Exit code is 0 even when the gate is not ready, because scan is an inspection.

`release-check` is the same pipeline plus optional evidence and policy. Its exit code is the gate: 2, 3 or 0. That is the code CI should use.

`verify` only validates an evidence file. It does not scan.

`init` only copies directories.

## Design decisions

**Heuristics, not parsers.** A real parser for every language would be a different product and a large dependency. The cost is false positives and false negatives. Each rule says its confidence is `medium` except the license check, which is `high` because it is a file-name check. The report repeats the limitation so a green gate is not read as a proof of absence.

**Evidence is supplied, not collected by running tests.** Running the target's test script would execute arbitrary code. The CLI refuses that. CI runs the tests in its own job, where the user already accepted that risk, and passes the summary in.

**Ready still needs a human.** `requiresHumanApproval` is always true. `automatedDeploymentAuthorized` is always false. A policy cannot flip them.

**Reports are the product, not a log line.** Reviewers live in pull requests and browsers. Markdown, HTML and JSON are written in one function so they cannot drift into different facts. JSON is the machine copy of the same object the prose describes.

**Ignore is visible.** Hiding `fixtures/` without saying so would make this repository's own gate dishonest. The limitation line is mandatory when the ignore file matches anything.

## What the other packages are

Directories under `packages/` other than `cli` (`core`, `runner`, `server`, `reporter`, and the rest) contain README notes for planned modules. They are not imported by the CLI. Treat them as roadmap, not as running code. The status page says the same thing. Do not document them as features.

## Failure behavior

| Condition | Result |
|---|---|
| Path missing, not a directory, or a symlink | Error, exit 1 |
| Evidence or policy unreadable, huge, or schema-invalid | Error, exit 1 |
| Unreadable subdirectory during the walk | Limitation on the report, scan continues, `inventory.partial` may be true, gate will not be ready |
| More than 20,000 files or depth 22 | Truncation limitation, partial scan, not ready |
| Test file bigger than 2,000,000 bytes | Skipped, partial, not ready |
| Test file contains a NUL | Skipped as binary, partial, not ready |
| Output directory cannot be created | Error, exit 1 |

## Extension points

A new static rule belongs in `scanner.mjs` next to the existing ones, with a fixture and a test. A new evidence source belongs in `evidence.mjs` and must not be added to the "can count as passing" set unless the provenance story is real. A new IDE path belongs in `installer.mjs` `ADAPTERS`. None of these load remote code.
