from pathlib import Path
import os,subprocess,time,json,hashlib,signal,datetime
APP=Path('/tmp/la-gaviota-lg-r1c-20261015/application');STAGE=Path(__file__).parent
NODE='/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin/node';ENV={'PATH':'/home/sebastiangarcia/.nvm/versions/node/v24.13.0/bin:/usr/bin:/bin','LANG':'C.UTF-8','CI':'1','NODE_ENV':'production','NEXT_TELEMETRY_DISABLED':'1','NEXT_PUBLIC_CLERK_KEYLESS_DISABLED':'true','NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED':'true'}
if any(f.name!='.env.example' for f in APP.glob('.env*')):raise SystemExit('NO_ENV_FILES_REQUIRED')
if not (APP/'node_modules/next/dist/bin/next').exists():raise SystemExit('DEPENDENCIES_NOT_READY')
def free(p):s=os.statvfs(p);return s.f_bavail*s.f_frsize
def mem():return int(next(x.split()[1] for x in Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemAvailable:')))*1024
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def resources():return {'root_free':free(STAGE),'tmp_free':free(APP),'mem_available':mem()}
def safe(v):return v['root_free']>=512*1024**2 and v['tmp_free']>=4*1024**3 and v['mem_available']>=4*1024**3
pre=resources()
if not safe(pre):raise SystemExit('PREFLIGHT_RESOURCE_THRESHOLD')
files=[x.decode() for x in subprocess.check_output(['/usr/bin/git','ls-files','-z'],cwd=APP,env=ENV).split(b'\0') if x];before={f:sha(APP/f) for f in files if (APP/f).is_file()};saved={f:(APP/f).read_bytes() for f in ['tsconfig.json','next-env.d.ts'] if (APP/f).is_file()};(STAGE/'tracked-before.json').write_text(json.dumps(before,indent=2))
command=['/usr/bin/unshare','--user','--map-root-user','--net','--','/usr/bin/strace','-f','-e','trace=network','-o',str(STAGE/'build-network.strace'),NODE,str(APP/'node_modules/next/dist/bin/next'),'build']
start=time.monotonic();observed=[pre];reason=None
with (STAGE/'next-build.stdout.log').open('w') as out,(STAGE/'next-build.stderr.log').open('w') as err:
 proc=subprocess.Popen(command,cwd=APP,env=ENV,stdout=out,stderr=err,start_new_session=True)
 try:
  while proc.poll() is None:
   time.sleep(.5);v=resources();observed.append(v)
   logs=[STAGE/'next-build.stdout.log',STAGE/'next-build.stderr.log',STAGE/'build-network.strace'];size=sum(x.stat().st_size for x in logs if x.exists())
   rss=0;breakdown=[]
   for path in Path('/proc').iterdir():
    if path.name.isdigit():
     try:
      st=(path/'stat').read_text().rsplit(') ',1)[1].split()
      if int(st[2])==proc.pid:
       resident=int((path/'statm').read_text().split()[1])*os.sysconf('SC_PAGE_SIZE');rss+=resident;breakdown.append({'pid':int(path.name),'rss_bytes':resident,'comm':(path/'comm').read_text().strip()})
     except (OSError,ValueError,IndexError):pass
   if not safe(v):reason='RESOURCE_THRESHOLD'
   elif size>8*1024**2:reason='LOG_SIZE_THRESHOLD'
   elif rss>3*1024**3:reason='PROCESS_GROUP_RSS_THRESHOLD'
   elif time.monotonic()-start>120:reason='TIMEOUT_120S'
   if reason:(STAGE/'resource-stop-breakdown.json').write_text(json.dumps({'rss_sum':rss,'processes':breakdown},indent=2));os.killpg(proc.pid,signal.SIGTERM);break
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
 finally:
  try:os.killpg(proc.pid,signal.SIGTERM)
  except ProcessLookupError:pass
elapsed=time.monotonic()-start;after={f:sha(APP/f) for f in before if (APP/f).is_file()};changes=[f for f in before if before[f]!=after.get(f)];generated=[]
for f in changes:
 if f in saved:
  generated.append({'file':f,'before_sha256':before[f],'generated_sha256':after.get(f),'generated_bytes':(APP/f).read_text(),'restored':True});(APP/f).write_bytes(saved[f])
 else:generated.append({'file':f,'before_sha256':before[f],'after_sha256':after.get(f),'restored':False,'requires_review':True})
(STAGE/'generated-tracked-delta.json').write_text(json.dumps(generated,indent=2));final={f:sha(APP/f) for f in before if (APP/f).is_file()};(STAGE/'tracked-after-restoration.json').write_text(json.dumps(final,indent=2));result={'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':command,'environment':ENV,'credentials_supplied':False,'kernel_isolation':'new user+network namespace; no network interfaces except down loopback/no routes; strace captures network calls','exitcode':proc.returncode,'stop_reason':reason,'elapsed_seconds':round(elapsed,3),'resources_before':pre,'observed_minima':{k:min(v[k] for v in observed) for k in pre},'tracked_count':len(before),'tracked_generated_changes':generated,'tracked_restored_identical':final==before,'stdout_sha256':sha(STAGE/'next-build.stdout.log'),'stderr_sha256':sha(STAGE/'next-build.stderr.log'),'network_log_sha256':sha(STAGE/'build-network.strace'),'status':'PASS_BUILD_ONLY' if proc.returncode==0 else 'BLOCKED_OR_FAILURE_REQUIRES_LOG_REVIEW','not_proven':['Real Clerk authentication','Supabase gateway/RLS/Storage','HTTP/customer/admin/checkout workflows']};(STAGE/'real-next-build-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
