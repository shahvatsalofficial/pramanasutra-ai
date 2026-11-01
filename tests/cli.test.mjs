import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scanProject, evaluateGate } from '../packages/cli/lib/scanner.mjs';
import { escapeHtml, html } from '../packages/cli/lib/report.mjs';
import { installSkills, listAgents } from '../packages/cli/lib/installer.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(root,'packages','cli','bin','pramanasutra.mjs');
const temp=(callback)=>{const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pramanasutra-test-'));try{return callback(folder)}finally{fs.rmSync(folder,{recursive:true,force:true})}};
const run=(args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
const put=(base,rel,content)=>{const dest=path.join(base,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);};

test('doctor succeeds without a provider key',()=>{
  const res=run(['doctor','--json']);assert.equal(res.status,0,res.stderr);
  const d=JSON.parse(res.stdout);assert.equal(d.aiInference,false);assert.equal(d.offline,true);
});
test('agents catalog includes Prime and 16 specialists',()=>{
  const skills=listAgents();assert.equal(skills.length,17);
  assert.ok(skills.includes('pramanasutra-prime'));
  for(const name of skills) {const content=fs.readFileSync(path.join(root,'.agents','skills',name,'SKILL.md'),'utf8');assert.match(content,new RegExp(`name: ${name}`));assert.match(content,/description:/);}
});
test('focused test is high-severity blocker with exact evidence',()=>temp(folder=>{
  put(folder,'tests/alpha.test.js','test.only("focused", () => {});\n');
  const report=scanProject(folder);assert.equal(report.findings[0].ruleId,'FOCUSED_TEST');assert.equal(report.findings[0].evidence.line,1);
  assert.equal(evaluateGate(report).decision,'NO_GO');
}));
test('skipped test is reported and not disguised as executed test',()=>temp(folder=>{
  put(folder,'tests/alpha.test.js','it.skip("pending", () => {});\n');
  const report=scanProject(folder);assert.ok(report.findings.some(x=>x.ruleId==='SKIPPED_TEST'));
  assert.equal(report.capabilities.testExecution,'not-run');
}));
test('no tests, CI or license produce transparent warnings',()=>temp(folder=>{
  put(folder,'package.json','{"name":"example"}');
  const report=scanProject(folder);const rules=report.findings.map(x=>x.ruleId);
  assert.ok(rules.includes('NO_TESTS') && rules.includes('NO_CI') && rules.includes('NO_LICENSE'));
  assert.equal(evaluateGate(report).decision,'REVIEW_REQUIRED');
}));
test('clean static project still requires review without test run',()=>temp(folder=>{
  put(folder,'tests/sum.test.js','test("sum", () => {});');
  put(folder,'.github/workflows/ci.yml','name: CI\n');
  put(folder,'LICENSE','example');
  const report=scanProject(folder);assert.equal(report.findings.length,0);assert.equal(evaluateGate(report).decision,'REVIEW_REQUIRED');
}));
test('report HTML escapes untrusted strings',()=>temp(folder=>{
  put(folder,'tests/sum.test.js','test.only("sum", () => {});');
  const report=scanProject(folder);report.findings[0].title='<script>alert("x")</script>';
  const content=html(report);assert.ok(content.includes('&lt;script&gt;'));assert.ok(!content.includes('<script>alert'));
  assert.equal(escapeHtml('a&<b>'), 'a&amp;&lt;b&gt;');
}));
test('scan command creates three reports without executing tests',()=>temp(folder=>{
  put(folder,'tests/sample.test.js','test.only("x", () => {});');
  const out=path.join(folder,'out');
  const res=run(['scan','--path',folder,'--out',out]);assert.equal(res.status,0,res.stderr);
  for(const ext of ['json','md','html'])assert.ok(fs.existsSync(path.join(out,`report.${ext}`)));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')).capabilities.testExecution,'not-run');
}));
test('release-check exit code signals NO_GO',()=>temp(folder=>{
  put(folder,'tests/sample.test.js','test.only("x", () => {});');
  const res=run(['release-check','--path',folder]);assert.equal(res.status,2);
}));
test('release-check exit code signals REVIEW_REQUIRED',()=>temp(folder=>{
  put(folder,'tests/sample.test.js','test("x", () => {});');
  put(folder,'.github/workflows/ci.yml','name: CI');put(folder,'LICENSE','MIT');
  const res=run(['release-check','--path',folder]);assert.equal(res.status,3);
}));
test('installer copies canonical skills into Claude target and prevents overwrite',()=>temp(folder=>{
  const a=installSkills({ide:'claude',target:folder});assert.equal(a.count,17);
  assert.ok(fs.existsSync(path.join(folder,'.claude/skills/pramanasutra-prime/SKILL.md')));
  assert.throws(()=>installSkills({ide:'claude',target:folder}),/Skill already exists/);
}));
test('installer refuses a target file or missing directory',()=>temp(folder=>{
  const file=path.join(folder,'file.txt');fs.writeFileSync(file,'x');
  assert.throws(()=>installSkills({ide:'cursor',target:file}),/existing real directory/);
  assert.throws(()=>installSkills({ide:'cursor',target:path.join(folder,'missing')}),/existing real directory/);
}));
test('unknown options or missing values fail clearly',()=>{
  assert.equal(run(['scan','--path']).status,1);
  assert.equal(run(['scan','--unknown']).status,1);
});
test('nested symlink is skipped rather than followed',t=>temp(folder=>{
  const outside=fs.mkdtempSync(path.join(os.tmpdir(),'ps-outside-'));
  try {
    put(outside,'outside.test.js','test.only("danger",()=>{});');
    try{fs.symlinkSync(outside,path.join(folder,'outsidelink'),'dir');}
    catch {t.skip('Symlink creation prohibited by OS permissions');return;}
    const report=scanProject(folder);assert.equal(report.inventory.skippedSymlinks,1);
    assert.ok(!report.findings.some(x=>x.ruleId==='FOCUSED_TEST'));
  } finally {fs.rmSync(outside,{recursive:true,force:true});}
}));
test('heuristic avoids matches embedded in fixture strings',()=>temp(folder=>{
  put(folder,'tests/fixture.test.js',`const fixture = 'test.only("not a real focused declaration")';\ntest("real", () => {});\n`);
  const report=scanProject(folder);
  assert.equal(report.findings.some(x=>x.ruleId==='FOCUSED_TEST'),false);
}));

test('reports do not disclose absolute target paths by default',()=>temp(folder=>{
  put(folder,'tests/sample.test.js','test("safe", () => {});');
  const report=scanProject(folder);
  assert.equal(report.scannedPath,path.basename(folder));
  assert.notEqual(report.scannedPath,folder);
}));

const evidenceDoc=(over={})=>JSON.stringify({schemaVersion:'1.0.0',source:'ci-ingested',command:'npm test',executedAt:'2026-11-01T10:00:00Z',exitCode:0,passed:12,failed:0,...over});
const cleanProject=(folder)=>{put(folder,'tests/sum.test.js','test("sum", () => {});');put(folder,'.github/workflows/ci.yml','name: CI\n');put(folder,'LICENSE','MIT');};

test('passing CI evidence on clean project reaches READY_FOR_HUMAN_APPROVAL (exit 0)',()=>temp(folder=>{
  cleanProject(folder);put(folder,'ev.json',evidenceDoc());
  const res=run(['release-check','--path',folder,'--evidence',path.join(folder,'ev.json'),'--json']);
  assert.equal(res.status,0,res.stderr);
  const gate=JSON.parse(res.stdout).releaseGate;
  assert.equal(gate.decision,'READY_FOR_HUMAN_APPROVAL');assert.equal(gate.automatedDeploymentAuthorized,false);assert.equal(gate.requiresHumanApproval,true);
}));
test('failing evidence yields NO_GO',()=>temp(folder=>{
  cleanProject(folder);put(folder,'ev.json',evidenceDoc({failed:2,exitCode:1}));
  assert.equal(run(['release-check','--path',folder,'--evidence',path.join(folder,'ev.json')]).status,2);
}));
test('external-unverified evidence never reaches READY',()=>temp(folder=>{
  cleanProject(folder);put(folder,'ev.json',evidenceDoc({source:'external-unverified'}));
  assert.equal(run(['release-check','--path',folder,'--evidence',path.join(folder,'ev.json')]).status,3);
}));
test('zero-pass evidence is inconclusive, absent evidence is never READY',()=>temp(folder=>{
  cleanProject(folder);put(folder,'ev.json',evidenceDoc({passed:0}));
  assert.equal(run(['release-check','--path',folder,'--evidence',path.join(folder,'ev.json')]).status,3);
  assert.equal(run(['release-check','--path',folder]).status,3);
}));
test('verify rejects malformed evidence and accepts valid evidence',()=>temp(folder=>{
  put(folder,'bad.json','{"schemaVersion":"9"}');put(folder,'worse.json','not json');put(folder,'ok.json',evidenceDoc());
  assert.equal(run(['verify','--evidence',path.join(folder,'bad.json')]).status,1);
  assert.equal(run(['verify','--evidence',path.join(folder,'worse.json')]).status,1);
  assert.equal(run(['verify','--evidence',path.join(folder,'ok.json')]).status,0);
}));
test('pytest/JUnit/Go skip markers are reported',()=>temp(folder=>{
  put(folder,'tests/test_a.py','@pytest.mark.skip\ndef test_a(): pass\n');
  put(folder,'tests/b_test.go','func TestB(t *testing.T) {\n\tt.Skip("x")\n}\n');
  const lines=scanProject(folder).findings.filter(x=>x.ruleId==='SKIPPED_TEST').map(x=>x.evidence.path+':'+x.evidence.line);
  assert.deepEqual(lines.sort(),['tests/b_test.go:2','tests/test_a.py:1']);
}));
test('missing path and traversal-style output fail closed without stack trace',()=>{
  const res=run(['scan','--path','/definitely/not/here']);
  assert.equal(res.status,1);assert.ok(!/at .*\.mjs/.test(res.stderr));
});
test('HTML report escapes malicious file names',{skip:process.platform==='win32'},()=>temp(folder=>{
  put(folder,'tests/<img src=x onerror=alert(1)>.test.js','test.only("x",()=>{});');
  const content=html(scanProject(folder));assert.ok(!content.includes('<img src=x'));
}));
