#!/usr/bin/env python3
"""Reproduce only the reviewed dependency install in a new private tmpfs directory."""
import pathlib,subprocess,os,json,hashlib,shutil,sys,time,signal,datetime,tempfile
stage=pathlib.Path(__file__).resolve().parent;tmp=pathlib.Path('/tmp/la-gaviota-lg-r1b-20261015')
forbidden=[k for k in os.environ if any(v in k.upper() for v in ['CLERK','SUPABASE','WOMPI','DATABASE_URL','DIRECT_URL','NEXT_PUBLIC','NODE_OPTIONS'])]
if forbidden:raise SystemExit('REJECTED inherited application/runtime configuration keys: '+','.join(sorted(forbidden)))
expect={'package.json':'7bcb5bf41cf599dffd487cb3c1032b1cb81350ace0e2f43bd009a0587b8e8c6b','package-lock.json':'1906288202e7b4c44e61659787ea3f9577ea9b37f7404098dd5c89b1c56b7157'}
for name,digest in expect.items():
 p=stage/'candidate-final'/name
 if p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:raise SystemExit('Candidate hash mismatch: '+name)
if any((stage/'candidate-final').glob('.env*')):raise SystemExit('REJECTED .env files in candidate')
lock=json.loads((stage/'candidate-final/package-lock.json').read_text())
if any(v.get('resolved') and not v['resolved'].startswith('https://registry.npmjs.org/') for v in lock['packages'].values()):raise SystemExit('REJECTED non-registry dependency')
if json.loads((stage/'candidate-final/package.json').read_text()).get('overrides'):raise SystemExit('REJECTED dependency overrides')
if not tmp.exists() or tmp.is_symlink():raise SystemExit('Private tmpfs mount directory must exist')
def resources():
 m={k:int(v.split()[0])*1024 for k,v in (line.split(':',1) for line in pathlib.Path('/proc/meminfo').read_text().splitlines())};return {'root_free':shutil.disk_usage(stage).free,'tmp_free':shutil.disk_usage(tmp).free,'memory_available':m['MemAvailable']}
def safe(d):return d['root_free']>=512*1024**2 and d['tmp_free']>=4*1024**3 and d['memory_available']>=4*1024**3
before=resources()
if not safe(before):raise SystemExit('REJECTED resource gate: '+json.dumps(before))
if sys.argv[1:]==['--check-only']:print(json.dumps({'status':'PASS_PREFLIGHT_ONLY','resources':before,'candidate_hashes':expect,'environment':'application keys absent, remaining inherited environment will be discarded; HOME omitted'}));raise SystemExit(0)
if sys.argv[1:]!=['--install']:raise SystemExit('Use --check-only or --install; no other commands permitted')
d=pathlib.Path(tempfile.mkdtemp(prefix='reproduce-',dir=tmp));os.chmod(d,0o700)
for name in expect:shutil.copy2(stage/'candidate-final'/name,d/name)
for name in ['empty-user.npmrc','empty-global.npmrc']:(d/name).write_text('')
env={'PATH':'/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin','LANG':'C.UTF-8','CI':'true','npm_config_userconfig':str(d/'empty-user.npmrc'),'npm_config_globalconfig':str(d/'empty-global.npmrc'),'npm_config_cache':str(d/'npm-cache'),'npm_config_registry':'https://registry.npmjs.org/','npm_config_ignore_scripts':'true','npm_config_strict_peer_deps':'true','npm_config_engine_strict':'true','npm_config_audit':'false','npm_config_fund':'false'}
actual_node=subprocess.check_output(['node','--version'],env=env,text=True).strip();actual_npm=subprocess.check_output(['npm','--version'],env=env,text=True).strip()
if (actual_node,actual_npm)!=('v24.13.0','11.6.2'):raise SystemExit('REJECTED runtime version mismatch')
stdout=d/'ci.stdout.log';stderr=d/'ci.stderr.log';cmd=['npm','ci','--ignore-scripts','--no-audit','--no-fund','--strict-peer-deps'];started=datetime.datetime.now(datetime.timezone.utc).isoformat();t=time.monotonic();abort=None
with stdout.open('w') as o,stderr.open('w') as e:
 p=subprocess.Popen(cmd,cwd=d,env=env,stdout=o,stderr=e,start_new_session=True)
 while p.poll() is None:
  if not safe(resources()) or max(stdout.stat().st_size,stderr.stat().st_size)>10*1024**2 or time.monotonic()-t>300:
   abort='resource/log/time gate';os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=15);break
  time.sleep(.3)
 code=p.wait()
result={'cwd':str(d),'command':cmd,'exitcode':code,'aborted':abort,'started_utc':started,'elapsed_s':round(time.monotonic()-t,3),'node':actual_node,'npm':actual_npm,'after':resources(),'candidate_hashes_unchanged':all(hashlib.sha256((d/n).read_bytes()).hexdigest()==h for n,h in expect.items()),'limits':'root512MiB,tmp/memory4GiB,logs10MiBeach,300s','scripts_disabled':True,'application_not_loaded':True}
(d/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));raise SystemExit(code)
