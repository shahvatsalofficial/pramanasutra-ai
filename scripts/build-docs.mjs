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
const AUTHOR = 'https://shahvatsal.com';
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
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line);
    if (img) {
      out.push(fig(rewrite(img[2]), img[1]));
      i++;
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
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|!\[|>\s?|\s*([-*]|\d+\.)\s|<(svg|div|figure|details|section|table)\b)/.test(lines[i]) && !(lines[i].includes('|') && lines[i + 1] && isTableSep(lines[i + 1]))) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc, questions };
}

const GROUPS = [
  { name: 'Get started', blurb: 'Run it, read it, see it work.', files: ['00-start-here.md', '05-user-guide.md', '16-real-world-scenarios.md', '06-cli-and-reports.md'] },
  { name: 'Understand', blurb: 'What it is, what it must do, how it is built.', files: ['01-executive-summary.md', '02-functional-specification.md', '03-architecture.md', '04-technical-reference.md', '07-rule-catalog.md', '08-skills-and-agents.md'] },
  { name: 'Trust', blurb: 'Security, legal and the evidence behind the claims.', files: ['09-security-and-privacy.md', '10-legal-and-compliance.md', '11-testing-and-proof.md'] },
  { name: 'Operate', blurb: 'CI, releases, status and how to maintain it.', files: ['12-ci-and-release.md', '13-roadmap-and-status.md', '15-maintainer-guide.md', '14-faq-and-glossary.md'] }
];
const found = readdirSync(srcDir).filter((f) => /^\d\d-.*\.md$/.test(f));
if (!found.length) throw new Error('No numbered markdown files in documents/pramanasutra');
const order = GROUPS.flatMap((g) => g.files);
const stray = found.filter((f) => !order.includes(f));
if (stray.length) throw new Error(`Add these files to GROUPS in scripts/build-docs.mjs: ${stray.join(', ')}`);
const files = order.filter((f) => found.includes(f));
const groupOf = (f) => GROUPS.find((g) => g.files.includes(f));
const docs = files.map((f) => {
  let md = readFileSync(path.join(srcDir, f), 'utf8');
  let summary = '';
  md = md.replace(/<!--\s*summary:\s*([\s\S]*?)-->/, (_, s) => { summary = s.trim(); return ''; });
  const title = /^#\s+(.*)$/m.exec(md)?.[1].replace(/`/g, '') ?? f;
  const desc = summary || (md.split('\n').find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('-') && !l.startsWith('!')) ?? '').replace(/[*`[\]]/g, '').slice(0, 220);
  const { html, toc, questions } = convert(md);
  const words = md.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return { file: f, out: f.replace(/\.md$/, '.html'), title, desc, html, toc, questions, minutes: Math.max(1, Math.round(words / 210)), group: groupOf(f), text: md.replace(/[#*`|>!\[\]()]/g, ' ').replace(/\s+/g, ' ') };
});
const byFile = Object.fromEntries(docs.map((d) => [d.file, d]));
const searchIndex = docs.map((d) => ({ t: d.title, u: d.out, x: d.text.slice(0, 5000) }));
searchIndex.unshift({ t: 'PramanaSutra AI home', u: 'index.html', x: 'Offline QA and release check. Four report files. Evidence binding none unbound ci-environment. Five static rules. Skills are instructions. scan and release-check share exit codes.' });

const I = (d) => `<svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  eye: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  proof: I('<path d="M12 3 4 6v6c0 4.4 3.3 7.6 8 9 4.7-1.4 8-4.6 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'),
  files: I('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
  policy: I('<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/>'),
  lock: I('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  plug: I('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8ZM12 18v4"/>'),
  github: I('<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>')
};
const HEAD_THEME = `<script>try{var t=localStorage.getItem('ps-theme-v2');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}</script>`;

function head({ title, desc, url, type, extra = '' }) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Vatsal Shah">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#0f766e">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="PramanaSutra AI">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${url}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0f766e"/><text x="16" y="21.5" font-size="14" font-weight="800" text-anchor="middle" fill="#fff" font-family="Arial">PS</text></svg>')}">
${HEAD_THEME}
${extra}
<style>${CSS}</style>
</head>`;
}

