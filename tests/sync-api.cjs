const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const base={household:{id:'family'},accounts:[{id:'bank',current_balance:1000}],transactions:[]};
const files={'base.json':{content:JSON.stringify(base)}};let patches=0;
function load(file){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 module,exports:module.exports,URL,console,
 require:n=>n==='next/server'?{NextResponse:{json:(data,opts)=>({data,status:opts.status})}}:n.includes('syncConfig')?{CLOUD_SYNC_CONFIG:{GIST_ID:'test',FILE_NAME:'base.json',GITHUB_TOKEN:'test-only'}}:load('src/lib/syncJournal.ts'),
 fetch:async(_,opts)=>{if(opts.method==='PATCH'){patches++;const changes=JSON.parse(opts.body).files;for(const [name,value]of Object.entries(changes))files[name]=value;return {ok:true};}return {ok:true,json:async()=>({files:JSON.parse(JSON.stringify(files))})};}
});return module.exports;}
(async()=>{
 const {POST,GET}=load('src/app/api/sync/route.ts');
 const op=(id,amount)=>({id,householdId:'family',createdAt:'2026-11-21T00:00:00Z',changes:[{field:'accounts',id:'bank',add:{current_balance:amount}},{field:'transactions',id,set:{id,amount}}]});
 const a=op('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',100),b=op('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',200);
 const post=o=>POST({json:async()=>({protocol:3,operation:o})});
 const results=await Promise.all([post(a),post(b)]);assert.ok(results.every(r=>r.status===200));
 let read=await GET();assert.equal(read.data.data.accounts[0].current_balance,1300);assert.equal(read.data.data.transactions.length,2);
 await post(a);assert.equal(patches,2,'Retry must not append another financial event');
 assert.equal((await POST({json:async()=>base})).status,409,'Old full snapshot writes must be rejected');
 assert.equal((await post({...a,householdId:'other'})).status,409);
 assert.equal((await post({...a,changes:[{field:'accounts',id:'bank',add:{current_balance:999}}]})).status,409,'Reusing an operation ID with different content must fail');
 console.log('PASS: real API handlers preserve concurrent operations, deduplicate retries, reject old snapshots and mismatched households.');
})().catch(e=>{console.error(e);process.exitCode=1;});
