// Static documentation site generator. No dependencies.
// Source: docs/handbook/*.md and selected docs/**/*.md. Output: HTML next to the sources, plus docs/index.html,
// docs/assets/*, docs/sitemap.xml, docs/robots.txt.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const SITE = 'https://shahvatsalofficial.github.io/pramanasutra-ai';
const REPO = 'https://github.com/shahvatsalofficial/pramanasutra-ai';
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs';

const GROUPS = [
  { title: 'Handbook', pages: ['handbook/README.md', 'handbook/01-executive-summary.md', 'handbook/02-functional-specification.md', 'handbook/03-technical-specification.md', 'handbook/04-architecture.md', 'handbook/05-user-guide.md', 'handbook/06-cli-reference.md', 'handbook/07-security-privacy-legal.md', 'handbook/08-testing-and-proof.md', 'handbook/09-compatibility-and-roadmap.md', 'handbook/10-contributor-guide.md', 'handbook/11-glossary-and-faq.md', 'handbook/12-rule-catalog.md'] },
  { title: 'Reference', pages: ['legal/trademark-and-name-clearance.md'] },
];
const ALL = GROUPS.flatMap((g) => g.pages);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
const outRel = (src) => src.replace(/(^|\/)README\.md$/, '$1index.html').replace(/\.md$/, '.html');
const relTo = (fromOut, toOut) => {
  const r = path.posix.relative(path.posix.dirname(fromOut), toOut);
  return r || path.posix.basename(toOut);
};

function rewriteLink(url, srcRel, curOut) {
  if (/^(https?:|mailto:|#)/.test(url)) return url;
  const [p, anchor] = url.split('#');
  const repoPath = path.posix.normalize(path.posix.join('docs', path.posix.dirname(srcRel), p));
  const suffix = anchor ? `#${anchor}` : '';
  if (repoPath.startsWith('docs/')) {
    const docRel = repoPath.slice(5);
    if (ALL.includes(docRel)) return relTo(curOut, outRel(docRel)) + suffix;
    if (existsSync(path.join(ROOT, repoPath)) && !statSync(path.join(ROOT, repoPath)).isDirectory()) return relTo(curOut, docRel) + suffix;
  }
  const abs = path.join(ROOT, repoPath);
  const isDir = existsSync(abs) && statSync(abs).isDirectory();
  return `${REPO}/${isDir ? 'tree' : 'blob'}/main/${repoPath.replace(/\/$/, '')}${suffix}`;
}

function inline(text, srcRel, curOut) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_m, c) => `\u0000${codes.push(`<code>${esc(c)}</code>`) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) => {
    const href = rewriteLink(u.replace(/&amp;/g, '&'), srcRel, curOut);
    const ext = /^https?:/.test(href);
    return `<a href="${esc(href)}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;])/g, '$1<a href="$2" rel="noopener">$2</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)]);
}

