// Builds the documentation site from documents/pramanasutra/*.md.
// Writes self-contained HTML to documents/pramanasutra/html/ and mirrors it to docs/ for GitHub Pages.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'documents', 'pramanasutra');
const outDir = path.join(srcDir, 'html');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const REPO = 'https://github.com/shahvatsalofficial/pramanasutra-ai';
const SITE = 'https://shahvatsalofficial.github.io/pramanasutra-ai';
const CSS = readFileSync(path.join(root, 'scripts', 'docs-site.css'), 'utf8');
const JS = readFileSync(path.join(root, 'scripts', 'docs-site.js'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function rewrite(href) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [p, anchor] = href.split('#');
  const hash = anchor ? `#${anchor}` : '';
  if (!p) return href;
  if (p.endsWith('.md') && !p.includes('..') && !p.startsWith('/')) return p.replace(/\.md$/, '.html') + hash;
  if (p.startsWith('..')) return `${REPO}/blob/main/${p.replace(/^(\.\.\/)+/, '')}${hash}`;
  return p + hash;
}

function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(esc(c)) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const h = rewrite(href.replace(/&amp;/g, '&'));
    const external = /^https?:/.test(h);
    return `<a href="${esc(h)}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

function convert(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  const questions = [];
  let i = 0;
  const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre class="code" data-lang="${esc(lang)}"><code>${esc(buf.join('\n'))}</code><button class="copy" type="button">Copy</button></pre>`);
      continue;
    }
    if (/^<(svg|div|figure|details|section|table)\b/.test(line)) {
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '') buf.push(lines[i++]);
      out.push(buf.join('\n'));
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      const plain = h[2].replace(/`/g, '');
      if (level === 2 || level === 3) toc.push({ level, id, text: plain });
      if (plain.trim().endsWith('?')) questions.push({ q: plain.replace(/\*\*/g, ''), id });
      out.push(`<h${level} id="${id}">${inline(h[2])}${level > 1 ? `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>` : ''}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => (k === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const text = buf.join(' ');
      const note = /^\*\*(Note|Warning|Important|Tip)[:.]?\*\*/i.exec(text);
      out.push(`<blockquote class="${note ? `callout callout-${note[1].toLowerCase()}` : ''}">${inline(text)}</blockquote>`);
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) {
      const items = [];
      const ordered = /\d+\./.test(li[2]);
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) { items.push({ indent: m[1].length, text: m[3] }); i++; }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ` ${lines[i].trim()}`; i++; }
        else break;
      }
      const render = (list, depth) => {
        let html = '';
        let n = 0;
        while (n < list.length) {
          const item = list[n];
          const kids = [];
          let m = n + 1;
          while (m < list.length && list[m].indent > item.indent) kids.push(list[m++]);
          html += `<li>${inline(item.text)}${kids.length ? render(kids, depth + 1) : ''}</li>`;
          n = m;
        }
        const tag = ordered && depth === 0 ? 'ol' : 'ul';
        return `<${tag}>${html}</${tag}>`;
      };
      out.push(render(items, 0));
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|\s*([-*]|\d+\.)\s|<(svg|div|figure|details|section|table)\b)/.test(lines[i]) && !(lines[i].includes('|') && lines[i + 1] && isTableSep(lines[i + 1]))) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc, questions };
}

