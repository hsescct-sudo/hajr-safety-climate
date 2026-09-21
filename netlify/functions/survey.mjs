import { getStore } from "@netlify/blobs";

export const config = { path: "/api/survey" };

const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const authorized=req=>Boolean(process.env.ADMIN_KEY)&&req.headers.get("x-admin-key")===process.env.ADMIN_KEY;

// IMPORTANT: inside Netlify Functions, getStore() receives site ID and write token
// automatically from the runtime. Passing a manual site ID without the runtime token
// can cause 403 write errors, so site-wide stores are opened directly here.
const configStore=()=>getStore("hajr-safety-config");
const responseStore=()=>getStore("hajr-safety-responses");

export default async (req, context) => {
  const url=new URL(req.url),action=url.searchParams.get("action")||"";
  try{
    if(action==="health"&&req.method==="GET"){
      return json({ok:true,site:context?.site?.name||null,siteID:context?.site?.id||null,deployContext:context?.deploy?.context||null,published:context?.deploy?.published??null,version:10});
    }

    if(action==="config"&&req.method==="GET"){
      const config=await configStore().get("main",{type:"json",consistency:"strong"});
      return json({config:config||null});
    }

    if(action==="submit"&&req.method==="POST"){
      const r=await req.json();
      if(!r||!r.role||!Array.isArray(r.answers)||!r.answers.length)return json({error:"Invalid submission"},400);
      const id=r.id||crypto.randomUUID();r.id=id;r.receivedAt=new Date().toISOString();r.schemaVersion=Number(r.schemaVersion||9);
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
      const store=configStore(),key=`__health_${Date.now()}_${crypto.randomUUID()}`;
      await store.set(key,"ok");
      const value=await store.get(key,{consistency:"strong"});
      await store.delete(key);
      return json({ok:value==="ok",message:value==="ok"?"Central storage read/write/delete test passed.":"Storage verification failed."});
    }

    if(action==="save-config"&&req.method==="POST"){
      const config=await req.json();if(!config||typeof config!=="object")return json({error:"Invalid config"},400);
      config.version=9;config.schema="hajr-safety-climate-v9";config.updatedAt=new Date().toISOString();
      await configStore().setJSON("main",config);
      return json({ok:true,savedAt:config.updatedAt});
    }

    if(action==="reset-responses"&&req.method==="POST"){
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
