# Compatibility and honest scope

| Host | Installer destination | Status |
|---|---|---|
| Claude Code | `.claude/skills` | Path supported by official docs; host execution not verified here |
| Cursor | `.cursor/skills` | Path supported by official docs; host execution not verified here |
| OpenAI Codex | `.agents/skills` | Path supported by official docs; host execution not verified here |
| Gemini CLI | `.gemini/skills` | Path supported by official docs; host execution not verified here |
| GitHub Copilot | `.github/skills` | Path supported by official docs; host execution not verified here |
| Generic | `.agents/skills` | Only portable skill files; arbitrary host support not guaranteed |
| Servers / CI | `node .../pramanasutra.mjs` | Deterministic static CLI works where Node 20+ and filesystem access are available |

Host-specific skills use existing host AI sessions and their existing model permission/quota. Installing a skill does not grant access to an IDE's private model API. The standalone CLI needs no AI key and does not perform model inference. See current host documentation for version-specific behavior.

Official documentation: Claude Code (support.claude.com), Cursor (cursor.com), Codex (learn.chatgpt.com), Gemini CLI (geminicli.com), GitHub Copilot (docs.github.com).
