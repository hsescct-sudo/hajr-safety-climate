window.Cloud = (() => {
 const API="/.netlify/functions/survey";let mode="unknown";const clone=x=>JSON.parse(JSON.stringify(x));
 function mergeDefaults(def,cur){if(cur===undefined||cur===null)return clone(def);if(Array.isArray(def))return Array.isArray(cur)?cur:clone(def);if(def&&typeof def==="object"){const out={};new Set([...Object.keys(def||{}),...Object.keys(cur||{})]).forEach(k=>out[k]=mergeDefaults(def?.[k],cur?.[k]));return out}return cur}
 function upgraded(defaultConfig,current){const prior=current||{};const c=mergeDefaults(defaultConfig,prior);if((prior.version||0)<7){c.roles=clone(defaultConfig.roles);c.questions=clone(defaultConfig.questions);c.positions=[]}c.version=defaultConfig.version||c.version;return c}
 function localConfig(defaultConfig){const x=localStorage.getItem("hajr_v4_config");if(x){try{return upgraded(defaultConfig,JSON.parse(x))}catch(e){}}const c=clone(defaultConfig);localStorage.setItem("hajr_v4_config",JSON.stringify(c));return c}
 function localResponses(){try{return JSON.parse(localStorage.getItem("hajr_v4_responses")||"[]")}catch(e){return[]}}
 async function request(action,opts={}){const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,opts);if(!r.ok){const msg=await r.text().catch(()=>"");const e=new Error(msg||`HTTP ${r.status}`);e.status=r.status;throw e}const ct=r.headers.get("content-type")||"";return ct.includes("application/json")?r.json():r.text()}
 async function getConfig(defaultConfig){try{const out=await request("config");mode="cloud";return upgraded(defaultConfig,out&&out.config?out.config:{})}catch(e){mode="local";return localConfig(defaultConfig)}}
 async function submitResponse(record){if(mode==="cloud")return request("submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(record)});const arr=localResponses();arr.push(record);localStorage.setItem("hajr_v4_responses",JSON.stringify(arr));return {ok:true,mode:"local"}}
 async function login(key){try{await request("login",{method:"POST",headers:{"x-admin-key":key}});mode="cloud";sessionStorage.setItem("hajr_admin_key",key);return true}catch(e){try{const probe=await fetch(`${API}?action=config`);if(probe.status!==404&&probe.ok)return false}catch(_){}mode="local";const pin=localStorage.getItem("hajr_v4_admin_pin")||"70330";if(key===pin){sessionStorage.setItem("hajr_admin_key",key);return true}return false}}
 function key(){return sessionStorage.getItem("hajr_admin_key")||""}
 async function getResponses(){if(mode==="cloud")return (await request("responses",{headers:{"x-admin-key":key()}})).responses||[];return localResponses()}
 async function saveConfig(config){if(mode==="cloud")return request("save-config",{method:"POST",headers:{"content-type":"application/json","x-admin-key":key()},body:JSON.stringify(config)});localStorage.setItem("hajr_v4_config",JSON.stringify(config));return {ok:true}}
 async function resetResponses(){if(mode==="cloud")return request("reset-responses",{method:"POST",headers:{"x-admin-key":key()}});localStorage.removeItem("hajr_v4_responses");return {ok:true}}
 async function changeLocalPin(pin){if(mode!=="cloud")localStorage.setItem("hajr_v4_admin_pin",pin)}
 return {getConfig,submitResponse,login,getResponses,saveConfig,resetResponses,changeLocalPin,get mode(){return mode}};
})();
