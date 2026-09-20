import { getStore } from "@netlify/blobs";

const json = (obj, status=200) => new Response(JSON.stringify(obj), {
  status,
  headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
});
const configStore = () => getStore({name:"hajr-safety-config", consistency:"strong"});
const responseStore = () => getStore({name:"hajr-safety-responses", consistency:"strong"});

function authorized(req){
  const required = process.env.ADMIN_KEY;
  if(!required) return false;
  return req.headers.get("x-admin-key") === required;
}

export default async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  if(action === "config" && req.method === "GET"){
    const config = await configStore().get("main", {type:"json", consistency:"strong"});
    return json({config: config || null});
  }

  if(action === "submit" && req.method === "POST"){
    const record = await req.json();
    if(!record || !record.role || !Array.isArray(record.answers)) return json({error:"Invalid submission"},400);
    const id = record.id || crypto.randomUUID();
    record.id=id; record.receivedAt=new Date().toISOString();
    await responseStore().setJSON(`${Date.now()}_${id}`, record);
    return json({ok:true,id});
  }

  if(action === "login" && req.method === "POST"){
    if(!process.env.ADMIN_KEY) return json({error:"ADMIN_KEY is not configured in Netlify"},503);
    return authorized(req) ? json({ok:true}) : json({error:"Unauthorized"},401);
  }

  if(!authorized(req)) return json({error:"Unauthorized"},401);

  if(action === "responses" && req.method === "GET"){
    const store=responseStore();
    const {blobs}=await store.list();
    const responses=(await Promise.all(blobs.map(x=>store.get(x.key,{type:"json",consistency:"strong"})))).filter(Boolean);
    responses.sort((a,b)=>String(a.timestamp||"").localeCompare(String(b.timestamp||"")));
    return json({responses});
  }

  if(action === "save-config" && req.method === "POST"){
    const config=await req.json();
    await configStore().setJSON("main",config);
    return json({ok:true});
  }

  if(action === "reset-responses" && req.method === "POST"){
    const {deletedBlobs}=await responseStore().deleteAll();
    return json({ok:true,deleted:deletedBlobs});
  }

  return json({error:"Not found"},404);
};
