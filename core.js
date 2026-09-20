window.Core = (() => {
  const LEGACY_ROLE_MAP = {
    "Management":"Executive Leader / Director",
    "HSE":"Project Director / Manager",
    "Engineers & Supervisors":"Engineer / Supervisor",
    "Workers":"Labour / Worker"
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const esc = x => String(x ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const tx = (obj, lang="en") => {
    if(obj == null) return "";
    if(typeof obj === "string") return obj;
    return obj[lang] || obj.en || Object.values(obj).find(v => typeof v === "string") || "";
  };
  const canonicalRole = role => LEGACY_ROLE_MAP[role] || role || "Unknown";
  const normalizedValue = answer => {
    const raw = Number(answer?.value ?? answer);
    if(!Number.isFinite(raw) || raw < 1 || raw > 5) return null;
    return answer?.negative ? 6 - raw : raw;
  };
  const pct = (values, predicate, digits=0) => {
    const clean=(values||[]).filter(Number.isFinite);
    if(!clean.length) return null;
    const n=clean.filter(predicate).length/clean.length*100;
    return Number(n.toFixed(digits));
  };
  const mergeText = (def, cur) => {
    const out={...(def||{})};
    if(cur && typeof cur === "object") Object.entries(cur).forEach(([k,v])=>{ if(typeof v === "string" && v.trim()) out[k]=v; });
    return out;
  };
  const cleanProjectName = (name, code) => String(name||"").replace(new RegExp(`^\\s*${String(code||"").replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\s*[–—-]\\s*`),"").trim();
  function migrateConfig(defaults, current){
    const d=clone(defaults); const c=current && typeof current === "object" ? current : null;
    if(!c) return d;
    // Preserve client branding/settings from earlier versions.
    if(c.project){
      d.project.code = c.project.code || d.project.code;
      ['name','surveyName','subtitle'].forEach(k=>{
        d.project[k]=mergeText(d.project[k],c.project[k]);
        if(k==='name') Object.keys(d.project[k]).forEach(l=>d.project[k][l]=cleanProjectName(d.project[k][l],d.project.code));
      });
    }
    if(c.theme && typeof c.theme==='object') d.theme={...d.theme,...c.theme};
    if(Array.isArray(c.logos) && c.logos.length) d.logos=clone(c.logos);
    if(Array.isArray(c.divisions) && c.divisions.length) d.divisions=clone(c.divisions);
    if(Array.isArray(c.languages)){
      const map=Object.fromEntries(c.languages.map(x=>[x.code,x]));
      d.languages=d.languages.map(x=>({...x,...(map[x.code]||{})}));
    }
    // Structural content is preserved only after the clean V7 schema has been saved.
    // Earlier configs are deliberately migrated to the verified five-questionnaire structure.
    if(Number(c.version) >= 7){
      if(Array.isArray(c.roles) && c.roles.length) d.roles=clone(c.roles);
      if(c.questions && typeof c.questions==='object') d.questions=clone(c.questions);
      if(Array.isArray(c.openQuestions)) d.openQuestions=clone(c.openQuestions);
      if(c.factors && typeof c.factors==='object'){
        Object.keys(d.factors).forEach(k=> d.factors[k]=mergeText(d.factors[k],c.factors[k]));
      }
      if(c.ui && typeof c.ui==='object'){
        Object.keys(d.ui).forEach(l=>{ d.ui[l]={...d.ui[l],...(c.ui[l]||{})}; });
      }
    }
    d.version=7; d.schema='hajr-safety-climate-v7';
    return d;
  }
  const roleObject = (config,id) => (config.roles||[]).find(r=>r.id===id);
  const roleLabel = (config,id,lang='en') => tx(roleObject(config,canonicalRole(id))?.text,lang) || canonicalRole(id);
  const roleDescription = (config,id,lang='en') => tx(roleObject(config,canonicalRole(id))?.description,lang);
  return {clone,esc,tx,canonicalRole,normalizedValue,pct,migrateConfig,roleObject,roleLabel,roleDescription,LEGACY_ROLE_MAP};
})();
