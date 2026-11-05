# PramanaSutra AI documents

This folder is the canonical documentation pack for the repository.

- Markdown sources: the numbered files in this directory. Read [Start here](00-start-here.md).
- HTML, same content, for a browser: [html/index.html](html/index.html).
- Audit of this repository, Markdown and HTML: [audit/report.md](audit/report.md) and [audit/report.html](audit/report.html).
- Sample audits: [samples](samples).
- Captured test output: [proof/test-results.txt](proof/test-results.txt).

The public site [shahvatsalofficial.github.io/pramanasutra-ai](https://shahvatsalofficial.github.io/pramanasutra-ai/) is a copy of `html/`, published from `docs/` by GitHub Pages. Regenerate both with `node scripts/build-docs.mjs` after editing the Markdown.
