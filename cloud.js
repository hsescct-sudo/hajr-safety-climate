
window.Cloud = (() => {
  const API = "/.netlify/functions/survey";
  let mode = "unknown";
  const clone = x => JSON.parse(JSON.stringify(x));
  function localConfig(defaultConfig){
    const x = localStorage.getItem("hajr_v4_config");
    if(x){ try { return JSON.parse(x); } catch(e){} }
    localStorage.setItem("hajr_v4_config", JSON.stringify(defaultConfig));
    return clone(defaultConfig);
  }
  function localResponses(){
    try{return JSON.parse(localStorage.getItem("hajr_v4_responses")||"[]")}catch(e){return[]}
  }
  async function request(action, opts={}){
    const r = await fetch(`${API}?action=${encodeURIComponent(action)}`, opts);
    if(!r.ok){
      const msg = await r.text().catch(()=> "");
      const e = new Error(msg || `HTTP ${r.status}`); e.status=r.status; throw e;
    }
    const ct=r.headers.get("content-type")||"";
    return ct.includes("application/json") ? r.json() : r.text();
  }
  async function getConfig(defaultConfig){
    try{
      const out = await request("config");
      mode="cloud";
      return out && out.config ? out.config : clone(defaultConfig);
    }catch(e){
      mode="local";
      return localConfig(defaultConfig);
    }
  }
  async function submitResponse(record){
    if(mode==="cloud"){
      try{
        return await request("submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});
      }catch(e){ throw e; }
    }
    const arr=localResponses();arr.push(record);localStorage.setItem("hajr_v4_responses",JSON.stringify(arr));return {ok:true,mode:"local"};
  }
  async function login(key){
    try{
      await request("login",{method:"POST",headers:{"x-admin-key":key}});
      mode="cloud"; sessionStorage.setItem("hajr_admin_key",key); return true;
    }catch(e){
      // When functions are not deployed, use local demo admin PIN.
      try{
        const probe=await fetch(`${API}?action=config`);
        if(probe.status!==404 && probe.ok){ return false; }
      }catch(_){}
      mode="local";
      const pin=localStorage.getItem("hajr_v4_admin_pin")||"70330";
      if(key===pin){sessionStorage.setItem("hajr_admin_key",key);return true}
      return false;
    }
  }
  function key(){return sessionStorage.getItem("hajr_admin_key")||""}
  async function getResponses(){
    if(mode==="cloud") return (await request("responses",{headers:{"x-admin-key":key()}})).responses||[];
    return localResponses();
  }
  async function saveConfig(config){
    if(mode==="cloud"){
      return request("save-config",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(config)});
    }
    localStorage.setItem("hajr_v4_config",JSON.stringify(config)); return {ok:true};
  }
  async function resetResponses(){
    if(mode==="cloud") return request("reset-responses",{method:"POST",headers:{"x-admin-key":key()}});
    localStorage.removeItem("hajr_v4_responses"); return {ok:true};
  }
  async function changeLocalPin(pin){
    if(mode!=="cloud") localStorage.setItem("hajr_v4_admin_pin",pin);
  }
  return {getConfig,submitResponse,login,getResponses,saveConfig,resetResponses,changeLocalPin,get mode(){return mode}};
})();