function splitRow(line) {
  const cells = [];
  let cur = '';
  let tick = false;
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (const ch of t) {
    if (ch === '`') tick = !tick;
    if (ch === '|' && !tick) {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function renderList(items, srcRel, curOut) {
  const root = { children: [], indent: -1 };
  const stack = [root];
  for (const it of items) {
    while (stack.length > 1 && it.indent <= stack[stack.length - 1].indent) stack.pop();
    const node = { ...it, children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  const out = (nodes) => {
    if (!nodes.length) return '';
    const tag = nodes[0].ordered ? 'ol' : 'ul';
    return `<${tag}>${nodes.map((n) => `<li>${inline(n.text, srcRel, curOut)}${out(n.children)}</li>`).join('')}</${tag}>`;
  };
  return out(root.children);
}

function md(source, srcRel, curOut) {
  let summary = '';
  const text = source.replace(/<!--\s*summary:\s*([\s\S]*?)-->/, (_m, s) => {
    summary = s.trim();
    return '';
  }).replace(/<!--[\s\S]*?-->/g, '');
  const lines = text.split(/\r?\n/);
  const html = [];
  const headings = [];
  let title = '';
  let lastHeading = '';
  let tableNo = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const code = buf.join('\n');
      if (fence[1] === 'mermaid') html.push(`<figure class="diagram"><pre class="mermaid">${esc(code)}</pre><figcaption>Diagram (Mermaid). If it does not render, the source is shown above.</figcaption></figure>`);
      else html.push(`<div class="code"><button class="copy" type="button" aria-label="Copy code">Copy</button><pre tabindex="0"><code${fence[1] ? ` class="language-${fence[1]}"` : ''}>${esc(code)}</code></pre></div>`);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      const body = inline(h[2], srcRel, curOut);
      lastHeading = h[2].replace(/`/g, '');
      if (level === 1 && !title) title = h[2].replace(/`/g, '');
      else if (level === 1) title = title || h[2];
      if (level >= 2 && level <= 3) headings.push({ level, id, text: h[2].replace(/`/g, '') });
      html.push(level === 1 ? `<h1 id="${id}">${body}</h1>` : `<h${level} id="${id}">${body}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${level}>`);
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      html.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(`Table ${++tableNo}: ${lastHeading || title}`)}"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c, srcRel, curOut)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, srcRel, curOut)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${inline(buf.join(' '), srcRel, curOut)}</blockquote>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) { items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] }); i++; }
        else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ` ${lines[i].trim()}`; i++; }
        else break;
      }
      html.push(renderList(items, srcRel, curOut));
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*([-*]|\d+\.)\s+|\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) { buf.push(lines[i++]); }
    html.push(`<p>${inline(buf.join(' '), srcRel, curOut)}</p>`);
  }
  return { html: html.join('\n'), title, headings, summary };
}

const prefix = (out) => '../'.repeat(out.split('/').length - 1);

function shell({ title, description, out, body, toc = [], current = '', landing = false, jsonld = '' }) {
  const p = prefix(out);
  const canonical = `${SITE}/${out === 'index.html' ? '' : out.replace(/index\.html$/, '')}`;
  const nav = GROUPS.map((g) => `<div class="nav-group"><p class="nav-title">${g.title}</p><ul>${g.pages.map((pg) => {
    const o = outRel(pg);
    const label = pg === 'handbook/README.md' ? 'Overview' : ((readTitle(pg) || pg).replace(/^PramanaSutra AI\s+/, ''));
    return `<li><a href="${p}${o}"${o === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  }).join('')}</ul></div>`).join('');
  const tocHtml = toc.length ? `<nav class="toc" aria-label="On this page"><p class="nav-title">On this page</p><ul>${toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></nav>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="${landing ? 'website' : 'article'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="PramanaSutra AI">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="author" content="Vatsal Shah">
<link rel="icon" href="${p}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${p}assets/site.css">
<script>try{var t=localStorage.getItem('ps-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
${jsonld}
</head>
<body class="${landing ? 'landing' : 'doc'}">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <div class="topbar-inner">
    <button class="menu-btn" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidebar">Menu</button>
    <a class="brand" href="${p}index.html" aria-label="PramanaSutra AI home"><svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor" opacity=".12"/><path d="M6 24 16 7l10 17M10.5 18h11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>PramanaSutra <b>AI</b></span></a>
    <nav class="top-links" aria-label="Primary"><a href="${p}handbook/index.html">Handbook</a><a href="${p}handbook/05-user-guide.html">Get started</a><a href="${p}handbook/08-testing-and-proof.html">Proof</a><a href="${REPO}" rel="noopener">GitHub</a></nav>
    <button class="theme-btn" type="button" aria-label="Toggle color theme"><span class="sun" aria-hidden="true">Light</span><span class="moon" aria-hidden="true">Dark</span></button>
  </div>
</header>
${landing ? `<main id="main">${body}</main>` : `<div class="layout">
  <aside id="sidebar" class="sidebar" aria-label="Documentation">${nav}</aside>
  <main id="main" class="content"><article class="prose">${body}</article></main>
  <aside class="rail">${tocHtml}</aside>
</div>`}
<footer class="footer">
  <div class="footer-inner">
    <p><strong>PramanaSutra AI</strong> v${pkg.version}. Test Everything. Prove Quality. Release Confidently. Created by <a href="https://github.com/shahvatsalofficial" rel="noopener">Vatsal Shah</a>. Licensed under <a href="${REPO}/blob/main/LICENSE" rel="noopener">Apache-2.0</a>.</p>
    <p class="fine">Review aid only. Not a certification, compliance attestation, security guarantee or legal advice. Not affiliated with Anthropic, OpenAI, Cursor, GitHub or Google; product names belong to their owners. <a href="${p}handbook/07-security-privacy-legal.html">Legal details</a>.</p>
  </div>
</footer>
<script src="${p}assets/site.js" type="module"></script>
</body>
</html>
`;
}

const titleCache = {};
function readTitle(src) {
  if (!titleCache[src]) {
    const m = /^#\s+(.+)$/m.exec(readFileSync(path.join(DOCS, src), 'utf8'));
    titleCache[src] = m ? m[1].replace(/`/g, '') : src;
  }
  return titleCache[src];
}

const pages = [];
for (const src of ALL) {
  const out = outRel(src);
  const raw = readFileSync(path.join(DOCS, src), 'utf8');
  const r = md(raw, src, out);
  const title = `${r.title} | PramanaSutra AI`;
  const desc = r.summary || `${r.title} - PramanaSutra AI documentation.`;
  const crumb = `<p class="crumbs"><a href="${prefix(out)}index.html">PramanaSutra AI</a> / ${src.startsWith('handbook/') ? 'Handbook' : 'Reference'}</p>`;
  const meta = `<p class="meta">Version ${pkg.version} &middot; Source: <a href="${REPO}/blob/main/docs/${src}" rel="noopener">docs/${src}</a></p>`;
  const body = r.html.replace(/^(<h1[^>]*>.*?<\/h1>)/, `${crumb}$1\n${r.summary ? `<p class="lede">${esc(r.summary)}</p>` : ''}${meta}`);
  const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: r.title, description: desc, author: { '@type': 'Person', name: 'Vatsal Shah' }, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'PramanaSutra AI', url: SITE } })}</script>`;
  const full = shell({ title, description: desc, out, body, toc: r.headings, current: out, jsonld: ld });
  mkdirSync(path.dirname(path.join(DOCS, out)), { recursive: true });
  writeFileSync(path.join(DOCS, out), full);
  pages.push(out);
}

// ---- Landing page ----
const stats = [['17', 'agent skills'], ['3 OS', 'CI matrix, Node 20 and 22'], ['0', 'runtime dependencies'], ['0', 'API keys required'], ['0', 'network calls by the CLI']];
const faq = [
  ['What is PramanaSutra AI?', 'An open-source AI QA and release-readiness agent: 17 portable Agent Skills plus a deterministic offline CLI that audits test hygiene, ingests test-run evidence and issues a conservative release gate (NO_GO, REVIEW_REQUIRED or READY_FOR_HUMAN_APPROVAL).'],
  ['Does it run my tests?', 'No. The CLI never executes the target project\'s tests or scripts. It reads test-run evidence you supply from your own runner or CI. Test execution is on the roadmap and will need explicit approval.'],
  ['Do I need an API key?', 'No. The CLI is offline. Inside a supported AI IDE the skills use that IDE\'s own model.'],
  ['Can it approve a release?', 'No. The best outcome is READY_FOR_HUMAN_APPROVAL, which always requires a person to approve. automatedDeploymentAuthorized is always false.'],
  ['Does it certify quality, security or compliance?', 'No. Reports are review aids, not certifications or legal advice.']
];
const hero = `
<section class="hero"><div class="wrap">
  <p class="eyebrow">Open source &middot; Apache-2.0 &middot; v${pkg.version}</p>
  <h1>The QA agent that never says "tests pass" without proof.</h1>
  <p class="hero-lede">PramanaSutra AI turns Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI into an evidence-first QA and release engineer. Audit test hygiene with <code>file:line</code> proof, ingest real test results, and get a conservative release gate. No extra API key.</p>
  <div class="cta"><a class="btn primary" href="handbook/05-user-guide.html">Get started in 60 seconds</a><a class="btn" href="handbook/index.html">Read the handbook</a><a class="btn ghost" href="${REPO}" rel="noopener">View on GitHub</a></div>
  <div class="code hero-code"><button class="copy" type="button" aria-label="Copy command">Copy</button><pre><code>npx github:shahvatsalofficial/pramanasutra-ai release-check --path .</code></pre></div>
  <p class="hero-note">Read-only on your project. Offline. No telemetry. Never auto-approves.</p>
</div></section>
<section class="stats" aria-label="Facts"><div class="wrap"><ul>${stats.map(([n, l]) => `<li><span class="num">${n}</span><span class="lbl">${l}</span></li>`).join('')}</ul></div></section>
<section class="band"><div class="wrap"><h2>Why teams use it</h2><div class="cards">
  <article class="card"><h3>Evidence, not vibes</h3><p>Static observations and executed test results are kept apart. The gate cannot turn green without valid evidence.</p></article>
  <article class="card"><h3>Catches silent test rot</h3><p>Focused (<code>.only</code>) and skipped tests in JS/TS, pytest, unittest, JUnit and Go, with exact file and line.</p></article>
  <article class="card"><h3>Reports you can read</h3><p>Every run writes Markdown, escaped HTML and JSON reports with severity, confidence and a fix for each finding.</p></article>
  <article class="card"><h3>Policy as code</h3><p>Fail-closed JSON policies. Unknown keys are rejected and safety flags cannot be weakened.</p></article>
  <article class="card"><h3>Keyless and private</h3><p>Zero runtime dependencies, no network calls, no telemetry. Skills use the model in your IDE.</p></article>
  <article class="card"><h3>Honest by design</h3><p>Every capability is reported as executed, not-run or not-supported. Limits are published.</p></article>
</div></div></section>
<section class="wrap how"><h2>How it works</h2><figure class="diagram"><pre class="mermaid">flowchart LR
  dev["You, in an AI IDE or CI"] --> cli["pramanasutra CLI (offline)"]
  cli --> repo[("Your project, read-only")]
  runner["Your test runner / CI"] --> ev["test-evidence.json"]
  ev --> cli
  cli --> gate{"Release gate"}
  gate --> r["report.md / report.html / report.json"]
  gate --> human["Human approval"]</pre><figcaption>The CLI inspects and decides. Your own runner produces the test evidence. A human approves.</figcaption></figure></section>
<section class="band"><div class="wrap"><h2>Trust, with receipts</h2><div class="cards two">
  <article class="card"><h3>Test results</h3><p>Captured output of the suite and 6 labeled fixtures is committed with the repository.</p><a href="handbook/08-testing-and-proof.html">See the proof</a></article>
  <article class="card"><h3>Legal clarity</h3><p>Apache-2.0, NOTICE, trademark disclaimers and a plain list of what is not legally reviewed.</p><a href="handbook/07-security-privacy-legal.html">Read the policy</a></article>
</div><p class="honest"><strong>What is not proven yet:</strong> behavior inside each AI IDE, an independent security review, trademark clearance for the name, a lawyer review, and accuracy on large real-world repositories.</p></div></section>
<section class="wrap"><h2>Documentation</h2><div class="cards">${[
  ['Executive summary', 'handbook/01-executive-summary.html', 'Problem, value, risks.'],
  ['Functional specification', 'handbook/02-functional-specification.html', 'Requirements and scenarios.'],
  ['Technical specification', 'handbook/03-technical-specification.html', 'Modules, limits, schemas.'],
  ['Architecture', 'handbook/04-architecture.html', 'Components, flows, trust boundaries.'],
  ['User guide', 'handbook/05-user-guide.html', 'Install, run, IDE prompts, CI.'],
  ['CLI reference', 'handbook/06-cli-reference.html', 'Commands, flags, exit codes.'],
  ['Security, privacy, legal', 'handbook/07-security-privacy-legal.html', 'Threats, license, disclaimers.'],
  ['Testing and proof', 'handbook/08-testing-and-proof.html', 'Results and samples.'],
  ['Rule catalog', 'handbook/12-rule-catalog.html', 'Every audit rule.']
].map(([t, h, d]) => `<a class="card link" href="${h}"><h3>${t}</h3><p>${d}</p></a>`).join('')}</div></section>
<section class="wrap faq"><h2>Frequently asked questions</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}<p class="muted"><a href="handbook/11-glossary-and-faq.html">More questions and a glossary</a></p></section>`;
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
const swLd = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'PramanaSutra AI', description: 'Open-source AI QA and release-readiness agent skills and offline CLI for Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI.', codeRepository: REPO, programmingLanguage: 'JavaScript', runtimePlatform: 'Node.js', license: 'https://www.apache.org/licenses/LICENSE-2.0', version: pkg.version, author: { '@type': 'Person', name: 'Vatsal Shah', url: 'https://github.com/shahvatsalofficial' }, url: SITE };
writeFileSync(path.join(DOCS, 'index.html'), shell({
  title: 'PramanaSutra AI - AI QA & Release-Readiness Agent for Claude Code, Cursor, Codex, Copilot & Gemini CLI',
  description: 'Open-source AI QA engineer: audit test hygiene, ingest test evidence and get a conservative release gate. Agent Skills plus an offline CLI. No API key. Apache-2.0.',
  out: 'index.html', body: hero, landing: true, current: 'index.html',
  jsonld: `<script type="application/ld+json">${JSON.stringify(swLd)}</script>\n<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`
}));
pages.unshift('index.html');

// ---- sitemap, robots, assets ----
const today = new Date().toISOString().slice(0, 10);
writeFileSync(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE}/${p === 'index.html' ? '' : p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(path.join(DOCS, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(path.join(DOCS, '.nojekyll'), '');
mkdirSync(path.join(DOCS, 'assets'), { recursive: true });
console.log(`Built ${pages.length} pages into docs/`);
