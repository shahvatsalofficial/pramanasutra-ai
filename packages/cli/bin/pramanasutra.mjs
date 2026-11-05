#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { scanProject, evaluateGate } from '../lib/scanner.mjs';
import { loadPolicy } from '../lib/policy.mjs';
import { loadEvidence } from '../lib/evidence.mjs';
import { writeReports } from '../lib/report.mjs';
import { supportedIdes, listAgents, installSkills } from '../lib/installer.mjs';

const VERSION = (() => { try { return JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version; } catch { return 'unknown'; } })();
const HELP = `PramanaSutra AI v${VERSION} — evidence-first QA & release review (by Vatsal Shah)
Usage:
  pramanasutra version
  pramanasutra doctor [--json]
  pramanasutra agents list [--json]
  pramanasutra scan --path <dir> [--out <dir>] [--no-report] [--json]
  pramanasutra release-check --path <dir> [--evidence <file>] [--policy <file>] [--out <dir>] [--no-report] [--json]
  pramanasutra verify --evidence <file> [--json]
  pramanasutra init --ide <${supportedIdes.join('|')}|all> --target <existing-dir> [--force]
  pramanasutra help

Exit codes: 0 success or READY_FOR_HUMAN_APPROVAL; 1 invalid input/error; 2 NO_GO; 3 REVIEW_REQUIRED.
Every scan and release-check writes three files together: report.md and report.html for people, report.json for tools.
Default directory: ./pramanasutra-reports. Change it with --out. Skip files with --no-report.
Static audit NEVER executes project tests. No additional AI key required.`;
const OPTION_VALUE = new Set(['--path','--out','--ide','--target','--evidence','--policy']);
const OPTION_FLAG = new Set(['--force','--json','--no-report']);
function parse(raw) {
  const flags={}; const words=[];
  for(let i=0;i<raw.length;i++) {
    const word=raw[i];
    if(OPTION_FLAG.has(word)) {flags[word.slice(2)]=true;continue;}
    if(OPTION_VALUE.has(word)) {
      if(!raw[i+1] || raw[i+1].startsWith('--')) throw new Error(`Missing value for ${word}`);
      flags[word.slice(2)]=raw[++i];continue;
    }
    if(word==='--help'||word==='-h'||word==='--version'||word==='-v') { words.push(word); continue; }
    if(word.startsWith('-')) throw new Error(`Unknown option: ${word}`);
    words.push(word);
  }
  return { flags, words };
}
function emit(value, json=false) { if(json) console.log(JSON.stringify(value,null,2)); else if(typeof value==='string') console.log(value); else console.log(JSON.stringify(value,null,2)); }
export function main(rawArgs=process.argv.slice(2)) {
  try {
    const { flags, words }=parse(rawArgs);
    const command=words[0] || 'help';
    if(command==='help' || command==='--help' || command==='-h') {console.log(HELP);return 0;}
    if(command==='version' || command==='--version' || command==='-v') {emit(flags.json?{product:'PramanaSutra AI',version:VERSION}:`PramanaSutra AI ${VERSION}`,!!flags.json);return 0;}
    if(command==='doctor') {
      const major=Number(process.versions.node.split('.')[0]);
      const obj={product:'PramanaSutra AI',version:VERSION,node:process.version,platform:process.platform,ok:major>=20,offline:true,aiInference:false,root:process.cwd()};
      emit(flags.json?obj:`PramanaSutra doctor: v${VERSION}, Node ${process.version}, ${process.platform}. ${obj.ok?'Ready for offline static QA.':'Node 20+ required.'} No additional AI key needed.`,!!flags.json);
      return obj.ok?0:1;
    }
    if(command==='agents' && words[1]==='list') {const value=listAgents(); emit(flags.json?value:value.map(s=>' - '+s).join('\n'));return 0;}
    if(command==='init') {
      if(!flags.ide || !flags.target) throw new Error('Use init --ide <name> --target <existing-directory>');
      const result=installSkills({ide:flags.ide,target:flags.target,force:!!flags.force});
      emit(flags.json?result:`Installed ${result.count} skill directories into ${result.targets.join(', ')}. No AI model called.`,!!flags.json);
      return 0;
    }
    if(command==='verify') {
      if(!flags.evidence) throw new Error('Use verify --evidence <file>');
      const ev=loadEvidence(flags.evidence);
      emit(flags.json?ev:`Evidence valid: source=${ev.source}, passed=${ev.passed}, failed=${ev.failed}, exitCode=${ev.exitCode}. Provenance is only as trustworthy as its source.`,!!flags.json);
      return 0;
    }
    if(command==='scan' || command==='release-check') {
      if(!flags.path) throw new Error(`Use ${command} --path <existing directory>`);
      if(command==='scan' && (flags.evidence||flags.policy)) throw new Error('--evidence and --policy apply to release-check only');
      const report=scanProject(flags.path);
      const evidence=flags.evidence && command==='release-check' ? loadEvidence(flags.evidence) : null;
      report.releaseGate=evaluateGate(report,evidence,loadPolicy(flags.policy));
      if(evidence) {
        report.capabilities.testExecution='evidence-supplied';
        report.evidence={source:evidence.source,command:evidence.command,executedAt:evidence.executedAt,exitCode:evidence.exitCode,passed:evidence.passed,failed:evidence.failed,skipped:evidence.skipped,environment:evidence.environment,commit:evidence.commit};
      }
      const outputs=flags['no-report']?[]:writeReports(report,flags.out||'pramanasutra-reports');
      if(flags.json) emit(report,true);
      else console.log(`PramanaSutra ${command}: ${report.inventory.fileCount} file(s), ${report.inventory.testFiles.length} test file(s), ${report.findings.length} finding(s). Gate: ${report.releaseGate.decision}. Tests executed by this tool: NO. Evidence: ${report.releaseGate.evidenceState}.\n${outputs.length?'Reports (Markdown, HTML, JSON): '+outputs.join(', '):'Reports not written (--no-report).'}`);
      return command==='release-check' ? ({NO_GO:2,REVIEW_REQUIRED:3}[report.releaseGate.decision]??0) : 0;
    }
    throw new Error(`Unknown command: ${words.join(' ')}`);
  } catch(err) {
    console.error(`PramanaSutra error: ${err.message}`);
    return 1;
  }
}
process.exitCode=main();
