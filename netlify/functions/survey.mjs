import { getStore } from "@netlify/blobs";
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const configStore=()=>getStore({name:"hajr-safety-config",consistency:"strong"});
const responseStore=()=>getStore({name:"hajr-safety-responses",consistency:"strong"});
const authorized=req=>Boolean(process.env.ADMIN_KEY)&&req.headers.get("x-admin-key")===process.env.ADMIN_KEY;
export default async req=>{
  const url=new URL(req.url),action=url.searchParams.get("action")||"";
  try{
    if(action==="config"&&req.method==="GET"){const config=await configStore().get("main",{type:"json",consistency:"strong"});return json({config:config||null});}
    if(action==="submit"&&req.method==="POST"){
      const r=await req.json();if(!r||!r.role||!Array.isArray(r.answers)||!r.answers.length)return json({error:"Invalid submission"},400);
      const id=r.id||crypto.randomUUID();r.id=id;r.receivedAt=new Date().toISOString();r.schemaVersion=Number(r.schemaVersion||7);
      await responseStore().setJSON(`${Date.now()}_${id}`,r);return json({ok:true,id});
    }
    if(action==="login"&&req.method==="POST"){if(!process.env.ADMIN_KEY)return json({error:"ADMIN_KEY is not configured"},503);return authorized(req)?json({ok:true}):json({error:"Unauthorized"},401);}
    if(!authorized(req))return json({error:"Unauthorized"},401);
    if(action==="responses"&&req.method==="GET"){
      const store=responseStore(),listed=await store.list();
      const responses=(await Promise.all(listed.blobs.map(x=>store.get(x.key,{type:"json",consistency:"strong"})))).filter(Boolean);
      responses.sort((a,b)=>String(a.timestamp||a.receivedAt||"").localeCompare(String(b.timestamp||b.receivedAt||"")));
      return json({responses,count:responses.length});
    }
    if(action==="save-config"&&req.method==="POST"){const config=await req.json();if(!config||typeof config!=="object")return json({error:"Invalid config"},400);config.version=7;await configStore().setJSON("main",config);return json({ok:true});}
    if(action==="reset-responses"&&req.method==="POST"){const result=await responseStore().deleteAll();return json({ok:true,deleted:result.deletedBlobs||0});}
    return json({error:"Not found"},404);
  }catch(e){console.error(e);return json({error:"Server error",message:e?.message||String(e)},500);}
};
