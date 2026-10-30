#!/usr/bin/python3
"""Private Unix-only real PostgreSQL fixture. No env/config/secrets imported. No production endpoint support."""
from pathlib import Path
import os,json,subprocess,hashlib,time,stat,re,sys
S=Path('/tmp/la-gaviota-runtime-e2e-20261015/security/private-pg'); BIN=Path('/usr/lib/postgresql/18/bin'); ENV={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','LC_ALL':'C.UTF-8'};PORT='55473'; OWNER='lg_r1b_fixture_owner'; DATA=S/'data'; SOCKET=S/'socket';results=[];started=False;pid=None

def guard():
 assert __import__('shutil').disk_usage(S).free>=1024*1024*1024, 'Require1GiB free'
 assert S.resolve()==S and not S.is_symlink() and stat.S_IMODE(S.stat().st_mode)==0o700
 assert (S/'SYNTHETIC_ONLY.sentinel').read_text()=='LA_GAVIOTA_RUNTIME_E2E_20261015_SYNTHETIC_LOCAL_POSTGRES_ONLY\n'
 assert DATA.parent.resolve()==S and SOCKET.resolve()==S/'socket' and not DATA.is_symlink()

def run(args,**kw):
 guard();return subprocess.run([str(a) for a in args],env=ENV,cwd=S,text=True,capture_output=True,timeout=kw.pop('timeout',30),**kw)

def sql(text,role=None,claims=None,operation='object.get_authenticated'):
 guard();assert started
 quoted=json.dumps(claims or {},separators=(',',':')).replace("'","''")
 prefix=f"BEGIN; SET LOCAL ROLE {role or OWNER}; SELECT set_config('request.jwt.claims','{quoted}',true); SELECT set_config('request.storage_operation','{operation}',true);"
 # Every call checks the exact disposable cluster path before the test transaction.
 check=f"DO $$ BEGIN IF current_setting('data_directory') <> '{DATA}' THEN RAISE EXCEPTION 'WRONG CLUSTER'; END IF; END $$;"
 r=run([BIN/'psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-h',SOCKET,'-p',PORT,'-U',OWNER,'-d','postgres','-c',check+prefix+text+';ROLLBACK;'])
 return r

def case(name,query,expected=None,error=None,role='authenticated',claims=None,operation='object.get_authenticated'):
 r=sql(query,role,claims,operation); lines=[x for x in r.stdout.splitlines() if x.strip()]
 value=lines[-1] if lines else None
 passed=(r.returncode!=0 and (error in r.stderr if error else False)) if error else (r.returncode==0 and value==expected)
 row={'name':name,'role':role,'expected':{'error_sqlstate':error} if error else {'value':expected},'passed':passed,'returncode':r.returncode,'actual':value,'stderr':r.stderr.strip() if r.returncode else None};results.append(row)
 if not passed:print(json.dumps(row),flush=True)

def claims(actor,**updates):
 d={'sub':'user_SYNTHETIC_'+actor,'role':'authenticated','iss':'https://clerk.synthetic.invalid','exp':4102444800,'public_metadata':{'role':'ADMIN' if actor=='admin' else 'SUPER_ADMIN' if actor=='superadmin' else 'USER'}}; d.update(updates);return d

try:
 guard();assert not DATA.exists(), 'Refusing existing cluster; preserve prior evidence and inspect separately.'
 assert __import__('shutil').disk_usage(S).free>=1024*1024*1024, 'Require1GiB free before initialization'
 r=run([BIN/'initdb','-D',DATA,'-U',OWNER,'--auth-local=trust','--auth-host=reject','--encoding=UTF8','--no-locale'],timeout=40);(S/'logs/initdb.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 opts=f"-c listen_addresses='' -c unix_socket_directories='{SOCKET}' -c unix_socket_permissions=0700 -c port={PORT} -c max_connections=8 -c shared_buffers=16MB -c log_statement=none -c log_min_error_statement=panic"
 r=run([BIN/'pg_ctl','-D',DATA,'-l',S/'logs/postgres.log','-o',opts,'-w','start'],timeout=40);(S/'logs/startup.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr;started=True;pid=int((DATA/'postmaster.pid').read_text().splitlines()[0])
 def setup(text,name):
  r=sql(text);(S/('logs/'+name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 # sql() rolls back tests; setup uses a dedicated commit inside input then harmless outer rollback.
 setup((S/'fixture.sql').read_text()+';COMMIT; BEGIN','fixture')
 setup((S/'storage-stub.sql').read_text()+';COMMIT; BEGIN','storage-stub')
 snapshot_tables=[r['table'] for r in json.loads((S/'schema-coverage.json').read_text())]
 def snapshot():
  snap={}
  for table in snapshot_tables:
   r=sql(f"SELECT COALESCE(jsonb_agg(j ORDER BY j::text),'[]'::jsonb)::text FROM (SELECT to_jsonb(t) j FROM {table} t) q",role=OWNER);assert r.returncode==0,r.stderr;snap[table]=json.loads(r.stdout.splitlines()[-1])
  return snap
 before=snapshot();(S/'rows-before.json').write_text(json.dumps(before,sort_keys=True)+'\n')
 candidate=(S/'proposals/lg-r1b-policy-proposal.sql.txt').read_text()
 # Gate absent must deny before policy modification; transaction rollback preserves baseline.
 case('migration_missing_review_gate_aborts',candidate,error='P0001',role=OWNER)
 case('migration_unknown_policy_aborts',"SELECT set_config('lg_r1b.review_gate','SYNTHETIC_OR_REVIEWED_METADATA_ONLY',false); CREATE POLICY synthetic_unreviewed_policy ON public.products USING(true);"+candidate,error='P0001',role=OWNER)
 setup("SELECT set_config('lg_r1b.review_gate','SYNTHETIC_OR_REVIEWED_METADATA_ONLY',false);"+candidate+';BEGIN','candidate-apply-local-only')
 settings=sql("SELECT json_build_object('version',version(),'data_directory',current_setting('data_directory'),'listen_addresses',current_setting('listen_addresses'),'unix_socket_directories',current_setting('unix_socket_directories'),'port',current_setting('port'))::text");assert settings.returncode==0
 (S/'cluster-settings.json').write_text(settings.stdout.splitlines()[-1]+'\n')
 # Public catalog projection, base-column privilege integrity, hidden product row.
 for role in ['anon','authenticated']:
  c={} if role=='anon' else claims('retail')
  case(role+'_catalog_active_only','SELECT count(*)::text FROM public.catalog_public','1',role=role,claims=c)
  case(role+'_kits_active_only','SELECT count(*)::text FROM public.kits_public','1',role=role,claims=c)
  case(role+'_base_safe_columns_active_only','SELECT count(id)::text FROM public.products','1',role=role,claims=c)
  for secret in ['base_cost','price_micro','price_restaurant','previous_price_micro','previous_price_restaurant','fixture_extra_secret']:
   case(role+'_deny_base_'+secret,f'SELECT {secret}::text FROM public.products',error='42501',role=role,claims=c)
  case(role+'_deny_base_select_star','SELECT * FROM public.products',error='42501',role=role,claims=c)
  case(role+'_safe_view_no_sensitive_columns',"SELECT count(*)::text FROM information_schema.columns WHERE table_schema='public' AND table_name='catalog_public' AND column_name IN ('base_cost','price_micro','price_restaurant')",'0',role=role,claims=c)
 # Owner reads for each synthetic app role/tier. DB never treats application role metadata as staff grant.
 actors=['retail','micro','restaurant','admin','superadmin','operario','commercial','unknown']
 owner_tables={'customers':'clerk_user_id','orders':'id','order_items':'id','b2b_credit_profiles':'id','buying_templates':'id','business_applications':'id'}
 for actor in actors:
  c=claims(actor)
  for table,col in owner_tables.items():
   case(actor+'_owns_'+table,f'SELECT count({col})::text FROM public.{table}','1',claims=c)
   target="'user_SYNTHETIC_micro'" if actor!='micro' else "'user_SYNTHETIC_retail'"
   ownercol='clerk_user_id' if table in ['customers','orders','business_applications'] else 'user_id'
   q=(f'SELECT count({col})::text FROM public.{table} WHERE {ownercol}={target}') if table!='order_items' else "SELECT count(id)::text FROM public.order_items WHERE order_id='10000000-0000-0000-0000-000000000008'" if actor!='unknown' else "SELECT count(id)::text FROM public.order_items WHERE order_id='10000000-0000-0000-0000-000000000001'"
   case(actor+'_cross_owner_'+table,q,'0',claims=c)
  case(actor+'_cannot_update_price',"UPDATE public.products SET price_retail=1 WHERE id='synthetic-active' RETURNING 'mutated'",error='42501',claims=c)
  case(actor+'_cannot_update_own_credit',"UPDATE public.customers SET credit_limit=999999 RETURNING 'mutated'",error='42501',claims=c)
  case(actor+'_cannot_insert_order',"INSERT INTO public.orders(id) VALUES ('90000000-0000-0000-0000-000000000001') RETURNING 'mutated'",error='42501',claims=c)
 # Missing/invalid ownership and metadata/tier spoof attempts.
 for name,c in [('missing',{}),('empty_sub',claims('retail',sub='')),('uuid_sub',claims('retail',sub='00000000-0000-0000-0000-000000000001')),('wrong_transport_role',claims('retail',role='ADMIN')),('missing_transport_role',{'sub':'user_SYNTHETIC_retail'}),('fake_admin_metadata',claims('retail',user_metadata={'role':'SUPER_ADMIN'},public_metadata={'role':'SUPER_ADMIN'})),('stale_admin_claim',claims('retail',public_metadata={'role':'ADMIN'}))]:
  expect='1' if name in ['fake_admin_metadata','stale_admin_claim'] else '0'
  case(name+'_owner_rows','SELECT count(clerk_user_id)::text FROM public.customers',expect,claims=c)
  case(name+'_no_staff_update',"UPDATE public.products SET base_cost=0 RETURNING 'mutated'",error='42501',claims=c)
 for table in owner_tables:
  case('guest_deny_'+table,f'SELECT * FROM public.{table}',error='42501',role='anon')
 # Deny all direct writes for all 17 application tables, incl admin JWT and guest.
 coverage=json.loads((S/'schema-coverage.json').read_text())
 for role,actor in [('anon',None),('authenticated','retail'),('authenticated','admin'),('authenticated','superadmin')]:
  for row in coverage:
   table=row['table']
   if not table.startswith('public.'):continue
   case((actor or 'guest')+'_deny_delete_'+table,f'DELETE FROM {table} RETURNING 1',error='42501',role=role,claims=claims(actor) if actor else {})
 # No sensitive server tables readable through an authenticated ordinary/admin JWT.
 for table in ['abandoned_carts','agricultural_shrinkage_logs','audit_logs','daily_operational_ledgers','global_settings','kit_items','marketing_leads','suppliers','system_settings']:
  for actor in ['retail','admin']:
   case(actor+'_deny_private_'+table,f'SELECT * FROM public.{table}',error='42501',claims=claims(actor))
 # Storage row/API-context model is stubbed; does not test CDN GET or Storage gateway.
 for role,actor in [('anon',None),('authenticated','retail'),('authenticated','admin'),('authenticated','superadmin')]:
  c=claims(actor) if actor else {};label=actor or 'guest'
  case(label+'_storage_bucket_metadata_denied','SELECT * FROM storage.buckets',error='42501',role=role,claims=c)
  case(label+'_storage_bucket_flag_mutation_denied',"UPDATE storage.buckets SET public=true WHERE id='private-customer-files' RETURNING 1",error='42501',role=role,claims=c)
  case(label+'_storage_public_get_rows','SELECT count(*)::text FROM storage.objects','2',role=role,claims=c)
  case(label+'_storage_private_get_rows',"SELECT count(*)::text FROM storage.objects WHERE bucket_id='private-customer-files'",'0',role=role,claims=c)
  case(label+'_storage_list_denied','SELECT count(*)::text FROM storage.objects','0',role=role,claims=c,operation='object.list')
  case(label+'_storage_missing_operation_denied','SELECT count(*)::text FROM storage.objects','0',role=role,claims=c,operation='')
  for op,q in [('insert',"INSERT INTO storage.objects(id,bucket_id,name) VALUES ('80000000-0000-0000-0000-000000000001','product-images','synthetic/new.jpg') RETURNING 1"),('update',"UPDATE storage.objects SET name='changed' RETURNING 1"),('delete','DELETE FROM storage.objects RETURNING 1')]:case(label+'_storage_'+op+'_denied',q,error='42501',role=role,claims=c)
 case('expired_claim_owner_read_limitation_sql_stub_not_gateway','SELECT count(clerk_user_id)::text FROM public.customers','1',claims=claims('retail',exp=1))
 case('expired_staff_claim_still_no_mutation',"UPDATE public.products SET base_cost=0 RETURNING 1",error='42501',claims=claims('retail',exp=1,public_metadata={'role':'ADMIN'}))
 # Service-role bypass is intentionally demonstrated, never interpreted as per-actor RLS enforcement.
 for table in ['products','customers','orders','order_items','suppliers','audit_logs','marketing_leads','abandoned_carts','system_settings','global_settings','b2b_credit_profiles','buying_templates','business_applications','kits','kit_items','agricultural_shrinkage_logs','daily_operational_ledgers']:
  case('service_bypass_can_select_'+table,f"SELECT 'readable' FROM (SELECT * FROM public.{table}) x LIMIT 0",expected=None,role='service_role') if False else case('service_bypass_can_select_'+table,f"SELECT (count(*)>=0)::text FROM public.{table}",'true',role='service_role')
 case('service_bypass_reads_all_customer_owners','SELECT count(*)::text FROM public.customers','8',role='service_role',claims={})
 case('service_bypass_mutates_cost_without_actor_guard',"UPDATE public.products SET base_cost=999 WHERE id='synthetic-active' RETURNING base_cost::text",'999',role='service_role',claims={})
 case('service_bypass_storage_private_rows','SELECT count(*)::text FROM storage.objects','3',role='service_role',claims={})
 case('service_bypass_storage_write',"INSERT INTO storage.objects(id,bucket_id,name) VALUES ('80000000-0000-0000-0000-000000000001','product-images','synthetic/server.jpg') RETURNING name",'synthetic/server.jpg',role='service_role',claims={})
 # Rolled-back positive writes must not persist.
 case('no_durable_cost_delta_after_service_test',"SELECT base_cost::text FROM public.products WHERE id='synthetic-active'",'111',role=OWNER)
 case('no_durable_storage_delta_after_service_test','SELECT count(*)::text FROM storage.objects','3',role=OWNER)
 # Owner helper not exposed RPC / definer elevation. No new SECURITY DEFINER functions.
 case('helper_security_invoker',"SELECT prosecdef::text FROM pg_proc WHERE oid='lg_private.clerk_subject()'::regprocedure",'false',role=OWNER)
 case('catalog_view_security_invoker',"SELECT (reloptions @> ARRAY['security_invoker=true'])::text FROM pg_class WHERE oid='public.catalog_public'::regclass",'true',role=OWNER)
 case('service_role_bypass_explicit',"SELECT rolbypassrls::text FROM pg_roles WHERE rolname='service_role'",'true',role=OWNER)
 # Current application projection compatibility (SQL analogue; not PostgREST API).
 case('current_anon_fetchProducts_projection',"SELECT jsonb_array_length(jsonb_agg(to_jsonb(p)))::text FROM (SELECT id,name,category,subcategory,unit,price_retail,previous_price_retail,stock_quantity,is_active,is_in_season,image_url,description FROM public.products WHERE is_active=true) p",'1',role='anon')
 case('current_anon_fetchProducts_kits_projection',"SELECT jsonb_array_length(jsonb_agg(to_jsonb(k)))::text FROM (SELECT id,name,fixed_price,banner_url,status FROM public.kits WHERE status='active') k",'1',role='anon')
 case('current_anon_catalog_extra_cost_denied','SELECT id,base_cost FROM public.products',error='42501',role='anon')
 case('current_anon_webhook_order_read_blocked',"SELECT notes,customer_phone,customer_name,total_amount,clerk_user_id,status,payment_method FROM public.orders LIMIT 1",error='42501',role='anon')
 case('current_anon_webhook_order_write_blocked',"UPDATE public.orders SET status='Pendiente' RETURNING id",error='42501',role='anon')
 case('current_anon_webhook_items_blocked','SELECT product_id,quantity FROM public.order_items',error='42501',role='anon')
 case('current_anon_kanban_orders_blocked','SELECT * FROM public.orders',error='42501',role='anon')
 after=snapshot();(S/'rows-after.json').write_text(json.dumps(after,sort_keys=True)+'\n')
 results.append({'name':'all19_table_rows_unchanged_after_candidate_and_rollback_tests','passed':before==after,'table_count':len(before),'expected':'identical before/after synthetic row snapshots'})
 # Complete fixture fingerprints after rollback-only tests (results only synthetic records).
 digest=sql("SELECT md5(string_agg(x::text,',' ORDER BY x::text)) FROM (SELECT row_to_json(t) x FROM public.customers t) q",role=OWNER)
 (S/'row-state-check.json').write_text(json.dumps({'customer_digest_after':digest.stdout.splitlines()[-1],'positive_write_tests_transactional_rollback':True})+'\n')
except Exception as e:
 (S/'logs/harness-error.txt').write_text(type(e).__name__+': '+str(e)+'\n'); print(type(e).__name__+': '+str(e),flush=True)
 raise
finally:
 (S/'test-results.json').write_text(json.dumps(results,indent=2)+'\n')
 cleanup={'started':started,'pid':pid,'listen_addresses_configured':'','socket_directory':str(SOCKET),'preserved':True}
 if started:
  guard();assert (DATA/'postmaster.pid').exists() and int((DATA/'postmaster.pid').read_text().splitlines()[0])==pid
  assert str(DATA).encode() in Path(f'/proc/{pid}/cmdline').read_bytes()
  r=run([BIN/'pg_ctl','-D',DATA,'-w','-m','fast','stop'],timeout=40);(S/'logs/shutdown.log').write_text(r.stdout+r.stderr);cleanup['stop_exit']=r.returncode
  try:os.kill(pid,0);cleanup['pid_alive']=True
  except ProcessLookupError:cleanup['pid_alive']=False
 cleanup['socket_entries_after']=[p.name for p in SOCKET.iterdir()];cleanup['postmaster_pid_exists_after']=(DATA/'postmaster.pid').exists()
 (S/'cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
 summary={'executed':len(results),'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'scope':'real PostgreSQL18 synthetic SQL roles/RLS/ACL; auth.jwt and Storage operation stubs; NOT JWT/gateway/API/CDN/production proof','cleanup':cleanup,'candidate_sql_sha256':hashlib.sha256((S/'proposals/lg-r1b-policy-proposal.sql.txt').read_bytes()).hexdigest(),'fixture_sha256':hashlib.sha256((S/'fixture.sql').read_bytes()).hexdigest(),'executed_harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'free_bytes_at_completion':__import__('shutil').disk_usage(S).free}
 (S/'test-summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2),flush=True)
