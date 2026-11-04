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
const proof = path.join(root, 'docs', 'proof');
fs.mkdirSync(proof, { recursive: true });

const t = spawnSync(process.execPath, ['--test', 'tests/cli.test.mjs'], { cwd: root, encoding: 'utf8' });
const header = `# Captured by scripts/generate-proof.mjs\n# node ${process.version} on ${process.platform}/${process.arch} (${os.release()})\n# exit code: ${t.status}\n\n`;
fs.writeFileSync(path.join(proof, 'test-results.txt'), header + t.stdout + t.stderr);

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
  report.generatedAt = '2026-11-01T00:00:00.000Z'; // fixed so sample output is reproducible
  writeReports(report, path.join(root, 'examples', 'sample-output', c.name));
  const got = report.findings.map(f => f.ruleId).sort();
  const want = [...c.expectRules].sort();
  const remaining = [...got];
  for (const r of want) { const i = remaining.indexOf(r); if (i >= 0) { tp++; remaining.splice(i, 1); } else fn++; }
  fp += remaining.length;
  results.push({ fixture: c.name, expectedRules: want, foundRules: got, decision: report.releaseGate.decision, expectedDecision: c.expectDecision, pass: JSON.stringify(got) === JSON.stringify(want) && report.releaseGate.decision === c.expectDecision });
}
const summary = { generatedBy: 'scripts/generate-proof.mjs', node: process.version, platform: process.platform, labeledFindings: { truePositives: tp, falsePositives: fp, falseNegatives: fn, precision: tp / (tp + fp || 1), recall: tp / (tp + fn || 1) },
  caveat: 'Fixtures were written by the rule author: this is a regression guarantee, not real-world accuracy.', cases: results };
fs.writeFileSync(path.join(proof, 'eval-results.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`tests exit ${t.status}; fixtures ${results.filter(r => r.pass).length}/${results.length} as expected; precision ${summary.labeledFindings.precision} recall ${summary.labeledFindings.recall}`);
process.exitCode = t.status || (results.every(r => r.pass) ? 0 : 1);
