import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../');
const SOURCE = path.join(REPO,'.agents','skills');
const ADAPTERS = { claude:'.claude/skills', cursor:'.cursor/skills', codex:'.agents/skills', gemini:'.gemini/skills', copilot:'.github/skills', generic:'.agents/skills' };
export const supportedIdes = Object.keys(ADAPTERS);
export function listAgents() {return fs.readdirSync(SOURCE,{withFileTypes:true}).filter(x=>x.isDirectory() && fs.existsSync(path.join(SOURCE,x.name,'SKILL.md'))).map(x=>x.name).sort();}
export function installSkills({ide,target,force=false}) {
  if (!ide || !target) throw new Error('init requires --ide and --target');
  if (ide!=='all' && !(ide in ADAPTERS)) throw new Error(`Unsupported IDE: ${ide}. Choices: ${Object.keys(ADAPTERS).join(', ')}, all`);
  const base=path.resolve(target);
  if (!fs.existsSync(base) || !fs.lstatSync(base).isDirectory() || fs.lstatSync(base).isSymbolicLink()) throw new Error('--target must be an existing real directory');
  const targets=[...new Set((ide==='all' ? Object.values(ADAPTERS):[ADAPTERS[ide]]))];
  const skills=listAgents();
  const actions=[];
  for(const adapter of targets) for(const skill of skills) {
    const dest=path.join(base,adapter,skill);
    const source=path.join(SOURCE,skill);
    // No symlink components in destination path: don't copy to surprising locations.
    let cursor=base;
    for(const segment of (adapter+'/'+skill).split('/')) {
      cursor=path.join(cursor,segment);
      if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Refusing symlink target path: ${cursor}`);
    }
    if (fs.existsSync(dest) && !force && path.resolve(dest) !== path.resolve(source)) throw new Error(`Skill already exists: ${dest} (use --force only after review)`);
    actions.push({source,dest,existing:fs.existsSync(dest)});
  }
  const installed=[];
  for(const {source,dest,existing} of actions) {
    if (path.resolve(dest) === path.resolve(source)) {installed.push(dest);continue;}
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    if (existing) fs.rmSync(dest,{recursive:true,force:true});
    fs.cpSync(source,dest,{recursive:true});
    installed.push(dest);
  }
  return {count:installed.length,targets,installed};
}
