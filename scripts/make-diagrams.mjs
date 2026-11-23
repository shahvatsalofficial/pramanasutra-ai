// Generates documents/pramanasutra/diagrams/*.svg. No dependencies, no network.
// Every SVG is a self-contained card with its own colours, so it reads the same in light and dark themes,
// on GitHub, on npm and on the documentation site. Numbers shown come from this repository's own proof files.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'documents', 'pramanasutra', 'diagrams');
mkdirSync(out, { recursive: true });

const C = {
  card: '#fffdf8', line: '#cfc6b4', ink: '#1c1915', mute: '#5e584e', neutral: '#efeae0',
  brand: '#0f3d3e', brandSoft: '#dff0ee', accent: '#0b5f63',
  ok: '#166534', okSoft: '#dcfce7', warn: '#92400e', warnSoft: '#fef3c7', bad: '#991b1b', badSoft: '#fee2e2',
  info: '#1e40af', infoSoft: '#dbeafe'
};
const KIND = {
  neutral: [C.neutral, C.line, C.ink], brand: [C.brandSoft, C.accent, C.brand], ok: [C.okSoft, C.ok, C.ok],
  warn: [C.warnSoft, C.warn, C.warn], bad: [C.badSoft, C.bad, C.bad], info: [C.infoSoft, C.info, C.info], white: ['#ffffff', C.line, C.ink]
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace";

function text(x, y, lines, { size = 15, weight = 400, fill = C.ink, anchor = 'middle', mono = false, lh = 1.3 } = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const tspans = arr.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : (size * lh).toFixed(1)}">${esc(l)}</tspan>`).join('');
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${mono ? MONO : FONT}">${tspans}</text>`;
}
function box(x, y, w, h, { title, lines = [], kind = 'neutral', r = 12, tsize = 16, lsize = 13, dash = false, mono = false } = {}) {
  const [fill, stroke, ink] = KIND[kind];
  const th = tsize * 1.3, lh = lsize * 1.35;
  const total = (title ? th : 0) + lines.length * lh;
  let cy = y + (h - total) / 2 + tsize * 0.95;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"${dash ? ' stroke-dasharray="6 5"' : ''}/>`;
  if (title) { s += text(x + w / 2, cy, title, { size: tsize, weight: 700, fill: ink, mono }); cy += th; }
  if (lines.length) s += text(x + w / 2, cy, lines, { size: lsize, fill: C.mute, lh: 1.35 });
  return s;
}
function pill(cx, cy, w, label, kind = 'neutral', size = 13) {
  const [fill, stroke, ink] = KIND[kind];
  return `<rect x="${cx - w / 2}" y="${cy - 14}" width="${w}" height="28" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>${text(cx, cy + size * 0.35, label, { size, weight: 700, fill: ink })}`;
}
function diamond(cx, cy, w, h, title, sub, kind = 'info') {
  const [fill, stroke, ink] = KIND[kind];
  return `<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>${text(cx, cy - 2, title, { size: 16, weight: 700, fill: ink })}${sub ? text(cx, cy + 18, sub, { size: 12.5, fill: C.mute }) : ''}`;
}
function arrow(pts, { label, lx, ly, color = C.mute, dash = false } = {}) {
  const d = pts.map(([x, y]) => `${x},${y}`).join(' ');
  let s = `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="2"${dash ? ' stroke-dasharray="6 5"' : ''} marker-end="url(#ah)"/>`;
  if (label) s += text(lx ?? pts[0][0], ly ?? pts[0][1] - 6, label, { size: 13, weight: 700, fill: color });
  return s;
}
function svg(name, w, h, title, desc, body) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.mute}"/></marker></defs>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="16" fill="${C.card}" stroke="${C.line}" stroke-width="2"/>
${body}
</svg>
`;
  writeFileSync(path.join(out, `${name}.svg`), doc);
}

// 1. Overview ---------------------------------------------------------------
svg('overview', 960, 430, 'How PramanaSutra AI works', 'Your project files, your test results and an optional policy go into the pramanasutra command. It scans, checks the evidence and decides a gate. It writes four report files and an exit code, and a person makes the final call.', [
  text(30, 30, 'YOU PROVIDE', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  text(340, 30, 'THE CLI DECIDES (OFFLINE, NO NETWORK)', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  text(680, 30, 'YOU GET', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  box(30, 45, 250, 90, { title: 'Your project files', lines: ['read-only, never executed'] }),
  box(30, 170, 250, 90, { title: 'Test results (evidence)', lines: ['JSON from your own runner or CI'], kind: 'brand' }),
  box(30, 295, 250, 80, { title: 'Policy (optional)', lines: ['fail-closed JSON'] }),
  `<rect x="335" y="45" width="280" height="330" rx="14" fill="#ffffff" stroke="${C.accent}" stroke-width="2"/>`,
  box(355, 62, 240, 80, { title: '1  Scan', lines: ['5 static rules, file and line'], kind: 'info' }),
  box(355, 160, 240, 80, { title: '2  Check evidence', lines: ['shape, state, binding label'], kind: 'info' }),
  box(355, 258, 240, 100, { title: '3  Gate', lines: ['apply policy to findings', 'and evidence'], kind: 'brand' }),
  arrow([[280, 90], [310, 90], [310, 102], [355, 102]]),
  arrow([[280, 215], [355, 200]]),
  arrow([[280, 335], [310, 335], [310, 318], [355, 318]]),
  arrow([[615, 120], [680, 120]]),
  arrow([[615, 300], [680, 300]]),
  box(680, 45, 250, 150, { title: 'Four report files', lines: ['report.md', 'report.html', 'report.json', 'report.sarif.json'], kind: 'white', mono: false }),
  box(680, 225, 250, 70, { title: 'Exit code', lines: ['0 ready   2 NO_GO   3 review'], kind: 'white' }),
  box(680, 320, 250, 70, { title: 'A person decides', lines: ['never an automatic deploy'], kind: 'ok' }),
  arrow([[805, 295], [805, 320]]),
  text(480, 412, 'The tool never runs your tests. It reads files and reads the results you hand it.', { size: 13.5, fill: C.mute })
].join('\n'));

// 2. Gate flow --------------------------------------------------------------
svg('gate-flow', 960, 800, 'How the release gate decides', 'Flowchart. A blocking finding or failing evidence gives NO_GO. Missing evidence, a partial scan, no tests, no CI or no license gives REVIEW_REQUIRED. Only when nothing is missing is the result READY_FOR_HUMAN_APPROVAL, which still needs a person.', [
  pill(480, 40, 220, 'release-check runs', 'neutral', 14),
  arrow([[480, 54], [480, 92]]),
  diamond(480, 160, 300, 130, 'Blocking finding?', 'e.g. a focused test (.only)', 'info'),
  arrow([[630, 160], [720, 160]], { label: 'yes', lx: 675, ly: 150, color: C.bad }),
  box(720, 120, 215, 80, { title: 'NO_GO', lines: ['exit code 2', 'fix, then re-check'], kind: 'bad' }),
  arrow([[480, 225], [480, 275]], { label: 'no', lx: 497, ly: 252, color: C.ok }),
  diamond(480, 340, 300, 130, 'Evidence failing?', 'failures, or exit code not 0', 'info'),
  arrow([[630, 340], [700, 340], [700, 170], [720, 170]], { label: 'yes', lx: 665, ly: 330, color: C.bad }),
  arrow([[480, 405], [480, 455]], { label: 'no', lx: 497, ly: 432, color: C.ok }),
  diamond(480, 520, 300, 130, 'Anything missing?', 'see the list on the right', 'info'),
  arrow([[630, 520], [720, 520]], { label: 'yes', lx: 675, ly: 510, color: C.warn }),
  box(720, 430, 215, 180, { title: 'REVIEW_REQUIRED', lines: ['exit code 3', '', 'Missing when:', 'evidence is not passing', 'scan is partial', 'no tests, CI or license'], kind: 'warn', tsize: 15 }),
  arrow([[480, 585], [480, 645]], { label: 'no', lx: 497, ly: 620, color: C.ok }),
  box(310, 645, 340, 70, { title: 'READY_FOR_HUMAN_APPROVAL', lines: ['exit code 0'], kind: 'ok', tsize: 16 }),
  arrow([[480, 715], [480, 745]]),
  pill(480, 765, 330, 'A person reviews and decides', 'ok', 14),
  text(30, 225, ['Checked in this order.', 'First match wins.'], { size: 13, fill: C.mute, anchor: 'start' }),
  box(30, 600, 230, 120, { title: 'Always true', lines: ['requiresHumanApproval: true', 'automatedDeploymentAuthorized:', 'false'], kind: 'neutral', lsize: 12.5 })
].join('\n'));

// 3. Four report files ------------------------------------------------------
svg('report-files', 960, 380, 'One audit, four files', 'One scan writes report.md for pull requests, report.html for browsers, report.json for tools and report.sarif.json for code scanning. The facts are the same in all four.', [
  box(30, 120, 240, 130, { title: 'One scan', lines: ['one set of facts', 'written four ways'], kind: 'brand', tsize: 18 }),
  ...[
    ['report.md', 'Pull requests, tickets, plain reading', 'info', 20],
    ['report.html', 'Open in a browser. Share or print. Light and dark.', 'ok', 110],
    ['report.json', 'Scripts and CI. Stable schema 1.0.0.', 'neutral', 200],
    ['report.sarif.json', 'SARIF 2.1.0 for code scanning. Not uploaded for you.', 'warn', 290]
  ].flatMap(([f, d, k, y]) => [box(350, y, 580, 70, { kind: k }), text(375, y + 30, f, { size: 17, weight: 700, anchor: 'start', mono: true, fill: KIND[k][2] }), text(375, y + 52, d, { size: 14, anchor: 'start', fill: C.mute }), arrow([[270, 185], [310, 185], [310, y + 35], [350, y + 35]])])
].join('\n'));

// 4. Evidence states --------------------------------------------------------
const rows = [
  ['No --evidence file', 'absent', 'neutral', 'REVIEW_REQUIRED', 'warn'],
  ['failed above 0, or exit code not 0', 'failing', 'bad', 'NO_GO', 'bad'],
  ['passed is 0', 'inconclusive', 'warn', 'REVIEW_REQUIRED', 'warn'],
  ['source is external-unverified', 'unverified', 'warn', 'REVIEW_REQUIRED', 'warn'],
  ['exit 0, passed above 0, failed 0, trusted source', 'passing', 'ok', 'Counts toward READY', 'ok']
];
svg('evidence-states', 960, 420, 'How supplied test results are classified', 'Five evidence states: absent, failing, inconclusive, unverified and passing, and the gate effect of each.', [
  text(30, 32, 'WHAT YOU SUPPLY', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  text(490, 32, 'STATE', { size: 12, weight: 700, fill: C.mute }),
  text(930, 32, 'GATE EFFECT', { size: 12, weight: 700, fill: C.mute, anchor: 'end' }),
  ...rows.flatMap(([a, st, sk, g, gk], i) => { const y = 50 + i * 72; return [box(30, y, 360, 58, { kind: 'white' }), text(46, y + 35, a, { size: 14.5, anchor: 'start' }), pill(490, y + 29, 150, st, sk, 14), arrow([[390, y + 29], [415, y + 29]]), arrow([[565, y + 29], [640, y + 29]]), box(640, y, 290, 58, { title: g, kind: gk, tsize: 15 })]; }),
  text(480, 412, 'Other checks (no blocking finding, complete scan, tests, CI, license) still apply to the last row.', { size: 12.5, fill: C.mute })
].join('\n'));

// 5. Trust boundaries -------------------------------------------------------
svg('trust-boundaries', 960, 420, 'Trust boundaries', 'Untrusted project files, file names, comments and evidence text flow into the CLI, which only reads and matches text and never executes it. Reports escape every value.', [
  `<rect x="20" y="20" width="270" height="320" rx="14" fill="${C.badSoft}" stroke="${C.bad}" stroke-width="1.6" stroke-dasharray="7 5"/>`,
  text(155, 48, 'UNTRUSTED INPUT', { size: 13, weight: 700, fill: C.bad }),
  box(40, 65, 230, 55, { title: 'Project files', kind: 'white' }),
  box(40, 135, 230, 55, { title: 'File names and paths', kind: 'white' }),
  box(40, 205, 230, 55, { title: 'Comments and test text', kind: 'white' }),
  box(40, 275, 230, 55, { title: 'Evidence JSON text', kind: 'white' }),
  `<rect x="345" y="20" width="270" height="320" rx="14" fill="${C.brandSoft}" stroke="${C.accent}" stroke-width="1.6"/>`,
  text(480, 48, 'TRUSTED ENGINE', { size: 13, weight: 700, fill: C.brand }),
  box(365, 70, 230, 250, { title: 'pramanasutra CLI', lines: ['reads text and matches rules', 'validates the JSON shape', 'skips symbolic links', 'never executes project code', 'makes no network call', 'writes only the report folder'], kind: 'white' }),
  `<rect x="670" y="20" width="270" height="320" rx="14" fill="${C.okSoft}" stroke="${C.ok}" stroke-width="1.6"/>`,
  text(805, 48, 'OUTPUT', { size: 13, weight: 700, fill: C.ok }),
  box(690, 70, 230, 120, { title: 'Reports', lines: ['every value is escaped', 'in HTML and Markdown'], kind: 'white' }),
  box(690, 210, 230, 110, { title: 'Exit code', lines: ['0, 2 or 3 for a pipeline'], kind: 'white' }),
  arrow([[290, 180], [345, 180]], { label: 'read only', lx: 318, ly: 168 }),
  arrow([[615, 130], [670, 130]]),
  arrow([[615, 260], [670, 260]]),
  box(20, 360, 920, 48, { title: 'Provenance of evidence is claimed, not proven. A person must still decide whether to trust the source.', kind: 'warn', tsize: 14.5 })
].join('\n'));

// 6. CI pipeline ------------------------------------------------------------
const stepY1 = 40, stepY2 = 210;
svg('ci-pipeline', 960, 340, 'A pull request through CI to a human decision', 'A pull request runs the tests on Ubuntu and Windows across Node 20, 22 and 24. A real evidence file is written from the test output, release-check runs, reports are kept, and a person reviews before release.', [
  box(20, stepY1, 205, 100, { title: '1  Pull request', lines: ['code and tests change'], kind: 'neutral' }),
  box(262, stepY1, 205, 100, { title: '2  Real tests run', lines: ['Ubuntu and Windows', 'Node 20, 22, 24'], kind: 'info' }),
  box(504, stepY1, 205, 100, { title: '3  Evidence written', lines: ['from the real output', 'scripts/ci-gate.mjs'], kind: 'info' }),
  box(746, stepY1, 195, 100, { title: '4  release-check', lines: ['scan + gate', 'exit 0, 2 or 3'], kind: 'brand' }),
  arrow([[225, 90], [262, 90]]), arrow([[467, 90], [504, 90]]), arrow([[709, 90], [746, 90]]),
  arrow([[843, 140], [843, 175], [122, 175], [122, stepY2]]),
  box(20, stepY2, 205, 100, { title: '5  Reports kept', lines: ['md, html, json, sarif', 'as CI artifacts'], kind: 'neutral' }),
  box(262, stepY2, 205, 100, { title: '6  Human review', lines: ['read report.html', 'decide'], kind: 'ok' }),
  box(504, stepY2, 205, 100, { title: '7  Merge or release', lines: ['a person clicks it'], kind: 'ok' }),
  box(746, stepY2, 195, 100, { title: '8  Publish', lines: ['npm, GitHub release', 'after a person says go'], kind: 'neutral' }),
  arrow([[225, 260], [262, 260]]), arrow([[467, 260], [504, 260]]), arrow([[709, 260], [746, 260]]),
  text(480, 330, 'A red step 4 (exit 2 or 3) stops here. Nothing is released by the tool.', { size: 13, fill: C.mute })
].join('\n'));

// 7. Skills team ------------------------------------------------------------
svg('skills-team', 960, 520, 'The 17 agent skills', 'PramanaSutra Prime is the chief orchestrator. Sixteen specialist skills are grouped into plan, write tests, investigate, and ship and verify.', [
  box(335, 215, 290, 90, { title: 'pramanasutra-prime', lines: ['chief orchestrator', 'scope, safety, delegation'], kind: 'brand', tsize: 18 }),
  box(30, 20, 400, 150, { title: 'Plan', lines: ['pramanasutra-strategy', 'risk-based test strategy', 'coverage objectives'], kind: 'info' }),
  box(530, 20, 400, 150, { title: 'Write and design tests', lines: ['-unit  -flow  -api  -visual', '-access  -load  -data', 'one skill per kind of test'], kind: 'ok' }),
  box(30, 350, 400, 150, { title: 'Investigate', lines: ['-regression  what changed', '-flake  why it is unstable', '-defect  failure to bug report'], kind: 'warn' }),
  box(530, 350, 400, 150, { title: 'Ship and verify', lines: ['-pipeline  -release  -secure', '-evidence  -verify', 'verify reviews the evidence'], kind: 'neutral' }),
  arrow([[335, 245], [430, 130]]), arrow([[625, 245], [530, 130]]), arrow([[335, 275], [430, 390]]), arrow([[625, 275], [530, 390]]),
  text(480, 340, 'Skills are instructions your IDE model follows. They do not run tests.', { size: 13, fill: C.mute })
].join('\n'));

// 8. Scenario: focused test --------------------------------------------------
svg('scenario-focused-test', 960, 420, 'Scenario: a focused test hides half the suite', 'A test.only on line 2 means the runner executes 1 of 2 tests and still shows green. PramanaSutra reports FOCUSED_TEST at tests/a.test.js:2 and returns NO_GO with exit code 2. After the fix, 2 of 2 run.', [
  text(30, 32, 'BEFORE: green build, half the coverage', { size: 14, weight: 700, fill: C.bad, anchor: 'start' }),
  `<rect x="30" y="48" width="420" height="108" rx="10" fill="#1b2423"/>`,
  text(46, 78, 'import { test } from "node:test";', { size: 13.5, anchor: 'start', fill: '#f3efe6', mono: true }),
  `<rect x="30" y="88" width="420" height="26" fill="#7f1d1d"/>`,
  text(46, 106, 'test.only("only this runs", () => {});', { size: 13.5, anchor: 'start', fill: '#fecaca', mono: true }),
  text(46, 134, 'test("silently skipped", () => {});', { size: 13.5, anchor: 'start', fill: '#f3efe6', mono: true }),
  text(14, 106, '2', { size: 12, fill: C.bad, weight: 700 }),
  text(30, 186, 'Tests the runner executes', { size: 13, anchor: 'start', fill: C.mute }),
  `<rect x="30" y="196" width="420" height="22" rx="6" fill="${C.neutral}"/><rect x="30" y="196" width="210" height="22" rx="6" fill="${C.bad}"/>`,
  text(125, 213, '1 of 2 run', { size: 13, weight: 700, fill: '#ffffff' }),
  arrow([[250, 232], [250, 262]]),
  box(30, 266, 420, 120, { title: 'PramanaSutra: NO_GO (exit 2)', lines: ['FOCUSED_TEST  high', 'tests/a.test.js:2', 'Remove .only, run the full suite'], kind: 'bad', tsize: 15 }),
  arrow([[450, 130], [510, 130]], { label: 'fix', lx: 480, ly: 120, color: C.ok }),
  text(510, 32, 'AFTER: full suite runs, evidence supplied', { size: 14, weight: 700, fill: C.ok, anchor: 'start' }),
  `<rect x="510" y="48" width="420" height="108" rx="10" fill="#1b2423"/>`,
  text(526, 78, 'import { test } from "node:test";', { size: 13.5, anchor: 'start', fill: '#f3efe6', mono: true }),
  text(526, 106, 'test("only this runs", () => {});', { size: 13.5, anchor: 'start', fill: '#bbf7d0', mono: true }),
  text(526, 134, 'test("no longer skipped", () => {});', { size: 13.5, anchor: 'start', fill: '#bbf7d0', mono: true }),
  text(510, 186, 'Tests the runner executes', { size: 13, anchor: 'start', fill: C.mute }),
  `<rect x="510" y="196" width="420" height="22" rx="6" fill="${C.ok}"/>`,
  text(720, 213, '2 of 2', { size: 13, weight: 700, fill: '#ffffff' }),
  arrow([[720, 232], [720, 262]]),
  box(510, 266, 420, 120, { title: 'READY_FOR_HUMAN_APPROVAL (exit 0)', lines: ['with passing evidence supplied', 'and no other blocker', 'a person still approves'], kind: 'ok', tsize: 15 })
].join('\n'));

// 9. Scenario: AI claims tests pass -----------------------------------------
svg('scenario-ai-claim', 960, 360, 'Scenario: "all tests pass" is a claim, not evidence', 'Without an evidence file from a real run the gate returns REVIEW_REQUIRED. With passing evidence it can reach READY_FOR_HUMAN_APPROVAL.', [
  box(20, 120, 210, 100, { title: 'An assistant says', lines: ['"All tests pass."'], kind: 'neutral', tsize: 15 }),
  arrow([[230, 170], [290, 170]]),
  diamond(405, 170, 230, 130, 'Evidence file?', 'from a real run', 'info'),
  arrow([[405, 105], [405, 70], [560, 70]], { label: 'no', lx: 440, ly: 62, color: C.warn }),
  box(560, 30, 380, 80, { title: 'REVIEW_REQUIRED (exit 3)', lines: ['a claim is not evidence', 'run the tests, then supply the result'], kind: 'warn', tsize: 15 }),
  arrow([[405, 235], [405, 290], [560, 290]], { label: 'yes', lx: 440, ly: 282, color: C.ok }),
  box(560, 150, 380, 120, { title: 'Evidence: ci-ingested', lines: ['exit 0, passed 12, failed 0', 'verify checks the JSON shape'], kind: 'info', tsize: 15 }),
  arrow([[750, 270], [750, 295]]),
  box(560, 295, 380, 55, { title: 'READY_FOR_HUMAN_APPROVAL (exit 0)', kind: 'ok', tsize: 15 })
].join('\n'));

// 10. Evidence binding ------------------------------------------------------
svg('evidence-binding', 960, 300, 'Evidence binding: three honest labels', 'Binding is none when no evidence file is given, unbound when the file names no GitHub run, and ci-environment when it names a repository, commit, run id and workflow. None of these is a signature.', [
  box(20, 40, 280, 150, { title: 'none', lines: ['no evidence file', 'nothing to bind'], kind: 'neutral', tsize: 20 }),
  box(340, 40, 280, 150, { title: 'unbound', lines: ['a file, but no GitHub identity', 'anyone could have typed it'], kind: 'warn', tsize: 20 }),
  box(660, 40, 280, 150, { title: 'ci-environment', lines: ['repository, commit, run id', 'and workflow are named'], kind: 'info', tsize: 20 }),
  arrow([[300, 115], [340, 115]]), arrow([[620, 115], [660, 115]]),
  text(480, 225, 'More claims as you move right.', { size: 14, weight: 700 }),
  text(480, 252, 'No label is a cryptographic signature. A person can still hand-write a ci-environment file.', { size: 13.5, fill: C.mute })
].join('\n'));

// 11. Rule table ------------------------------------------------------------
const rules = [
  ['FOCUSED_TEST', 'high', 'bad', 'NO_GO', 'bad', 'test.only, fit, fdescribe'],
  ['SKIPPED_TEST', 'low', 'neutral', 'NO_GO under strict policy only', 'neutral', '.skip, xit, @Disabled, t.Skip'],
  ['NO_TESTS', 'medium', 'warn', 'REVIEW_REQUIRED', 'warn', 'no file looks like a test'],
  ['NO_CI', 'medium', 'warn', 'REVIEW_REQUIRED', 'warn', 'no recognised pipeline file'],
  ['NO_LICENSE', 'low', 'neutral', 'REVIEW_REQUIRED', 'warn', 'no LICENSE at the root']
];
svg('rules-overview', 960, 400, 'The five static rules', 'FOCUSED_TEST is high and blocks. SKIPPED_TEST is low and blocks only under the strict policy. NO_TESTS, NO_CI and NO_LICENSE are medium or low and require review.', [
  text(30, 32, 'RULE', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  text(300, 32, 'SEVERITY', { size: 12, weight: 700, fill: C.mute }),
  text(430, 32, 'WHAT IT SEES', { size: 12, weight: 700, fill: C.mute, anchor: 'start' }),
  text(930, 32, 'GATE EFFECT', { size: 12, weight: 700, fill: C.mute, anchor: 'end' }),
  ...rules.flatMap(([r, s, sk, g, gk, w], i) => { const y = 46 + i * 68; return [box(20, y, 920, 56, { kind: 'white' }), text(36, y + 34, r, { size: 15.5, weight: 700, anchor: 'start', mono: true }), pill(300, y + 28, 100, s, sk), text(430, y + 33, w, { size: 13.5, anchor: 'start', fill: C.mute }), pill(800, y + 28, 250, g, gk, 12.5)]; }),
  text(480, 390, 'Rules read test files only, line by line. They are heuristics, not parsers.', { size: 13, fill: C.mute })
].join('\n'));

// 12. Components ------------------------------------------------------------
svg('components', 960, 430, 'Inside the CLI', 'The bin file parses arguments and sets the exit code. It calls the scanner, the evidence and policy loaders and the report writer, and the installer copies skills into IDE folders.', [
  box(280, 20, 400, 70, { title: 'bin/pramanasutra.mjs', lines: ['parse arguments, dispatch, exit code'], kind: 'brand', mono: true, tsize: 16 }),
  ...[
    ['scanner.mjs', ['walk files, 5 rules', 'evaluateGate'], 'info', 20],
    ['evidence.mjs', ['validate JSON', 'classify state'], 'info', 210],
    ['policy.mjs', ['fail-closed load', 'unknown key = error'], 'info', 400],
    ['report.mjs', ['md, html', 'json, sarif'], 'ok', 590],
    ['installer.mjs', ['copy 17 skills', 'refuse overwrite'], 'neutral', 780]
  ].flatMap(([n, l, k, x]) => [box(x, 170, 160, 110, { title: n, lines: l, kind: k, mono: true, tsize: 14.5 }), arrow([[480, 90], [480, 130], [x + 80, 130], [x + 80, 170]])]),
  box(20, 330, 700, 80, { title: 'Zero runtime dependencies. Node standard library only. No network.', lines: ['Runs git diff --name-only (read-only) only when you pass --changed'], kind: 'white', tsize: 14.5 }),
  box(740, 330, 200, 80, { title: '.agents/skills', lines: ['17 SKILL.md sources'], kind: 'neutral', tsize: 14.5, mono: true }),
  arrow([[860, 330], [860, 280]])
].join('\n'));

// 13. Proof graphs ----------------------------------------------------------
const ci = [['Ubuntu', 20], ['Ubuntu', 22], ['Ubuntu', 24], ['Windows', 20], ['Windows', 22], ['Windows', 24]];
svg('proof-graphs', 960, 470, 'Recorded results', 'Forty-three of forty-three unit tests passed, six of six labeled fixtures matched, and six of six required CI jobs passed on commit 43309a8.', [
  text(30, 34, 'UNIT TESTS (tests/cli.test.mjs)', { size: 13, weight: 700, fill: C.mute, anchor: 'start' }),
  `<rect x="30" y="46" width="900" height="34" rx="8" fill="${C.ok}"/>`,
  text(480, 69, '43 passed    0 failed    0 skipped', { size: 15, weight: 700, fill: '#ffffff' }),
  text(30, 120, 'LABELED FIXTURES (rule author wrote them: a regression lock, not field accuracy)', { size: 13, weight: 700, fill: C.mute, anchor: 'start' }),
  `<rect x="30" y="132" width="900" height="34" rx="8" fill="${C.ok}"/>`,
  text(480, 155, '6 of 6 matched the expected rules and gate    0 false positives    0 false negatives', { size: 15, weight: 700, fill: '#ffffff' }),
  text(30, 206, 'REQUIRED CI JOBS on commit 43309a8 (macOS is not scheduled)', { size: 13, weight: 700, fill: C.mute, anchor: 'start' }),
  ...ci.flatMap(([os, n], i) => { const col = i % 3, row = Math.floor(i / 3); const x = 30 + col * 300, y = 222 + row * 78; return [`<rect x="${x}" y="${y}" width="280" height="62" rx="10" fill="${C.okSoft}" stroke="${C.ok}" stroke-width="1.6"/>`, text(x + 140, y + 27, `${os}  Node ${n}`, { size: 15, weight: 700, fill: C.ok }), text(x + 140, y + 48, 'passed', { size: 13, fill: C.ok })]; }),
  text(480, 410, 'Numbers come from docs/proof/test-results.txt, docs/proof/eval-results.json and the GitHub Actions run.', { size: 13, fill: C.mute }),
  text(480, 436, 'Not measured: accuracy on large real repositories, live behaviour in each AI IDE.', { size: 13, fill: C.warn, weight: 700 })
].join('\n'));

// 14. Quick start -----------------------------------------------------------
svg('quickstart', 960, 260, 'Three steps to your first audit', 'Run release-check, open report.html, then fix findings and supply real test results as evidence.', [
  box(20, 30, 290, 200, { kind: 'brand' }), text(165, 70, '1  Run', { size: 20, weight: 700, fill: C.brand }), text(165, 110, 'npx pramanasutra', { size: 14, mono: true }), text(165, 132, 'release-check --path .', { size: 14, mono: true }), text(165, 175, 'Offline. Read-only.', { size: 13, fill: C.mute }), text(165, 195, 'No account, no API key.', { size: 13, fill: C.mute }),
  box(335, 30, 290, 200, { kind: 'info' }), text(480, 70, '2  Read', { size: 20, weight: 700, fill: C.info }), text(480, 110, 'pramanasutra-reports/', { size: 14, mono: true }), text(480, 132, 'report.html', { size: 14, mono: true }), text(480, 175, 'Gate, findings with', { size: 13, fill: C.mute }), text(480, 195, 'file:line, and fixes.', { size: 13, fill: C.mute }),
  box(650, 30, 290, 200, { kind: 'ok' }), text(795, 70, '3  Prove', { size: 20, weight: 700, fill: C.ok }), text(795, 110, 'run your tests, then', { size: 14 }), text(795, 132, '--evidence results.json', { size: 14, mono: true }), text(795, 175, 'Only real results', { size: 13, fill: C.mute }), text(795, 195, 'can reach READY.', { size: 13, fill: C.mute }),
  arrow([[310, 130], [335, 130]]), arrow([[625, 130], [650, 130]])
].join('\n'));


// 15. Scenario picker -------------------------------------------------------
svg('scenario-picker', 960, 330, 'Which story is yours?', 'A decision guide: stop a release with a hidden problem, stories 1, 4 and 6; check a claim that tests pass, stories 2 and 5; make every pull request prove itself, story 3; teach an AI assistant the method, story 8.', [
  box(330, 20, 300, 60, { title: 'What are you trying to do?', kind: 'brand', tsize: 16 }),
  ...[
    ['Stop a release with a hidden problem', 'Stories 1, 4, 6', 'bad', 20],
    ['Check a claim that tests pass', 'Stories 2, 5', 'warn', 255],
    ['Make every pull request prove itself', 'Story 3', 'info', 490],
    ['Teach an AI assistant the method', 'Story 8', 'ok', 725]
  ].flatMap(([a, b, k, x]) => [arrow([[480, 80], [480, 110], [x + 107, 110], [x + 107, 150]]), box(x, 150, 215, 80, { title: a, kind: k, tsize: 13.5 }), arrow([[x + 107, 230], [x + 107, 262]]), box(x, 262, 215, 48, { title: b, kind: 'white', tsize: 15 })])
].join('\n'));

console.log('diagrams written to documents/pramanasutra/diagrams');
