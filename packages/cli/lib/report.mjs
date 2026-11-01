import fs from 'node:fs';
import path from 'node:path';

export const escapeHtml = (value) => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function escMd(value) {return String(value).replace(/\|/g,'\\|').replace(/\r?\n/g,' ');}
export function markdown(report) {
  const lines=[`# PramanaSutra AI — ${report.releaseGate ? 'Release Review' : 'Static QA Audit'}`,'',`Generated: ${report.generatedAt}`,'',`Project: \`${report.scannedPath.replace(/`/g,'\\`')}\``,'',`**Release decision:** ${report.releaseGate?.decision || 'Not evaluated'}`,'',`**Tests executed by PramanaSutra:** NO (static scan only). **Supplied evidence:** ${report.releaseGate?.evidenceState || 'n/a'}`,'',`**Files inspected:** ${report.inventory.fileCount}`,'',`**Test files detected:** ${report.inventory.testFiles.length}`,'',`**CI workflows detected:** ${report.inventory.ciWorkflows.length}`,'','## Findings','', '| Severity | Rule | File:line | Finding |','|---|---|---|---|'];
  for (const f of report.findings) lines.push(`| ${escMd(f.severity)} | ${escMd(f.ruleId)} | ${escMd(`${f.evidence.path}:${f.evidence.line ?? '-'}`)} | ${escMd(f.title)} |`);
  if (!report.findings.length) lines.push('| — | — | — | No static issues detected; other checks were not run |');
  lines.push('','## Gate reasons','');
  for (const r of (report.releaseGate?.reasons || ['Not requested'])) lines.push(`- ${r}`);
  lines.push('','## Limitations','');
  for (const lim of [...report.limitations,'Heuristic checks do not prove absence of bugs or release readiness.','No target tests, security scanners, browser, load tests or deploy checks were run.']) lines.push(`- ${lim}`);
  lines.push(''); return lines.join('\n');
}
export function html(report) {
  const cell=(v)=>`<td>${escapeHtml(v)}</td>`;
  const rows=report.findings.map(f=>`<tr>${cell(f.severity)}${cell(f.ruleId)}${cell(`${f.evidence.path}:${f.evidence.line ?? '-'}`)}${cell(f.title)}${cell(f.recommendation)}</tr>`).join('\n');
  const reasons=(report.releaseGate?.reasons || ['Not requested']).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  const limitations=[...report.limitations,'Static heuristics are not executed tests.'].map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PramanaSutra AI QA Report</title><style>body{font:16px/1.6 system-ui,Arial,sans-serif;margin:auto;padding:2rem;max-width:1100px;color:#1e293b}h1{color:#172554}table{border-collapse:collapse;width:100%}th,td{padding:.7rem;border-bottom:1px solid #cbd5e1;text-align:left;vertical-align:top}th{background:#eef2ff}code{overflow-wrap:anywhere}.muted{color:#64748b}</style></head><body><h1>PramanaSutra AI — QA Audit</h1><p class="muted">Created by Vatsal Shah • ${escapeHtml(report.generatedAt)}</p><p>Project: <code>${escapeHtml(report.scannedPath)}</code></p><h2>Gate: ${escapeHtml(report.releaseGate?.decision || 'Not evaluated')}</h2><p><strong>Tests executed by PramanaSutra: NO. Supplied evidence: ${escapeHtml(report.releaseGate?.evidenceState || 'n/a')}.</strong> Files inspected: ${report.inventory.fileCount}. Test files detected: ${report.inventory.testFiles.length}.</p><h2>Findings</h2><table><thead><tr><th>Severity</th><th>Rule</th><th>File:line</th><th>Finding</th><th>Recommendation</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No matching static findings; this does not indicate release approval.</td></tr>'}</tbody></table><h2>Gate reasons</h2><ul>${reasons}</ul><h2>Limitations</h2><ul>${limitations}</ul><p>Generated from local heuristics; not a compliance certification or release authorization.</p></body></html>`;
}
export function writeReports(report, out) {
  if (!out) return [];
  const target=path.resolve(out);
  fs.mkdirSync(target,{recursive:true});
  const outputs=[['report.json',JSON.stringify(report,null,2)+'\n'],['report.md',markdown(report)],['report.html',html(report)]];
  for(const [file,content] of outputs) fs.writeFileSync(path.join(target,file),content,'utf8');
  return outputs.map(([file])=>path.join(target,file));
}
