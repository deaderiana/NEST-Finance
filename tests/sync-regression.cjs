// Execute the real provider with a small deterministic React hook harness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const KEY='nest_finance_v1_1_state', PENDING='nest_finance_pending_sync_v2';
const copy=x=>JSON.parse(JSON.stringify(x));
function harness(initial, remote) {
  const slots=[], effects=[], timers=new Map(), store=new Map([[KEY,JSON.stringify(initial)]]);
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
      console,Date,URLSearchParams,atob,btoa,
      localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
      sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
      window:{location:{search:''},addEventListener(){},removeEventListener(){}},
      document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},
      setTimeout:fn=>{const id=nextTimer++;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval:()=>{},
      fetch:async(_,options)=>{if(options.method==='POST'){posts++;if(failPost)return {ok:false,json:async()=>({success:false})};remote=JSON.parse(options.body);}else gets++;
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
 await h.settle();h.failPost=true;await h.flush();assert.ok(h.store.get(PENDING),'Failed writes remain durable');
 h.failPost=false;await h.value.syncFromCloud();await h.settle();assert.equal(h.remote.bills[0].title,'Sekolah');assert.equal(h.store.has(PENDING),false);
 const fresh=harness(initial,h.remote);await fresh.settle();assert.equal(fresh.value.bills[0].title,'Sekolah','Another device reads saved changes with original device closed');assert.equal(fresh.posts,0);
 const other=harness(initial,{...cloud,household:{id:'other'}});await other.settle();assert.equal(other.value.household.id,'family','Do not import another family');
 const normalize=h.load('src/lib/storage.ts').ensureStandardIncomeCategories;
 const twice=normalize(normalize(initial.categories));assert.equal(twice.filter(c=>c.name==='Keperluan Sekolah').length,1);
 console.log('PASS: stale-device startup, sequential spouse access, user identity, no cloud echo, durable retry, household isolation, category migration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
