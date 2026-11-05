import fs from 'node:fs';
import path from 'node:path';

export const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const escMd = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').replace(/`/g, '\\`');
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const loc = (f) => `${f.evidence.path}${f.evidence.line ? ':' + f.evidence.line : ''}`;
const sevCounts = (report) => Object.fromEntries(SEVERITIES.map(s => [s, report.findings.filter(f => f.severity === s).length]));
const GATE_TEXT = {
  NO_GO: 'Blocking issue found. Do not release until it is fixed and re-checked.',
  REVIEW_REQUIRED: 'Evidence is missing or incomplete. A human must review before any release decision.',
  READY_FOR_HUMAN_APPROVAL: 'All policy checks passed. A human must still approve; this is never a deploy order.'
};
const NOT_RUN = 'Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.';
const LIMITS = [
  'Heuristic checks do not prove the absence of bugs or release readiness.',
  'No target tests, security scanners, browser, load tests or deploy checks were run by this tool.',
  'This report is decision support, not a compliance certification or legal advice.'
];

function listOrNote(items, empty) {
  if (!items.length) return [empty, ''];
  const shown = items.slice(0, 40).map(x => `- \`${escMd(x)}\``);
  if (items.length > 40) shown.push(`- … ${items.length - 40} more not listed.`);
  return [...shown, ''];
}

export function markdown(report) {
  const gate = report.releaseGate;
  const c = sevCounts(report);
  const ev = report.evidence || null;
  const L = [];
  L.push('# PramanaSutra AI: QA & Release Audit Report', '');
  L.push('This audit is three files with the same facts: **report.md** (this file), **report.html** (open in a browser) and **report.json** (for CI). A static finding is text the scanner saw. It is not a test PramanaSutra ran.', '');
  L.push('| | |', '|---|---|');
  L.push(`| Project | \`${escMd(report.scannedPath)}\` |`);
  L.push(`| Generated | ${escMd(report.generatedAt)} |`);
  L.push(`| Tool | PramanaSutra AI ${escMd(report.toolVersion || '')} (schema ${escMd(report.schemaVersion)}) |`);
  L.push(`| **Release decision** | **${gate ? gate.decision : 'Not evaluated'}** |`);
  if (gate) L.push(`| Policy | ${escMd(gate.policy)} |`, `| Supplied test evidence | ${escMd(gate.evidenceState)} |`);
  L.push('');
  if (gate) L.push(`> **${gate.decision}.** ${GATE_TEXT[gate.decision]}`, '');
  L.push('## Summary', '', `- Files inspected: ${report.inventory.fileCount}`, `- Test files detected: ${report.inventory.testFiles.length}`, `- CI workflows detected: ${report.inventory.ciWorkflows.length}`, `- Manifests detected: ${report.inventory.manifests.length}`, `- Findings: ${report.findings.length} (${SEVERITIES.map(s => `${s} ${c[s]}`).join(', ')})`, `- ${NOT_RUN}`, '');
  L.push('## Supplied test evidence', '');
  if (!ev) {
    L.push('No evidence file was supplied. Counts below are not test results. The release gate cannot treat the suite as passed.', '');
  } else {
    L.push('These numbers come from the evidence file the operator supplied. PramanaSutra did not run that command.', '');
    L.push('| Field | Value |', '|---|---|');
    L.push(`| Source | \`${escMd(ev.source)}\` |`);
    L.push(`| Command | \`${escMd(ev.command)}\` |`);
    L.push(`| Executed at | ${escMd(ev.executedAt)} |`);
    L.push(`| Exit code | ${escMd(ev.exitCode)} |`);
    L.push(`| Passed | ${escMd(ev.passed)} |`);
    L.push(`| Failed | ${escMd(ev.failed)} |`);
    L.push(`| Skipped | ${escMd(ev.skipped ?? 0)} |`);
    if (ev.environment) L.push(`| Environment | ${escMd(ev.environment)} |`);
    if (ev.commit) L.push(`| Commit | \`${escMd(ev.commit)}\` |`);
    L.push('');
  }
  L.push('## Findings at a glance', '');
  if (!report.findings.length) L.push('No static issues detected. This does **not** mean the project is release-ready; other checks were not run.', '');
  else {
    L.push('| Severity | Rule | Where | Fix |', '|---|---|---|---|');
    for (const f of report.findings) L.push(`| ${f.severity} | \`${escMd(f.ruleId)}\` | \`${escMd(loc(f))}\` | ${escMd(f.recommendation)} |`);
    L.push('');
  }
  L.push('## Findings', '');
  if (!report.findings.length) L.push('None.', '');
  for (const f of report.findings) {
    L.push(`### ${escMd(f.title)}`, '', `- **Rule:** \`${escMd(f.ruleId)}\` | **Severity:** ${f.severity} | **Confidence:** ${f.confidence} | **Status:** ${f.status}`, `- **Where:** \`${escMd(loc(f))}\``, `- **Why it matters:** ${escMd(f.description)}`, `- **Fix:** ${escMd(f.recommendation)}`, '');
  }
  L.push('## Test files seen', '');
  L.push(...listOrNote(report.inventory.testFiles, 'None. Either there are no tests, or they use a naming convention this scanner does not recognise.'));
  L.push('## CI workflows seen', '');
  L.push(...listOrNote(report.inventory.ciWorkflows, 'None recognised (GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, Bitbucket Pipelines).'));
  L.push('## Capabilities', '', '| Capability | State | What that means |', '|---|---|---|');
  const capHelp = {
    staticAudit: 'Source text was inspected with heuristic rules.',
    testExecution: 'not-run means this tool did not execute tests. evidence-supplied means an evidence file was attached.',
    browser: 'No browser was launched.',
    securityScan: 'This is not a vulnerability scanner.',
    performanceTest: 'No load or timing test was run.',
    aiInference: 'The CLI did not call a model.'
  };
  for (const [k, v] of Object.entries(report.capabilities)) L.push(`| ${escMd(k)} | ${escMd(v)} | ${escMd(capHelp[k] || '')} |`);
  L.push('', '## Release gate reasons', '');
  for (const r of (gate ? gate.reasons : ['Not requested'])) L.push(`- ${escMd(r)}`);
  L.push('', '## Limitations', '');
  for (const lim of [...report.limitations, ...LIMITS]) L.push(`- ${escMd(lim)}`);
  L.push('', '---', '*Created by Vatsal Shah. Generated locally; nothing was sent over the network. Same audit: report.html and report.json.*', '');
  return L.join('\n');
}

