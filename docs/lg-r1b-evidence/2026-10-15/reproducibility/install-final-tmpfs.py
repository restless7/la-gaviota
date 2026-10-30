#!/usr/bin/env python3
import pathlib,subprocess,shutil,os,json,time,datetime,hashlib,signal
s=pathlib.Path(__file__).resolve().parent;t=pathlib.Path('/tmp/la-gaviota-lg-r1b-20261015');d=t/'candidate-final';d.mkdir(exist_ok=True);cache=t/'npm-cache';cache.mkdir(exist_ok=True)
limits={'root_free_min':512*1024**2,'tmpfs_free_min':4*1024**3,'memory_available_min':4*1024**3,'log_each_max':10*1024**2}
def resources():
 m={k:int(v.split()[0])*1024 for k,v in (l.split(':',1) for l in pathlib.Path('/proc/meminfo').read_text().splitlines())}
 return {'root_free':shutil.disk_usage(s).free,'tmpfs_free':shutil.disk_usage(t).free,'memory_available':m['MemAvailable']}
def safe(r):return all(r[k]>=limits[k+'_min'] for k in ['root_free','tmpfs_free','memory_available'])
before=resources()
if not safe(before):raise SystemExit('Resource gate failed '+json.dumps(before))
if (d/'node_modules').exists():raise SystemExit('Fresh tree required')
for n in ['package.json','package-lock.json']:shutil.copy2(s/'candidate-final'/n,d/n)
for n in ['empty-user.npmrc','empty-global.npmrc']:(t/n).write_text('')
env={'PATH':'/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin','LANG':'C.UTF-8','CI':'true','npm_config_userconfig':str(t/'empty-user.npmrc'),'npm_config_globalconfig':str(t/'empty-global.npmrc'),'npm_config_cache':str(cache),'npm_config_registry':'https://registry.npmjs.org/','npm_config_ignore_scripts':'true','npm_config_audit':'false','npm_config_fund':'false','npm_config_strict_peer_deps':'true','npm_config_engine_strict':'true'}
cmd=['npm','ci','--ignore-scripts','--no-audit','--no-fund','--strict-peer-deps'];out=t/'clean-ci.stdout.log';err=t/'clean-ci.stderr.log';start=time.monotonic();began=datetime.datetime.now(datetime.timezone.utc).isoformat();aborted=None;minima=dict(before)
with out.open('w') as o,err.open('w') as e:
 p=subprocess.Popen(cmd,cwd=d,env=env,stdout=o,stderr=e,start_new_session=True)
 while p.poll() is None:
  rr=resources();minima={k:min(minima[k],rr[k]) for k in minima}
  if not safe(rr) or out.stat().st_size>limits['log_each_max'] or err.stat().st_size>limits['log_each_max'] or time.monotonic()-start>300:
   aborted='resource/log/time gate crossed';os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=15);break
  time.sleep(.3)
 code=p.wait()
result={'command':cmd,'cwd':str(d),'exitcode':code,'aborted':aborted,'started_utc':began,'elapsed_s':round(time.monotonic()-start,3),'resource_limits':limits,'before':before,'minimum_observed':minima,'after':resources(),'environment_keys':sorted(env),'HOME_and_credentials':'omitted, not rebound','scripts_disabled':True,'manifest_sha256':hashlib.sha256((d/'package.json').read_bytes()).hexdigest(),'lock_sha256':hashlib.sha256((d/'package-lock.json').read_bytes()).hexdigest(),'fresh_node_modules_before':True,'network':'npm public registry only; no app/SDK/start/build executed'}
for src,name in [(out,'final-tmpfs-clean-ci.stdout.log'),(err,'final-tmpfs-clean-ci.stderr.log')]:shutil.copy2(src,s/name)
(s/'final-tmpfs-clean-ci.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));print(out.read_text()[-2000:]);print(err.read_text()[-2000:]);raise SystemExit(code)
