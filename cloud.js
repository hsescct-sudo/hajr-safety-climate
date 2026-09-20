window.Cloud = (() => {
  const API="/.netlify/functions/survey";
  let mode="unknown";
  const LOCAL_CONFIG="hajr_v7_config", LOCAL_RESP="hajr_v7_responses", LOCAL_PIN="hajr_v7_admin_pin";
  async function request(action, opts={}){
    const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,opts);
    if(!r.ok){const body=await r.text().catch(()=>"");const e=new Error(body||`HTTP ${r.status}`);e.status=r.status;throw e;}
    const ct=r.headers.get("content-type")||""; return ct.includes("application/json")?r.json():r.text();
  }
  function localConfig(defaults){
    try{const x=JSON.parse(localStorage.getItem(LOCAL_CONFIG)||"null");const m=Core.migrateConfig(defaults,x);localStorage.setItem(LOCAL_CONFIG,JSON.stringify(m));return m;}catch(e){const d=Core.clone(defaults);localStorage.setItem(LOCAL_CONFIG,JSON.stringify(d));return d;}
  }
  function localResponses(){try{return JSON.parse(localStorage.getItem(LOCAL_RESP)||"[]")}catch(e){return[]}}
  async function getConfig(defaults){
    try{const out=await request("config");mode="cloud";return Core.migrateConfig(defaults,out?.config||{});}catch(e){mode="local";return localConfig(defaults);}
  }
  async function submitResponse(record){
    if(mode==="cloud") return request("submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});
    const arr=localResponses();arr.push(record);localStorage.setItem(LOCAL_RESP,JSON.stringify(arr));return {ok:true,mode:"local"};
  }
  async function login(key){
    try{await request("login",{method:"POST",headers:{"x-admin-key":key}});mode="cloud";sessionStorage.setItem("hajr_admin_key",key);return true;}
    catch(e){
      // Fallback only when the Function is absent (local preview), never when a deployed Function rejects the key.
      try{const probe=await fetch(`${API}?action=config`);if(probe.ok || probe.status!==404) return false;}catch(_){}
      mode="local";const pin=localStorage.getItem(LOCAL_PIN)||"70330";if(key===pin){sessionStorage.setItem("hajr_admin_key",key);return true;}return false;
    }
  }
  const key=()=>sessionStorage.getItem("hajr_admin_key")||"";
  async function getResponses(){if(mode==="cloud")return (await request("responses",{headers:{"x-admin-key":key()}})).responses||[];return localResponses();}
  async function saveConfig(config){if(mode==="cloud")return request("save-config",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(config)});localStorage.setItem(LOCAL_CONFIG,JSON.stringify(config));return {ok:true};}
  async function resetResponses(){if(mode==="cloud")return request("reset-responses",{method:"POST",headers:{"x-admin-key":key()}});localStorage.removeItem(LOCAL_RESP);return {ok:true};}
  async function changeLocalPin(pin){if(mode!=="cloud")localStorage.setItem(LOCAL_PIN,pin);}
  return {getConfig,submitResponse,login,getResponses,saveConfig,resetResponses,changeLocalPin,get mode(){return mode;}};
})();
