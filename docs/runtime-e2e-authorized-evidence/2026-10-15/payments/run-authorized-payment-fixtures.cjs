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
const FixtureDate=class extends Date { constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00.000Z']));}static now(){return 1792065600000;} };
function load(file, stubs, env = {}) {
  const absolute = path.join(root, file), source = fs.readFileSync(absolute, 'utf8');
  loaded.set(file, crypto.createHash('sha256').update(source).digest('hex'));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, Map, Set, Date: FixtureDate, FormData,
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
    '@/src/lib/wompi':options.wompi || wompi,'@supabase/supabase-js':{createClient:()=>db},
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
 await diagnostic('AUTH-PAY-01-declined-terminal','PASS_MODEL',async()=>{const h=callbackHarness();const r=await h.send(signedEvent({status:'DECLINED'}));await flush();assert.equal(r.status,200);assert.equal(h.db.state.orders[0].status,'Cancelado');assert.equal(h.db.state.products[0].stock_quantity,10);assert.equal(h.stats().notifications,0);return{response:r,orderStatus:'Cancelado',stock:10,notifications:0};});
 await diagnostic('AUTH-PAY-02-pending-then-approved','PASS_MODEL',async()=>{const h=callbackHarness();const pending=await h.send(signedEvent({status:'PENDING'}));assert.equal(h.db.state.orders[0].status,'Pago Pendiente');assert.equal(h.db.ops.length,0);const approved=await h.send(signedEvent());await flush();assert.equal(h.db.state.orders[0].status,'Pendiente');assert.equal(h.stats().notifications,1);assert.equal(h.db.state.products[0].stock_quantity,8);return{responses:[pending,approved],orderStatus:'Pendiente',stock:8,notifications:1};});
 await diagnostic('AUTH-PAY-03-approved-then-late-pending','PASS_MODEL',async()=>{const h=callbackHarness();const approved=await h.send(signedEvent());await flush();const latePending=await h.send(signedEvent({status:'PENDING'}));await flush();assert.equal(h.db.state.orders[0].status,'Pendiente');assert.equal(h.stats().notifications,1);assert.equal(h.db.state.products[0].stock_quantity,8);return{responses:[approved,latePending],orderStatus:'Pendiente',stock:8,notifications:1};});
 await diagnostic('AUTH-PAY-04-declined-then-late-pending','PASS_MODEL',async()=>{const h=callbackHarness();await h.send(signedEvent({status:'DECLINED'}));const r=await h.send(signedEvent({status:'PENDING'}));await flush();assert.equal(h.db.state.orders[0].status,'Cancelado');assert.equal(h.db.state.products[0].stock_quantity,10);return{response:r,orderStatus:'Cancelado',stock:10,notifications:h.stats().notifications};});
 await diagnostic('AUTH-PAY-05-approved-then-late-decline-preserves-terminal','PASS_MODEL',async()=>{const h=callbackHarness();await h.send(signedEvent());await flush();const r=await h.send(signedEvent({status:'DECLINED'}));await flush();assert.equal(h.db.state.orders[0].status,'Pendiente');assert.equal(h.stats().notifications,1);return{response:r,orderStatus:'Pendiente',stock:h.db.state.products[0].stock_quantity,notifications:1,limitation:'Does not establish authoritative ordering or valid provider lifecycle; observes stale terminal replay guard only'};});
 await diagnostic('AUTH-PAY-06-concurrent-opposite-transactions-same-unsigned-reference','FAIL',async()=>{const h=callbackHarness({concurrentOrderReads:true});const rs=await Promise.all([h.send(signedEvent({id:'fixture-approved-tx',status:'APPROVED'})),h.send(signedEvent({id:'fixture-declined-tx',status:'DECLINED'}))]);await flush();assert.equal(h.db.state.orders[0].status,'Cancelado');assert.equal(h.db.state.products[0].stock_quantity,8);assert.equal(h.stats().notifications,1);return{responses:rs,orderStatus:'Cancelado',stock:8,notifications:1,condition:'Two independently signed fictional transaction IDs directed at same unsigned order reference; not claim provider emits contradictory statuses for one transaction'};});
 await diagnostic('AUTH-PAY-07-transient-order-update-error-retry','PASS_MODEL',async()=>{const options={failUpdate:'orders'},h=callbackHarness(options);const first=await h.send(signedEvent({status:'DECLINED'}));assert.equal(first.status,500);assert.equal(h.db.state.orders[0].status,'Pago Pendiente');delete options.failUpdate;const second=await h.send(signedEvent({status:'DECLINED'}));assert.equal(second.status,200);assert.equal(h.db.state.orders[0].status,'Cancelado');return{first,second,orderStatus:'Cancelado',stock:h.db.state.products[0].stock_quantity};});
 await diagnostic('AUTH-PAY-08-amount-mismatch-mutates-order','FAIL',async()=>{const h=callbackHarness();const r=await h.send(signedEvent({amount_in_cents:1000000}));await flush();assert.equal(r.status,200);assert.equal(h.db.state.orders[0].status,'Cancelado');return{response:r,orderStatus:'Cancelado',stock:10,expected:'Reject mismatching transaction without mutating an unrelated pending order; covered by binding defect family'};});
 await diagnostic('AUTH-PAY-09-nonCOP-rejected-without-db','PASS_MODEL',async()=>{const h=callbackHarness();const r=await h.send(signedEvent({currency:'USD'}));assert.equal(r.status,400);assert.equal(h.db.ops.length,0);return{response:r,operations:0};});
 await diagnostic('AUTH-PAY-10-missing-event-secret-no-db','PASS_MODEL',async()=>{const noSecret=load('src/lib/wompi.ts',{crypto},{});const h=callbackHarness({wompi:noSecret});const r=await h.send(signedEvent());assert.equal(r.status,401);assert.equal(h.db.ops.length,0);return{response:r,operations:0};});
 assert.equal(forbiddenDependencies,0);
 for(const[file,hash]of loaded)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash);
 const report={scope:'CURRENT_SOURCE_VM_FICTIONAL_OFFICIAL_SCHEMA_SHAPE_NOT_PROVIDER_SANDBOX',fixtureClock:'2026-10-15T12:00:00.000Z',loadedSources:Object.fromEntries(loaded),sourceStable:true,forbiddenDependencies,networkClientsLoaded:0,cases:results.length,safetyPassModel:results.filter(r=>r.safety==='PASS_MODEL').length,safetyFail:results.filter(r=>r.safety==='FAIL').length,notProven:['HTTP','Clerk/Supabase/Wompi SDKs','Wompi sandbox','real provider delivery/order lifecycle','DB triggers/RLS/transaction isolation'],results};fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.cases,safetyPassModel:report.safetyPassModel,safetyFail:report.safetyFail,output:out}));
})().catch(e=>{console.error(e);process.exitCode=1;});
