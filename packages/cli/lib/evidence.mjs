import fs from 'node:fs';
import path from 'node:path';

const SOURCES = new Set(['local-executed', 'ci-ingested', 'external-unverified']);
const MAX_EVIDENCE_BYTES = 1_000_000;
const count = (v) => Number.isInteger(v) && v >= 0;

export function loadEvidence(file) {
  const resolved = path.resolve(file);
  const info = fs.lstatSync(resolved);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('--evidence must be a regular file (not a symlink)');
  if (info.size > MAX_EVIDENCE_BYTES) throw new Error(`Evidence file exceeds ${MAX_EVIDENCE_BYTES} bytes`);
  let data;
  try { data = JSON.parse(fs.readFileSync(resolved, 'utf8')); }
  catch (e) { throw new Error(`Evidence is not valid JSON: ${e.message}`); }
  return validateEvidence(data);
}

export function validateEvidence(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Evidence must be a JSON object');
  if (data.schemaVersion !== '1.0.0') errors.push('schemaVersion must be "1.0.0"');
  if (!SOURCES.has(data.source)) errors.push(`source must be one of: ${[...SOURCES].join(', ')}`);
  if (typeof data.command !== 'string' || !data.command.trim()) errors.push('command must be a non-empty string');
  if (typeof data.executedAt !== 'string' || Number.isNaN(Date.parse(data.executedAt))) errors.push('executedAt must be an ISO-8601 timestamp');
  if (!Number.isInteger(data.exitCode)) errors.push('exitCode must be an integer');
  if (!count(data.passed)) errors.push('passed must be a non-negative integer');
  if (!count(data.failed)) errors.push('failed must be a non-negative integer');
  if (data.skipped !== undefined && !count(data.skipped)) errors.push('skipped must be a non-negative integer when present');
  if (errors.length) throw new Error(`Invalid evidence: ${errors.join('; ')}`);
  return {
    schemaVersion: data.schemaVersion, source: data.source, command: data.command, executedAt: data.executedAt,
    exitCode: data.exitCode, passed: data.passed, failed: data.failed, skipped: data.skipped ?? 0,
    environment: typeof data.environment === 'string' ? data.environment : null,
    commit: typeof data.commit === 'string' ? data.commit : null
  };
}

/** Summarize evidence for the gate. Only `local-executed` and `ci-ingested` evidence can count as verified. */
export function classifyEvidence(evidence) {
  if (!evidence) return { state: 'absent', reasons: ['No executed-test evidence supplied (use --evidence).'] };
  if (evidence.failed > 0 || evidence.exitCode !== 0) return { state: 'failing', reasons: [`Supplied test evidence reports ${evidence.failed} failure(s), exit code ${evidence.exitCode}.`] };
  if (evidence.passed === 0) return { state: 'inconclusive', reasons: ['Supplied evidence reports zero passed tests.'] };
  if (evidence.source === 'external-unverified') return { state: 'unverified', reasons: ['Evidence source is external-unverified; provenance is not established.'] };
  return { state: 'passing', reasons: [] };
}
