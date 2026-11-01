# CLI commands (implemented)

```text
node packages/cli/bin/pramanasutra.mjs help
node packages/cli/bin/pramanasutra.mjs doctor [--json]
node packages/cli/bin/pramanasutra.mjs agents list [--json]
node packages/cli/bin/pramanasutra.mjs scan --path <folder> [--out <folder>] [--json]
node packages/cli/bin/pramanasutra.mjs release-check --path <folder> [--evidence <file>] [--out <folder>] [--json]
node packages/cli/bin/pramanasutra.mjs verify --evidence <file> [--json]
node packages/cli/bin/pramanasutra.mjs init --ide <claude|cursor|codex|gemini|copilot|generic|all> --target <existing-folder> [--force]
```

Exit codes: `0` normal completion; `0` also for `READY_FOR_HUMAN_APPROVAL`; `2` known blocking release finding (`NO_GO`); `3` release review required; `1` invalid input/runtime error. A scan may return `0` despite findings; use `release-check` for gate outcomes. Reports are saved only when `--out` is present. `init` modifies only target skill directories and does not run any installed skill.
