# Glossary and FAQ

<!-- summary: Definitions of PramanaSutra AI terms and answers to common questions about keys, privacy, test execution, accuracy and licensing. -->

## Glossary

| Term | Meaning |
|---|---|
| Pramana | Sanskrit for a means of valid knowledge or proof |
| Sutra | Sanskrit for a concise rule or thread |
| Agent Skill | A folder with a `SKILL.md` file of instructions an AI assistant loads on demand |
| Prime | `pramanasutra-prime`, the chief QA orchestrator skill |
| Finding | One observation with rule, severity, confidence, evidence and fix |
| Evidence (static) | What a file scan observed |
| Evidence (executed) | A test run result supplied from a runner or CI |
| Release gate | The decision computed from findings, evidence and policy |
| `NO_GO` | A blocking issue exists |
| `REVIEW_REQUIRED` | Evidence is missing, unverified or incomplete |
| `READY_FOR_HUMAN_APPROVAL` | All policy checks satisfied; a person must still approve |
| Policy | A fail-closed JSON file that sets which conditions block or require review |
| Focused test | A test marked to run alone (`.only`), silently excluding the rest |
| Skipped test | A test marked not to run |
| Flaky test | A test that passes and fails without code changes |
| Provenance | Where evidence came from and whether it can be trusted |

## FAQ

**Is this a testing framework?** No. It reviews test hygiene and release evidence and guides your assistant. It complements Jest, Vitest, pytest, JUnit, Go test, Playwright and others.

**Does it run my tests?** No. You run them and supply the result. Running tests is planned and will need explicit approval.

**Do I need an API key or account?** No.

**Does it send my code anywhere?** The CLI never does. Your AI IDE's provider sees whatever you send it when you use the skills.

**Why does a perfect-looking project still say `REVIEW_REQUIRED`?** Because no passing test evidence was supplied, or something required is missing. The report lists exact reasons.

**Can it approve my release?** No. The best outcome still requires a person. `automatedDeploymentAuthorized` is always false.

**How accurate are the rules?** On the committed labeled fixtures: all expected findings found, none extra. Those fixtures were written by the rule author, so this is a regression guarantee, not real-world accuracy. Expect false positives and negatives on real projects.

**Why was my test layout not recognised?** Detection uses naming conventions; see the [rule catalog](12-rule-catalog.md).

**Can I weaken the safety flags in a policy?** No. `allowAutomatedDeployment` must be `false` and `manualApprovalsRequired` must be `true`.

**Is it free?** Yes, Apache-2.0.

**Is it affiliated with Anthropic, OpenAI, Cursor, GitHub or Google?** No.

**How do I cite it?** Use `CITATION.cff` in the repository.

**Where do I report a security issue?** `SECURITY.md`.
