window.Cloud = (() => {
  const API="/api/survey";
  let mode="unknown", lastError="";
  const LOCAL_CONFIG="hajr_v8_config", LOCAL_RESP="hajr_v8_responses", LOCAL_PIN="hajr_v8_admin_pin";
  function apiError(status, body){
    let message=body||`HTTP ${status}`;
    try{const j=JSON.parse(body);message=j.message||j.error||message;}catch(_){}
    const e=new Error(message);e.status=status;e.raw=body;return e;
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
      const old=localStorage.getItem(LOCAL_CONFIG) || localStorage.getItem("hajr_v7_config");
      const x=JSON.parse(old||"null"),m=Core.migrateConfig(defaults,x);
      localStorage.setItem(LOCAL_CONFIG,JSON.stringify(m));return m;
    }catch(e){const d=Core.migrateConfig(defaults,null);localStorage.setItem(LOCAL_CONFIG,JSON.stringify(d));return d;}
  }
  function localResponses(){
    try{return JSON.parse(localStorage.getItem(LOCAL_RESP)||localStorage.getItem("hajr_v7_responses")||"[]")}catch(e){return[]}
  }
  const localAllowed=()=>location.protocol==='file:' || ['localhost','127.0.0.1'].includes(location.hostname);
  async function getConfig(defaults){
    try{const out=await request("config");mode="cloud";lastError="";return Core.migrateConfig(defaults,out?.config||{});}catch(e){
      lastError=e.message;
      if(e.status===404 || localAllowed()){mode="local";return localConfig(defaults);}
      mode="cloud-error";console.error('Cloud config error',e);return Core.migrateConfig(defaults,null);
    }
  }
  async function submitResponse(record){
    if(mode==="local"){const arr=localResponses();arr.push(record);localStorage.setItem(LOCAL_RESP,JSON.stringify(arr));return {ok:true,mode:"local"};}
    if(mode==="cloud-error") throw new Error(lastError||"Cloud storage is unavailable.");
    return request("submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});
  }
  async function login(key){
    try{await request("login",{method:"POST",headers:{"x-admin-key":key}});mode="cloud";lastError="";sessionStorage.setItem("hajr_admin_key",key);return true;}
    catch(e){
      if((e.status===404 || localAllowed())){mode="local";const pin=localStorage.getItem(LOCAL_PIN)||"70330";if(key===pin){sessionStorage.setItem("hajr_admin_key",key);return true;}}
      lastError=e.message;return false;
    }
  }
  const key=()=>sessionStorage.getItem("hajr_admin_key")||"";
  async function getResponses(){
    if(mode==="local") return localResponses();
    return (await request("responses",{headers:{"x-admin-key":key()}})).responses||[];
  }
  async function saveConfig(config){
    if(mode==="local"){localStorage.setItem(LOCAL_CONFIG,JSON.stringify(config));return {ok:true,mode:"local",savedAt:new Date().toISOString()};}
    return request("save-config",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(config)});
  }
  async function resetResponses(){
    if(mode==="local"){localStorage.removeItem(LOCAL_RESP);return {ok:true,mode:"local",deleted:0};}
    return request("reset-responses",{method:"POST",headers:{"x-admin-key":key()}});
  }
  async function storageCheck(){
    if(mode==="local") return {ok:true,mode:"local",message:"Local preview storage is working."};
    return request("storage-check",{method:"POST",headers:{"x-admin-key":key()}});
  }
  async function health(){try{return await request("health");}catch(e){return {ok:false,error:e.message};}}
  async function changeLocalPin(pin){if(mode==="local")localStorage.setItem(LOCAL_PIN,pin);}
  return {getConfig,submitResponse,login,getResponses,saveConfig,resetResponses,storageCheck,health,changeLocalPin,get mode(){return mode;},get lastError(){return lastError;}};
})();
