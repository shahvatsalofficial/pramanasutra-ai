# PramanaSutra AI Handbook

<!-- summary: Complete documentation for PramanaSutra AI, the open-source AI QA and release-readiness agent: executive, functional, technical, architecture, user, security, legal, testing and contributor guides. -->

PramanaSutra AI (from the Sanskrit *pramana*, "valid proof") is an open-source **AI QA engineer and release-readiness agent**. It ships 17 portable Agent Skills and a deterministic, offline CLI. Created by Vatsal Shah. Apache-2.0. Version 0.2.0.

This handbook is written so that a new reader needs nothing else: what it is, what it does, what it does not do, how it is built, how to use it, and how much to trust it.

## Read by role

| You are | Start with |
|---|---|
| Executive or decision maker | [Executive summary](01-executive-summary.md) |
| Product or QA lead | [Functional specification](02-functional-specification.md), [Rule catalog](12-rule-catalog.md) |
| Developer who wants to try it | [User guide](05-user-guide.md), [CLI reference](06-cli-reference.md) |
| Architect or reviewer | [Architecture](04-architecture.md), [Technical specification](03-technical-specification.md) |
| Security or legal reviewer | [Security, privacy and legal](07-security-privacy-legal.md), [Trademark and name clearance](../legal/trademark-and-name-clearance.md) |
| Skeptic | [Testing and proof](08-testing-and-proof.md) |
| Contributor | [Contributor guide](10-contributor-guide.md), [Compatibility and roadmap](09-compatibility-and-roadmap.md) |

## Pages

1. [Executive summary](01-executive-summary.md)
2. [Functional specification](02-functional-specification.md)
3. [Technical specification](03-technical-specification.md)
4. [Architecture](04-architecture.md)
5. [User guide](05-user-guide.md)
6. [CLI reference](06-cli-reference.md)
7. [Security, privacy and legal](07-security-privacy-legal.md)
8. [Testing and proof](08-testing-and-proof.md)
9. [Compatibility and roadmap](09-compatibility-and-roadmap.md)
10. [Contributor guide](10-contributor-guide.md)
11. [Glossary and FAQ](11-glossary-and-faq.md)
12. [Rule catalog](12-rule-catalog.md)

## One-paragraph truth

The CLI reads a project **without changing it**, finds test-hygiene problems with `file:line` evidence, reads test results that **you** supply, and prints a release decision: `NO_GO`, `REVIEW_REQUIRED` or `READY_FOR_HUMAN_APPROVAL`. It does **not** run your tests, does **not** call the network or any AI model, and **never** authorizes a deployment. The 17 skills guide your AI IDE's own model through the same evidence-first method.
