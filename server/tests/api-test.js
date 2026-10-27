import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:5011';
let server;
if(!process.env.TEST_BASE_URL){server=spawn(process.execPath,['server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5011'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',()=>{});server.stderr.on('data',data=>{if(String(data).includes('SyntaxError')||String(data).includes('Error:'))console.error(String(data));});}
let passed=0,failed=0;
async function check(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(err){failed++;console.error('FAIL '+name+': '+err.message);}}
async function call(route,status,options={}){const res=await fetch(base+route,options);assert.equal(res.status,status,route);return res;}
try{
 for(let i=0;i<60;i++){try{await fetch(base+'/api/health');break;}catch{await delay(250);}}
 // Allow initial MongoDB selection to finish, rather than treating connecting as ready.
 let health;for(let i=0;i<30;i++){health=await (await fetch(base+'/api/health')).json();if(health.database.readyState!==2)break;await delay(250);}
 await check('health matches actual database state',async()=>{await call('/api/health',health.database.readyState===1?200:503);assert.equal(health.status,health.database.readyState===1?'healthy':'degraded');});
 const pages=(await readdir(root)).filter(p=>p.endsWith('.html'));
 for(const page of ['/',...pages.map(p=>'/'+encodeURIComponent(p))])await check('HTML '+page,()=>call(page,200));
 const assets=new Set();for(const page of pages){const text=await readFile(root+page,'utf8');for(const match of text.matchAll(/(?:src|href)="((?:css|js)\/[^"?#]+)"/g)) assets.add(match[1]);}
 for(const asset of assets)await check('asset '+asset,()=>call('/'+encodeURI(asset),200));
 for(const route of ['/server/server.js','/server/.env','/.git/config','/server/package.json','/server/logs/activities.log','/server/uploads/.gitkeep','/api/v1/missing'])await check('private/missing path '+route,()=>call(route,404));
 await check('topics',()=>call('/api/topics',200));
 await check('homepage retains real Login/Signup links',async()=>{const text=await (await fetch(base)).text();assert.match(text,/href="login.html"/);assert.match(text,/href="signup.html"/);});
 const json=body=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 await check('invalid signup rejected',()=>call('/api/v1/auth/signup',400,json({name:'A',email:'bad',password:'x'})));
 await check('privileged signup rejected',()=>call('/api/v1/auth/signup',400,json({name:'Test User',email:'test@example.com',password:'test-password',role:'admin'})));
 await check('invalid JSON rejected',()=>call('/api/v1/auth/login',400,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}));
 for(const [route,method]of [['/api/v1/auth/me','GET'],['/api/v1/notes','GET'],['/api/v1/notes','POST'],['/api/v1/bookmarks','GET'],['/api/v1/resources','GET'],['/api/v1/resources/upload','POST'],['/api/v1/resources/download/example.pdf','GET'],['/api/v1/assistant','POST']])await check('unauthenticated '+method+' '+route,()=>call(route,401,{method}));
 await check('malformed token rejected',()=>call('/api/v1/auth/me',401,{headers:{Authorization:'Bearer invalid'}}));
 await check('subjects readiness',()=>call('/api/v1/subjects',health.database.readyState===1?200:503));
 if(health.database.readyState!==1){
  await check('valid signup fails fast with disconnected DB',()=>call('/api/v1/auth/signup',503,json({name:'Test User',email:'test@example.com',password:'test-password'})));
  console.log('BLOCKED: real signup/login, CRUD, two-user authorization, upload/download persistence and AI provider calls require MongoDB.');
 }else{
  const suffix=Date.now();const account={name:'Integration Test',email:'integration-'+suffix+'@example.com',password:'integration-test-pass'};
  let token,second,subject,note,resource;
  const auth=(method,body,t=token)=>({method,headers:{Authorization:'Bearer '+t,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:body instanceof FormData?body:JSON.stringify(body)})});
  await check('real signup and hash hook',async()=>{const res=await call('/api/v1/auth/signup',201,json(account));const data=await res.json();token=data.token;assert.ok(token);assert.equal(data.data.user.password,undefined);});
  await check('duplicate account rejected',()=>call('/api/v1/auth/signup',409,json(account)));
  await check('invalid password rejected',()=>call('/api/v1/auth/login',401,json({...account,password:'wrong-password'})));
  await check('real login',async()=>{token=(await (await call('/api/v1/auth/login',200,json(account))).json()).token;});
  await check('second user signup',async()=>{second=(await (await call('/api/v1/auth/signup',201,json({...account,email:'second-'+suffix+'@example.com'}))).json()).token;});
  await check('subjects retrieved',async()=>{const data=await (await call('/api/v1/subjects',200)).json();subject=data.data.subjects[0]?._id;assert.ok(subject,'Add subjects with npm run seed in a development database first.');});
  if(subject){
   await check('private note created',async()=>{const data=await (await call('/api/v1/notes',201,auth('POST',{title:'Integration private note',description:'Persistence test',subject,isPublic:false}))).json();note=data.data.note._id;});
   if(note){
    await check('created note retrieved',()=>call('/api/v1/notes/'+note,200,auth('GET')));
    await check('other user cannot read private note',()=>call('/api/v1/notes/'+note,404,auth('GET',undefined,second)));
    await check('other user cannot edit private note',()=>call('/api/v1/notes/'+note,403,auth('PATCH',{title:'Unauthorized edit'},second)));
    await check('note update persisted',async()=>{await call('/api/v1/notes/'+note,200,auth('PATCH',{title:'Updated integration note'}));assert.equal((await (await call('/api/v1/notes/'+note,200,auth('GET'))).json()).data.note.title,'Updated integration note');});
    await check('bookmark create and retrieval',async()=>{await call('/api/v1/bookmarks/toggle',201,auth('POST',{noteId:note}));const data=await (await call('/api/v1/bookmarks',200,auth('GET'))).json();assert.ok(data.data.bookmarks.some(b=>b.note?._id===note));});
    await check('other user cannot bookmark private note',()=>call('/api/v1/bookmarks/toggle',404,auth('POST',{noteId:note},second)));
   }
  }
  await check('resource upload',async()=>{const body=new FormData();body.append('file',new Blob(['CampusHub integration test'],{type:'text/plain'}),'integration.txt');resource=(await (await call('/api/v1/resources/upload',201,auth('POST',body))).json()).data.fileName;});
  if(resource){await check('stream download bytes',async()=>assert.equal(await(await call('/api/v1/resources/download/'+resource,200,auth('GET'))).text(),'CampusHub integration test'));await check('other user cannot download private resource',()=>call('/api/v1/resources/download/'+resource,404,auth('GET',undefined,second)));}
  await check('spoofed document rejected',async()=>{const body=new FormData();body.append('file',new Blob(['not a PDF'],{type:'application/pdf'}),'fake.pdf');await call('/api/v1/resources/upload',400,auth('POST',body));});
  const updatedEmail='updated-'+suffix+'@example.com';
  await check('profile fields update and persist',async()=>{const fields={username:'updated_handle',email:updatedEmail,university:'Integration University',age:21,semester:6};await call('/api/v1/auth/updateMe',200,auth('PATCH',fields));const data=await(await call('/api/v1/auth/me',200,auth('GET'))).json();for(const [key,value]of Object.entries(fields))assert.equal(data.data.user[key],value);assert.equal(data.data.user.year,3);});
  await check('login uses updated email',async()=>{await call('/api/v1/auth/login',401,json(account));await call('/api/v1/auth/login',200,json({...account,email:updatedEmail}));});
  await check('duplicate profile email rejected',()=>call('/api/v1/auth/updateMe',409,auth('PATCH',{email:'second-'+suffix+'@example.com'})));
  await check('invalid profile email rejected',()=>call('/api/v1/auth/updateMe',400,auth('PATCH',{email:'invalid'})));
  await check('invalid profile age rejected',()=>call('/api/v1/auth/updateMe',400,auth('PATCH',{age:150})));
  await check('signup year and semester mismatch rejected',()=>call('/api/v1/auth/signup',400,json({...account,email:'year-invalid-'+suffix+'@example.com',year:1,semester:6})));
  await check('signup selected year persists through semester',async()=>{const data=await(await call('/api/v1/auth/signup',201,json({...account,email:'year-valid-'+suffix+'@example.com',year:3,semester:6}))).json();assert.equal(data.data.user.year,3);assert.equal(data.data.user.semester,6);});
  console.log('Test-only records retained; existing records were not deleted. AI live provider testing requires explicit configured credentials.');
 }
 console.log(passed+' passed; '+failed+' failed.');process.exitCode=failed?1:0;
}finally{if(server&&!process.argv.includes('--serve'))server.kill();}
