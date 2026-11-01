# Report schema v1.0.0

The JSON report has `schemaVersion`, `product`, `scannedPath`, `generatedAt`, `capabilities`, `inventory`, `findings`, `limitations`, and `releaseGate`. Findings contain `id`, `ruleId`, `severity`, `confidence`, `title`, `description`, `evidence`, `recommendation`, and `status`. Paths in evidence are relative to the scanned root; no source code excerpt is included. The HTML report escapes untrusted text. JSON is suitable for downstream processing, not verified compliance.

## Evidence file (input, schema v1.0.0)

```json
{
  "schemaVersion": "1.0.0",
  "source": "ci-ingested",
  "command": "npm test",
  "executedAt": "2026-11-01T10:00:00Z",
  "exitCode": 0,
  "passed": 12,
  "failed": 0,
  "skipped": 0,
  "environment": "ubuntu-latest, node 22",
  "commit": "abc1234"
}
```

`source` is one of `local-executed`, `ci-ingested`, `external-unverified`. Validate with `pramanasutra verify --evidence <file>`. Max size 1 MB; symlinks rejected. The gate adds `evidenceState` (`absent|failing|inconclusive|unverified|passing`) to `releaseGate`.
