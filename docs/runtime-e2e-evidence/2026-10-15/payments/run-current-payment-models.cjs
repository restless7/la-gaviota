'use strict';
// Diagnostic execution of CURRENT source functions. NOT HTTP, SDK, Supabase or Wompi certification.
// All identities, transactions, secrets and rows are fictional. No .env, network, child processes or SDK clients.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) throw Error('Usage: node script CURRENT_ROOT OUTPUT_JSON');
const ts = require(path.join(root, 'node_modules/typescript'));
const loaded = new Map();
let forbiddenDependencies = 0;
function load(file, stubs, env = {}) {
  const absolute = path.join(root, file), source = fs.readFileSync(absolute, 'utf8');
  loaded.set(file, crypto.createHash('sha256').update(source).digest('hex'));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, Map, Set, Date, FormData,
    console: { log(){}, error(){}, warn(){} }, process: { env }, require(id) {
      if (Object.hasOwn(stubs, id)) return stubs[id];
      forbiddenDependencies++; throw Error(`Forbidden dependency: ${id}`);
    }
  }, { filename: absolute });
  return module.exports;
}
const fixtureSecret = 'FICTIONAL_EVENTS_SECRET';
const wompi = load('src/lib/wompi.ts', { crypto }, { WOMPI_EVENTS_SECRET: fixtureSecret });
const validation = load('src/lib/checkoutValidation.ts', {});
function signedEvent(overrides = {}) {
  const transaction = { id: 'fictional-tx-1', reference: 'order-a', status: 'APPROVED', currency: 'COP', amount_in_cents: 1500000, ...overrides };
  const properties = ['transaction.id','transaction.status','transaction.amount_in_cents'];
  const timestamp = 1234567890;
  const checksum = crypto.createHash('sha256').update(properties.map(p=>transaction[p.split('.')[1]]).join('')+timestamp+fixtureSecret).digest('hex');
  return { event: 'transaction.updated', environment: 'test', timestamp, signature: { properties, checksum }, data: { transaction } };
}
const clone = value => JSON.parse(JSON.stringify(value));
function order(id='order-a', owner='user_owner_a') {
  return { id, clerk_user_id: owner, status: 'Pago Pendiente', payment_method: 'wompi', total_amount: 15000, notes: '', customer_phone: 'FICTIONAL', customer_name: 'Fixture' };
}
function database(options={}) {
  const state = { orders: [order(),order('order-b','user_owner_b')], order_items: [{ order_id: 'order-a', product_id:'sku-1',quantity:2 },{ order_id:'order-b',product_id:'sku-1',quantity:2 }], products: [{ id:'sku-1',stock_quantity:10 }], customers: [], abandoned_carts: [], b2b_credit_profiles: options.profiles || [] };
  const ops = [];
  let selectBarrierWaiters = [], orderReads = 0;
  function match(row, filters) { return filters.every(([type,k,v]) => type==='eq' ? row[k]===v : type==='in' ? v.includes(row[k]) : String(row[k]).toLowerCase().startsWith(v.slice(0,-1).toLowerCase())); }
  class Query {
    constructor(table) { this.table=table;this.filters=[];this.verb='select';this.payload=null;this.isSingle=false;this.promise=null; }
    select(){return this;} eq(k,v){this.filters.push(['eq',k,v]);return this;} in(k,v){this.filters.push(['in',k,v]);return this;} ilike(k,v){this.filters.push(['ilike',k,v]);return this;}
    update(payload){this.verb='update';this.payload=payload;return this;} insert(payload){this.verb='insert';this.payload=payload;return this;} single(){this.isSingle=true;return this;}
    then(resolve,reject) { if(!this.promise)this.promise=this.execute();return this.promise.then(resolve,reject); }
    async execute() {
      ops.push({ table:this.table, verb:this.verb, filters:clone(this.filters), payload:clone(this.payload) });
      const rows=state[this.table]; if(!rows)throw Error(`Unapproved fixture table ${this.table}`);
      if(options.failInsert===this.table && this.verb==='insert' || options.failUpdate===this.table && this.verb==='update') return {data:null,error:{code:'INJECTED_FAILURE'}};
      if(this.verb==='insert') {
        const payloads=Array.isArray(this.payload)?this.payload:[this.payload];
        const inserted=payloads.map(p=>({...clone(p),id:p.id||`created-${rows.length+1}`}));
        rows.push(...inserted);return {data:this.isSingle?clone(inserted[0]):clone(inserted),error:null};
      }
      const selected=rows.filter(r=>match(r,this.filters));
      if(this.verb==='update') { selected.forEach(r=>Object.assign(r,clone(this.payload)));return {data:null,error:null}; }
      const snapshot=clone(selected);
      if(options.concurrentOrderReads && this.table==='orders' && this.isSingle && ++orderReads<=2) {
        await new Promise(resolve=>{selectBarrierWaiters.push(resolve);if(selectBarrierWaiters.length===2)selectBarrierWaiters.forEach(fn=>fn());});
      }
      if(this.isSingle) return snapshot.length===1?{data:snapshot[0],error:null}:{data:null,error:{code:'FIXTURE_SINGLE_CARDINALITY'}};
      return {data:snapshot,error:null};
    }
  }
  return { state,ops,from:table=>new Query(table) };
}
function callbackHarness(options={}) {
  const db=database(options);let notifications=0,settingsReads=0;
  const route=load('app/api/webhooks/wompi/route.ts', {
    'next/server':{NextResponse:{json:(body,opts)=>({status:opts.status,body})}},
    '@/src/lib/wompi':wompi,'@supabase/supabase-js':{createClient:()=>db},
    '@/src/lib/notifications':{triggerOrderNotification:async()=>{notifications++;}},
    '@/src/actions/settings':{getInventorySettings:async()=>{settingsReads++;if(options.settingsFault)throw Error('INJECTED_AFTER_STATUS');return {track_inventory:options.trackInventory!==false};}},
    '@/src/lib/metaCapi':{sendPurchaseEventToMeta:async()=>{}}
  }, {NEXT_PUBLIC_SUPABASE_URL:'https://database.fixture.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'FICTIONAL_ANON_KEY'});
  return {db,send:event=>route.POST({json:async()=>clone(event)}),stats:()=>({notifications,settingsReads})};
}
const flush=async()=>{for(let i=0;i<15;i++)await new Promise(resolve=>setImmediate(resolve));};
const results=[];
async function diagnostic(id,expectedSafety,fn) {
  const observed=await fn();results.push({id,diagnostic:'OBSERVATION_CONFIRMED',safety:expectedSafety,evidence:observed});
}
(async()=>{
 await diagnostic('PAY-01-valid-approved-happy-path','PASS_MODEL',async()=>{const h=callbackHarness();const response=await h.send(signedEvent());await flush();assert.equal(response.status,200);assert.equal(h.db.state.orders[0].status,'Pendiente');assert.equal(h.stats().notifications,1);assert.equal(h.db.state.products[0].stock_quantity,8);return {response,status:h.db.state.orders[0].status,...h.stats(),stock:8};});
 await diagnostic('PAY-02-pending-no-financial-writes','PASS_MODEL',async()=>{const h=callbackHarness();const response=await h.send(signedEvent({status:'PENDING'}));assert.equal(response.status,200);assert.equal(h.db.ops.length,0);return{response,operations:0};});
 await diagnostic('PAY-03-invalid-signature-no-db','PASS_MODEL',async()=>{const h=callbackHarness(),e=signedEvent();e.signature.checksum='00'.repeat(32);const response=await h.send(e);assert.equal(response.status,401);assert.equal(h.db.ops.length,0);return{response,operations:0};});
 await diagnostic('PAY-04-reference-substitution-other-owner','FAIL',async()=>{const h=callbackHarness(),e=signedEvent();e.data.transaction.reference='order-b';const response=await h.send(e);await flush();assert.equal(response.status,200);assert.equal(h.db.state.orders[0].status,'Pago Pendiente');assert.equal(h.db.state.orders[1].status,'Pendiente');return {response,signedOriginalReference:'order-a',acceptedReference:'order-b',acceptedOwner:'user_owner_b',orders:h.db.state.orders.map(({id,status,clerk_user_id})=>({id,status,clerk_user_id}))};});
 await diagnostic('PAY-05-sequential-callback-replay','PASS_MODEL',async()=>{const h=callbackHarness();const responses=[await h.send(signedEvent()),await h.send(signedEvent())];await flush();assert.equal(h.stats().notifications,1);assert.equal(h.db.ops.filter(o=>o.table==='orders'&&o.verb==='update').length,1);return{responses,orderUpdates:1,...h.stats()};});
 await diagnostic('PAY-06-concurrent-identical-callbacks','FAIL',async()=>{const h=callbackHarness({concurrentOrderReads:true});const responses=await Promise.all([h.send(signedEvent()),h.send(signedEvent())]);await flush();const updates=h.db.ops.filter(o=>o.table==='orders'&&o.verb==='update').length;assert.equal(updates,2);assert.equal(h.stats().notifications,2);return {responses,orderUpdates:updates,...h.stats(),stock:h.db.state.products[0].stock_quantity};});
 await diagnostic('PAY-07-fault-after-status-retry-skips-recovery','FAIL',async()=>{const h=callbackHarness({settingsFault:true});const first=await h.send(signedEvent());const second=await h.send(signedEvent());await flush();assert.equal(first.status,500);assert.equal(second.status,200);assert.equal(h.db.state.orders[0].status,'Pendiente');assert.equal(h.db.state.products[0].stock_quantity,10);return{first,second,status:h.db.state.orders[0].status,stock:10,...h.stats(),fault:'dependency error after durable status; not process crash'};});
 await diagnostic('PAY-08-stock-write-failure-acknowledged-and-not-recovered','FAIL',async()=>{const h=callbackHarness({failUpdate:'products'});const first=await h.send(signedEvent());await flush();const second=await h.send(signedEvent());await flush();assert.equal(first.status,200);assert.equal(second.status,200);assert.equal(h.db.state.products[0].stock_quantity,10);return{first,second,stock:10,attemptedStockUpdates:h.db.ops.filter(o=>o.table==='products'&&o.verb==='update').length};});
 await diagnostic('PAY-09-BAL-truncated-subject-ambiguous-acknowledged','FAIL',async()=>{const h=callbackHarness({profiles:[{user_id:'user_owner_a',credit_balance:100000},{user_id:'user_owner_b',credit_balance:100000}]});const response=await h.send(signedEvent({reference:'BAL_user_own_1234567890'}));assert.equal(response.status,200);assert.equal(h.db.state.b2b_credit_profiles[0].credit_balance,100000);assert.equal(h.db.state.b2b_credit_profiles[1].credit_balance,100000);return {response,lookup:h.db.ops.find(o=>o.table==='b2b_credit_profiles'),balances:h.db.state.b2b_credit_profiles};});
 await diagnostic('PAY-10-BAL-prefix-can-update-unrelated-single-profile','FAIL',async()=>{const h=callbackHarness({profiles:[{user_id:'user_unrelated',credit_balance:100000}]});const response=await h.send(signedEvent({reference:'BAL_user_own_1234567890'}));assert.equal(response.status,200);assert.equal(h.db.state.b2b_credit_profiles[0].credit_balance,85000);return {response,acceptedProfile:h.db.state.b2b_credit_profiles[0],lookup:h.db.ops.find(o=>o.table==='b2b_credit_profiles')};});
 await diagnostic('PAY-11-BAL-identical-event-replay-double-credit','FAIL',async()=>{const h=callbackHarness({profiles:[{user_id:'user_owner_a',credit_balance:100000}]});const event=signedEvent({reference:'BAL_user_own_1234567890'});await h.send(event);await h.send(event);assert.equal(h.db.state.b2b_credit_profiles[0].credit_balance,70000);return {balance:h.db.state.b2b_credit_profiles[0].credit_balance,duplicateIdenticalTransaction:true,creditUpdates:h.db.ops.filter(o=>o.table==='b2b_credit_profiles'&&o.verb==='update').length};});
 await diagnostic('PAY-12-unsigned-environment-mismatch-not-rejected','FAIL',async()=>{const h=callbackHarness();const event=signedEvent();event.environment='prod';const response=await h.send(event);await flush();assert.equal(response.status,200);assert.equal(h.db.state.orders[0].status,'Pendiente');return{response,expectedFixtureEnvironment:'test',submittedEnvironment:'prod',status:h.db.state.orders[0].status};});
 function writerHarness(options={}) {const db=database(options);db.state.orders=[];db.state.order_items=[];const writer=load('src/lib/server/orderWriter.ts',{'server-only':{},'next/cache':{revalidatePath(){}},'./authorization':{requireOwnedSubject:async subject=>{assert.equal(subject,'user_owner_a');return{userId:subject};}},'./database':{getServerDatabase:()=>db},'@/src/lib/checkoutValidation':validation});return{db,create:()=>writer.createOrder({clerk_user_id:'user_owner_a',total_amount:15000,status:'Pago Pendiente',payment_method:'wompi'},[{product_id:'sku-1',product_name:'Fixture',quantity:1,price_at_purchase:10000}],false)};}
 await diagnostic('PAY-13-writer-items-failure-persists-header','FAIL',async()=>{const h=writerHarness({failInsert:'order_items'});await assert.rejects(h.create(),/Failed to create order items/);assert.equal(h.db.state.orders.length,1);assert.equal(h.db.state.order_items.length,0);return {orders:h.db.state.orders.length,items:0,operationSequence:h.db.ops.map(({table,verb})=>({table,verb}))};});
 await diagnostic('PAY-14-writer-failed-client-retry-duplicates-orphan-headers','FAIL',async()=>{const h=writerHarness({failInsert:'order_items'});await assert.rejects(h.create());await assert.rejects(h.create());assert.equal(h.db.state.orders.length,2);return{orders:2,items:0};});
 await diagnostic('PAY-15-writer-concurrent-identical-submit-two-orders','FAIL',async()=>{const h=writerHarness();const responses=await Promise.all([h.create(),h.create()]);assert.equal(h.db.state.orders.length,2);assert.equal(h.db.state.order_items.length,2);return{responses,orders:2,items:2};});
 await diagnostic('PAY-16-writer-header-failure-no-items','PASS_MODEL',async()=>{const h=writerHarness({failInsert:'orders'});await assert.rejects(h.create(),/Failed to create order$/);assert.equal(h.db.state.orders.length,0);assert.equal(h.db.state.order_items.length,0);return{orders:0,items:0};});
 assert.equal(forbiddenDependencies,0);
 const after=Object.fromEntries([...loaded].map(([file])=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
 for(const[file,hash]of loaded)assert.equal(after[file],hash);
 const report={scope:'CURRENT_WORKTREE_SOURCE_VM_WITH_FICTIONAL_STATEFUL_DB_AND_FAULTS',notProven:['HTTP dispatch','Clerk verification','Supabase/PostgREST/RLS','Wompi sandbox','real PostgreSQL semantics','process kill/durable crash recovery'],loadedSources:Object.fromEntries(loaded),sourceStable:true,forbiddenDependencies,networkClientsLoaded:0,diagnosticCases:results.length,safetyPassModel:results.filter(r=>r.safety==='PASS_MODEL').length,safetyFail:results.filter(r=>r.safety==='FAIL').length,results};
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({diagnosticCases:report.diagnosticCases,safetyPassModel:report.safetyPassModel,safetyFail:report.safetyFail,sourceStable:report.sourceStable,forbiddenDependencies,output:out}));
})().catch(error=>{console.error(error);process.exitCode=1;});
