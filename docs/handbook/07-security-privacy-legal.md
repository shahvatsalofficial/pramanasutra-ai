# Security, privacy and legal

<!-- summary: Threat model, privacy guarantees, license, trademarks, disclaimers and the legal checks not yet performed for PramanaSutra AI. -->

## Security model

### Assets and threats

| Threat | Control | Test |
|---|---|---|
| Malicious repository executes code on scan | The scanner only reads files; it never runs scripts, installs packages or spawns processes | No `child_process` in the CLI |
| Symlink escapes the scan root | Symlinks are skipped, never followed; symlink roots refused | Symlink test |
| HTML injection or XSS through file names or text | Every dynamic value is escaped before it enters HTML | XSS and escape tests |
| Path leakage in shared reports | Only the base name of the scanned directory is recorded | Report test |
| Resource exhaustion | Depth, file-count and file-size limits; partial scans are flagged | Limits documented |
| Weakened policy | Fail-closed parser; safety flags cannot be changed | Policy tests |
| Forged evidence | Provenance field; unverified sources never reach ready; human approval always required | Evidence tests |
| Overwriting user skills | `init` refuses without `--force`; symlinked destinations refused | Installer tests |
| Prompt injection via project text | Skills instruct agents to treat project content as data | Skill text |

### Not covered

PramanaSutra is not a vulnerability scanner, not a SAST tool and not a penetration test. It has had **no independent security review**. Do not rely on it to find security defects.

## Privacy

- The CLI makes **no network requests** and has **no telemetry**.
- Reports are written to your disk only.
- Reports contain relative file paths and rule text, not source excerpts.
- When you use the skills, your AI IDE's provider processes prompts and code under the provider's own terms. PramanaSutra does not control that.
- `.env.example` documents only optional future settings; no secret is read by the CLI.

## License

Apache License 2.0 (`LICENSE`). `NOTICE` carries attribution. Contributions are accepted under the same license. There are **no runtime dependencies**, so no third-party code is redistributed; see `THIRD_PARTY_NOTICES.md`.

## Trademarks and names

- "PramanaSutra" and "PramanaSutra AI" are project names. They are **not registered trademarks** and have **not been trademark-cleared** (see [name clearance](../legal/trademark-and-name-clearance.md)).
- Claude, Claude Code, Anthropic, Cursor, OpenAI, Codex, GitHub, GitHub Copilot, Gemini and Google are trademarks of their owners and are used only to describe compatibility. This project is not affiliated with or endorsed by them.

## Disclaimers

- Provided "as is" without warranty, as stated in Apache-2.0 sections 7 and 8.
- Output is decision support. It is not a certification of quality, security, accessibility, safety or regulatory compliance.
- Nothing here is legal, financial or investment advice.
- A clean report does not prove the absence of defects.

## Compliance statements deliberately not made

No claim of SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, SLSA level or OpenSSF score is made. Standards are referenced as inspiration, never as conformance.

## Checks not yet done

| Check | Status |
|---|---|
| Lawyer review of license, notices and wording | Not done |
| Trademark search in target jurisdictions | Not done |
| Independent security review | Not done |
| Live smoke tests in each AI IDE | Not done |
| Accessibility audit of the HTML reports and docs | Basic (semantic HTML, contrast tokens, keyboard focus); no formal audit |

## Reporting a vulnerability

Use GitHub private vulnerability reporting on the repository, or open a minimal public issue that asks for a private channel without exploit details. See `SECURITY.md`.
