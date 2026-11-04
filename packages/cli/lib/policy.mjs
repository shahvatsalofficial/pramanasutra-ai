import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_POLICY = Object.freeze({
  name: 'recommended', releaseRequiresExecutedEvidence: true, blockOnFocusedTests: true,
  blockOnSkippedTests: false, requireCi: true, requireLicense: true, requireTests: true
});
const BOOLEAN_KEYS = ['releaseRequiresExecutedEvidence', 'blockOnFocusedTests', 'blockOnSkippedTests', 'requireCi', 'requireLicense', 'requireTests'];
// Keys that exist for documentation/forward-compat. Their value is only accepted if safe.
const FIXED_KEYS = { schemaVersion: '1.0.0', allowAutomatedDeployment: false, manualApprovalsRequired: true };
const MAX_POLICY_BYTES = 100_000;

/** Fail-closed policy loader: unknown keys, wrong types, symlinks and unsafe values are rejected. */
export function loadPolicy(file) {
  if (!file) return { ...DEFAULT_POLICY };
  const resolved = path.resolve(file);
  const info = fs.lstatSync(resolved);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('--policy must be a regular file (not a symlink)');
  if (info.size > MAX_POLICY_BYTES) throw new Error('Policy file is too large');
  let data;
  try { data = JSON.parse(fs.readFileSync(resolved, 'utf8')); } catch (e) { throw new Error(`Policy is not valid JSON: ${e.message}`); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Policy must be a JSON object');
  const errors = [];
  const policy = { ...DEFAULT_POLICY };
  for (const [key, value] of Object.entries(data)) {
    if (key === 'name') { if (typeof value === 'string' && value.length <= 80) policy.name = value; else errors.push('name must be a string up to 80 chars'); }
    else if (BOOLEAN_KEYS.includes(key)) { if (typeof value === 'boolean') policy[key] = value; else errors.push(`${key} must be a boolean`); }
    else if (key in FIXED_KEYS) { if (value !== FIXED_KEYS[key]) errors.push(`${key} must be ${JSON.stringify(FIXED_KEYS[key])} (cannot be weakened)`); }
    else errors.push(`unknown key: ${key}`);
  }
  if (errors.length) throw new Error(`Invalid policy: ${errors.join('; ')}`);
  return policy;
}