function topbar(active) {
  const links = [['00-start-here.html', 'Docs', 'docs'], ['16-real-world-scenarios.html', 'Scenarios', 'scn'], ['11-testing-and-proof.html', 'Proof', 'proof'], ['13-roadmap-and-status.html', 'Status', 'status']];
  return `<a class="skip" href="#content">Skip to content</a>
<header class="topbar">
<div class="topbar-in">
<button class="icon-btn menu-btn" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation menu">${ICON.menu}</button>
<a class="brand" href="index.html" aria-label="PramanaSutra AI home"><span class="logo" aria-hidden="true">PS</span><span class="brand-name">PramanaSutra <b>AI</b></span><small class="ver">v${esc(pkg.version)}</small></a>
<nav class="topnav" aria-label="Main">${links.map(([h, t, k]) => `<a href="${h}"${active === k ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<div class="search"><label class="sr" for="q">Search documentation</label>${ICON.search}<input id="q" type="search" placeholder="Search the docs" autocomplete="off" aria-controls="results" aria-expanded="false"><kbd aria-hidden="true">/</kbd><ul id="results" role="listbox" hidden></ul></div>
<button class="icon-btn theme-btn" type="button" aria-label="Switch to dark theme" aria-pressed="false"><span class="i-sun">${ICON.sun}</span><span class="i-moon">${ICON.moon}</span></button>
<a class="icon-btn gh" href="${REPO}" rel="noopener" aria-label="GitHub repository">${ICON.github}</a>
</div>
</header>`;
}

function fig(src, alt, { link = true, cls = '' } = {}) {
  const dark = src.replace(/\.svg$/, '-dark.svg');
  const imgs = `<img class="light-only" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"><img class="dark-only" src="${esc(dark)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  return `<figure class="fig ${cls}">${link ? `<a href="${esc(src)}" class="figlink" aria-label="Open diagram full size">${imgs}</a>` : imgs}<figcaption>${esc(alt)}</figcaption></figure>`;
}

function sidebar(currentFile) {
  const g = GROUPS.map((grp) => `<div class="nav-group"><p class="nav-title">${esc(grp.name)}</p><ol>${grp.files.filter((f) => byFile[f]).map((f) => `<li><a href="${byFile[f].out}"${f === currentFile ? ' aria-current="page"' : ''}>${esc(byFile[f].title)}</a></li>`).join('')}</ol></div>`).join('');
  return `<div class="scrim" hidden></div><aside id="sidebar" class="sidebar" aria-label="Documentation"><nav><a class="nav-home" href="index.html"${currentFile ? '' : ' aria-current="page"'}>Home</a>${g}</nav></aside>`;
}

function footer() {
  return `<footer class="site-foot"><div class="foot-in">
<div class="foot-brand"><a class="brand" href="index.html"><span class="logo" aria-hidden="true">PS</span><span class="brand-name">PramanaSutra <b>AI</b></span></a><p>An offline QA and release check. Evidence first. A person decides.</p><p class="fine">Created by <a href="${AUTHOR}" rel="noopener">Vatsal Shah</a> · <a href="${AUTHOR}" rel="noopener">shahvatsal.com</a> · Apache-2.0</p></div>
${GROUPS.map((g) => `<div><p class="foot-title">${esc(g.name)}</p><ul>${g.files.filter((f) => byFile[f]).slice(0, 4).map((f) => `<li><a href="${byFile[f].out}">${esc(byFile[f].title)}</a></li>`).join('')}</ul></div>`).join('')}
<div><p class="foot-title">Project</p><ul><li><a href="${REPO}" rel="noopener">GitHub</a></li><li><a href="https://www.npmjs.com/package/pramanasutra" rel="noopener">npm</a></li><li><a href="${REPO}/releases" rel="noopener">Releases</a></li><li><a href="${REPO}/blob/main/llms.txt" rel="noopener">llms.txt</a></li></ul></div>
</div><p class="legal">Version ${esc(pkg.version)}. Decision support, not a certification, compliance attestation or legal advice. Product names belong to their owners; no affiliation is implied.</p></footer>`;
}

function page(d, idx) {
  const prev = docs[idx - 1];
  const next = docs[idx + 1];
  const tocItems = d.toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('');
  const toc = d.toc.length ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>${tocItems}</ul></nav>` : '';
  const tocM = d.toc.length ? `<details class="toc-m"><summary>On this page</summary><ul>${tocItems}</ul></details>` : '';
  const html = d.html.replace(/<h1 id="([^"]*)">/, `<p class="eyebrow">${esc(d.group.name)}</p><h1 id="$1">`).replace(/<\/h1>/, `</h1><p class="meta">${d.minutes} min read · version ${esc(pkg.version)}</p>${tocM}`);
  const graph = [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: d.title, description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah', url: AUTHOR }, inLanguage: 'en', isPartOf: { '@type': 'SoftwareSourceCode', name: 'PramanaSutra AI', codeRepository: REPO, license: 'https://www.apache.org/licenses/LICENSE-2.0', version: pkg.version } }];
  if (d.file.startsWith('00-')) graph.push({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PramanaSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', softwareVersion: pkg.version, license: 'https://www.apache.org/licenses/LICENSE-2.0', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: d.desc, author: { '@type': 'Person', name: 'Vatsal Shah', url: AUTHOR }, codeRepository: REPO });
  const active = d.file.startsWith('16-') ? 'scn' : d.file.startsWith('11-') ? 'proof' : d.file.startsWith('13-') ? 'status' : 'docs';
  return `${head({ title: `${d.title} | PramanaSutra AI`, desc: d.desc, url: `${SITE}/${d.out}`, type: 'article', extra: `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>` })}
<body class="doc-page">
${topbar(active)}
<div class="layout">
${sidebar(d.file)}
<main id="content" class="content" tabindex="-1"><article class="prose">
${html}
</article>
<nav class="pager" aria-label="Previous and next">
${prev ? `<a class="prev" href="${prev.out}"><span>Previous</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
${next ? `<a class="next" href="${next.out}"><span>Next</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
</nav>
<p class="edit"><a href="${REPO}/blob/main/documents/pramanasutra/${d.file}" rel="noopener">View this page's source on GitHub</a></p>
</main>
${toc}
</div>
${footer()}
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

function copyInto(name) {
  const from = path.join(srcDir, name);
  if (!existsSync(from)) return;
  const walk = (s, d) => {
    mkdirSync(d, { recursive: true });
    for (const entry of readdirSync(s, { withFileTypes: true })) {
      const a = path.join(s, entry.name);
      const b = path.join(d, entry.name);
      if (entry.isDirectory()) walk(a, b);
      else copyFileSync(a, b);
    }
  };
  walk(from, path.join(outDir, name));
}

function landing() {
  const desc = 'Offline QA and release check. Reads a repository, does not run its tests, and writes Markdown, HTML, JSON and SARIF. A ready result still needs a person.';
  const scn = byFile['16-real-world-scenarios.md'];
  const stories = (scn?.toc ?? []).filter((t) => /^Story \d/.test(t.text));
  const storyMeta = [['A stray test.only', 'Friday 16:40. The build is green and half the suite is silent.', 'bad'], ['"The AI said all tests pass"', 'A claim is not evidence. See what the gate does.', 'warn'], ['The pull-request gate', 'Make every PR prove its tests before a human looks.', 'info'], ['Skipped tests pile up', 'Python, Java and Go skips, found by line.', 'warn'], ['The pasted "passing" JSON', 'How much can you trust evidence you did not produce?', 'info'], ['A legacy service, no tests', 'Say what was not found, not that it is fine.', 'neutral'], ['Hostile file names', 'Scan safely. Escape every name in the report.', 'bad'], ['Teach your AI IDE', 'Install 17 skills and use the Prime prompt.', 'ok']];
  const storyCards = stories.map((t, i) => `<a class="scard k-${storyMeta[i]?.[2] ?? 'neutral'}" href="16-real-world-scenarios.html#${t.id}"><span class="snum">${i + 1}</span><h3>${esc(storyMeta[i]?.[0] ?? t.text)}</h3><p>${esc(storyMeta[i]?.[1] ?? '')}</p><span class="more">Read the story ${ICON.arrow}</span></a>`).join('');
  const features = [
    ['eye', 'Finds silent test rot', 'Focused and skipped tests in JavaScript, TypeScript, pytest, unittest, JUnit and Go, with the exact file and line.'],
    ['proof', 'Demands proof', 'You supply test results from your own runner. A claim without evidence stays at REVIEW_REQUIRED. Failing evidence is NO_GO.'],
    ['files', 'Four files, one audit', 'report.md for pull requests, report.html for people, report.json for tools and report.sarif.json for code scanning.'],
    ['policy', 'Policy as code', 'Small JSON policies. Unknown keys are errors, and the safety flags can never be switched off.'],
    ['lock', 'Safe by design', 'Read-only on your project. Symbolic links are skipped. Every value in a report is escaped. No network calls.'],
    ['plug', 'Works with your AI IDE', 'Seventeen portable skills for Claude Code, Cursor, Codex, GitHub Copilot and Gemini CLI. No extra API key.']
  ].map(([ic, t, p]) => `<article class="feat"><span class="feat-ic">${ICON[ic]}</span><h3>${t}</h3><p>${p}</p></article>`).join('');
  const faq = [
    ['Does it run my tests?', 'No. You run them with your own tool and hand over the result as an evidence file. The report states that the tool did not execute tests.'],
    ['Can it approve a release?', 'No. The best result is READY_FOR_HUMAN_APPROVAL, and the gate always records automatedDeploymentAuthorized: false. A person decides.'],
    ['Is a passing JSON file proof?', 'No. The report labels evidence none, unbound or ci-environment. None of those is a signature, and a person can still type the file by hand.'],
    ['Do I need an API key or an account?', 'No. The CLI is offline with zero runtime dependencies. The skills use the model already in your IDE.'],
    ['How accurate are the rules?', 'On the six committed fixtures every expected finding is found and none is extra. The author wrote those fixtures, so that is a regression check, not field accuracy.'],
    ['Where is macOS?', 'macOS is not on the required CI matrix. Hosted macOS jobs were cancelled in the queue with zero steps. That is not a pass.']
  ];
  const docsGrid = GROUPS.map((g) => `<div class="dgroup"><h3>${esc(g.name)}</h3><p>${esc(g.blurb)}</p><ul>${g.files.filter((f) => byFile[f]).map((f) => `<li><a href="${byFile[f].out}">${esc(byFile[f].title)}</a><span>${byFile[f].minutes} min</span></li>`).join('')}</ul></div>`).join('');
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const swLd = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'PramanaSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', softwareVersion: pkg.version, license: 'https://www.apache.org/licenses/LICENSE-2.0', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: desc, author: { '@type': 'Person', name: 'Vatsal Shah', url: AUTHOR }, codeRepository: REPO, url: `${SITE}/` };
  return `${head({ title: 'PramanaSutra AI: know what you can prove before you ship', desc, url: `${SITE}/`, type: 'website', extra: `<script type="application/ld+json">${JSON.stringify(swLd).replace(/</g, '\\u003c')}</script><script type="application/ld+json">${JSON.stringify(faqLd).replace(/</g, '\\u003c')}</script>` })}
<body class="home-page">
${topbar('')}
${sidebar(null).replace('class="sidebar"', 'class="sidebar drawer-only"')}
<main id="content" tabindex="-1">
<section class="hero"><div class="wrap hero-grid">
<div class="hero-copy">
<p class="badge"><span class="dot"></span>Open source · Apache-2.0 · v${esc(pkg.version)}</p>
<h1>Know what you can <span class="grad">prove</span> before you ship.</h1>
<p class="lead">PramanaSutra AI reads your repository, checks the test results you give it, and returns one clear answer: stop, review, or hand it to a person. It never runs your tests and never approves a release.</p>
<div class="cta"><a class="btn primary" href="00-start-here.html">Get started ${ICON.arrow}</a><a class="btn" href="16-real-world-scenarios.html">See real scenarios</a><a class="btn ghost" href="${REPO}" rel="noopener">${ICON.github} GitHub</a></div>
<div class="install" role="group" aria-label="Install command"><span class="prompt" aria-hidden="true">$</span><code>npx pramanasutra release-check --path .</code><button class="copy-inline" type="button" aria-label="Copy command">${ICON.copy}<span>Copy</span></button></div>
<ul class="facts"><li>Offline</li><li>No API key</li><li>0 runtime dependencies</li><li>Read-only</li></ul>
</div>
<div class="hero-art">${fig('diagrams/overview.svg', 'Your project files, test results and policy go into the pramanasutra command. It writes four report files and an exit code, and a person decides.', { cls: 'hero-fig' })}</div>
</div></section>
<section class="statband" aria-label="Facts about this version"><div class="wrap"><ul>
<li><b>5</b><span>static rules</span></li><li><b>17</b><span>agent skills</span></li><li><b>4</b><span>report files</span></li><li><b>0</b><span>runtime dependencies</span></li><li><b>43/43</b><span>tests passing</span></li>
</ul></div></section>
<section class="sec"><div class="wrap"><p class="kicker">What it does</p><h2>Honest answers, with receipts</h2><p class="sub">Most tools tell you a build is green. This one tells you what was checked, what was claimed, and what nobody proved.</p><div class="feat-grid">${features}</div></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">How it works</p><h2>Three steps. Five minutes.</h2>
<ol class="steps">
<li><span class="n">1</span><h3>Run</h3><p>One command. Read-only. Nothing leaves your machine.</p><pre class="mini-code"><code>npx pramanasutra release-check --path .</code></pre></li>
<li><span class="n">2</span><h3>Read</h3><p>Open the HTML report. Each finding has a file, a line and a fix.</p><pre class="mini-code"><code>pramanasutra-reports/report.html</code></pre></li>
<li><span class="n">3</span><h3>Prove</h3><p>Run your tests, hand over the result, and run the check again.</p><pre class="mini-code"><code>--evidence results.json</code></pre></li>
</ol>
${fig('diagrams/gate-flow.svg', 'The release gate: a blocking finding or failing evidence is NO_GO. Anything missing is REVIEW_REQUIRED. Otherwise it is READY_FOR_HUMAN_APPROVAL, and then a person decides.', { cls: 'gate-fig' })}
<div class="outcomes">
<article class="out bad"><span class="chip">exit 2</span><h3>NO_GO</h3><p>A blocker was found, such as a focused test, or the evidence shows failures.</p></article>
<article class="out warn"><span class="chip">exit 3</span><h3>REVIEW_REQUIRED</h3><p>Evidence is missing, unverified or empty, or the scan is incomplete.</p></article>
<article class="out ok"><span class="chip">exit 0</span><h3>READY_FOR_HUMAN_APPROVAL</h3><p>Every check passed. A person still decides. Never a deploy order.</p></article>
</div></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Real-world scenarios</p><h2>See it on situations you know</h2><p class="sub">Eight stories with the real terminal output, captured from this repository's fixtures.</p><div class="scn-grid">${storyCards}</div><p class="center"><a class="btn primary" href="16-real-world-scenarios.html">Read all eight stories ${ICON.arrow}</a></p></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">Documentation</p><h2>Everything, organised by what you need</h2><div class="dgrid">${docsGrid}</div></div></section>
<section class="sec"><div class="wrap narrow"><p class="kicker">What it does not do</p><h2>Limits, stated plainly</h2><ul class="limits">
<li>It does not run your tests, a browser, a load generator or a vulnerability scanner.</li>
<li>Evidence is not signed. A hand-written file can look like a CI file.</li>
<li>Fixture precision is a regression lock written by the rule author, not field accuracy.</li>
<li>Skills are instructions. No one has yet published a live smoke test inside each AI IDE.</li>
<li>Required CI is Ubuntu and Windows on Node 20, 22 and 24. macOS is not scheduled.</li>
</ul></div></section>
<section class="sec alt"><div class="wrap narrow"><p class="kicker">FAQ</p><h2>Quick answers</h2>${faq.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}<p class="center"><a href="14-faq-and-glossary.html">More questions and a glossary</a></p></div></section>
<section class="cta-band"><div class="wrap"><h2>Run it on your repository now</h2><p>One command, no account, nothing leaves your machine.</p><div class="install on-dark" role="group" aria-label="Install command"><span class="prompt" aria-hidden="true">$</span><code>npx pramanasutra release-check --path .</code><button class="copy-inline" type="button" aria-label="Copy command">${ICON.copy}<span>Copy</span></button></div><div class="cta center"><a class="btn light" href="00-start-here.html">Read the guide ${ICON.arrow}</a><a class="btn outline" href="${REPO}" rel="noopener">Star on GitHub</a></div></div></section>
</main>
${footer()}
<script>window.__DOCS_INDEX__=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};</script>
<script>${JS}</script>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });
docs.forEach((d, i) => writeFileSync(path.join(outDir, d.out), page(d, i)));
writeFileSync(path.join(outDir, 'index.html'), landing());
for (const name of ['samples', 'proof', 'audit', 'diagrams']) copyInto(name);
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