const CSS = `:root{--bg:#f4f1ea;--card:#fffcf7;--ink:#1c1915;--mut:#5c564c;--line:#e4ddd0;--ac:#0f3d3e;--ok:#166534;--warn:#92400e;--bad:#991b1b}
@media(prefers-color-scheme:dark){:root{--bg:#121410;--card:#1c1f1a;--ink:#f3efe6;--mut:#c4bbaa;--line:#34382f;--ac:#8ec9c4;--ok:#86efac;--warn:#fbbf24;--bad:#fca5a5}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:980px;margin:0 auto;padding:1.5rem 1rem 4rem}h1{font-size:clamp(1.6rem,3vw,2.1rem);line-height:1.2;margin:.2rem 0 .4rem}h2{margin-top:2.2rem;font-size:1.25rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.1rem 1.25rem;margin:1rem 0}
.banner{border-left:6px solid var(--ac)}.NO_GO{border-color:var(--bad)}.REVIEW_REQUIRED{border-color:var(--warn)}.READY_FOR_HUMAN_APPROVAL{border-color:var(--ok)}
.pill{display:inline-block;padding:.12rem .7rem;border-radius:999px;font-weight:700;font-size:.85rem;border:1px solid currentColor}
.pill.NO_GO,.pill.critical,.pill.high{color:var(--bad)}.pill.REVIEW_REQUIRED,.pill.medium{color:var(--warn)}.pill.READY_FOR_HUMAN_APPROVAL{color:var(--ok)}.pill.low,.pill.info{color:var(--mut)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem}.stat b{display:block;font-size:1.6rem;line-height:1.2}.stat span{color:var(--mut);font-size:.88rem}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.5rem .55rem;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--mut);font-size:.8rem;letter-spacing:.03em}
code{font-family:ui-monospace,Consolas,monospace;background:var(--bg);padding:.05rem .35rem;border-radius:5px;overflow-wrap:anywhere}
.muted{color:var(--mut)}footer{margin-top:2.5rem;color:var(--mut);font-size:.9rem}a{color:var(--ac)}:focus-visible{outline:3px solid var(--ac);outline-offset:2px}
.skip{position:absolute;left:-999px;top:.4rem;background:var(--ac);color:#fff;padding:.4rem .7rem;z-index:2}.skip:focus{left:.4rem}
@media(prefers-color-scheme:dark){.skip{color:#10201f}}
@media print{body{background:#fff;color:#000}.card{break-inside:avoid}.skip{display:none}}
@media(max-width:640px){body{font-size:16px}}`;

