# User guide

<!-- summary: Install, run, read reports, supply test evidence, install the skills in your AI IDE and wire PramanaSutra AI into CI. -->

## Requirements

Node.js 20 or newer. Nothing else: no install step, no account, no API key.

## 1. Run it (60 seconds)

```bash
npx github:shahvatsalofficial/pramanasutra-ai doctor
npx github:shahvatsalofficial/pramanasutra-ai release-check --path .
```

Or from a clone:

```bash
git clone https://github.com/shahvatsalofficial/pramanasutra-ai.git
cd pramanasutra-ai
node packages/cli/bin/pramanasutra.mjs release-check --path examples/sample-app
```

The sample app has a deliberate `test.only`, so the expected result is `NO_GO` and exit code 2.

## 2. Read the reports

Each run writes four files to `./pramanasutra-reports` (or `--out <dir>`): `report.md`, `report.html`, `report.json` and `report.sarif.json`. The numbered handbook in `documents/pramanasutra/` is the copy to trust. This file is an older write-up.

| File | For | Contents |
|---|---|---|
| `report.md` | People, pull requests | Decision, summary, capabilities, every finding with fix, gate reasons, limitations |
| `report.html` | People, sharing | Same content, styled, light and dark, printable, all text escaped |
| `report.json` | Tools, CI | Machine-readable schema 1.0.0 |
| `report.sarif.json` | SARIF readers | Same findings. The CLI does not upload the file |

Open `report.html` in a browser. Use `--no-report` to write nothing.

## 3. Supply test evidence

PramanaSutra does not run your tests. Run them with your own tool, then describe the result:

```json
{
  "schemaVersion": "1.0.0",
  "source": "ci-ingested",
  "command": "npm test",
  "executedAt": "2026-11-01T10:00:00Z",
  "exitCode": 0,
  "passed": 12,
  "failed": 0
}
```

```bash
npx github:shahvatsalofficial/pramanasutra-ai verify --evidence test-evidence.json
npx github:shahvatsalofficial/pramanasutra-ai release-check --path . --evidence test-evidence.json
```

Use `source: "local-executed"` for a run you did yourself, `ci-ingested` for results taken from CI, and `external-unverified` when you cannot vouch for it (this never reaches ready).

## 4. Choose a policy

```bash
node packages/cli/bin/pramanasutra.mjs release-check --path . --policy policies/strict.json --evidence test-evidence.json
```

`recommended.json` blocks on focused tests. `strict.json` also blocks on skipped tests. See the [CLI reference](06-cli-reference.md) for every key.

## 5. Install the skills in your AI IDE

```bash
npx github:shahvatsalofficial/pramanasutra-ai init --ide claude --target .
```

Choices: `claude`, `cursor`, `codex`, `gemini`, `copilot`, `generic`, `all`. Existing skills are never overwritten without `--force`.

Then ask your assistant:

> PramanaSutra Prime: assess this repository's test quality and release readiness. Stay read-only, cite file and line, separate observed facts from executed results, and ask before running any tests.

## 6. Use it in CI (GitHub Actions)

```yaml
name: QA gate
on: [pull_request]
permissions:
  contents: read
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: '22' }
      - run: npm test
      - run: |
          cat > test-evidence.json <<EOF
          {"schemaVersion":"1.0.0","source":"ci-ingested","command":"npm test","executedAt":"$(date -u +%FT%TZ)","exitCode":0,"passed":1,"failed":0}
          EOF
      - run: npx github:shahvatsalofficial/pramanasutra-ai release-check --path . --evidence test-evidence.json
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: qa-report, path: pramanasutra-reports }
```

The placeholder `passed: 1` above must be replaced with real counts parsed from your runner; never hard-code passing evidence.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Missing value for --path` | Pass a directory after `--path` |
| `Scan target must be a real directory` | The path is a file, missing, or a symlink |
| `Invalid evidence: ...` | Fix the listed fields; see section 3 |
| `Invalid policy: unknown key` | Policies are fail-closed; remove or correct the key |
| `No test files detected` on a real project | Your test layout is unusual; see the [rule catalog](12-rule-catalog.md) for recognised names |
| Exit code 3 and you expected 0 | Read "Gate reasons" in the report; something required is missing |
