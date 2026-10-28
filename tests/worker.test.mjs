import test from 'node:test';
import assert from 'node:assert/strict';
import app,{validateQuote} from '../worker/index.js';
const q={title:'Website',rate:40,items:[{name:'Design',hours:2.25},{name:'Build',hours:5}]};
const request=(path,data,env={},origin='https://scope.test')=>app.fetch(new Request('https://scope.test'+path,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)}),env);
test('recomputes cents from line items and rejects invalid input',()=>{assert.equal(validateQuote({...q,cents:1}).cents,29000);for(const bad of [{...q,rate:-1},{...q,rate:Infinity},{...q,items:[]},{...q,items:[{name:'',hours:1}]},{...q,items:[{name:'A',hours:-2}]}])assert.throws(()=>validateQuote(bad));});
test('missing integrations fail honestly; cross origin rejected',async()=>{assert.equal((await request('/api/generate',{brief:'A long enough brief',rate:40})).status,503);assert.equal((await request('/api/orders',{quote:q,approved:true})).status,503);assert.equal((await request('/api/orders',{}, {},'https://evil.test')).status,403);});
test('PayPal requires approval, verifies amount, rejects forged session, and captures idempotently',async()=>{
const old=globalThis.fetch;let captureCount=0;let value='290.00',completed=false;
const env={PAYPAL_CLIENT_ID:'sandbox-test',PAYPAL_CLIENT_SECRET:'only-for-tests'};
globalThis.fetch=async(url,opt={})=>{const response=d=>Response.json(d);if(url.endsWith('/token'))return response({access_token:'mock'});if(url.endsWith('/orders')&&opt.method==='POST'){const sent=JSON.parse(opt.body);assert.equal(sent.purchase_units[0].amount.value,'290.00');globalThis.testRef=sent.purchase_units[0].reference_id;return response({id:'TESTORDER',links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=TESTORDER'}]});}const order={id:'TESTORDER',status:completed?'COMPLETED':'APPROVED',purchase_units:[{reference_id:globalThis.testRef,amount:{currency_code:'USD',value},payments:completed?{captures:[{id:'CAPTURE',status:'COMPLETED',amount:{currency_code:'USD',value}}]}:undefined}]};if(url.endsWith('/capture')){captureCount++;completed=true;order.status='COMPLETED';order.purchase_units[0].payments={captures:[{id:'CAPTURE',status:'COMPLETED',amount:{currency_code:'USD',value}}]};}return response(order);};
try{assert.equal((await request('/api/orders',{quote:q,approved:false},env)).status,400);const created=await (await request('/api/orders',{quote:q,approved:true},env)).json();assert.ok(created.session);assert.equal((await request('/api/capture',{orderId:'OTHER',session:created.session},env)).status,400);assert.equal((await request('/api/capture',{orderId:created.id,session:created.session+'bad'},env)).status,400);value='1.00';assert.equal((await request('/api/capture',{orderId:created.id,session:created.session},env)).status,400);value='290.00';for(let i=0;i<2;i++){const response=await request('/api/capture',{orderId:created.id,session:created.session},env);assert.equal(response.status,200);assert.equal((await response.json()).status,'COMPLETED');}assert.equal(captureCount,1);}finally{globalThis.fetch=old;delete globalThis.testRef;}});
test('AI response validated; provider failures do not become sample results',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({...q,assumptions:['Confirm content'],questions:['Deadline?']})}}]});const good=await request('/api/generate',{brief:'Please create a five-page website for my studio.',rate:40},{OPENAI_API_KEY:'test'});assert.equal(good.status,200);assert.equal((await good.json()).cents,29000);globalThis.fetch=async()=>new Response('error',{status:429});assert.equal((await request('/api/generate',{brief:'Please create a five-page website for my studio.',rate:40},{OPENAI_API_KEY:'test'})).status,429);}finally{globalThis.fetch=old;}});

test('quota errors provide safe actionable feedback without exposing provider payload',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({error:{code:'insufficient_quota',message:'private upstream detail'}},{status:429});const r=await request('/api/generate',{brief:'Please create a five-page website for my studio.',rate:40},{OPENAI_API_KEY:'test'});assert.equal(r.status,402);const d=await r.json();assert.match(d.error,/insufficient API quota/);assert.ok(!JSON.stringify(d).includes('private upstream'));}finally{globalThis.fetch=old;}});

test('Groq is preferred without sending requests to OpenAI; provider and model remain server controlled',async()=>{
 const old=globalThis.fetch;const env={GROQ_API_KEY:'groq-test',OPENAI_API_KEY:'openai-test'};let calls=0;
 try{
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer groq-test');const data=JSON.parse(options.body);assert.equal(data.model,'llama-3.3-70b-versatile');assert.equal(data.response_format.type,'json_object');assert.equal(data.max_tokens,1800);return Response.json({choices:[{message:{content:JSON.stringify({...q,assumptions:[],questions:[]})}}]});};
  const status=await (await app.fetch(new Request('https://scope.test/api/status'),env)).json();assert.equal(status.aiProvider,'Groq');assert.ok(!JSON.stringify(status).includes('groq-test'));
  const result=await request('/api/generate',{brief:'A website for a florist with a gallery and contact form.',rate:40,provider:'openai'},env);assert.equal(result.status,200);assert.equal((await result.json()).cents,29000);assert.equal(calls,1);
  globalThis.fetch=async()=>{calls++;return Response.json({error:{code:'rate_limit_exceeded',message:'private detail'}},{status:429});};
  const limited=await request('/api/generate',{brief:'A website for a florist with a gallery and contact form.',rate:40},env);assert.equal(limited.status,429);assert.match((await limited.json()).error,/Groq usage limit/);assert.equal(calls,2);
 }finally{globalThis.fetch=old;}
});
test('invalid AI output and invalid rates do not create a quote',async()=>{
 const old=globalThis.fetch;let calls=0;
 try{globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify({...q,items:[{name:'Build',hours:-1}]})}}]});};
 const data={brief:'Please create a five-page website for my studio.',rate:40};
 assert.equal((await request('/api/generate',{...data,rate:-1},{GROQ_API_KEY:'test'})).status,400);assert.equal(calls,0);
 assert.equal((await request('/api/generate',data,{GROQ_API_KEY:'test'})).status,502);assert.equal(calls,1);
 const status=await (await app.fetch(new Request('https://scope.test/api/status'),{GROQ_API_KEY:'test',AI_PROVIDER:'openai'})).json();assert.equal(status.ai,false);
 }finally{globalThis.fetch=old;}
});
