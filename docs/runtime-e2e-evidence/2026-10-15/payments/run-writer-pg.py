#!/usr/bin/python3
"""Owned PostgreSQL fixture with real commit durability; no external service, credentials or shared data."""
from pathlib import Path
import subprocess,json,os,shutil,stat,time,hashlib,argparse
cli=argparse.ArgumentParser();cli.add_argument('--root',required=True);cli.add_argument('--stage',required=True);cli.add_argument('--node',required=True);a=cli.parse_args()
S=Path(a.stage);B=Path('/usr/lib/postgresql/18/bin');R=Path(a.root);P=Path(__file__).resolve().parent
assert S.is_absolute() and str(S).startswith('/tmp/la-gaviota-') and not S.exists(), 'Require NEW private /tmp/la-gaviota-* path'
assert R.is_absolute() and (R/'src/lib/server/orderWriter.ts').is_file()
ENV={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8'};NODE=a.node;started=False;pid=None;results=[]
S.mkdir(mode=0o700,exist_ok=True);os.chmod(S,0o700);(S/'socket').mkdir(mode=0o700,exist_ok=True);(S/'SYNTHETIC_ONLY.sentinel').write_text('PAYMENTS_SYNTHETIC_LOCAL_ONLY\n')
assert S.resolve()==S and not S.is_symlink() and stat.S_IMODE(S.stat().st_mode)==0o700
assert shutil.disk_usage(S).free>=1024**3 and shutil.disk_usage(R).free>=1024**3
assert not (S/'data').exists(),'Refuse preexisting cluster'
def run(args,timeout=40):return subprocess.run([str(x) for x in args],env=ENV,cwd=S,capture_output=True,text=True,timeout=timeout)
def sql(q):
 r=run([B/'psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1','-h',S/'socket','-p','55474','-U','payments_fixture_owner','-d','postgres','-c',q]);assert r.returncode==0,r.stderr;return r.stdout.strip()
try:
 r=run([B/'initdb','-D',S/'data','-U','payments_fixture_owner','--auth-local=trust','--auth-host=reject','--encoding=UTF8','--no-locale']);(S/'initdb.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 options=f"-c listen_addresses='' -c unix_socket_directories='{S}/socket' -c unix_socket_permissions=0700 -c port=55474 -c max_connections=8 -c shared_buffers=16MB -c log_statement=none -c log_min_error_statement=panic"
 r=run([B/'pg_ctl','-D',S/'data','-l',S/'postgres.log','-o',options,'-w','start']);assert r.returncode==0,r.stderr;started=True;pid=int((S/'data/postmaster.pid').read_text().splitlines()[0])
 settings=sql("SELECT json_build_object('version',version(),'listen_addresses',current_setting('listen_addresses'),'socket_permissions',current_setting('unix_socket_permissions'),'data_directory',current_setting('data_directory'));");(S/'cluster-settings.json').write_text(settings+'\n')
 ddl="""CREATE TABLE public.orders(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),clerk_user_id TEXT,customer_name TEXT NOT NULL,customer_email TEXT NOT NULL,customer_phone TEXT NOT NULL,delivery_address TEXT NOT NULL,delivery_municipality TEXT NOT NULL,total_amount INTEGER NOT NULL,status TEXT NOT NULL,payment_method TEXT NOT NULL,notes TEXT);CREATE TABLE public.order_items(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,product_id TEXT NOT NULL,product_name TEXT NOT NULL,quantity INTEGER NOT NULL,price_at_purchase INTEGER NOT NULL);CREATE TABLE public.fixture_fault(enabled BOOLEAN NOT NULL);INSERT INTO public.fixture_fault VALUES(false);CREATE FUNCTION public.inject_item_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF (SELECT enabled FROM public.fixture_fault) THEN RAISE EXCEPTION 'INJECTED_ITEM_FAILURE'; END IF;RETURN NEW;END $$;CREATE TRIGGER fixture_fail_items BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.inject_item_failure();"""
 (S/'fixture.sql').write_text(ddl+'\n');sql(ddl)
 for scenario in ['valid','items-fault','retry-fault','concurrent','crash']:
  sql("TRUNCATE public.order_items,public.orders; UPDATE public.fixture_fault SET enabled="+('true' if 'fault' in scenario else 'false')+';')
  r=run([NODE,P/'run-current-writer-pg.cjs',R,S,scenario]);
  if scenario=='crash':
   assert r.returncode==77,(r.returncode,r.stderr)
   before=json.loads(sql("SELECT json_build_object('orders',(SELECT count(*) FROM public.orders),'items',(SELECT count(*) FROM public.order_items));"));assert before=={'orders':1,'items':0},before
   recovery=run([NODE,P/'run-current-writer-pg.cjs',R,S,'recover']);assert recovery.returncode==0,recovery.stderr
   results.append({'scenario':'abrupt_application_process_exit_after_committed_header','exitCode':77,'durableRowsNewConnection':before,'recovery':json.loads(recovery.stdout),'safety':'FAIL','notProven':'OS/DB crash; HTTP/client SDK; production schema triggers or RLS'})
  else:
   assert r.returncode==0,(scenario,r.stderr,r.stdout);v=json.loads(r.stdout);v['safety']='PASS_DB_FIXTURE' if scenario=='valid' else 'FAIL';results.append(v)
 (S/'results.json').write_text(json.dumps({'scope':'CURRENT_WRITER_ACTUAL_FUNCTION_REAL_POSTGRESQL_VIA_FINITE_PSQL_ADAPTER','runner':str(P/'run-current-writer-pg.cjs'),'root':str(R),'private_stage':str(S),'schema':'subset matching Prisma relevant columns/FK/integer types; injection trigger fictional','notProven':['HTTP actions','Clerk authentication','Supabase/PostgREST/RLS','production deployed schema/triggers','real Wompi sandbox','OS/DB crash'],'scenarios':results,'total':len(results),'safetyPass':sum(r['safety']=='PASS_DB_FIXTURE' for r in results),'safetyFail':sum(r['safety']=='FAIL' for r in results)},indent=2)+'\n')
finally:
 cleanup={'ownedPID':pid,'started':started}
 if started:
  r=run([B/'pg_ctl','-D',S/'data','-m','fast','-w','stop']);cleanup['stopReturnCode']=r.returncode;cleanup['postmasterPIDFileExists']=(S/'data/postmaster.pid').exists();cleanup['remainingSocketEntries']=[x.name for x in (S/'socket').iterdir()];cleanup['pidAlive']=Path(f'/proc/{pid}').exists()
 (S/'cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
print(json.dumps({'scenarios':len(results),'output':str(S/'results.json'),'cleanup':cleanup}))
