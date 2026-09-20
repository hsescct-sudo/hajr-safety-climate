import { getStore } from "@netlify/blobs";

export const config = { path: "/api/survey" };

const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const authorized=req=>Boolean(process.env.ADMIN_KEY)&&req.headers.get("x-admin-key")===process.env.ADMIN_KEY;
const productionOnly=context=>context?.deploy?.context === "production";
function siteStore(name, context){
  // Explicitly bind the site ID while still letting Netlify inject its runtime write token.
  return getStore(name,{siteID:context?.site?.id,region:"us-east-2"});
}

export default async (req, context) => {
  const url=new URL(req.url),action=url.searchParams.get("action")||"";
  try{
    if(action==="health"&&req.method==="GET"){
      return json({ok:true,site:context?.site?.name||null,siteID:context?.site?.id||null,deployContext:context?.deploy?.context||null,published:context?.deploy?.published??null});
    }
    const configStore=()=>siteStore("hajr-safety-config",context);
    const responseStore=()=>siteStore("hajr-safety-responses",context);

    if(action==="config"&&req.method==="GET"){
      const config=await configStore().get("main",{type:"json",consistency:"strong"});
      return json({config:config||null});
    }
    if(action==="submit"&&req.method==="POST"){
      if(!productionOnly(context)) return json({error:"Writes are disabled outside the production deploy."},403);
      const r=await req.json();
      if(!r||!r.role||!Array.isArray(r.answers)||!r.answers.length)return json({error:"Invalid submission"},400);
      const id=r.id||crypto.randomUUID();r.id=id;r.receivedAt=new Date().toISOString();r.schemaVersion=Number(r.schemaVersion||8);
      await responseStore().setJSON(`${Date.now()}_${id}`,r);
      return json({ok:true,id,savedAt:r.receivedAt});
    }
    if(action==="login"&&req.method==="POST"){
      if(!process.env.ADMIN_KEY)return json({error:"ADMIN_KEY is not configured"},503);
      return authorized(req)?json({ok:true}):json({error:"Unauthorized"},401);
    }
    if(!authorized(req))return json({error:"Unauthorized"},401);

    if(action==="responses"&&req.method==="GET"){
      const store=responseStore(),listed=await store.list();
      const responses=(await Promise.all(listed.blobs.map(x=>store.get(x.key,{type:"json",consistency:"strong"})))).filter(Boolean);
      responses.sort((a,b)=>String(a.timestamp||a.receivedAt||"").localeCompare(String(b.timestamp||b.receivedAt||"")));
      return json({responses,count:responses.length});
    }
    if(action==="storage-check"&&req.method==="POST"){
      if(!productionOnly(context)) return json({error:"Storage write test is allowed only on production."},403);
      const store=configStore(),key=`__health_${Date.now()}_${crypto.randomUUID()}`;
      await store.set(key,"ok");
      const value=await store.get(key,{consistency:"strong"});
      await store.delete(key);
      return json({ok:value==="ok",message:value==="ok"?"Site-wide Blob read/write/delete test passed.":"Storage verification failed."});
    }
    if(action==="save-config"&&req.method==="POST"){
      if(!productionOnly(context)) return json({error:"Configuration writes are allowed only on production."},403);
      const config=await req.json();if(!config||typeof config!=="object")return json({error:"Invalid config"},400);
      config.version=8;config.schema="hajr-safety-climate-v8";config.updatedAt=new Date().toISOString();
      await configStore().setJSON("main",config);
      return json({ok:true,savedAt:config.updatedAt});
    }
    if(action==="reset-responses"&&req.method==="POST"){
      if(!productionOnly(context)) return json({error:"Reset is allowed only on the production deploy."},403);
      const store=responseStore(),listed=await store.list();
      let deleted=0;
      for(const item of listed.blobs){await store.delete(item.key);deleted++;}
      return json({ok:true,deleted,savedAt:new Date().toISOString()});
    }
    return json({error:"Not found"},404);
  }catch(e){
    console.error("survey function error",e);
    return json({error:"Server error",message:e?.message||String(e)},500);
  }
};
