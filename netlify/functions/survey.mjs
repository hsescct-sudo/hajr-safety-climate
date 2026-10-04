import { getStore } from "@netlify/blobs";

export const config = { path: "/api/survey" };

const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const authorized=req=>Boolean(process.env.ADMIN_KEY)&&req.headers.get("x-admin-key")===process.env.ADMIN_KEY;

// IMPORTANT: inside Netlify Functions, getStore() receives site ID and write token
// automatically from the runtime. Passing a manual site ID without the runtime token
// can cause 403 write errors, so site-wide stores are opened directly here.
const configStore=()=>getStore("hajr-safety-config");
const responseStore=()=>getStore("hajr-safety-responses");
const actionStore=()=>getStore("hajr-safety-actions");
const actionFileStore=()=>getStore("hajr-safety-action-files");
const raffleStore=()=>getStore("safety-climate-raffle");
const raffleDeviceStore=()=>getStore("safety-climate-raffle-devices");
const raffleDrawStore=()=>getStore("safety-climate-raffle-draws");
const surveyDeviceStore=()=>getStore("safety-climate-survey-devices");
const hashText=async text=>{const bytes=new TextEncoder().encode(String(text||""));const dig=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(dig)].map(b=>b.toString(16).padStart(2,"0")).join("");};

export default async (req, context) => {
  const url=new URL(req.url),action=url.searchParams.get("action")||"";
  try{
    if(action==="health"&&req.method==="GET"){
      return json({ok:true,site:context?.site?.name||null,siteID:context?.site?.id||null,deployContext:context?.deploy?.context||null,published:context?.deploy?.published??null,version:"10.15-final"});
    }

    if(action==="config"&&req.method==="GET"){
      const config=await configStore().get("main",{type:"json",consistency:"strong"});
      return json({config:config||null});
    }

    if(action==="survey-device-check"&&req.method==="POST"){
      const body=await req.json();
      const cfg=await configStore().get("main",{type:"json",consistency:"strong"});
      if(cfg?.surveyControls?.oneResponsePerDevice===false)return json({ok:true,available:true,enforced:false});
      const active=(cfg?.campaigns||[]).find(c=>c?.isActive)||cfg?.campaign||null;
      const campaignKey=String(active?.id||body?.campaignId||active?.name||body?.campaign||'default');
      const deviceId=String(body?.deviceId||'').trim();
      if(!deviceId)return json({ok:true,available:true,enforced:true});
      const deviceHash=await hashText(`${campaignKey}::${deviceId}`);
      const existing=await surveyDeviceStore().get(`device_${deviceHash}`,{type:"json",consistency:"strong"});
      return json({ok:true,available:!existing,enforced:true});
    }

    if(action==="submit"&&req.method==="POST"){
      const r=await req.json();
      if(!r||!r.role||!Array.isArray(r.answers)||!r.answers.length)return json({error:"Invalid submission"},400);
      const cfg=await configStore().get("main",{type:"json",consistency:"strong"});
      const active=(cfg?.campaigns||[]).find(c=>c?.isActive)||cfg?.campaign||null;
      if(active&&String(active.status||"Open")!=="Open")return json({error:"Campaign closed",message:"The active survey campaign is not accepting responses."},409);
      if(active){r.campaign=String(active.name||r.campaign||"Safety Climate Survey");r.campaignId=String(active.id||r.campaignId||"");}
      const campaignKey=String(active?.id||r.campaignId||active?.name||r.campaign||'default');
      const deviceId=String(r.deviceId||'').trim();delete r.deviceId;
      let deviceKey='';
      if(cfg?.surveyControls?.oneResponsePerDevice!==false&&deviceId){const deviceHash=await hashText(`${campaignKey}::${deviceId}`);deviceKey=`device_${deviceHash}`;const existing=await surveyDeviceStore().get(deviceKey,{type:"json",consistency:"strong"});if(existing)return json({error:"Duplicate survey device",message:"This browser/device has already submitted a response for the current campaign.",code:"DUPLICATE_SURVEY_DEVICE"},409);}
      const id=r.id||crypto.randomUUID();r.id=id;r.receivedAt=new Date().toISOString();r.schemaVersion=Number(r.schemaVersion||10);
      await responseStore().setJSON(`${Date.now()}_${id}`,r);
      if(deviceKey)await surveyDeviceStore().setJSON(deviceKey,{campaignId:r.campaignId||'',campaign:r.campaign||'',submittedAt:r.receivedAt});
      return json({ok:true,id,savedAt:r.receivedAt,campaign:r.campaign,campaignId:r.campaignId||null});
    }

    if(action==="raffle-submit"&&req.method==="POST"){
      const body=await req.json();
      const badge=String(body?.badge||'').trim().replace(/\s+/g,' ').toUpperCase();
      if(!badge||badge.length<2||badge.length>80)return json({error:'Invalid badge number',code:'INVALID_BADGE'},400);
      const cfg=await configStore().get('main',{type:'json',consistency:'strong'});
      if(cfg?.raffle?.enabled===false)return json({error:'Raffle disabled',code:'RAFFLE_DISABLED'},409);
      const campaignKey=String(body?.campaignId||body?.campaign||'default');const badgeHash=await hashText(`${campaignKey}::${badge}`),key=`badge_${badgeHash}`;
      const existing=await raffleStore().get(key,{type:'json',consistency:'strong'});
      if(existing)return json({error:'Duplicate badge',code:'DUPLICATE_BADGE'},409);
      const deviceId=String(body?.deviceId||'').trim();
      let deviceHash='';
      if(deviceId){deviceHash=await hashText(`${campaignKey}::${deviceId}`);if(cfg?.raffle?.strictDevice===true){const d=await raffleDeviceStore().get(`device_${deviceHash}`,{type:'json',consistency:'strong'});if(d)return json({error:'Duplicate device',code:'DUPLICATE_DEVICE'},409);}}
      const entry={id:crypto.randomUUID(),badge,name:cfg?.raffle?.collectName===true?String(body?.name||'').trim().slice(0,120):'',campaign:String(body?.campaign||''),campaignId:String(body?.campaignId||''),language:String(body?.language||''),enteredAt:new Date().toISOString()};
      await raffleStore().setJSON(key,entry);
      if(deviceHash)await raffleDeviceStore().setJSON(`device_${deviceHash}`,{entryId:entry.id,enteredAt:entry.enteredAt});
      return json({ok:true,enteredAt:entry.enteredAt});
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


    if(action==="raffle-entries"&&req.method==="GET"){
      const store=raffleStore(),listed=await store.list();
      const entries=(await Promise.all(listed.blobs.map(x=>store.get(x.key,{type:'json',consistency:'strong'})))).filter(Boolean).sort((a,b)=>String(a.enteredAt||'').localeCompare(String(b.enteredAt||'')));
      const ds=raffleDrawStore(),dl=await ds.list();
      const draws=(await Promise.all(dl.blobs.map(x=>ds.get(x.key,{type:'json',consistency:'strong'})))).filter(Boolean).sort((a,b)=>String(b.drawnAt||'').localeCompare(String(a.drawnAt||'')));
      return json({entries,draws,count:entries.length});
    }
    if(action==="raffle-draw"&&req.method==="POST"){
      const store=raffleStore(),listed=await store.list();
      const cfg=await configStore().get('main',{type:'json',consistency:'strong'});const active=(cfg?.campaigns||[]).find(c=>c?.isActive)||cfg?.campaign||null;
      let entries=(await Promise.all(listed.blobs.map(x=>store.get(x.key,{type:'json',consistency:'strong'})))).filter(Boolean);
      if(active){entries=entries.filter(x=>(active.id&&x.campaignId===active.id)||(!active.id&&x.campaign===active.name));}
      if(!entries.length)return json({error:'No raffle entries for the active campaign'},409);
      const buf=new Uint32Array(1);crypto.getRandomValues(buf);const winner=entries[Math.floor((buf[0]/4294967296)*entries.length)];
      const draw={id:crypto.randomUUID(),winnerId:winner.id,badge:winner.badge,name:winner.name||'',campaign:winner.campaign||'',drawnAt:new Date().toISOString()};
      await raffleDrawStore().setJSON(`${Date.now()}_${draw.id}`,draw);
      return json({ok:true,winner,drawnAt:draw.drawnAt});
    }

    if(action==="action-records"&&req.method==="GET"){
      const store=actionStore(),listed=await store.list();
      const records=(await Promise.all(listed.blobs.map(x=>store.get(x.key,{type:"json",consistency:"strong"})))).filter(Boolean);
      records.sort((a,b)=>String(a.updatedAt||a.createdAt||"").localeCompare(String(b.updatedAt||b.createdAt||"")));
      return json({records,count:records.length});
    }

    if(action==="save-action"&&req.method==="POST"){
      const incoming=await req.json();
      if(!incoming||typeof incoming!=="object"||!incoming.id)return json({error:"Invalid action record"},400);
      const id=String(incoming.id).replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      if(!id)return json({error:"Invalid action id"},400);
      const now=new Date().toISOString();
      const previous=await actionStore().get(id,{type:"json",consistency:"strong"});
      const record={...incoming,id,createdAt:previous?.createdAt||incoming.createdAt||now,updatedAt:now};
      await actionStore().setJSON(id,record);
      const verified=await actionStore().get(id,{type:"json",consistency:"strong"});
      return json({ok:true,record:verified});
    }

    if(action==="upload-action-evidence"&&req.method==="POST"){
      const body=await req.json();
      if(!body?.actionId||!body?.name||!body?.dataUrl)return json({error:"Missing evidence file data"},400);
      const actionId=String(body.actionId).replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      const name=String(body.name).slice(0,220),type=String(body.type||"application/octet-stream").slice(0,120),dataUrl=String(body.dataUrl);
      if(dataUrl.length>4_500_000)return json({error:"Evidence file is too large","message":"Please keep each attachment below approximately 3 MB after compression."},413);
      const fileId=crypto.randomUUID();
      await actionFileStore().setJSON(`${actionId}__${fileId}`,{name,type,dataUrl,uploadedAt:new Date().toISOString()});
      return json({ok:true,file:{id:fileId,name,type,size:Number(body.size||0),uploadedAt:new Date().toISOString()}});
    }

    if(action==="action-evidence"&&req.method==="GET"){
      const actionId=String(url.searchParams.get("actionId")||"").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      const fileId=String(url.searchParams.get("fileId")||"").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      if(!actionId||!fileId)return json({error:"Missing evidence file id"},400);
      const file=await actionFileStore().get(`${actionId}__${fileId}`,{type:"json",consistency:"strong"});
      return file?json({ok:true,file}):json({error:"Evidence file not found"},404);
    }

    if(action==="delete-action-evidence"&&req.method==="DELETE"){
      const body=await req.json();
      const actionId=String(body?.actionId||"").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      const fileId=String(body?.fileId||"").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
      if(!actionId||!fileId)return json({error:"Missing evidence file id"},400);
      await actionFileStore().delete(`${actionId}__${fileId}`);
      return json({ok:true});
    }

    if(action==="storage-check"&&req.method==="POST"){
      const key=`__health_${Date.now()}_${crypto.randomUUID()}`;
      const c=configStore(),a=actionStore(),f=actionFileStore(),r=raffleStore(),sd=surveyDeviceStore();
      await c.set(key,"ok");await a.setJSON(key,{ok:true});await f.setJSON(key,{ok:true});await r.setJSON(key,{ok:true});await sd.setJSON(key,{ok:true});
      const [cv,av,fv,rv,sv]=await Promise.all([c.get(key,{consistency:"strong"}),a.get(key,{type:"json",consistency:"strong"}),f.get(key,{type:"json",consistency:"strong"}),r.get(key,{type:"json",consistency:"strong"}),sd.get(key,{type:"json",consistency:"strong"})]);
      await Promise.all([c.delete(key),a.delete(key),f.delete(key),r.delete(key),sd.delete(key)]);
      const ok=cv==="ok"&&av?.ok===true&&fv?.ok===true&&rv?.ok===true&&sv?.ok===true;
      return json({ok,message:ok?"Central storage read/write/delete test passed for configuration, actions, evidence, raffle data and survey device controls.":"Storage verification failed."});
    }

    if(action==="save-config"&&req.method==="POST"){
      const incoming=await req.json();
      if(!incoming||typeof incoming!=="object"||Array.isArray(incoming))return json({error:"Invalid config"},400);
      // Store a clean copy and then read the exact object back with strong
      // consistency. Returning that raw stored object lets the admin verify the
      // save without comparing against a migrated/default-normalized config.
      const stored={...incoming,version:"10.15-final",schema:"safety-climate-v10",updatedAt:new Date().toISOString()};
      const store=configStore();
      await store.setJSON("main",stored);
      const verified=await store.get("main",{type:"json",consistency:"strong"});
      if(!verified)return json({error:"Save verification failed",message:"Configuration was written but could not be read back from central storage."},500);
      return json({ok:true,savedAt:stored.updatedAt,config:verified});
    }

    if(action==="reset-responses"&&req.method==="POST"){
      const store=responseStore(),listed=await store.list();
      let deleted=0;
      for(const item of listed.blobs){await store.delete(item.key);deleted++;}
      const deviceStore=surveyDeviceStore(),deviceList=await deviceStore.list();
      let deviceLocksDeleted=0;for(const item of deviceList.blobs){await deviceStore.delete(item.key);deviceLocksDeleted++;}
      return json({ok:true,deleted,deviceLocksDeleted,savedAt:new Date().toISOString()});
    }

    return json({error:"Not found"},404);
  }catch(e){
    console.error("survey function error",e);
    return json({error:"Server error",message:e?.message||String(e)},500);
  }
};
