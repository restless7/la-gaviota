#!/usr/bin/python3
"""Owned synthetic local lifecycle. No connection/env/target discovery."""
from pathlib import Path
import subprocess,os,stat,shutil,json,sys
S=Path(__file__).resolve().parent;B=Path('/usr/lib/postgresql/18/bin');D=S/'data';K=S/'socket';ENV={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8'};OWNER='lg_test_owner';PORT='55479'
def guard():
 assert S==Path('/tmp/la-gaviota-authorized-e2e-20261015/database') and S.resolve()==S and not S.is_symlink()
 assert stat.S_IMODE(S.stat().st_mode)==0o700 and K.resolve()==S/'socket'
 assert (S/'SYNTHETIC_ONLY.sentinel').read_text()=='LG_AUTHORIZED_E2E_SYNTHETIC_POSTGRES_ONLY_20261015\n'
 assert shutil.disk_usage('/').free>=1024**3 and shutil.disk_usage(S).free>=1024**3
 assert D.parent.resolve()==S and not D.is_symlink()
def run(args,**kw):guard();return subprocess.run(list(map(str,args)),env=ENV,cwd=S,capture_output=True,text=True,timeout=kw.pop('timeout',40),**kw)
def query(sql):
 return run([B/'psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1','-h',K,'-p',PORT,'-U',OWNER,'-d','postgres','-c',"DO $$ BEGIN IF current_setting('data_directory') <> '"+str(D)+"' THEN RAISE EXCEPTION 'WRONG CLUSTER'; END IF; END $$;"+sql])
if __name__=='__main__':
 guard();action=sys.argv[1];assert action in ['start','stop','status']
 if action=='start':
  assert not D.exists(),'Fresh stage only; never overwrite retained cluster'
  r=run([B/'initdb','-D',D,'-U',OWNER,'--auth-local=trust','--auth-host=reject','--encoding=UTF8','--no-locale']);(S/'logs/initdb.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
  r=run([B/'pg_ctl','-D',D,'-l',S/'logs/postgres.log','-o',f"-c listen_addresses='' -c unix_socket_directories='{K}' -c unix_socket_permissions=0700 -c port={PORT} -c max_connections=16 -c shared_buffers=16MB -c log_statement=none -c log_min_error_statement=panic",'-w','start']);(S/'logs/start.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
  pid=int((D/'postmaster.pid').read_text().splitlines()[0]);(S/'owned-pid.json').write_text(json.dumps({'pid':pid,'stage':str(S),'unixSocket':str(K),'port':PORT,'database':'postgres','owner':OWNER}))
  try:
   for file in ['baseline-fixture.sql','baseline-storage-stub.sql','seed-stable.sql']:
    r=query((S/file).read_text());(S/('logs/'+file+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
   r=query("SELECT set_config('lg_r1b.review_gate','SYNTHETIC_OR_REVIEWED_METADATA_ONLY',false);"+(S/'policy-model.sql.txt').read_text());(S/'logs/policy-model.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
   r=query("SELECT json_build_object('server_version',version(),'listen_addresses',current_setting('listen_addresses'),'data_directory',current_setting('data_directory'),'unix_socket_directories',current_setting('unix_socket_directories'))::text");assert r.returncode==0;(S/'cluster-settings.json').write_text(r.stdout)
  except:
   subprocess.run([sys.executable,str(__file__),'stop'],env=ENV);raise
  print(json.dumps({'state':'STARTED_SYNTHETIC_ONLY','pid':pid,'socket':str(K),'port':PORT,'dbname':'postgres','owner':OWNER}))
 elif action=='stop':
  info=json.loads((S/'owned-pid.json').read_text());pid=info['pid'];assert int((D/'postmaster.pid').read_text().splitlines()[0])==pid;assert str(D).encode()in Path(f'/proc/{pid}/cmdline').read_bytes()
  r=run([B/'pg_ctl','-D',D,'-w','-m','fast','stop']);(S/'logs/stop.log').write_text(r.stdout+r.stderr)
  try:os.kill(pid,0);alive=True
  except ProcessLookupError:alive=False
  proof={'stopExit':r.returncode,'pid':pid,'pidAlive':alive,'socketFiles':[p.name for p in K.iterdir()],'postmasterPidExists':(D/'postmaster.pid').exists()};(S/'cleanup.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof));assert r.returncode==0 and not alive and not proof['socketFiles']
 else:
  print(json.dumps({'ownedPidPresent':(D/'postmaster.pid').exists(),'socketFiles':[p.name for p in K.iterdir()]}))
