from pathlib import Path
import os,json,hashlib,subprocess,time,shutil,signal,concurrent.futures,re
S=Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1c-20261015/reproducibility');A=Path('/tmp/la-gaviota-lg-r1c-20261015/application');NODE=Path('/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node');B=S/'baseline-source';BASE='49add73ae90b837c36553a0f2b535267c9610143'
assert S.resolve()==S and A.resolve()==A and (A/'node_modules').is_dir()
ENV={'PATH':str(NODE.parent)+':/usr/bin:/bin','LANG':'C.UTF-8','CI':'true','NEXT_TELEMETRY_DISABLED':'1','LG_R1B_IO_LOG':str(S/'static-network-attempts.jsonl')}
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
old=Path('/home/sebastiangarcia/planmaestro-ecosystem/packages/la-gaviota/docs/lg-r1b-evidence/2026-10-15/reproducibility/deny-network.cjs');(S/'deny-network.cjs').write_bytes(old.read_bytes())
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=A,env=ENV,text=True).splitlines();selected=[p for p in paths if Path(p).suffix in ['.ts','.tsx','.js','.mjs','.mts','.cjs'] and not p.startswith(('.agents/','docs/'))]+['package.json','tsconfig.json'];selected=sorted(set(selected));assert not B.exists();B.mkdir(mode=0o700)
manifest={}
for name in selected:
 p=B/name;p.parent.mkdir(parents=True,exist_ok=True);raw=subprocess.check_output(['git','show',BASE+':'+name],cwd=A,env=ENV);p.write_bytes(raw);manifest[name]=hashlib.sha256(raw).hexdigest()
(B/'node_modules').symlink_to(A/'node_modules',target_is_directory=True)
(S/'baseline-source-manifest.json').write_text(json.dumps({'baseline':BASE,'files':manifest,'node_modules':'symlink only to single fresh application installation','full_lint_scope':'all tracked JS/TS/config incl root diagnostic scripts; excludes docs/.agents/public (no source) and ignores node_modules perESLint'},indent=2)+'\n')
scopes=json.loads(Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/authorization/proposal-files.json').read_text());approved=[x['file'] for x in scopes];(S/'approved-source-hashes-before-lint.json').write_text(json.dumps({p:h(A/p) for p in approved},indent=2)+'\n')
ES=A/'node_modules/eslint/bin/eslint.js';TSC=A/'node_modules/typescript/bin/tsc';pre=['--require',str(S/'deny-network.cjs')]
def execute(name,cmd,cwd):
 t=time.monotonic();out=S/(name+'.stdout.json' if 'lint' in name or 'peer' in name else name+'.stdout.log');err=S/(name+'.stderr.log');aborted=None
 with out.open('w') as o,err.open('w') as e:
  p=subprocess.Popen([str(c) for c in cmd],cwd=cwd,env=ENV,stdout=o,stderr=e,start_new_session=True)
  while p.poll() is None:
   if shutil.disk_usage(S).free<1024**3 or shutil.disk_usage(A).free<4*1024**3 or max(out.stat().st_size,err.stat().st_size)>20*1024**2 or time.monotonic()-t>180:
    aborted='resource/time/log';os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=10);break
   time.sleep(.2)
  code=p.wait()
 r={'name':name,'command':[str(x) for x in cmd],'cwd':str(cwd),'exitcode':code,'elapsed_s':round(time.monotonic()-t,3),'aborted':aborted,'stdout_sha256':h(out),'stderr_sha256':h(err),'pid':p.pid,'process_completed':p.poll() is not None}
 (S/(name+'.result.json')).write_text(json.dumps(r,indent=2)+'\n');return r
jobs=[('baseline-full-lint',[NODE,*pre,ES,'.','--format','json'],B),('candidate-full-lint-before',[NODE,*pre,ES,'.','--format','json'],A),('baseline-scoped-lint',[NODE,*pre,ES,*[p for p in approved if (B/p).exists()],'--format','json'],B),('candidate-scoped-lint-before',[NODE,*pre,ES,*approved,'--format','json'],A),('candidate-typecheck-before',[NODE,*pre,TSC,'--noEmit','--incremental','false','--pretty','false'],A),('peer-tree',[NODE,A/'node_modules/npm/bin/npm-cli.js','ls','--all','--json','--offline'],A)]
# npm is installed outside project; use exact toolchain entry rather than a transitive package.
jobs[-1]=('peer-tree',[NODE,NODE.parent/'../lib/node_modules/npm/bin/npm-cli.js','ls','--all','--json','--offline'],A)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(lambda j:execute(*j),jobs))
(S/'initial-static-results.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results,indent=2))
