# Legal and compliance

<!-- summary: Project notice for PramanaSutra AI: Apache-2.0, third-party names, trademarks not cleared, and what the output is not. This page is not a legal opinion and not legal advice. -->

> **Important:** This page is a project notice written so users and reviewers can see what has and has not been checked. It is not legal advice, not a lawyer's opinion, and not a compliance attestation. Have a qualified lawyer review trademark, export, and regulated-industry use before you bet a company name or a certification on this project.

## License

The source is Apache License 2.0. The full text is [LICENSE](../../LICENSE). [NOTICE](../../NOTICE) attributes the work to Vatsal Shah. Contributors keep the attribution the license requires.

Apache-2.0 is a permissive license with a patent grant and a requirement to keep notices. It is not a warranty. The license's disclaimer of warranty and limitation of liability apply. The software is provided "AS IS".

## Third-party code

Version 0.3.0 has no runtime npm dependencies and does not vendor third-party libraries inside `packages/cli`. [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) records that. If a later change adds a dependency, that file has to change in the same commit. Documentation pages use system fonts and no remote script, so the HTML does not pull in a font license or a CDN library.

GitHub Actions are third-party workflows pinned by SHA for checkout and setup-node. Their licenses are their own. Using them does not copy their source into this repository.

## Names that are not ours

Claude, Claude Code, Cursor, OpenAI, Codex, GitHub, Copilot, Google, Gemini, Node.js, npm, Jest, pytest, JUnit and the other product names in the docs are used to describe compatibility. They are the property of their owners. This project is not affiliated with, endorsed by, or sponsored by those owners. Do not write marketing that implies otherwise.

## The name PramanaSutra

"PramanaSutra" and "PramanaSutra AI" are project names used by Vatsal Shah. As of this version:

- They are **not** described here as registered trademarks.
- A clearance search of trademark registers, domains and package names has **not** been completed for this project.
- No filing is claimed.

Before a company adopts the name in commerce, a trademark lawyer should search the classes that matter (commonly Nice classes 9 and 42 for software and software services, plus the countries where the name will be used) and should search package registries and domains. This document cannot do that search, and a previous draft that said the same thing is still the accurate status.

The Sanskrit word *pramana* is used here in its ordinary meaning, "valid proof" or "means of knowledge", as a project metaphor. That sentence is an explanation of the name, not a claim of exclusive rights over the word.

## What the output is

A report is decision support. It is not:

- a certification of quality, security, accessibility or compliance
- an audit opinion under any professional standard
- a representation that tests passed, unless the evidence block is quoting a file the operator supplied
- legal advice about the scanned project
- permission to ship

Do not attach a PramanaSutra report to a regulatory submission as if it were an independent assessment.

## Privacy laws

The CLI does not operate a service and does not collect accounts. If you put personal data into an evidence file or you scan a repository that contains personal data, you are the one processing it. The report will copy evidence fields through. Strip them before you publish a report. The public documentation site contains no customer data.

## Acceptable use

The skills forbid destructive actions, unapproved production load tests, secret collection and publishing. Use the CLI on trees you are allowed to read. Do not point it at systems you do not own in order to interfere with them. The tool's refusal to execute target tests is a safety property; do not wrap it in a script that then runs arbitrary repository code unless that is already your CI and you accept that risk there.

## Regulated industries

If the scanned product is medical, financial, aviation, or otherwise regulated, a heuristic QA gate is not your validation record. Keep the validation process your regulator already requires. This project does not claim IEC 62304, ISO 13485, SOC 2, FedRAMP, PCI-DSS, HIPAA, or any other program.

## Export

This repository is a local source scanner and a set of text files. It does not implement cryptography as a product. This sentence is not an export classification. If your counsel needs a classification, ask them, with the source in front of them.

## What a lawyer should still be asked

1. Is "PramanaSutra" available for the goods and countries you care about?
2. Does your use of the Apache-2.0 project, including NOTICE, match how you distribute it?
3. If you publish reports from private repositories, what do they disclose?
4. If a customer will rely on a gate in a contract, what warranty are you accidentally giving? The upstream license gives none. Your contract might.

## Contact

Security reports: [Security and privacy](09-security-and-privacy.md) and `SECURITY.md`. Other maintainer contact is the GitHub repository [shahvatsalofficial/pramanasutra-ai](https://github.com/shahvatsalofficial/pramanasutra-ai).
