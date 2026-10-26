import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { validStudyFile } from '../middleware/uploadMiddleware.js';
import { User } from '../models/User.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { getNote, updateNote } from '../controllers/noteController.js';
import { Note } from '../models/Note.js';
import { signup } from '../controllers/authController.js';

 test('Mongoose 9 password hook hashes and compares passwords without callback',async()=>{
 const user=new User({name:'Test Student',email:'student@example.com',password:'a-secret-password'});
 await User.schema.s.hooks.execPre('save',user,[]);
 assert.notEqual(user.password,'a-secret-password');
 assert.equal(await user.comparePassword('a-secret-password'),true);
 assert.equal(await user.comparePassword('wrong'),false);
 });
 test('JWT rejects tampering',async()=>{const token=signToken('507f1f77bcf86cd799439011');assert.equal((await verifyToken(token)).id,'507f1f77bcf86cd799439011');await assert.rejects(verifyToken(token.slice(0,-8)+'tampered'));});
 test('failed login never provisions an offline account or redirects',async()=>{
 let ready,submit,redirected=false;const button={disabled:false};const values={identifier:{value:'test@example.com'},password:{value:'wrong'}};
 const context={document:{addEventListener:(name,fn)=>ready=fn,getElementById:id=>id==='LoginForm'?{addEventListener:(name,fn)=>submit=fn,querySelector:()=>button}:values[id]},CampusAPI:{login:async()=>{throw new Error('Invalid credentials');}},location:{assign:()=>redirected=true},alert:()=>{}};
 vm.runInNewContext(await readFile(new URL('../../js/login.js',import.meta.url),'utf8'),context);ready();await submit({preventDefault(){}});assert.equal(redirected,false);assert.equal(button.disabled,false);
 });
 test('failed signup cannot persist plaintext passwords or report success',async()=>{
 let submit,redirected=false;const button={disabled:false};const values={password:{value:'password'},'confirm-password':{value:'password'},terms:{checked:true},username:{value:'test'},fullname:{value:'Test Student'},email:{value:'test@example.com'},course:{value:'CSE'},semester:{value:'4',addEventListener(){}},year:{value:'2',addEventListener(){}}};
 const form={addEventListener:(name,fn)=>submit=fn,querySelector:()=>button};
 const context={document:{getElementById:id=>id==='signupForm'?form:values[id]},CampusAPI:{signup:async()=>{throw new Error('Database disconnected');}},location:{assign:()=>redirected=true},alert:()=>{}};
 vm.runInNewContext(await readFile(new URL('../../js/signup.js',import.meta.url),'utf8'),context);await submit({preventDefault(){},currentTarget:form});assert.equal(redirected,false);assert.equal(button.disabled,false);
 });
 test('single-note read query enforces public-or-owner visibility',async()=>{
 const original=Note.findOne;let query;
 Note.findOne=q=>{query=q;const chain={populate:()=>chain,then:resolve=>resolve(null)};return chain;};
 try{await new Promise(resolve=>getNote({params:{id:'507f1f77bcf86cd799439011'},user:{_id:'owner'}},{},err=>{assert.equal(err.statusCode,404);resolve();}));assert.deepEqual(query.$or,[{isPublic:true},{author:'owner'}]);}finally{Note.findOne=original;}
 });
 test('note update filters immutable author and attachment fields',async()=>{
 const originalFind=Note.findById,originalUpdate=Note.findByIdAndUpdate;let update;
 Note.findById=async()=>({author:'owner'});Note.findByIdAndUpdate=(id,data)=>{update=data;return {populate:async()=>data};};
 try{await new Promise((resolve,reject)=>updateNote({params:{id:'note'},user:{_id:'owner',role:'student'},body:{title:'Allowed title',author:'attacker',fileName:'secret.pdf'}},{status:()=>({json:()=>resolve()})},reject));assert.deepEqual(update,{title:'Allowed title'});}finally{Note.findById=originalFind;Note.findByIdAndUpdate=originalUpdate;}
 });
 test('public signup cannot mass assign admin role',async()=>{
 const originalFind=User.findOne,originalCreate=User.create;let created;
 User.findOne=async()=>null;User.create=async data=>{created=data;return {_id:'507f1f77bcf86cd799439011',...data};};
 try{await new Promise((resolve,reject)=>signup({body:{name:'Test Student',email:'student@example.com',password:'password',role:'admin'}},{status:()=>({json:()=>resolve()})},reject));assert.equal(created.role,'student');}finally{User.findOne=originalFind;User.create=originalCreate;}
 });

