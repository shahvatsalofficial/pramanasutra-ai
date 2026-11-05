// Runs the real unit tests, writes an evidence file from that output, then release-checks this repo.
// Exit code is the release-check code: 0 ready for a human, 2 NO_GO, 3 review, 1 error.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const test = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'tests/cli.test.mjs'], { cwd: root, encoding: 'utf8' });
process.stdout.write(test.stdout || '');
process.stderr.write(test.stderr || '');
const text = `${test.stdout || ''}\n${test.stderr || ''}`;

function lastCount(label) {
  const re = new RegExp(`(?:ℹ|#)\\s*${label}\\s+(\\d+)`, 'g');
  let found = null;
  for (const match of text.matchAll(re)) found = Number(match[1]);
  return found;
}

const passed = lastCount('pass');
const failed = lastCount('fail');
const skipped = lastCount('skipped');
if (passed === null || failed === null || test.status === null) {
  console.error('Could not read the node --test summary. Refusing to invent evidence.');
  process.exitCode = 1;
} else {
  const evidence = {
    schemaVersion: '1.0.0',
    source: 'ci-ingested',
    command: 'node --test --test-reporter=spec tests/cli.test.mjs',
    executedAt: new Date().toISOString(),
    exitCode: test.status,
    passed,
    failed,
    skipped: skipped ?? 0,
    environment: `${process.platform} ${os.release()} ${process.version}`
  };
  const evPath = path.join(os.tmpdir(), `pramanasutra-ci-evidence-${process.pid}.json`);
  fs.writeFileSync(evPath, JSON.stringify(evidence));
  const gate = spawnSync(process.execPath, [
    path.join(root, 'packages', 'cli', 'bin', 'pramanasutra.mjs'),
    'release-check', '--path', root, '--evidence', evPath, '--out', path.join(root, 'reports', 'ci')
  ], { cwd: root, encoding: 'utf8' });
  process.stdout.write(gate.stdout || '');
  process.stderr.write(gate.stderr || '');
  console.log(`Evidence used by the gate: passed=${passed} failed=${failed} skipped=${evidence.skipped} exit=${test.status}`);
  process.exitCode = gate.status === null ? 1 : gate.status;
}
