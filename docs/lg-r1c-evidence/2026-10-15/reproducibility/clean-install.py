from pathlib import Path
import os,json,hashlib,subprocess,shutil,time,signal,datetime
S=Path('/home/sebastiangarcia/.local/share/la-gaviota/lg-r1c-20261015/reproducibility');APP=Path('/tmp/la-gaviota-lg-r1c-20261015/application');OLD=Path('/tmp/la-gaviota-lg-r1b-20261015/candidate-final');NODE=Path('/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node');NPM=NODE.parent/'npm'
EXPECTED={'package.json':'7bcb5bf41cf599dffd487cb3c1032b1cb81350ace0e2f43bd009a0587b8e8c6b','package-lock.json':'1906288202e7b4c44e61659787ea3f9577ea9b37f7404098dd5c89b1c56b7157'}
assert S.resolve()==S and APP.resolve()==APP and OLD.resolve()==OLD
assert not (APP/'node_modules').exists() and not (APP/'.npmrc').exists()
assert not any(p.name not in ['.env.example'] for p in APP.glob('.env*'))
for root in [APP,OLD]:
 for n,h in EXPECTED.items():assert hashlib.sha256((root/n).read_bytes()).hexdigest()==h,(root,n)
lock=json.loads((APP/'package-lock.json').read_text());assert all(not v.get('resolved') or v['resolved'].startswith('https://registry.npmjs.org/') for v in lock['packages'].values())
assert not json.loads((APP/'package.json').read_text()).get('overrides')
for name in ['empty-user.npmrc','empty-global.npmrc']:(S/name).write_text('')
ENV={'PATH':str(NODE.parent)+':/usr/bin:/bin','LANG':'C.UTF-8','CI':'true','NEXT_TELEMETRY_DISABLED':'1','npm_config_userconfig':str(S/'empty-user.npmrc'),'npm_config_globalconfig':str(S/'empty-global.npmrc'),'npm_config_cache':'/tmp/la-gaviota-lg-r1b-20261015/npm-cache','npm_config_registry':'https://registry.npmjs.org/','npm_config_ignore_scripts':'true','npm_config_strict_peer_deps':'true','npm_config_engine_strict':'true','npm_config_audit':'false','npm_config_fund':'false'}
versions={'node':subprocess.check_output([NODE,'--version'],env=ENV,text=True).strip(),'npm':subprocess.check_output([NPM,'--version'],env=ENV,text=True).strip()};assert versions=={'node':'v24.13.0','npm':'11.6.2'}
def resources():
 m={k:int(v.split()[0])*1024 for k,v in (l.split(':',1) for l in Path('/proc/meminfo').read_text().splitlines())};return {'root_free':shutil.disk_usage(S).free,'tmp_free':shutil.disk_usage(APP).free,'memory_available':m['MemAvailable']}
def safe(r):return r['root_free']>=1024**3 and r['tmp_free']>=4*1024**3 and r['memory_available']>=4*1024**3
assert safe(resources()),resources()
# Exact previously owned tree only; no process may reference it in cwd or argv.
active=[]
for proc in Path('/proc').iterdir():
 if not proc.name.isdigit() or int(proc.name)==os.getpid():continue
 try:
  cwd=os.readlink(proc/'cwd');argv=(proc/'cmdline').read_bytes().replace(b'\0',b' ').decode(errors='replace')
  if str(OLD) in cwd or str(OLD) in argv:active.append(proc.name)
 except (FileNotFoundError,PermissionError,ProcessLookupError):pass
assert not active,active
oldmodules=OLD/'node_modules';assert oldmodules.exists() and not oldmodules.is_symlink() and oldmodules.resolve().parent==OLD
retire={'path':str(oldmodules),'authorized_exact_owned_tree':True,'manifest_hashes':EXPECTED,'no_active_process_refs':True,'pre_resources':resources(),'old_hidden_lock_sha256':hashlib.sha256((oldmodules/'.package-lock.json').read_bytes()).hexdigest()}
shutil.rmtree(oldmodules);retire['removed']=not oldmodules.exists();retire['post_resources']=resources();(S/'owned-old-tree-retirement.json').write_text(json.dumps(retire,indent=2)+'\n')
cmd=[str(NPM),'ci','--ignore-scripts','--no-audit','--no-fund','--strict-peer-deps','--engine-strict'];before=resources();samples=[before];t=time.monotonic();abort=None;out=S/'clean-ci.stdout.log';err=S/'clean-ci.stderr.log'
with out.open('w') as o,err.open('w') as e:
 p=subprocess.Popen(cmd,cwd=APP,env=ENV,stdout=o,stderr=e,start_new_session=True)
 while p.poll() is None:
  r=resources();samples.append(r)
  if not safe(r) or time.monotonic()-t>300 or max(out.stat().st_size,err.stat().st_size)>10*1024**2:
   abort='resource/log/time threshold';os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=15);break
  time.sleep(.2)
 code=p.wait()
res={'command':cmd,'cwd':str(APP),'versions':versions,'exitcode':code,'elapsed_s':round(time.monotonic()-t,3),'aborted':abort,'environment_keys':sorted(ENV),'before':before,'after':resources(),'minima':{k:min(x[k] for x in samples) for k in before},'scripts_disabled':True,'no_force_legacy_overrides':True,'package_hashes_after':{n:hashlib.sha256((APP/n).read_bytes()).hexdigest() for n in EXPECTED},'expected_hashes_unchanged':all(hashlib.sha256((APP/n).read_bytes()).hexdigest()==h for n,h in EXPECTED.items()),'owned_install_pid':p.pid,'process_completed':p.poll() is not None}
(S/'clean-ci.json').write_text(json.dumps(res,indent=2)+'\n');print(json.dumps(res,indent=2));raise SystemExit(code)
