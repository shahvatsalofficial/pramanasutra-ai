# FAQ and glossary

<!-- summary: Short answers about PramanaSutra AI and the terms used in its reports. -->

## Questions

### Is this a test framework?

No. It reviews test hygiene and release evidence. Keep Jest, pytest, JUnit, Go test, Playwright or whatever you already run. PramanaSutra reads the result only when you pass an evidence file.

### Does the scan send my code anywhere?

No. The scan, the gate, the report writer and the skill installer do not open network connections. `npx` downloads the tool before it runs; that download is npm. After the process starts, the audit stays local.

### Why is the gate REVIEW_REQUIRED when I can see tests?

Because nobody passed `--evidence`, or the evidence is unverified, or it records zero passes, or the scan was partial, or CI or a license file is missing under the policy. A clean reading of the files is not a test run. That split is the point of the tool.

### Why did a clean scan still not say ready?

`READY_FOR_HUMAN_APPROVAL` requires passing `local-executed` or `ci-ingested` evidence and the policy's static checks. No evidence file means not ready. See the clean-project sample, which includes an evidence file, versus any scan without one.

### Can I turn off the human?

No. `automatedDeploymentAuthorized` is always false, and the policy loader rejects an attempt to set it true. The ready state means "a person may now look", not "ship it".

### The HTML and the Markdown disagree. Which is wrong?

They are written from the same object in one function. If they disagree, it is a bug. Open `report.json` for the object. Please report it.

### It flagged test.only inside a string.

The pattern matches a line that starts with the declaration, after whitespace. A string later on the line does not match. A line whose first code is `test.only(` does match, even if a human considers it data. Move the sample off the start of the line, or exclude the path in `.pramanasutraignore` if it is a fixture tree. Do not ignore your real tests to silence a true positive.

### It did not see my tests.

The naming rules are in the [technical reference](04-technical-reference.md). A custom folder that matches none of them produces `NO_TESTS`. That finding means "not recognised", not "proven absent".

### Does a green CI file mean the tests ran?

No. `NO_CI` checks that a known file exists. It does not read the workflow steps.

### Is the skill going to edit my repository?

Only if you ask the assistant to and the host allows it. The skill text says to ask before running tests or changing files. The CLI `scan` and `release-check` do not edit the target. `init` writes only the skill directories you named.

### Which IDE was tested?

None end to end. The installer copies into documented paths. [Roadmap and status](13-roadmap-and-status.md) keeps the "verified live" column on No until there is a note.

### Is the name trademarked?

Not as far as this project claims, and no clearance search has been completed. Details: [Legal](10-legal-and-compliance.md).

### Where is the audit of PramanaSutra itself?

[audit/report.md](audit/report.md) and [audit/report.html](audit/report.html).

### How do I cite it?

[CITATION.cff](../../CITATION.cff) at the repository root.

## Glossary

| Term | Meaning |
|---|---|
| Agent Skill | A `SKILL.md` file an IDE may load as instructions. Not a running process |
| Prime | `pramanasutra-prime`, the coordinating skill |
| Static finding | A rule matched source text. Status `observed` |
| Evidence | A JSON file describing a test command someone already ran |
| Evidence state | `absent`, `failing`, `inconclusive`, `unverified`, or `passing` |
| Gate | The release decision derived from findings, evidence and policy |
| NO_GO | Do not release on this output. Exit 2 |
| REVIEW_REQUIRED | A person must look, or inputs are missing. Exit 3 |
| READY_FOR_HUMAN_APPROVAL | Policy checks passed. A person still approves. Exit 0 |
| Partial scan | The walk hit a limit or could not read something. Cannot be ready |
| Policy | JSON that turns optional strictness on or off, and cannot enable auto-deploy |
| Capability | A named activity and whether this run executed it, skipped it, or cannot do it |
| Ignore file | `.pramanasutraignore`, prefixes excluded from the walk, disclosed in limitations |
| Focused test | A declaration that runs a subset (`.only`, `fit`, `fdescribe`) |
| Base name | The last segment of the scanned directory. The report does not store the full path |