const files = readdirSync(srcDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
if (!files.length) throw new Error('No numbered markdown files in documents/pramanasutra');
const docs = files.map((f) => {
  let md = readFileSync(path.join(srcDir, f), 'utf8');
  let summary = '';
  md = md.replace(/<!--\s*summary:\s*([\s\S]*?)-->/, (_, s) => { summary = s.trim(); return ''; });
  const title = /^#\s+(.*)$/m.exec(md)?.[1].replace(/`/g, '') ?? f;
  const desc = summary || (md.split('\n').find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-')) ?? '').replace(/[*`[\]]/g, '').slice(0, 220);
  const { html, toc, questions } = convert(md);
  return { file: f, out: f.replace(/\.md$/, '.html'), title, desc, html, toc, questions, text: md.replace(/[#*`|>]/g, ' ').replace(/\s+/g, ' ') };
});
const searchIndex = docs.map((d) => ({ t: d.title, u: d.out, x: d.text.slice(0, 5000) }));
searchIndex.unshift({ t: 'PramanaSutra AI', u: 'index.html', x: 'Offline QA and release check. Four report files. Evidence binding none unbound ci-environment. Five static rules. Skills are instructions. scan and release-check share exit codes. macOS CI is not scheduled.' });

function page(d, idx) {
  const prev = docs[idx - 1];
  const next = docs[idx + 1];
  const nav = `<li><a href="index.html">Home</a></li>` + docs.map((x) => `<li><a href="${x.out}"${x.file === d.file ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`).join('');
  const toc = d.toc.length ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>${d.toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>` : '';
  const graph = [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: d.title, description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah', url: 'https://github.com/shahvatsalofficial' }, inLanguage: 'en', isPartOf: { '@type': 'SoftwareSourceCode', name: 'PramanaSutra AI', codeRepository: REPO, license: 'https://www.apache.org/licenses/LICENSE-2.0', version: pkg.version } }];
  if (d.file.startsWith('00-')) graph.push({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PramanaSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', softwareVersion: pkg.version, license: 'https://www.apache.org/licenses/LICENSE-2.0', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah' }, codeRepository: REPO });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} — PramanaSutra AI</title>
<meta name="description" content="${esc(d.desc)}">
<meta name="author" content="Vatsal Shah">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${esc(d.title)} — PramanaSutra AI">
<meta property="og:description" content="${esc(d.desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}/${d.out}">
<link rel="canonical" href="${SITE}/${d.out}">
<meta name="color-scheme" content="light dark">
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
<button class="menu-btn" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">Menu</button>
<a class="brand" href="index.html"><span class="logo" aria-hidden="true">PS</span><span>PramanaSutra AI <small>v${esc(pkg.version)}</small></span></a>
<div class="search"><label class="sr" for="q">Search documentation</label><input id="q" type="search" placeholder="Search docs (press /)" autocomplete="off" aria-controls="results"><ul id="results" role="listbox" hidden></ul></div>
<button class="theme-btn" type="button" aria-label="Toggle colour theme">Theme</button>
<a class="gh" href="${REPO}" rel="noopener">GitHub</a>
</header>
<div class="layout">
<aside id="sidebar" class="sidebar"><nav aria-label="Documentation"><ol>${nav}</ol></nav></aside>
<main id="content" class="content" tabindex="-1"><article>
${d.html}
</article>
<nav class="pager" aria-label="Previous and next">
${prev ? `<a class="prev" href="${prev.out}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a class="next" href="${next.out}"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>
<footer class="foot">PramanaSutra AI ${esc(pkg.version)} · Created by Vatsal Shah · Apache-2.0 · Decision support, not a certification · <a href="${REPO}/blob/main/documents/pramanasutra/${d.file}" rel="noopener">Page source</a></footer>
</main>
${toc}
</div>
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

function copyInto(name) {
  const from = path.join(srcDir, name);
  if (!existsSync(from)) return;
  const dest = path.join(outDir, name);
  const walk = (s, d) => {
    mkdirSync(d, { recursive: true });
    for (const entry of readdirSync(s, { withFileTypes: true })) {
      const a = path.join(s, entry.name);
      const b = path.join(d, entry.name);
      if (entry.isDirectory()) walk(a, b);
      else copyFileSync(a, b);
    }
  };
  walk(from, dest);
}

function landing() {
  const nav = `<li><a href="index.html" aria-current="page">Home</a></li>` + docs.map((x) => `<li><a href="${x.out}">${esc(x.title)}</a></li>`).join('');
  const cards = docs.map((d) => `<article class="mini"><h2><a href="${d.out}">${esc(d.title)}</a></h2><p>${esc(d.desc)}</p></article>`).join('');
  const desc = 'Offline QA and release check. Reads a repository, does not run its tests, and writes Markdown, HTML, JSON and SARIF. A ready result still needs a person.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PramanaSutra AI</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Vatsal Shah">
<meta name="robots" content="index,follow">
<meta property="og:title" content="PramanaSutra AI">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/">
<link rel="canonical" href="${SITE}/">
<meta name="color-scheme" content="light dark">
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
<button class="menu-btn" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">Menu</button>
<a class="brand" href="index.html"><span class="logo" aria-hidden="true">PS</span><span>PramanaSutra AI <small>v${esc(pkg.version)}</small></span></a>
<div class="search"><label class="sr" for="q">Search documentation</label><input id="q" type="search" placeholder="Search docs (press /)" autocomplete="off" aria-controls="results"><ul id="results" role="listbox" hidden></ul></div>
<button class="theme-btn" type="button" aria-label="Toggle colour theme">Theme</button>
<a class="gh" href="${REPO}" rel="noopener">GitHub</a>
</header>
<div class="layout">
<aside id="sidebar" class="sidebar"><nav aria-label="Documentation"><ol>${nav}</ol></nav></aside>
<main id="content" class="content home" tabindex="-1">
<p class="muted">Created by Vatsal Shah · Apache-2.0 · version ${esc(pkg.version)}</p>
<h1>PramanaSutra AI</h1>
<p class="lead">An offline check for a repository you are about to ship. It reads files. It does not run the project's tests. It writes four copies of one audit, then stops for a person.</p>
<div class="actions"><a class="primary" href="00-start-here.html">Start here</a><a class="secondary" href="${REPO}" rel="noopener">Source</a><a class="secondary" href="https://www.npmjs.com/package/pramanasutra" rel="noopener">npm</a></div>
<section class="stat-grid" aria-label="What this version actually is">
<article class="stat"><b>5</b><span>static rules. Focused test, skipped test, no tests, no CI, no license.</span></article>
<article class="stat"><b>0</b><span>runtime dependencies. The CLI makes no network call.</span></article>
<article class="stat"><b>4</b><span>report files: Markdown, HTML, JSON, SARIF 2.1.0. SARIF is not uploaded.</span></article>
<article class="stat"><b>17</b><span>skills. They are instructions. They do not execute tests.</span></article>
</section>
<h2>What the command does</h2>
<div class="card-grid">
<article class="mini"><h2>scan</h2><p>Same exit codes as release-check. Exit 2 is NO_GO. Exit 3 is REVIEW_REQUIRED. Exit 0 needs passing evidence. A scan with no evidence file exits 3.</p></article>
<article class="mini"><h2>release-check</h2><p>Exit 2 is NO_GO. Exit 3 is REVIEW_REQUIRED. Exit 0 is READY_FOR_HUMAN_APPROVAL. Ready is not a deploy.</p></article>
<article class="mini"><h2>Evidence</h2><p>No file is binding <code>none</code>. A file with no GitHub identity is <code>unbound</code>. Four GitHub strings is <code>ci-environment</code>, and that is still not a signature.</p></article>
<article class="mini"><h2>--changed</h2><p>Lists names from git diff. It does not choose tests. A folder that is not a checkout says git diff was not available.</p></article>
</div>
<h2>What this version does not do</h2>
<ul>
<li>It does not run the target's tests, a browser, a load generator, or a vulnerability scanner.</li>
<li>It does not sign evidence. <code>verify</code> checks the JSON shape.</li>
<li>Fixture precision is a regression lock written by the rule author, not field accuracy.</li>
<li>Required CI is Ubuntu and Windows, Node 20 and 22. macOS is not scheduled.</li>
<li>The npm page shows the last published tarball. It can lag the version in git until a person completes publish.</li>
<li>Twelve <code>packages/*</code> directories are notes. The CLI does not import them.</li>
</ul>
<h2>Handbook</h2>
<div class="card-grid">${cards}</div>
<h2>Questions</h2>
<div class="card-grid">
<article class="mini"><h2>Does it run my tests?</h2><p>No. You run them, then pass an evidence file. The report says the tool did not execute tests.</p></article>
<article class="mini"><h2>Is a ready result a release?</h2><p>No. <code>automatedDeploymentAuthorized</code> is false. A person still approves.</p></article>
<article class="mini"><h2>Can I paste a passing JSON?</h2><p>Yes, and the report will say unbound or ci-environment. Neither label proves the command ran.</p></article>
<article class="mini"><h2>Where is macOS?</h2><p>Not on the required matrix. Earlier macOS jobs were cancelled with zero steps. That is not a pass.</p></article>
</div>
<footer class="foot">PramanaSutra AI ${esc(pkg.version)} · Created by Vatsal Shah · Apache-2.0 · Decision support, not a certification</footer>
</main>
</div>
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
docs.forEach((d, i) => writeFileSync(path.join(outDir, d.out), page(d, i)));
writeFileSync(path.join(outDir, 'index.html'), landing());
for (const name of ['samples', 'proof', 'audit']) copyInto(name);
const urls = ['index.html', ...docs.map((d) => d.out)];
writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\n# Explicit allow for answer engines and LLM crawlers. This documentation is meant to be found.\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Applebot\nAllow: /\nUser-agent: CCBot\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

const docsRoot = path.join(root, 'docs');
const mirror = (s, d) => {
  mkdirSync(d, { recursive: true });
  for (const entry of readdirSync(s, { withFileTypes: true })) {
    const a = path.join(s, entry.name);
    const b = path.join(d, entry.name);
    if (entry.isDirectory()) mirror(a, b);
    else if (statSync(a).isFile()) copyFileSync(a, b);
  }
};
mirror(outDir, docsRoot);

const redirect = (target, label) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="index,follow"><link rel="canonical" href="${SITE}/${target}"><meta http-equiv="refresh" content="0; url=../${target}"><title>Moved — PramanaSutra AI</title></head><body><p>This page moved to <a href="../${target}">${esc(label)}</a>.</p></body></html>\n`;
const moved = {
  'handbook/index.html': ['00-start-here.html', 'Start here'],
  'handbook/01-executive-summary.html': ['01-executive-summary.html', 'Executive summary'],
  'handbook/02-functional-specification.html': ['02-functional-specification.html', 'Functional specification'],
  'handbook/03-technical-specification.html': ['04-technical-reference.html', 'Technical reference'],
  'handbook/04-architecture.html': ['03-architecture.html', 'Architecture'],
  'handbook/05-user-guide.html': ['05-user-guide.html', 'User guide'],
  'handbook/06-cli-reference.html': ['06-cli-and-reports.html', 'CLI and reports'],
  'handbook/07-security-privacy-legal.html': ['09-security-and-privacy.html', 'Security and privacy'],
  'handbook/08-testing-and-proof.html': ['11-testing-and-proof.html', 'Testing and proof'],
  'handbook/09-compatibility-and-roadmap.html': ['13-roadmap-and-status.html', 'Roadmap and status'],
  'handbook/10-contributor-guide.html': ['15-maintainer-guide.html', 'Maintainer guide'],
  'handbook/11-glossary-and-faq.html': ['14-faq-and-glossary.html', 'FAQ and glossary'],
  'handbook/12-rule-catalog.html': ['07-rule-catalog.html', 'Rule catalog'],
  'legal/trademark-and-name-clearance.html': ['10-legal-and-compliance.html', 'Legal and compliance']
};
for (const [rel, [target, label]] of Object.entries(moved)) {
  const dest = path.join(docsRoot, rel);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, redirect(target, label));
}
console.log(`built ${docs.length} pages into documents/pramanasutra/html and mirrored to docs/`);
