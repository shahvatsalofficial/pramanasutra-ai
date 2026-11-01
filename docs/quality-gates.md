# Release gate

| Decision | Exit code | When |
|---|---|---|
| `NO_GO` | 2 | A high/critical static finding (e.g. focused test), or supplied evidence reports failures / non-zero exit code |
| `REVIEW_REQUIRED` | 3 | No evidence, unverified (`external-unverified`) evidence, zero passed tests, no tests/CI/license detected, or incomplete scan |
| `READY_FOR_HUMAN_APPROVAL` | 0 | Evidence from `local-executed` or `ci-ingested` with exit 0, passed > 0, failed = 0, **and** clean static checks |

`READY_FOR_HUMAN_APPROVAL` is never a deploy order: `requiresHumanApproval` is always `true` and `automatedDeploymentAuthorized` is always `false`.
The tool does not run tests itself; evidence is supplied with `--evidence` (schema in [report-schema](report-schema.md)). Evidence provenance is only as trustworthy as its source.
