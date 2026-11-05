import fs from 'node:fs';
import path from 'node:path';
import { classifyEvidence } from './evidence.mjs';
import { DEFAULT_POLICY } from './policy.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'venv', 'dist', 'build', 'target', 'coverage', '.next', '.nuxt', '.turbo', '.cache', 'reports', 'pramanasutra-reports', '.idea', '.gradle', 'vendor', 'bin', 'obj']);
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|py|go|rs|rb|php|java|kt|swift|dart|cs|vue|svelte)$/i;
const TEST_PATH = /(?:^|\/)(?:tests?|__tests__|specs?|e2e)(?:\/|$)|(?:\.test\.|\.spec\.|_test\.(?:go|py|rb|dart)|_spec\.rb$|(?:^|\/)test_[^/]*\.py$)/i;
const TEST_NAME = /[a-z0-9](?:Tests?|Spec|IT)\.(?:java|kt|cs|swift|scala|php|dart)$/;
const FOCUSED = /^\s*(?:(?:await\s+)?(?:describe|test|it)\.only\s*\(|(?:fit|fdescribe)\s*\()/;
const SKIPPED = /^\s*(?:(?:await\s+)?(?:describe|test|it)\.(?:skip|todo)\s*\(|(?:xit|xtest|xdescribe)\s*\()/;
const SKIPPED_ALT = /^\s*(?:@pytest\.mark\.(?:skip|xfail)|@unittest\.skip\w*|@Ignore\b|@Disabled\b|(?:\w+\.)?t\.Skip(?:Now)?\s*\(|pytest\.(?:skip|xfail)\s*\(|self\.skipTest\s*\(|raise\s+unittest\.SkipTest\b)/;
const MAX_DEPTH = 22;
const MAX_FILES = 20000;
const MAX_SOURCE_SIZE = 2_000_000;

function toolVersion() {
  try { return JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version; }
  catch { return 'unknown'; }
}

function finding(ruleId, severity, confidence, title, description, evidence, recommendation) {
  return { id: `PS-${ruleId}-${String(evidence.line || 0).padStart(5,'0')}-${String(evidence.path || '').replace(/[^a-z0-9]/gi,'_').slice(-45)}`, ruleId, severity, confidence, title, description, evidence, recommendation, status: 'observed' };
}
function isTestFile(rel) { return TEST_PATH.test(rel) || TEST_NAME.test(rel); }
function loadIgnore(root) {
  const file = path.join(root, '.pramanasutraignore');
  let info;
  try { info = fs.lstatSync(file); } catch { return []; }
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('.pramanasutraignore must be a regular file (not a symlink)');
  if (info.size > 100_000) throw new Error('.pramanasutraignore is too large');
  const rules = [];
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.includes('..') || line.startsWith('/') || line.startsWith('\\') || line.includes('\0')) throw new Error(`Unsafe .pramanasutraignore entry: ${line}`);
    rules.push(line.replace(/\\/g, '/').replace(/^\.\//, ''));
  }
  return rules;
}
function isIgnored(rel, rules) {
  return rules.some((rule) => rule.endsWith('/') ? (rel === rule.slice(0, -1) || rel.startsWith(rule)) : (rel === rule || rel.startsWith(rule + '/')));
}
function existsFile(root, rel) {
  try { return fs.statSync(path.join(root, rel)).isFile(); } catch { return false; }
}

export function scanProject(target) {
  const targetPath = path.resolve(target);
  const info = fs.lstatSync(targetPath);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Scan target must be a real directory (not a symlink)');
  const entries = [];
  const limitations = [];
  let skippedSymlinks = 0;
  let oversizedFiles = 0;
  let binaryFiles = 0;
  let ignoredPaths = 0;
  let truncated = false;
  const ignore = loadIgnore(targetPath);
  const stack = [{ absolute: targetPath, depth: 0 }];
  while (stack.length) {
    const { absolute, depth } = stack.pop();
    if (depth > MAX_DEPTH) { truncated = true; continue; }
    let children;
    try { children = fs.readdirSync(absolute, { withFileTypes: true }); }
    catch (e) { limitations.push(`Unreadable directory: ${path.relative(targetPath, absolute) || '.'} (${e.code || 'error'})`); continue; }
    children.sort((a,b)=>a.name.localeCompare(b.name));
    for (const child of children) {
      const full = path.join(absolute, child.name);
      const rel = path.relative(targetPath, full).split(path.sep).join('/');
      if (isIgnored(rel, ignore)) { ignoredPaths++; continue; }
      if (child.isSymbolicLink()) { skippedSymlinks++; continue; }
      if (child.isDirectory()) {
        if (!SKIP_DIRS.has(child.name)) stack.push({ absolute: full, depth: depth + 1 });
      } else if (child.isFile()) {
        entries.push(path.relative(targetPath, full).split(path.sep).join('/'));
        if (entries.length >= MAX_FILES) { truncated = true; stack.length = 0; break; }
      }
    }
  }
  entries.sort();
  if (skippedSymlinks) limitations.push(`Skipped ${skippedSymlinks} symbolic link(s); they were not followed.`);
  if (truncated) limitations.push('File/depth limit reached; scan is incomplete.');
  const testFiles = entries.filter(isTestFile);
  const findings = [];
  const manifests = entries.filter(p => /(?:^|\/)(?:package\.json|pyproject\.toml|requirements\.txt|pom\.xml|build\.gradle(?:\.kts)?|Cargo\.toml|go\.mod|Gemfile|composer\.json|pubspec\.yaml|[^/]+\.sln|[^/]+\.csproj)$/.test(p));
  const workflows = entries.filter(p => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(p) || /(?:^|\/)(?:\.gitlab-ci\.yml|Jenkinsfile|azure-pipelines\.yml|bitbucket-pipelines\.yml)$/.test(p));
  for (const rel of testFiles) {
    if (!SOURCE_EXT.test(rel)) continue;
    const full=path.join(targetPath,...rel.split('/'));
    let size;
    try { size=fs.statSync(full).size; } catch { continue; }
    if (size > MAX_SOURCE_SIZE) { oversizedFiles++; continue; }
    let lines;
    try {
      const buf = fs.readFileSync(full);
      if (buf.includes(0)) { binaryFiles++; continue; }
      lines = buf.toString('utf8').split(/\r?\n/);
    } catch { continue; }
    for (let i=0; i<lines.length; i++) {
      const line=lines[i];
      // Deliberately small heuristic rule set. Not a language parser.
      if (FOCUSED.test(line)) findings.push(finding('FOCUSED_TEST','high','medium','Focused test found','A focused test declaration may silently omit other tests.',{path:rel,line:i+1},'Remove .only / fit / fdescribe, then execute the full suite.'));
      if (SKIPPED.test(line) || SKIPPED_ALT.test(line)) findings.push(finding('SKIPPED_TEST','low','medium','Skipped test found','A skipped test needs review before release.',{path:rel,line:i+1},'Confirm the skip is intended, tracked and does not conceal a required case.'));
    }
  }
  if (oversizedFiles) limitations.push(`Skipped inspecting ${oversizedFiles} large test file(s) (> ${MAX_SOURCE_SIZE} bytes).`);
  if (binaryFiles) limitations.push(`Skipped inspecting ${binaryFiles} binary test file(s); they contain NUL bytes and were not treated as source.`);
  if (ignoredPaths) limitations.push(`Excluded ${ignoredPaths} path(s) listed in .pramanasutraignore. Excluded content was not inspected.`);
  if (!testFiles.length) findings.push(finding('NO_TESTS','medium','medium','No tests discovered','No test files matched the starter\'s supported path conventions.',{path:'.',line:null},'Confirm test framework location; add and execute relevant tests.'));
  if (!workflows.length) findings.push(finding('NO_CI','medium','medium','No recognized CI workflow discovered','No recognized CI configuration was found in the files scanned.',{path:'.',line:null},'Verify your CI configuration and enforce required test gates.'));
  const license = entries.some(p => /^(?:LICENSE|LICENSE\.md|LICENSE\.txt|COPYING)$/i.test(p));
  if (!license) findings.push(finding('NO_LICENSE','low','high','No license file at root','A recognized open-source license file was not found at the root.',{path:'.',line:null},'Review intended licensing and add the correct LICENSE file before publication.'));
  const output = {
    schemaVersion: '1.0.0', product: 'PramanaSutra AI', toolVersion: toolVersion(), generatedAt: new Date().toISOString(), scannedPath: path.basename(targetPath) || ".",
    capabilities: { staticAudit:'executed', testExecution:'not-run', browser:'not-supported', securityScan:'not-run', performanceTest:'not-run', aiInference:'not-run' },
    inventory: { fileCount:entries.length, testFiles, manifests, ciWorkflows:workflows, skippedSymlinks, oversizedFiles, binaryFiles, ignoredPaths, partial:truncated || oversizedFiles > 0 || binaryFiles > 0 || limitations.some(x=>x.startsWith('Unreadable')) },
    findings, limitations,
    releaseGate: null
  };
  return output;
}

export function evaluateGate(report, evidence = null, policy = DEFAULT_POLICY) {
  const blocking = report.findings.filter(f =>
    ['critical', 'high'].includes(f.severity) ? (f.ruleId !== 'FOCUSED_TEST' || policy.blockOnFocusedTests)
      : (f.ruleId === 'SKIPPED_TEST' && policy.blockOnSkippedTests));
  const ev = classifyEvidence(evidence);
  const reasons = [];
  let decision;
  if (blocking.length) {
    decision = 'NO_GO'; reasons.push(`Found ${blocking.length} blocking static finding(s) under policy "${policy.name}".`);
  } else if (ev.state === 'failing') {
    decision = 'NO_GO'; reasons.push(...ev.reasons);
  } else {
    const missing = [];
    if (policy.releaseRequiresExecutedEvidence && ev.state !== 'passing') missing.push(...ev.reasons);
    if (report.inventory.partial) missing.push('Scan is incomplete; treat uninspected content as unknown.');
    if (policy.requireTests && !report.inventory.testFiles.length) missing.push('No test files detected by supported naming conventions.');
    if (policy.requireCi && !report.inventory.ciWorkflows.length) missing.push('No recognized CI workflow detected.');
    if (policy.requireLicense && report.findings.some(f => f.ruleId === 'NO_LICENSE')) missing.push('No license file at root.');
    if (missing.length) { decision = 'REVIEW_REQUIRED'; reasons.push(...missing); }
    else { decision = 'READY_FOR_HUMAN_APPROVAL'; reasons.push('All policy checks satisfied by supplied evidence and static inspection. A human must still approve and deploy.'); }
  }
  return { decision, policy: policy.name, reasons, requiresHumanApproval: true, executedTestEvidence: ev.state === 'passing' || ev.state === 'failing', evidenceState: ev.state, automatedDeploymentAuthorized: false };
}
