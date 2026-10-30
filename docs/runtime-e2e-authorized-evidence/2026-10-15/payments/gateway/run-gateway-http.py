#!/usr/bin/python3
"""Finite HTTP probes ONLY root-owned loopback PostgREST fixture. No SDK/Clerk/real Supabase identity claim."""
from pathlib import Path
import argparse,json,re,hmac,hashlib,base64,time,urllib.request,urllib.error,os
cli=argparse.ArgumentParser();cli.add_argument('--fixture-env',required=True);cli.add_argument('--postgrest-config',required=True);cli.add_argument('--output',required=True);a=cli.parse_args()
F=Path(a.fixture_env);C=Path(a.postgrest_config)
assert F.resolve()==Path('/tmp/la-gaviota-authorized-e2e-20261015/root/synthetic-service-env.json')
assert C.resolve()==Path('/tmp/la-gaviota-authorized-e2e-20261015/root/postgrest.conf')
config=json.loads(F.read_text());assert config['NEXT_PUBLIC_SUPABASE_URL']=='http://127.0.0.1:47776'
match=re.search(r'^jwt-secret\s*=\s*"([^\"]+)"',C.read_text(),re.M);assert match,'Private fictional gateway HMAC config required';secret=match.group(1).encode();anon=config['NEXT_PUBLIC_SUPABASE_ANON_KEY'];service=config['SUPABASE_SERVICE_ROLE_KEY']
def b64(v):return base64.urlsafe_b64encode(json.dumps(v,separators=(',',':')).encode()).rstrip(b'=').decode()
def jwt(sub='user_TEST_RETAIL_A',role='authenticated',app_role='USER',expired=False,bad_signature=False):
 claims={'role':role,'sub':sub,'iss':'https://clerk.synthetic.invalid','iat':int(time.time())-5,'exp':int(time.time())+300 if not expired else 1,'public_metadata':{'role':app_role}}
 text=b64({'alg':'HS256','typ':'JWT'})+'.'+b64(claims);key=b'FICTIONAL_WRONG_SIGNATURE' if bad_signature else secret;return text+'.'+base64.urlsafe_b64encode(hmac.new(key,text.encode(),hashlib.sha256).digest()).rstrip(b'=').decode()
# Disable proxy environment, no redirects (would widen the endpoint boundary).
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('Redirect forbidden')
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
results=[]
def request(path,token,method='GET',payload=None):
 assert path.startswith('/') and not path.startswith('//') and '://' not in path
 url='http://127.0.0.1:47776/rest/v1'+path
 req=urllib.request.Request(url,method=method,headers={'apikey':anon,'Authorization':'Bearer '+token,'Content-Type':'application/json','Prefer':'return=minimal'},data=json.dumps(payload).encode() if payload is not None else None)
 start=time.monotonic()
 try:
  with opener.open(req,timeout=10) as resp:status=resp.status;body=resp.read(65537)
 except urllib.error.HTTPError as e:status=e.code;body=e.read(65537)
 assert len(body)<=65536,'Bounded result cap exceeded'
 try:data=json.loads(body) if body else None
 except json.JSONDecodeError:data=None
 return status,data,round((time.monotonic()-start)*1000,2)
def case(name,path,token,verify,expected,method='GET',payload=None):
 status,data,ms=request(path,token,method,payload);ok=verify(status,data)
 # Store only counts/error codes/field names. Do not retain JWT, email, phone or actual Clerk IDs.
 observation={'status':status,'durationMs':ms,'rowCount':len(data) if isinstance(data,list) else None,'returnedFields':sorted(data[0]) if isinstance(data,list) and data else [],'errorCode':data.get('code') if isinstance(data,dict) else None}
 results.append({'id':name,'method':method,'path':path,'expected':expected,'actual':observation,'passed':bool(ok)})
 if not ok:raise AssertionError(json.dumps(results[-1]))
