window.Cloud = (() => {
  const API="/api/survey";
  let mode="unknown", lastError="";
  const LOCAL_CONFIG="safety_v10_config", LOCAL_RESP="safety_v10_responses", LOCAL_PIN="safety_v10_admin_pin", LOCAL_RAFFLE="safety_v10_raffle", LOCAL_SURVEY_DEVICES="safety_v10_survey_devices";
  function apiError(status, body){
    let message=body||`HTTP ${status}`,payload=null;
    try{payload=JSON.parse(body);message=payload.message||payload.error||message;}catch(_){}
    const e=new Error(message);e.status=status;e.raw=body;e.payload=payload;return e;
  }
  async function request(action, opts={}){
    const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,opts);
    const body=await r.text().catch(()=>"");
    if(!r.ok) throw apiError(r.status,body);
    const ct=r.headers.get("content-type")||"";
    return ct.includes("application/json") ? (body?JSON.parse(body):{}) : body;
  }
  function localConfig(defaults){
    try{
      const old=localStorage.getItem(LOCAL_CONFIG);
      const x=JSON.parse(old||"null"),m=Core.migrateConfig(defaults,x);
      localStorage.setItem(LOCAL_CONFIG,JSON.stringify(m));return m;
    }catch(e){const d=Core.migrateConfig(defaults,null);localStorage.setItem(LOCAL_CONFIG,JSON.stringify(d));return d;}
  }
  function localResponses(){
    try{return JSON.parse(localStorage.getItem(LOCAL_RESP)||"[]")}catch(e){return[]}
  }
  const localAllowed=()=>location.protocol==='file:' || ['localhost','127.0.0.1'].includes(location.hostname);
  async function getConfig(defaults){
    try{const out=await request("config");mode="cloud";lastError="";return Core.migrateConfig(defaults,out?.config||{});}catch(e){
      lastError=e.message;
      if(e.status===404 || localAllowed()){mode="local";return localConfig(defaults);}
      mode="cloud-error";console.error('Cloud config error',e);return Core.migrateConfig(defaults,null);
    }
  }
  function localSurveyKey(record){return `${record?.campaignId||record?.campaign||'default'}::${record?.deviceId||''}`;}
  async function checkSurveyDevice(record){
    if(!record?.deviceId)return {ok:true,available:true};
    if(mode==="local"){let used=[];try{used=JSON.parse(localStorage.getItem(LOCAL_SURVEY_DEVICES)||"[]")}catch(_){}return {ok:true,available:!used.includes(localSurveyKey(record))};}
    if(mode==="cloud-error")throw new Error(lastError||"Cloud storage is unavailable.");
    return request("survey-device-check",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});
  }
  async function submitResponse(record){
    if(mode==="local"){let used=[];try{used=JSON.parse(localStorage.getItem(LOCAL_SURVEY_DEVICES)||"[]")}catch(_){}const k=localSurveyKey(record);if(record?.deviceId&&used.includes(k)){const e=new Error('Duplicate survey device');e.status=409;e.payload={code:'DUPLICATE_SURVEY_DEVICE'};throw e;}const arr=localResponses(),clean={...record};delete clean.deviceId;arr.push(clean);localStorage.setItem(LOCAL_RESP,JSON.stringify(arr));if(record?.deviceId){used.push(k);localStorage.setItem(LOCAL_SURVEY_DEVICES,JSON.stringify([...new Set(used)]));}return {ok:true,mode:"local"};}
    if(mode==="cloud-error") throw new Error(lastError||"Cloud storage is unavailable.");
    return request("submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});
  }
  async function login(key){
    try{await request("login",{method:"POST",headers:{"x-admin-key":key}});mode="cloud";lastError="";sessionStorage.setItem("safety_admin_key",key);return true;}
    catch(e){
      if((e.status===404 || localAllowed())){mode="local";const pin=localStorage.getItem(LOCAL_PIN)||"70330";if(key===pin){sessionStorage.setItem("safety_admin_key",key);return true;}}
      lastError=e.message;return false;
    }
  }
  const key=()=>sessionStorage.getItem("safety_admin_key")||"";
  async function getResponses(){
    if(mode==="local") return localResponses();
    return (await request("responses",{headers:{"x-admin-key":key()}})).responses||[];
  }
  async function saveConfig(config){
    if(mode==="local"){localStorage.setItem(LOCAL_CONFIG,JSON.stringify(config));return {ok:true,mode:"local",savedAt:new Date().toISOString()};}
    return request("save-config",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(config)});
  }
  async function resetResponses(){
    if(mode==="local"){localStorage.removeItem(LOCAL_RESP);localStorage.removeItem(LOCAL_SURVEY_DEVICES);return {ok:true,mode:"local",deleted:0};}
    return request("reset-responses",{method:"POST",headers:{"x-admin-key":key()}});
  }
  async function storageCheck(){
    if(mode==="local") return {ok:true,mode:"local",message:"Local preview storage is working."};
    return request("storage-check",{method:"POST",headers:{"x-admin-key":key()}});
  }

  async function getActionRecords(){
    if(mode==="local"){
      try{return JSON.parse(localStorage.getItem("safety_v10_actions")||"[]")}catch(e){return[]}
    }
    return (await request("action-records",{headers:{"x-admin-key":key()}})).records||[];
  }
  async function saveAction(record){
    if(mode==="local"){
      const arr=await getActionRecords(),i=arr.findIndex(x=>x.id===record.id),saved={...record,updatedAt:new Date().toISOString()};
      if(i>=0)arr[i]=saved;else arr.push(saved);localStorage.setItem("safety_v10_actions",JSON.stringify(arr));return {ok:true,record:saved};
    }
    return request("save-action",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(record)});
  }
  async function uploadActionEvidence(actionId,file){
    const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error("Could not read file"));r.readAsDataURL(file)});
    if(mode==="local")return {ok:true,file:{id:`local_${Date.now()}_${Math.random().toString(36).slice(2)}`,name:file.name,type:file.type,size:file.size,uploadedAt:new Date().toISOString(),dataUrl}};
    return request("upload-action-evidence",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify({actionId,name:file.name,type:file.type,size:file.size,dataUrl})});
  }
  async function getActionEvidence(actionId,fileMeta){
    if(mode==="local")return {ok:true,file:{name:fileMeta.name,type:fileMeta.type,dataUrl:fileMeta.dataUrl}};
    const r=await fetch(`${API}?action=action-evidence&actionId=${encodeURIComponent(actionId)}&fileId=${encodeURIComponent(fileMeta.id)}`,{headers:{"x-admin-key":key()}});
    const body=await r.text().catch(()=>"");if(!r.ok)throw apiError(r.status,body);return body?JSON.parse(body):{};
  }
  async function deleteActionEvidence(actionId,fileMeta){
    if(mode==="local")return {ok:true};
    return request("delete-action-evidence",{method:"DELETE",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify({actionId,fileId:fileMeta.id})});
  }

  async function submitRaffle(record){
    if(mode==='local'){const arr=JSON.parse(localStorage.getItem(LOCAL_RAFFLE)||'[]'),badge=String(record.badge||'').trim().toUpperCase();if(arr.some(x=>String(x.badge||'').toUpperCase()===badge)){const e=new Error('Duplicate badge');e.status=409;e.payload={code:'DUPLICATE_BADGE'};throw e;}arr.push({...record,badge,enteredAt:new Date().toISOString()});localStorage.setItem(LOCAL_RAFFLE,JSON.stringify(arr));return {ok:true};}
    return request('raffle-submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record)});
  }
  async function getRaffleEntries(){if(mode==='local')return {entries:JSON.parse(localStorage.getItem(LOCAL_RAFFLE)||'[]'),draws:[]};return request('raffle-entries',{headers:{'x-admin-key':key()}});}
  async function drawRaffleWinner(){if(mode==='local'){const arr=JSON.parse(localStorage.getItem(LOCAL_RAFFLE)||'[]');if(!arr.length)throw new Error('No raffle entries');return {ok:true,winner:arr[Math.floor(Math.random()*arr.length)],drawnAt:new Date().toISOString()};}return request('raffle-draw',{method:'POST',headers:{'x-admin-key':key()}});}
  async function clearRaffleData(){if(mode==='local'){const count=JSON.parse(localStorage.getItem(LOCAL_RAFFLE)||'[]').length;localStorage.removeItem(LOCAL_RAFFLE);return {ok:true,mode:'local',deleted:{entries:count,deviceLocks:0,drawHistory:0}};}return request('raffle-reset',{method:'POST',headers:{'x-admin-key':key()}});}

  async function health(){try{return await request("health");}catch(e){return {ok:false,error:e.message};}}
  async function changeLocalPin(pin){if(mode==="local")localStorage.setItem(LOCAL_PIN,pin);}
  return {getConfig,checkSurveyDevice,submitResponse,submitRaffle,login,getResponses,saveConfig,resetResponses,storageCheck,getActionRecords,saveAction,uploadActionEvidence,getActionEvidence,deleteActionEvidence,getRaffleEntries,drawRaffleWinner,clearRaffleData,health,changeLocalPin,get mode(){return mode;},get lastError(){return lastError;}};
})();
