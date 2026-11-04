import fs from 'node:fs';
import path from 'node:path';

export const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const escMd = (value) => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').replace(/`/g, '\\`');
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const loc = (f) => `${f.evidence.path}${f.evidence.line ? ':' + f.evidence.line : ''}`;
const sevCounts = (report) => Object.fromEntries(SEVERITIES.map(s => [s, report.findings.filter(f => f.severity === s).length]));
const GATE_TEXT = {
  NO_GO: 'Blocking issue found. Do not release until it is fixed and re-checked.',
  REVIEW_REQUIRED: 'Evidence is missing or incomplete. A human must review before any release decision.',
  READY_FOR_HUMAN_APPROVAL: 'All policy checks passed. A human must still approve; this is never a deploy order.'
};
const NOT_RUN = 'Tests executed by PramanaSutra: NO (static scan only). Executed-test results count only when supplied as evidence.';

export function markdown(report) {
  const gate = report.releaseGate;
  const c = sevCounts(report);
  const L = [];
  L.push('# PramanaSutra AI: QA & Release Audit Report', '');
  L.push(`| | |`, `|---|---|`);
  L.push(`| Project | \`${escMd(report.scannedPath)}\` |`, `| Generated | ${report.generatedAt} |`, `| Tool | PramanaSutra AI (schema ${report.schemaVersion}) |`);
  L.push(`| **Release decision** | **${gate ? gate.decision : 'Not evaluated'}** |`);
  if (gate) L.push(`| Policy | ${escMd(gate.policy)} |`, `| Supplied test evidence | ${gate.evidenceState} |`);
  L.push('');
  if (gate) L.push(`> ${GATE_TEXT[gate.decision]}`, '');
  L.push('## Summary', '', `- Files inspected: ${report.inventory.fileCount}`, `- Test files detected: ${report.inventory.testFiles.length}`, `- CI workflows detected: ${report.inventory.ciWorkflows.length}`, `- Manifests detected: ${report.inventory.manifests.length}`, `- Findings: ${report.findings.length} (${SEVERITIES.map(s => `${s} ${c[s]}`).join(', ')})`, `- ${NOT_RUN}`, '');
  L.push('## Capabilities', '', '| Capability | State |', '|---|---|');
  for (const [k, v] of Object.entries(report.capabilities)) L.push(`| ${escMd(k)} | ${escMd(v)} |`);
  L.push('', '## Findings', '');
  if (!report.findings.length) L.push('No static issues detected. This does **not** mean the project is release-ready; other checks were not run.', '');
  for (const f of report.findings) {
    L.push(`### ${escMd(f.title)}`, '', `- **Rule:** \`${escMd(f.ruleId)}\` | **Severity:** ${f.severity} | **Confidence:** ${f.confidence} | **Status:** ${f.status}`, `- **Where:** \`${escMd(loc(f))}\``, `- **Why it matters:** ${escMd(f.description)}`, `- **Fix:** ${escMd(f.recommendation)}`, '');
  }
  L.push('## Release gate reasons', '');
  for (const r of (gate ? gate.reasons : ['Not requested'])) L.push(`- ${escMd(r)}`);
  L.push('', '## Limitations', '');
  for (const lim of [...report.limitations, 'Heuristic checks do not prove the absence of bugs or release readiness.', 'No target tests, security scanners, browser, load tests or deploy checks were run by this tool.', 'This report is decision support, not a compliance certification.']) L.push(`- ${escMd(lim)}`);
  L.push('', '---', '*Created by Vatsal Shah. Generated locally; nothing was sent over the network.*', '');
  return L.join('\n');
}

