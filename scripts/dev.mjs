import http from 'node:http';
import app from '../worker/index.js';
const portIndex=process.argv.indexOf('--port');
const port=Number(portIndex>=0?process.argv[portIndex+1]:process.env.PORT||5173);
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Buffer.concat(chunks)})});const response=await app.fetch(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Server error');}}).listen(port,'0.0.0.0',()=>console.log('ScopePay listening on '+port));
