// Execute the real provider with a small deterministic React hook harness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const KEY='nest_finance_v1_1_state', PENDING='nest_sync_outbox_v3';
const copy=x=>JSON.parse(JSON.stringify(x));
function harness(initial, remote, storageSeed) {
  const slots=[], effects=[], timers=new Map(), store=new Map([[KEY,JSON.stringify(initial)]]);
  if (storageSeed) for (const [k,v] of storageSeed) store.set(k,v);
  const operations=new Map(); const base=copy(remote);
  let cursor=0, dirty=true, value, provider, failPost=false, posts=0, gets=0, nextTimer=1;
  const react={
    createContext:()=>({Provider:'provider'}), useContext:()=>value,
    useState(init){const i=cursor++;if(!(i in slots))slots[i]=init;return [slots[i],v=>{const next=typeof v==='function'?v(slots[i]):v;if(next!==slots[i]){slots[i]=next;dirty=true;}}];},
    useRef(init){const i=cursor++;return slots[i]||(slots[i]={current:init});},
    useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((d,j)=>!Object.is(d,slots[i][j]))){slots[i]=deps;effects.push(fn);}},
    useCallback:fn=>fn, createElement:(_,props)=>{value=props.value;return null;}
  };
  const cache={};
  function load(file){file=path.resolve(file);if(cache[file])return cache[file].exports;
    const module={exports:{}};cache[file]=module;
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
    vm.runInNewContext(code,{module,exports:module.exports,require:n=>n==='react'?react:n.startsWith('@/')?load('src/'+n.slice(2)+'.ts'):require(n),
      console,Date,URLSearchParams,atob,btoa,crypto:require("node:crypto").webcrypto,
      localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
      sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
      window:{location:{search:''},addEventListener(){},removeEventListener(){}},
      document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},
      setTimeout:fn=>{const id=nextTimer++;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval:()=>{},
      fetch:async(_,options)=>{if(options.method==='POST'){posts++;if(failPost)return {ok:false,json:async()=>({success:false})};const body=JSON.parse(options.body);assert.equal(body.protocol,3);operations.set(body.operation.id,body.operation);remote=load('src/lib/syncJournal.ts').applyOperations(base,[...operations.values()]);return {ok:true,json:async()=>({success:true,operationId:body.operation.id})};}else gets++;
        return {ok:true,json:async()=>({success:true,data:copy(remote)})};}
    },{filename:file});return module.exports;
  }
  provider=load('src/context/FinanceContext.tsx').FinanceProvider;
  async function settle(){for(let i=0;i<40;i++){if(dirty){dirty=false;cursor=0;provider({children:null});while(effects.length)effects.shift()();}await Promise.resolve();}}
  return {settle, get value(){return value;},store,get remote(){return remote;}, get posts(){return posts;},get gets(){return gets;},set failPost(v){failPost=v;},async flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}await settle();},load};
}
(async()=>{
 const initial={household:{id:'family',name:'Test'},users:[{id:'husband',display_name:'Suami',role:'OWNER'},{id:'wife',display_name:'Istri',role:'PARTNER'}],currentUserId:'husband',members:[],invitations:[],accounts:[],categories:[{id:'food',household_id:'family',category_type:'EXPENSE',name:'Makanan'}],transactions:[],journals:[],budgets:[],goals:[],debts:[],bills:[],notifications:[],approvalPolicy:{threshold_amount:1000000},appPassword:'',updatedAt:'2026-11-20T01:00:00Z'};
 const cloud={...copy(initial),currentUserId:'wife',updatedAt:'2026-11-20T02:00:00Z',transactions:[{id:'wife-income',amount:100,transaction_type:'INCOME',status:'POSTED'}]};
 const h=harness(initial,cloud);await h.settle();await h.flush();
 assert.equal(h.posts,0,'Opening stale husband device must not upload its snapshot');
 assert.equal(h.value.transactions[0].id,'wife-income');
 assert.equal(h.value.currentUser.id,'husband','Cloud must not switch the logged-in spouse');
 assert.equal(JSON.parse(h.store.get(KEY)).updatedAt,cloud.updatedAt,'Cloud timestamp must survive hydration');
 assert.equal(h.value.categories.filter(c=>c.name==='Keperluan Sekolah').length,1);
 await h.value.syncFromCloud();await h.settle();await h.flush();assert.equal(h.posts,0,'Pull must not echo a write');
 const result=h.value.addBill({title:'Sekolah',amount:50,due_date:'2026-12-01'});assert.equal(result.success,true);
 await h.settle();h.failPost=true;await h.flush();assert.ok(JSON.parse(h.store.get(PENDING)).operations.length,'Failed writes remain durable');
 const reopened=harness(initial,h.remote,h.store);await reopened.settle();assert.equal(reopened.remote.bills[0].title,'Sekolah','Refresh retries the exact durable operation');
 h.failPost=false;await h.value.syncFromCloud();await h.settle();assert.equal(h.remote.bills[0].title,'Sekolah');assert.equal(JSON.parse(h.store.get(PENDING)).operations.length,0);
 const fresh=harness(initial,h.remote);await fresh.settle();assert.equal(fresh.value.bills[0].title,'Sekolah','Another device reads saved changes with original device closed');assert.equal(fresh.posts,0);
 const other=harness(initial,{...cloud,household:{id:'other'}});await other.settle();assert.equal(other.value.household.id,'family','Do not import another family');
 const normalize=h.load('src/lib/storage.ts').ensureStandardIncomeCategories;
 const twice=normalize(normalize(initial.categories));assert.equal(twice.filter(c=>c.name==='Keperluan Sekolah').length,1);
 const funded={...copy(initial),accounts:[{id:'bank1',name:'Bank Suami',account_type:'BANK',is_active:true,current_balance:1000},{id:'bank2',name:'Bank Istri',account_type:'BANK',is_active:true,current_balance:500},{id:'cash',name:'Cash',account_type:'CASH',is_active:true,current_balance:0}]};
 const t=harness(funded,funded);await t.settle();
 assert.equal(t.value.createTransaction({transaction_type:'TRANSFER',amount:200,account_id:'bank1',destination_account_id:'cash'}).success,true);await t.settle();await t.flush();
 assert.equal(t.value.accounts.find(a=>a.id==='bank1').current_balance,800);assert.equal(t.value.accounts.find(a=>a.id==='cash').current_balance,200);
 assert.equal(t.value.createTransaction({transaction_type:'TRANSFER',amount:100,account_id:'bank2',destination_account_id:'cash'}).success,true);await t.settle();await t.flush();
 assert.equal(t.value.accounts.find(a=>a.id==='cash').current_balance,300);
 assert.equal(t.value.createTransaction({transaction_type:'TRANSFER',amount:100,account_id:'bank1',destination_account_id:'bank2'}).success,true);await t.settle();await t.flush();
 assert.equal(t.value.totalIncome,0);assert.equal(t.value.totalExpense,0);assert.equal(t.value.accounts.reduce((n,a)=>n+a.current_balance,0),1500);
 assert.equal(t.value.createTransaction({transaction_type:'TRANSFER',amount:100,account_id:'cash',destination_account_id:'cash'}).success,false);
 assert.equal(t.value.createTransaction({transaction_type:'TRANSFER',amount:10000,account_id:'cash',destination_account_id:'bank1'}).success,false);
 const {diffState,applyOperations}=t.load('src/lib/syncJournal.ts');
 const wife=copy(funded), husband=copy(funded);wife.accounts[0].current_balance-=100;wife.transactions=[{id:'wife-expense'}];husband.accounts[0].current_balance+=400;husband.transactions=[{id:'husband-income'}];
 const one={id:'one',householdId:'family',createdAt:'2026-11-21T00:00:00Z',changes:diffState(funded,wife)};
 const two={id:'two',householdId:'family',createdAt:'2026-11-21T00:00:01Z',changes:diffState(funded,husband)};
 const merged=applyOperations(funded,[one,two,one]);assert.equal(merged.transactions.length,2);assert.equal(merged.accounts[0].current_balance,1300,'Concurrent spouse changes and retries must apply exactly once');
 console.log('PASS: Cash funded by either bank, bank transfers, invariant totals, transfer validation, concurrent spouse writes, retry deduplication.');
 console.log('PASS: stale-device startup, sequential spouse access, user identity, no cloud echo, durable retry, household isolation, category migration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
