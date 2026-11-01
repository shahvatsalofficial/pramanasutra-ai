# Troubleshooting

- `Node.js 20+ required`: upgrade runtime, then rerun doctor.
- `Unknown argument`: run CLI `help` and use `--path`, `--out`, `--target`, `--ide`.
- `Destination exists`: check existing skill and rerun with `--force` only after reviewing changes.
- `release-check` exits `2` or `3`: expected gate decision; review generated reports.
- No AI model response: the CLI is deterministic; open the installed `SKILL.md` in a supported authenticated AI IDE.