const CSS = `:root{--bg:#f6f7fb;--card:#fff;--ink:#0f172a;--mut:#475569;--line:#e2e8f0;--ac:#4f46e5;--ok:#047857;--warn:#b45309;--bad:#b91c1c}
@media(prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#131a2e;--ink:#e6eaf5;--mut:#9aa6c0;--line:#25304d;--ac:#8b93ff;--ok:#34d399;--warn:#fbbf24;--bad:#f87171}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:2rem 1rem 4rem}h1{font-size:1.9rem;margin:.2rem 0}h2{margin-top:2.2rem;font-size:1.25rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.2rem 1.4rem;margin:1rem 0}
.banner{border-left:6px solid var(--ac);font-size:1.05rem}.NO_GO{border-color:var(--bad)}.REVIEW_REQUIRED{border-color:var(--warn)}.READY_FOR_HUMAN_APPROVAL{border-color:var(--ok)}
.pill{display:inline-block;padding:.1rem .65rem;border-radius:999px;font-weight:700;font-size:.85rem;border:1px solid currentColor}
.pill.NO_GO,.pill.critical,.pill.high{color:var(--bad)}.pill.REVIEW_REQUIRED,.pill.medium{color:var(--warn)}.pill.READY_FOR_HUMAN_APPROVAL{color:var(--ok)}.pill.low,.pill.info{color:var(--mut)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.8rem}.stat b{display:block;font-size:1.7rem}.stat span{color:var(--mut);font-size:.9rem}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.55rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--mut);font-size:.85rem}
code{font-family:ui-monospace,Consolas,monospace;background:var(--bg);padding:.05rem .35rem;border-radius:5px;overflow-wrap:anywhere}
.muted{color:var(--mut)}footer{margin-top:3rem;color:var(--mut);font-size:.9rem}a{color:var(--ac)}:focus-visible{outline:3px solid var(--ac);outline-offset:2px}
@media print{body{background:#fff;color:#000}.card{break-inside:avoid}}`;

export function html(report) {
  const gate = report.releaseGate;
  const c = sevCounts(report);
  const e = escapeHtml;
  const cards = report.findings.map(f => `<article class="card"><h3 style="margin:.1rem 0"><span class="pill ${e(f.severity)}">${e(f.severity)}</span> ${e(f.title)}</h3><p class="muted">Rule <code>${e(f.ruleId)}</code> &middot; confidence ${e(f.confidence)} &middot; ${e(f.status)} &middot; <code>${e(loc(f))}</code></p><p>${e(f.description)}</p><p><strong>Fix:</strong> ${e(f.recommendation)}</p></article>`).join('\n');
  const caps = Object.entries(report.capabilities).map(([k, v]) => `<tr><td>${e(k)}</td><td><code>${e(v)}</code></td></tr>`).join('');
  const reasons = (gate ? gate.reasons : ['Not requested']).map(x => `<li>${e(x)}</li>`).join('');
  const lims = [...report.limitations, 'Heuristic checks do not prove the absence of bugs or release readiness.', 'No target tests, security scanners, browser, load tests or deploy checks were run by this tool.', 'This report is decision support, not a compliance certification.'].map(x => `<li>${e(x)}</li>`).join('');
  const stat = (n, label) => `<div class="stat card"><b>${e(n)}</b><span>${e(label)}</span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>PramanaSutra AI QA &amp; Release Audit Report</title><style>${CSS}</style></head><body><main>
<p class="muted">PramanaSutra AI &middot; QA &amp; Release Audit</p><h1>${e(report.scannedPath)}</h1><p class="muted">Generated ${e(report.generatedAt)}</p>
${gate ? `<section class="card banner ${e(gate.decision)}" role="status"><span class="pill ${e(gate.decision)}">${e(gate.decision)}</span><p style="margin:.6rem 0 0">${e(GATE_TEXT[gate.decision])}</p><p class="muted" style="margin:.3rem 0 0">Policy: ${e(gate.policy)} &middot; Supplied test evidence: ${e(gate.evidenceState)}</p></section>` : ''}
<section class="grid" aria-label="Summary">${stat(report.inventory.fileCount, 'files inspected')}${stat(report.inventory.testFiles.length, 'test files')}${stat(report.inventory.ciWorkflows.length, 'CI workflows')}${stat(report.findings.length, 'findings')}${stat(c.critical + c.high, 'critical + high')}</section>
<p class="card"><strong>${e(NOT_RUN)}</strong></p>
<h2>Findings</h2>${cards || '<p class="card">No static issues detected. This does <strong>not</strong> mean the project is release-ready; other checks were not run.</p>'}
<h2>Release gate reasons</h2><div class="card"><ul>${reasons}</ul></div>
<h2>Capabilities</h2><div class="card"><table><thead><tr><th>Capability</th><th>State</th></tr></thead><tbody>${caps}</tbody></table></div>
<h2>Limitations</h2><div class="card"><ul>${lims}</ul></div>
<footer>Created by Vatsal Shah. Generated locally; nothing was sent over the network. Not a compliance certification or release authorization.</footer></main></body></html>`;
}

export function writeReports(report, out) {
  if (!out) return [];
  const target = path.resolve(out);
  fs.mkdirSync(target, { recursive: true });
  const outputs = [['report.md', markdown(report)], ['report.html', html(report)], ['report.json', JSON.stringify(report, null, 2) + '\n']];
  for (const [file, content] of outputs) fs.writeFileSync(path.join(target, file), content, 'utf8');
  return outputs.map(([file]) => path.join(target, file));
}
