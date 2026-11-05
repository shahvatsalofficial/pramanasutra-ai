// Regenerates docs/proof and examples/sample-output from the real code. Usage: node scripts/generate-proof.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scanProject, evaluateGate } from '../packages/cli/lib/scanner.mjs';
import { loadEvidence } from '../packages/cli/lib/evidence.mjs';
import { writeReports } from '../packages/cli/lib/report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proofDirs = [path.join(root, 'docs', 'proof'), path.join(root, 'documents', 'pramanasutra', 'proof')];
for (const dir of proofDirs) fs.mkdirSync(dir, { recursive: true });

const t = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'tests/cli.test.mjs'], { cwd: root, encoding: 'utf8' });
const header = `# Captured by scripts/generate-proof.mjs\n# node ${process.version} on ${process.platform}/${process.arch} (${os.release()})\n# exit code: ${t.status}\n# This file is the command output. It is not a summary written by hand.\n\n`;
const captured = header + t.stdout + t.stderr;
for (const dir of proofDirs) fs.writeFileSync(path.join(dir, 'test-results.txt'), captured);

// Labeled fixtures: expected rule -> must be found; clean fixture -> zero findings.
const cases = [
  { name: 'clean-project', evidence: 'evidence.json', expectRules: [], expectDecision: 'READY_FOR_HUMAN_APPROVAL' },
  { name: 'focused-test', expectRules: ['FOCUSED_TEST'], expectDecision: 'NO_GO' },
  { name: 'missing-ci', expectRules: ['NO_CI'], expectDecision: 'REVIEW_REQUIRED' },
  { name: 'missing-tests', expectRules: ['NO_TESTS'], expectDecision: 'REVIEW_REQUIRED' },
  { name: 'unsafe-names', expectRules: ['FOCUSED_TEST'], expectDecision: 'NO_GO' },
  { name: 'multi-language', expectRules: ['SKIPPED_TEST', 'SKIPPED_TEST', 'SKIPPED_TEST', 'NO_CI', 'NO_LICENSE'], expectDecision: 'REVIEW_REQUIRED' }
];
const results = [];
let tp = 0, fp = 0, fn = 0;
for (const c of cases) {
  const dir = path.join(root, 'fixtures', c.name);
  const report = scanProject(dir);
  const ev = c.evidence ? loadEvidence(path.join(dir, c.evidence)) : null;
  report.releaseGate = evaluateGate(report, ev);
  if (ev) report.capabilities.testExecution = 'evidence-supplied';
  report.generatedAt = '2026-11-06T00:00:00.000Z'; // pinned so sample output diffs stay reviewable
  for (const dest of [path.join(root, 'examples', 'sample-output', c.name), path.join(root, 'documents', 'pramanasutra', 'samples', c.name)]) writeReports(report, dest);
  const got = report.findings.map(f => f.ruleId).sort();
  const want = [...c.expectRules].sort();
  const remaining = [...got];
  for (const r of want) { const i = remaining.indexOf(r); if (i >= 0) { tp++; remaining.splice(i, 1); } else fn++; }
  fp += remaining.length;
  results.push({ fixture: c.name, expectedRules: want, foundRules: got, decision: report.releaseGate.decision, expectedDecision: c.expectDecision, pass: JSON.stringify(got) === JSON.stringify(want) && report.releaseGate.decision === c.expectDecision });
}
const summary = { generatedBy: 'scripts/generate-proof.mjs', node: process.version, platform: process.platform, labeledFindings: { truePositives: tp, falsePositives: fp, falseNegatives: fn, precision: tp / (tp + fp || 1), recall: tp / (tp + fn || 1) },
  caveat: 'Fixtures were written by the rule author: this is a regression guarantee, not real-world accuracy.', cases: results };
const evalText = JSON.stringify(summary, null, 2) + '\n';
for (const dir of proofDirs) fs.writeFileSync(path.join(dir, 'eval-results.json'), evalText);

function lastCount(label) {
  const re = new RegExp(`(?:ℹ|#)\\s*${label}\\s+(\\d+)`, 'g');
  let found = null;
  for (const match of captured.matchAll(re)) found = Number(match[1]);
  return found;
}
const passed = lastCount('pass');
const failed = lastCount('fail');
const skipped = lastCount('skipped');
let proofOk = true;
if (passed === null || failed === null || t.status === null) {
  console.error('Could not read the test summary. Self-audit was not written.');
  proofOk = false;
} else {
  const self = scanProject(root);
  const evidence = { schemaVersion: '1.0.0', source: 'local-executed', command: 'node --test --test-reporter=spec tests/cli.test.mjs', executedAt: '2026-11-06T00:00:00.000Z', exitCode: t.status, passed, failed, skipped: skipped ?? 0, environment: `${process.platform} ${process.version}` };
  self.releaseGate = evaluateGate(self, evidence);
  self.capabilities.testExecution = 'evidence-supplied';
  self.evidence = evidence;
  self.generatedAt = '2026-11-06T00:00:00.000Z';
  writeReports(self, path.join(root, 'documents', 'pramanasutra', 'audit'));
  console.log(`self-audit gate ${self.releaseGate.decision}; findings ${self.findings.length}; evidence passed=${passed} failed=${failed} skipped=${evidence.skipped}`);
}
console.log(`tests exit ${t.status}; fixtures ${results.filter(r => r.pass).length}/${results.length} as expected; precision ${summary.labeledFindings.precision} recall ${summary.labeledFindings.recall}`);
process.exitCode = !proofOk || t.status || !results.every(r => r.pass) ? 1 : 0;