test('upload validation rejects spoofing, binary text and unsupported extensions',()=>{assert.equal(validStudyFile(Buffer.from('not a PDF'),'.pdf','application/pdf'),false);assert.equal(validStudyFile(Buffer.from('%PDF-1.7\n'),'.exe','application/pdf'),false);assert.equal(validStudyFile(Buffer.from('%PDF-1.7\n'),'.pdf','image/png'),false);assert.equal(validStudyFile(Buffer.from([0,255,1]),'.txt','text/plain'),false);assert.equal(validStudyFile(Buffer.from('Study notes'),'.txt','text/plain'),true);assert.equal(validStudyFile(Buffer.from('%PDF-1.7\n'),'.pdf','application/pdf'),true);});

test('signup year and semester are both editable and stay consistent',async()=>{
 const handlers={};
 const year={value:'3',addEventListener:(event,fn)=>handlers.year=fn};
 const semester={value:'4',addEventListener:(event,fn)=>handlers.semester=fn};
 const context={document:{getElementById:id=>id==='year'?year:id==='semester'?semester:{addEventListener(){}}}};
 vm.runInNewContext(await readFile(new URL('../../js/signup.js',import.meta.url),'utf8'),context);
 handlers.year();assert.equal(semester.value,'5');assert.notEqual(year.disabled,true);
 semester.value='6';handlers.semester();assert.equal(year.value,'3');
 year.value='1';handlers.year();assert.equal(semester.value,'1');
});
test('settings enables reported fields and submits their values after session readiness',async()=>{
 let ready,payload,cached;
 const ids={};
 for(const id of ['name','email','username','university','age','semester','course','profileName','profileUsername','profileAvatar','SaveChanges','updatePassword','delete_btn']) ids[id]={value:'',disabled:true,required:false,reportValidity:()=>true,addEventListener(event,fn){this[event]=fn;},parentElement:{append(){}},options:[{value:'CSE'}]};
 ids.SaveChanges.disabled=false;ids.updatePassword.disabled=false;
 const profile={name:'Test Student',username:'old_handle',email:'old@example.com',university:'Old University',age:20,semester:4,department:'CSE'};
 const context={document:{addEventListener:(name,fn)=>ready=fn,getElementById:id=>ids[id],querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({setAttribute(){}})},CampusAPI:{sessionReady:Promise.resolve(profile),getCurrentUser:()=>({name:'Stale profile'}),request:async(path,options)=>{payload=JSON.parse(options.body);return {data:{user:{...profile,...payload}}};},setSession:(token,user)=>cached=user},alert:message=>{throw new Error(message);}};
 vm.runInNewContext(await readFile(new URL('../../js/settings.js',import.meta.url),'utf8'),context);await ready();
 for(const id of ['username','email','university','age'])assert.equal(ids[id].disabled,false,id);
 assert.equal(ids.university.value,'Old University');
 ids.username.value='new_handle';ids.email.value='new@example.com';ids.university.value='New University';ids.age.value='21';
 await ids.SaveChanges.click({currentTarget:ids.SaveChanges});
 assert.equal(payload.username,'new_handle');assert.equal(payload.email,'new@example.com');assert.equal(payload.university,'New University');assert.equal(payload.age,21);assert.equal(cached.email,'new@example.com');assert.equal(ids.SaveChanges.disabled,false);
});