export function html(report) {
  const gate = report.releaseGate;
  const c = sevCounts(report);
  const e = escapeHtml;
  const ev = report.evidence || null;
  const row = (cells) => `<tr>${cells.map(x => `<td>${x}</td>`).join('')}</tr>`;
  const glance = report.findings.map(f => row([`<span class="pill ${e(f.severity)}">${e(f.severity)}</span>`, `<code>${e(f.ruleId)}</code>`, `<code>${e(loc(f))}</code>`, e(f.recommendation)])).join('');
  const cards = report.findings.map(f => `<article class="card"><h3 style="margin:.1rem 0"><span class="pill ${e(f.severity)}">${e(f.severity)}</span> ${e(f.title)}</h3><p class="muted">Rule <code>${e(f.ruleId)}</code> &middot; confidence ${e(f.confidence)} &middot; ${e(f.status)} &middot; <code>${e(loc(f))}</code></p><p><strong>Why it matters:</strong> ${e(f.description)}</p><p><strong>Fix:</strong> ${e(f.recommendation)}</p></article>`).join('\n');
  const capHelp = {
    staticAudit: 'Source text was inspected with heuristic rules.',
    testExecution: 'not-run means this tool did not execute tests. evidence-supplied means an evidence file was attached.',
    browser: 'No browser was launched.',
    securityScan: 'This is not a vulnerability scanner.',
    performanceTest: 'No load or timing test was run.',
    aiInference: 'The CLI did not call a model.'
  };
  const caps = Object.entries(report.capabilities).map(([k, v]) => `<tr><th scope="row">${e(k)}</th><td><code>${e(v)}</code></td><td>${e(capHelp[k] || '')}</td></tr>`).join('');
  const reasons = (gate ? gate.reasons : ['Not requested']).map(x => `<li>${e(x)}</li>`).join('');
  const lims = [...report.limitations, ...LIMITS].map(x => `<li>${e(x)}</li>`).join('');
  const stat = (n, label) => `<div class="stat card"><b>${e(n)}</b><span>${e(label)}</span></div>`;
  const fileList = (items, empty) => items.length ? `<ul>${items.slice(0, 40).map(x => `<li><code>${e(x)}</code></li>`).join('')}${items.length > 40 ? `<li>… ${e(items.length - 40)} more not listed.</li>` : ''}</ul>` : `<p>${e(empty)}</p>`;
  const evidence = !ev
    ? '<p>No evidence file was supplied. Counts on this page are not test results. The release gate cannot treat the suite as passed.</p>'
    : `<p>These numbers come from the evidence file the operator supplied. PramanaSutra did not run that command.</p><table><tbody>
<tr><th scope="row">Source</th><td><code>${e(ev.source)}</code></td></tr>
<tr><th scope="row">Command</th><td><code>${e(ev.command)}</code></td></tr>
<tr><th scope="row">Executed at</th><td>${e(ev.executedAt)}</td></tr>
<tr><th scope="row">Exit code</th><td>${e(ev.exitCode)}</td></tr>
<tr><th scope="row">Passed</th><td>${e(ev.passed)}</td></tr>
<tr><th scope="row">Failed</th><td>${e(ev.failed)}</td></tr>
<tr><th scope="row">Skipped</th><td>${e(ev.skipped ?? 0)}</td></tr>
${ev.environment ? `<tr><th scope="row">Environment</th><td>${e(ev.environment)}</td></tr>` : ''}
${ev.commit ? `<tr><th scope="row">Commit</th><td><code>${e(ev.commit)}</code></td></tr>` : ''}
</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="PramanaSutra AI QA and release audit report. Decision support, not a certification."><title>PramanaSutra AI QA &amp; Release Audit Report</title><style>${CSS}</style></head><body><a class="skip" href="#content">Skip to content</a><main id="content">
<p class="muted">PramanaSutra AI &middot; QA &amp; Release Audit &middot; Markdown, HTML and JSON are the same audit</p><h1>${e(report.scannedPath)}</h1><p class="muted">Generated ${e(report.generatedAt)} &middot; schema ${e(report.schemaVersion)} &middot; tool ${e(report.toolVersion || '')}</p>
${gate ? `<section class="card banner ${e(gate.decision)}" role="status"><p class="muted" style="margin:0">Release decision</p><p style="margin:.35rem 0"><span class="pill ${e(gate.decision)}">${e(gate.decision)}</span></p><p style="margin:.4rem 0 0">${e(GATE_TEXT[gate.decision])}</p><p class="muted" style="margin:.35rem 0 0">Policy: ${e(gate.policy)} &middot; Supplied test evidence: ${e(gate.evidenceState)}</p></section>` : '<p class="card">Release decision: not evaluated. This was a scan without a gate.</p>'}
<section class="grid" aria-label="Summary">${stat(report.inventory.fileCount, 'files inspected')}${stat(report.inventory.testFiles.length, 'test files')}${stat(report.inventory.ciWorkflows.length, 'CI workflows')}${stat(report.findings.length, 'findings')}${stat(c.critical + c.high, 'critical + high')}</section>
<p class="card"><strong>${e(NOT_RUN)}</strong></p>
<h2>Supplied test evidence</h2><div class="card">${evidence}</div>
<h2>Findings at a glance</h2>${report.findings.length ? `<div class="card" style="overflow-x:auto"><table><thead><tr><th>Severity</th><th>Rule</th><th>Where</th><th>Fix</th></tr></thead><tbody>${glance}</tbody></table></div>` : '<p class="card">No static issues detected. This does <strong>not</strong> mean the project is release-ready; other checks were not run.</p>'}
<h2>Findings</h2>${cards || '<p class="card">None.</p>'}
<h2>Test files seen</h2><div class="card">${fileList(report.inventory.testFiles, 'None. Either there are no tests, or they use a naming convention this scanner does not recognise.')}</div>
<h2>CI workflows seen</h2><div class="card">${fileList(report.inventory.ciWorkflows, 'None recognised (GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, Bitbucket Pipelines).')}</div>
<h2>Release gate reasons</h2><div class="card"><ul>${reasons}</ul></div>
<h2>Capabilities</h2><div class="card" style="overflow-x:auto"><table><thead><tr><th>Capability</th><th>State</th><th>What that means</th></tr></thead><tbody>${caps}</tbody></table></div>
<h2>Limitations</h2><div class="card"><ul>${lims}</ul></div>
<footer>Created by Vatsal Shah. Generated locally; nothing was sent over the network. Not a compliance certification, a security test, or a release authorization. Open <code>report.md</code> for the same audit in Markdown.</footer></main></body></html>`;
}

export function writeReports(report, out) {
  if (!out) return [];
  const target = path.resolve(out);
  fs.mkdirSync(target, { recursive: true });
  const outputs = [['report.md', markdown(report)], ['report.html', html(report)], ['report.json', JSON.stringify(report, null, 2) + '\n']];
  for (const [file, content] of outputs) fs.writeFileSync(path.join(target, file), content, 'utf8');
  return outputs.map(([file]) => path.join(target, file));
}
