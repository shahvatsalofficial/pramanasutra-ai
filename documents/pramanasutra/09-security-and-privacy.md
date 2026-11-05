# Security and privacy

<!-- summary: Threat model, controls and residual risk for PramanaSutra AI. The CLI is local, read-only on the target, and not a vulnerability scanner. No independent security review has been done. -->

PramanaSutra is not a SAST product, not a secret scanner, and not a penetration test. This page describes how the CLI and the skills are built to avoid a class of mistakes. It is not a claim that the software has been attacked by a third party and found clean. It has not had an independent security review.

## Assets

| Asset | Why it matters |
|---|---|
| The target source tree | May contain proprietary code. The scanner reads it |
| Evidence and policy files | May contain commands, host names, commit ids |
| The report | Repeats finding paths and the evidence fields. People forward it |
| Skill text | Tells a model how to behave. A hostile edit changes the assistant's instructions |
| The machine running the CLI | The process has the user's filesystem rights |

## What the CLI does not do

- It does not open a socket as part of scan, gate, report or install. (The documentation HTML also does not load a third-party script. `npx` itself uses the network to download the package; that is npm, not the scan.)
- It does not execute the target's tests, package scripts, or binaries.
- It does not follow symlinks, so a link cannot pull in a directory outside the tree.
- It does not walk into a path that contains a symlink component during install.
- It does not put the absolute target path in the report. It stores the base name.
- It escapes report text so a file name or an evidence command cannot inject a tag.

## Controls

| Threat | Control |
|---|---|
| Accidental execution of repo code | No test runner in the CLI. Evidence is data |
| Symlink escape while scanning | `lstat` / `Dirent` symlink check, skip, count |
| Symlink escape while installing skills | Walk the destination, refuse if any component is a symlink |
| Overwriting a team's own skills | Refuse when the destination exists, unless `--force` |
| Policy that allows unattended deploy | Loader rejects `allowAutomatedDeployment: true` |
| Tampered evidence promoted to "ready" | `external-unverified` cannot reach ready. This does not detect a lie in a `ci-ingested` file |
| HTML injection via a crafted file name | `escapeHtml` on every interpolated value. Tested |
| Markdown injection of the same name | `<` and `>` escaped in the Markdown renderer |
| Ignore file used as a path traversal | Entries containing `..` or an absolute path throw |
| Huge input | Size caps on evidence, policy, ignore, and per test file |
| Binary mistaken for source | NUL byte skips the file and marks the scan partial, so the gate cannot be ready |
| Secrets in a report | The tool does not redact. Do not put secrets in the evidence `command` or `environment`. The evidence skill tells the model the same |

## Privacy

The CLI does not phone home, does not have an analytics hook, and does not write a user id. Data stays in the process and in the output directory you chose.

You can still leak data yourself:

- The evidence file's `command`, `environment` and `commit` are copied into the report.
- Finding paths are relative and can still reveal internal layout.
- If you paste a report or a skill prompt into a hosted model, that provider processes it under their terms. PramanaSutra does not control that.
- `init` copies skill files into the target. Those files are project content, not telemetry.

The HTML documentation uses `localStorage` only if you toggle the theme, and only in that browser. Search runs on the page. Nothing is sent.

GitHub Pages serves a copy of the HTML. That is a public site of this public repository. Do not put private audit output into `docs/`.

## Residual risk

- Heuristic rules miss vulnerabilities entirely. Do not use a ready gate as a security sign-off.
- A person can write `ci-ingested` evidence that does not match any CI run. The schema cannot prove the command happened.
- `--out` writes wherever the operator points. That is intended. Point it at a directory you mean to create.
- `init --force` deletes an existing skill directory and replaces it. Read the diff first.
- Skill files are instructions to a model. Review them like code before you install them into a repository with secrets in context.
- Dependencies: there are none at runtime. The GitHub Actions workflows pin `actions/checkout` and `actions/setup-node` to commit SHAs. CodeQL actions are still on the v4 major tag; Dependabot is configured.

## Reporting a vulnerability

Use GitHub private vulnerability reporting on [the repository](https://github.com/shahvatsalofficial/pramanasutra-ai). Do not open a public issue with an exploit, a token, or customer data. The policy file is `SECURITY.md`.

## CodeQL

The CodeQL workflow runs on push to `main`, on pull requests, and weekly. A green CodeQL check is the queries that shipped with that action, on this JavaScript. It is not a full application assessment.
