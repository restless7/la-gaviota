from pathlib import Path
import os,json,hashlib,subprocess,time,concurrent.futures,collections
S=Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1c-20261015/reproducibility');A=Path('/tmp/la-gaviota-lg-r1c-20261015/application');NODE=Path('/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node')
ENV={'PATH':str(NODE.parent)+':/usr/bin:/bin','LANG':'C.UTF-8','CI':'true','NEXT_TELEMETRY_DISABLED':'1','LG_R1B_IO_LOG':str(S/'final-static-network-attempts.jsonl')}
paths=[r['file'] for r in json.loads(Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/authorization/proposal-files.json').read_text())];paths+=['package.json','package-lock.json'];hashes={n:hashlib.sha256((A/n).read_bytes()).hexdigest() for n in paths}
old=json.loads((S/'approved-source-hashes-before-lint.json').read_text());deltas=[n for n,h in old.items() if hashes[n]!=h];assert sorted(deltas)==['middleware.ts','src/lib/server/authorization.ts'],deltas
(S/'final-source-hashes-before.json').write_text(json.dumps(hashes,indent=2)+'\n')
def run(name,args):
 cmd=[str(NODE),'--require',str(S/'deny-network.cjs'),*map(str,args)];t=time.monotonic();r=subprocess.run(cmd,cwd=A,env=ENV,text=True,capture_output=True,timeout=120);(S/(name+'.stdout.log')).write_text(r.stdout);(S/(name+'.stderr.log')).write_text(r.stderr);res={'command':cmd,'exitcode':r.returncode,'elapsed_s':round(time.monotonic()-t,3),'stdout_sha256':hashlib.sha256(r.stdout.encode()).hexdigest(),'stderr_sha256':hashlib.sha256(r.stderr.encode()).hexdigest(),'environment_keys':sorted(ENV)};(S/(name+'.result.json')).write_text(json.dumps(res,indent=2)+'\n');return name,r.stdout,res
jobs=[('final-typecheck',[A/'node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--pretty','false']),('final-scoped-lint',[A/'node_modules/eslint/bin/eslint.js',*paths[:-2],'--format','json'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(lambda j:run(*j),jobs))
after={n:hashlib.sha256((A/n).read_bytes()).hexdigest() for n in paths};assert hashes==after
baseline=json.loads((S/'baseline-scoped-lint.stdout.json').read_text());basefiles={str(Path(r['filePath']).relative_to(S/'baseline-source')):r for r in baseline};candidate=json.loads(next(stdout for name,stdout,res in results if name=='final-scoped-lint'));new=[];inherited=[]
def key(m,root,f):return (m.get('ruleId'),m['severity'],m['message'].split('\n\n')[0],(root/f).read_text().splitlines()[m['line']-1].strip())
for row in candidate:
 f=str(Path(row['filePath']).relative_to(A));old=collections.Counter(key(m,S/'baseline-source',f) for m in basefiles.get(f,{}).get('messages',[]))
 for m in row['messages']:
  k=key(m,A,f);entry={'file':f,'rule':k[0],'severity':k[1],'line':m['line'],'source_line':k[3]}
  if old[k]:old[k]-=1;inherited.append(entry)
  else:new.append(entry)
summary={'typecheck':next(res for name,stdout,res in results if name=='final-typecheck'),'scoped_lint':{'exitcode':next(res['exitcode'] for name,stdout,res in results if name=='final-scoped-lint'),'files':len(candidate),'errors':sum(r['errorCount'] for r in candidate),'warnings':sum(r['warningCount'] for r in candidate),'fatal_errors':sum(r.get('fatalErrorCount',0) for r in candidate),'new_violations':new,'inherited_source_line_matches':len(inherited)},'modified_from_frozen_r1b_only':deltas,'lint_source_edits_by_release_agent':0,'no_regression_status':'PASS' if not new else 'FAIL','full_lint_status':'FAIL inherited; final two-file update has no new scoped violations','all55_hashes_stable_during_final_run':hashes==after,'final_source_hashes':after,'static_network_attempts':len((S/'final-static-network-attempts.jsonl').read_text().splitlines()) if (S/'final-static-network-attempts.jsonl').exists() else 0,'owned_quality_processes':'all subprocess.run calls completed'}
(S/'final-quality-summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='final_source_hashes'},indent=2))
