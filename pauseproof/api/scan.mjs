// PauseProof Website Scanner — server-side *passive* checks.
// IMPORTANT: Never fetch, visit, render, resolve, follow redirects to, or execute code
// on the submitted website. Outbound requests go to fixed public lookup services only.
import { isIP } from "node:net";

const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const cache=new Map(),limits=new Map();
const SAFE_SUFFIXES=new Set(["co.uk","org.uk","ac.uk","com.ng","org.ng","com.au","net.au","co.nz","com.br","com.mx","co.in","co.jp","com.sg","com.tr","co.za","com.hk","co.kr","com.cn","com.tw","co.id","com.my","com.pk"]);
const BRAND_DOMAINS={paypal:"paypal.com",amazon:"amazon.com",apple:"apple.com",microsoft:"microsoft.com",google:"google.com",facebook:"facebook.com",instagram:"instagram.com",netflix:"netflix.com",whatsapp:"whatsapp.com",stripe:"stripe.com"};
function output(body,status=200){return new Response(JSON.stringify(body),{status,headers:JSON_HEADERS});}
function limitHit(ip){
 const now=Date.now(),key=ip.slice(0,70);
 if(limits.size>500){for(const [k,v] of limits){if(now-v.time>65000)limits.delete(k);}}
 const r=limits.get(key);
 if(!r||now-r.time>60000){limits.set(key,{time:now,count:1});return false;}
 r.count++;return r.count>12;
}
function parseInput(text){
 const raw=String(text||"").trim();
 if(!raw||raw.length>2048||/[\u0000-\u001f\u007f]/.test(raw))throw Error("Provide a valid website URL of up to 2,048 characters.");
 if(/^(?:javascript|data|file|ftp|chrome|about):/i.test(raw))throw Error("Only public HTTP and HTTPS website addresses can be checked.");
 const candidate=/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)?raw:"https://"+raw;
 let u;try{u=new URL(candidate);}catch{throw Error("This does not look like a valid website address.");}
 if(!["http:","https:"].includes(u.protocol))throw Error("Only HTTP or HTTPS sites can be checked.");
 const h=u.hostname.replace(/\.$/,"").toLowerCase();
 if(!h||h.length>253||!h.includes(".")||isIP(h)||/^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.onion|.*\.test|.*\.invalid)$/i.test(h))throw Error("Enter a public website domain, not a private network or IP address.");
 if(!/^[a-z0-9.-]+$/.test(h)||h.split(".").some(p=>p.length<1||p.length>63||p.startsWith("-")||p.endsWith("-")))throw Error("The website domain format is not valid.");
 const parts=h.split("."),last2=parts.slice(-2).join(".");
 const registered=SAFE_SUFFIXES.has(last2)?parts.slice(-3).join("."):last2;
 return {host:h,registered,protocol:u.protocol,hasCredentials:!!(u.username||u.password),url:u};
}
function finding(type,title,description){
 return {severity:type,title,description};
}
async function lookup(url,ms=4700){
 const response=await fetch(url,{method:"GET",headers:{"Accept":"application/json","User-Agent":"PauseProof-Website-Scanner/1.0 (passive domain verification)"},signal:AbortSignal.timeout(ms),cache:"no-store"});
 if(!response.ok)throw Error("Lookup service returned "+response.status);
 const bytes=Number(response.headers.get("content-length")||0);
 if(bytes>300000)throw Error("Lookup response too large");
 const text=await response.text();
 if(text.length>300000)throw Error("Lookup response too large");
 return JSON.parse(text);
}
async function dnsCheck(host){
 const [a,aaaa]=await Promise.allSettled([lookup("https://dns.google/resolve?name="+encodeURIComponent(host)+"&type=A"),lookup("https://dns.google/resolve?name="+encodeURIComponent(host)+"&type=AAAA")]);
 const ok=[a,aaaa].filter(x=>x.status==="fulfilled").map(x=>x.value);
 if(!ok.length)return {state:"unavailable",label:"DNS lookup unavailable",detail:"The DNS provider could not be reached. This does not indicate whether the site is legitimate."};
 const found=ok.some(x=>Array.isArray(x.Answer)&&x.Answer.some(a=>a.type===1||a.type===28));
 if(found)return {state:"observed",label:"Domain resolves",detail:"A public DNS lookup found address records. This confirms only that the domain resolves, not that its content or owner is trustworthy."};
 const statuses=ok.map(x=>x.Status);
 if(ok.length===2&&statuses.every(x=>x===3))return {state:"not-found",label:"Domain not found in DNS",detail:"The public resolver returned a domain-not-found response at check time. DNS can change, and this alone does not prove fraud."};
 return {state:"unknown",label:"No public address records confirmed",detail:"DNS did not return usable A or AAAA records in this check. The site could be down or use another configuration."};
}
async function rdapCheck(domain){
 try{
  const rdap=await lookup("https://rdap.org/domain/"+encodeURIComponent(domain),4300);
  const events=Array.isArray(rdap.events)?rdap.events:[];
  const registration=events.find(e=>/registration|created/i.test(String(e.eventAction||""))&&e.eventDate);
  const date=registration?Date.parse(registration.eventDate):NaN;
  if(Number.isFinite(date)&&date<Date.now()&&date>Date.UTC(1985,0,1)){
   const days=Math.floor((Date.now()-date)/86400000);
   return {state:"observed",label:"Registration date found",detail:"The domain registration record reports a creation date. It does not establish the identity or trustworthiness of the current owner.",createdAt:new Date(date).toISOString().slice(0,10),ageDays:days};
  }
  return {state:"unknown",label:"Registration age unavailable",detail:"A public domain-registration response was retrieved, but a reliable creation date was not available."};
 }catch{
  return {state:"unavailable",label:"Registration data not available",detail:"The public RDAP lookup did not return usable registration data for this domain."};
 }
}
async function historicalScan(host){
 try{
  const out=await lookup("https://urlscan.io/api/v1/search/?q="+encodeURIComponent('page.domain:"'+host+'"')+"&size=3",4000);
  const entries=Array.isArray(out.results)?out.results:[];
  const matching=entries.filter(e=>String(e?.page?.domain||"").toLowerCase()===host);
  const malicious=matching.some(e=>e?.verdicts?.malicious===true||e?.verdicts?.overall?.malicious===true);
  if(matching.length)return {state:"observed",label:"Historical public scans exist",detail:"Found "+matching.length+" recent public scan record(s) for this exact hostname. Prior scanning does not confirm safety or fraud.",records:matching.length,flagged:malicious};
  return {state:"unknown",label:"No public scan records found",detail:"No matching records appeared in this limited public search. This is not proof the domain is new or safe.",records:0};
 }catch{
  return {state:"unavailable",label:"Public scan search unavailable",detail:"Historical scans could not be checked (the provider may be rate-limited). No reputation claim is made."};
 }
}
function evaluate(parsed,checks){
 const flags=[];
 if(parsed.hasCredentials)flags.push(finding("high","Deceptive @-sign URL","The visible brand before @ is not necessarily the destination. The destination hostname appears after the @ sign."));
 if(parsed.protocol==="http:")flags.push(finding("caution","Unencrypted HTTP address","This address begins with HTTP rather than HTTPS. HTTPS itself is not a guarantee of legitimacy."));
 if(parsed.host.includes("xn--"))flags.push(finding("caution","Internationalised/punycode domain","Some internationalised domains are legitimate, but lookalike characters can be used in phishing links."));
 for(const [brand,real] of Object.entries(BRAND_DOMAINS)){
  if(parsed.host.includes(brand)&&parsed.host!==real&&!parsed.host.endsWith("."+real)){
   flags.push(finding("caution","Brand name appears in another domain","The hostname contains "+brand+" but is not a subdomain of "+real+". Some legitimate sites mention brands; verify ownership independently."));
   break;
  }
 }
 const riskyTlds=[".top",".click",".zip",".xyz",".buzz"];
 if(riskyTlds.some(x=>parsed.host.endsWith(x)))flags.push(finding("info","Less familiar domain ending","This domain ending is commonly available to anyone; it is not evidence of fraud on its own."));
 if(parsed.host.split(".").length>4)flags.push(finding("info","Long hostname","Multiple subdomains can make the true registered domain harder to recognise."));
 if(checks.dns.state==="not-found")flags.push(finding("caution","Domain does not currently resolve","The DNS provider reported that this domain does not exist at check time."));
 const days=checks.registration.ageDays;
 if(Number.isFinite(days)&&days<30)flags.push(finding("high","Very recently registered domain","The public registration record indicates this domain was created within the past 30 days. New domains can be legitimate but deserve additional verification."));
 else if(Number.isFinite(days)&&days<180)flags.push(finding("caution","Recently registered domain","The domain registration is less than six months old. Check identity, business details, and reputation independently."));
 if(checks.history.flagged===true)flags.push(finding("high","Public scan record includes a malicious verdict","At least one matched historical public scan includes an explicit malicious flag. A scan verdict can be incomplete or outdated; verify before treating it as definitive."));
 const high=flags.filter(f=>f.severity==="high").length;
 const warnings=flags.filter(f=>f.severity==="caution").length;
 const checked=Object.values(checks).filter(c=>c.state==="observed"||c.state==="not-found").length;
 const level=high>=1?"high":warnings>=1?"caution":"inconclusive";
 return {level,flags,coverage:checked,checksAvailable:3};
}
export async function POST(request){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return output({error:"Cross-origin requests are not supported."},403);
  const remote=(request.headers.get("x-forwarded-for")||"anonymous").split(",")[0].trim();
  if(limitHit(remote))return output({error:"Too many checks. Please try again shortly."},429);
  const bodyText=await request.text();
  if(bodyText.length>4500)return output({error:"Request too large."},413);
  let body;try{body=JSON.parse(bodyText);}catch{return output({error:"Send a valid website address."},400);}
  const parsed=parseInput(body?.url);
  const key=parsed.host+"|"+parsed.protocol+"|"+parsed.hasCredentials;
  const hit=cache.get(key);
  if(hit&&Date.now()-hit.at<180000)return output({...hit.value,cached:true});
  const [dns,registration,history]=await Promise.all([dnsCheck(parsed.host),rdapCheck(parsed.registered),historicalScan(parsed.host)]);
  const checks={dns,registration,history};
  const ev=evaluate(parsed,checks);
  const result={hostname:parsed.host,registeredDomain:parsed.registered,checkedAt:new Date().toISOString(),status:ev.level,signals:ev.flags,checks,coverage:ev.coverage,checksAvailable:ev.checksAvailable,sourceTypes:["Google Public DNS","RDAP domain registration","urlscan.io public search"],explanation:"Passive checks only. We never visit the submitted website or execute its content. No result can certify a website as real or fake."};
  if(cache.size>400)cache.clear();
  cache.set(key,{at:Date.now(),value:result});
  return output(result);
 }catch(error){
  return output({error:error instanceof Error?error.message:"Unable to check this website right now."},400);
 }
}
export function GET(){return output({service:"PauseProof Website Scanner",status:"online",method:"POST",description:"Passive DNS, domain-registration, and public-history checks. No target-site fetching."});}