def denied(s,d):return s in [401,403] and isinstance(d,dict) and d.get('code')=='42501'
auth=jwt();admin=jwt(app_role='ADMIN')
try:
 case('GW-01-anon-safe-catalog','/products?select=id,name,price_retail&is_active=eq.true',anon,lambda s,d:s==200 and isinstance(d,list) and any(x['id']=='SKU_TEST_A' for x in d) and all(set(x)=={'id','name','price_retail'} for x in d),'200 safe projection; no base_cost or B2B fields')
 case('GW-02-anon-cost-denied','/products?select=id,base_cost',anon,denied,'401/403 SQL42501, no cost rows')
 case('GW-03-anon-private-customer-PII-denied','/customers?select=clerk_user_id,email',anon,denied,'401/403 SQL42501, no PII rows')
 case('GW-04-anon-product-write-denied','/products?id=eq.__NO_SUCH_SYNTHETIC_SKU__',anon,denied,'401/403 SQL42501; impossible target prevents mutation even on unexpected allow','PATCH',{'base_cost':0})
 case('GW-05-auth-own-profile','/customers?select=clerk_user_id&clerk_user_id=eq.user_TEST_RETAIL_A',auth,lambda s,d:s==200 and len(d)==1 and d[0]['clerk_user_id']=='user_TEST_RETAIL_A','200 exactly own synthetic profile')
 case('GW-06-auth-cross-owner-profile-empty','/customers?select=clerk_user_id&clerk_user_id=eq.user_TEST_RETAIL_B',auth,lambda s,d:s==200 and d==[],'200 [] cross-owner filtered by RLS')
 case('GW-07-auth-own-order','/orders?select=id,clerk_user_id&id=eq.b0000000-0000-4000-8000-000000000001',auth,lambda s,d:s==200 and len(d)==1 and d[0]['clerk_user_id']=='user_TEST_RETAIL_A','200 one owned order')
 case('GW-08-auth-cross-owner-order-empty','/orders?select=id,clerk_user_id&id=eq.b0000000-0000-4000-8000-000000000002',auth,lambda s,d:s==200 and d==[],'200 [] cross-owner order filtered')
 case('GW-09-auth-admin-label-no-direct-write','/products?id=eq.__NO_SUCH_SYNTHETIC_SKU__',admin,denied,'403 SQL42501 even with app metadata ADMIN','PATCH',{'base_cost':0})
 case('GW-10-auth-admin-label-no-cross-owner-PII','/customers?select=clerk_user_id&clerk_user_id=eq.user_TEST_RETAIL_B',admin,lambda s,d:s==200 and d==[],'200 [] ADMIN metadata does not grant staff DB authority')
 case('GW-11-invalid-JWT-signature','/products?select=id',jwt(bad_signature=True),lambda s,d:s==401,'401 invalid signature')
 case('GW-12-expired-JWT','/products?select=id',jwt(expired=True),lambda s,d:s==401,'401 expired token')
 case('GW-13-service-role-bypass-cost-positive','/products?select=id,base_cost&id=eq.SKU_TEST_A',service,lambda s,d:s==200 and len(d)==1 and d[0]['base_cost']==7000,'200 base_cost7000 via explicit service_role bypass')
 case('GW-14-service-role-bypass-private-positive','/customers?select=clerk_user_id',service,lambda s,d:s==200 and len(d)>=2 and any(x['clerk_user_id']=='user_TEST_RETAIL_A' for x in d) and any(x['clerk_user_id']=='user_TEST_RETAIL_B' for x in d),'200 multiple owners reachable via service_role; server guard mandatory')
finally:
 report={'scope':'REAL_HTTP_LOOPBACK_GATEWAY_TO_POSTGREST16_4_TO_POSTGRESQL18_FIXTURE','endpoint':'http://127.0.0.1:47776/rest/v1','configuration':'root-owned synthetic HMAC JWT; values never emitted','transport':'urllib real HTTP, proxy disabled, redirects forbidden, explicit localhost endpoint only','notProven':['Clerk issuer/JWKS validation','Clerk session freshness/revocation','Supabase hosted stack/Auth/Storage/Realtime','Next action or callback dispatch','production DB grants/policies','payments'],'positiveDML':0,'deniedWriteTargets':'nonexistent fixture IDs only','cases':len(results),'pass':sum(x['passed'] for x in results),'fail':sum(not x['passed'] for x in results),'results':results}
 Path(a.output).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'cases':report['cases'],'pass':report['pass'],'fail':report['fail'],'output':a.output}))
