window.Core = (() => {
  const MERGED_ROLE = "Engineer / Supervisor / Technician";
  const LEGACY_ROLE_MAP = {
    "Management":"Executive Leader / Director",
    "HSE":"Project Director / Manager",
    "Engineers & Supervisors":MERGED_ROLE,
    "Engineer / Supervisor":MERGED_ROLE,
    "Technician":MERGED_ROLE,
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
    return Number((clean.filter(predicate).length/clean.length*100).toFixed(digits));
  };
  const mergeText = (def, cur) => {
    const out={...(def||{})};
    if(cur && typeof cur === "object") Object.entries(cur).forEach(([k,v])=>{ if(typeof v === "string" && v.trim()) out[k]=v; });
    return out;
  };
  const cleanProjectName = (name, code) => {
    const safe=String(code||"").replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return String(name||"").replace(new RegExp(`^\\s*${safe}\\s*[–—-]\\s*`),"").trim();
  };
  function migrateConfig(defaults, current){
    const d=clone(defaults), c=current && typeof current === "object" ? current : null;
    if(!c){ d.version='10.8-final'; d.release='10.8-final'; d.schema='hajr-safety-climate-v10'; return d; }

    if(c.project){
      d.project.code=c.project.code||d.project.code;
      ['name','surveyName','subtitle'].forEach(k=>{
        d.project[k]=mergeText(d.project[k],c.project[k]);
        if(k==='name') Object.keys(d.project[k]).forEach(l=>d.project[k][l]=cleanProjectName(d.project[k][l],d.project.code));
      });
    }
    if(c.theme && typeof c.theme==='object') d.theme={...d.theme,...c.theme};
    if(c.campaign && typeof c.campaign==='object') d.campaign={...d.campaign,...c.campaign};
    // V10.5 campaign registry: preserve all historical campaigns while maintaining
    // one active campaign pointer for backward compatibility with V10.x responses.
    const savedCampaigns=Array.isArray(c.campaigns)?clone(c.campaigns):[];
    if(savedCampaigns.length){
      d.campaigns=savedCampaigns.map((x,i)=>({
        id:String(x.id||`campaign_${i+1}`).replace(/[^a-zA-Z0-9._-]/g,'_'),
        name:String(x.name||`Campaign ${i+1}`),
        status:['Draft','Open','Closed','Archived'].includes(x.status)?x.status:'Draft',
        startDate:String(x.startDate||''),endDate:String(x.endDate||''),
        description:String(x.description||''),isActive:!!x.isActive,
        createdAt:x.createdAt||new Date().toISOString()
      }));
    }else{
      const legacy=d.campaign||{};
      d.campaigns=[{id:String(legacy.id||'campaign_baseline_2026'),name:String(legacy.name||'Baseline Safety Climate Survey 2026'),status:['Draft','Open','Closed','Archived'].includes(legacy.status)?legacy.status:'Open',startDate:String(legacy.startDate||''),endDate:String(legacy.endDate||''),description:String(legacy.description||'Baseline safety climate survey campaign.'),isActive:true,createdAt:legacy.createdAt||new Date().toISOString()}];
    }
    let active=d.campaigns.find(x=>x.isActive);
    if(!active && c.campaign){active=d.campaigns.find(x=>x.id===c.campaign.id)||d.campaigns.find(x=>x.name===c.campaign.name);}
    if(!active) active=d.campaigns.find(x=>x.status==='Open')||d.campaigns[0];
    d.campaigns.forEach(x=>x.isActive=x.id===active.id);
    d.campaign={...active};
    if(c.performanceThresholds && typeof c.performanceThresholds==='object') d.performanceThresholds={...d.performanceThresholds,...c.performanceThresholds};
    if(Array.isArray(c.logos) && c.logos.length) d.logos=clone(c.logos);
    if(Array.isArray(c.divisions) && c.divisions.length) d.divisions=clone(c.divisions);
    if(Array.isArray(c.languages)){
      const map=Object.fromEntries(c.languages.map(x=>[x.code,x]));
      d.languages=d.languages.map(x=>({...x,...(map[x.code]||{})}));
    }
    // V10.8: force Filipino/Tagalog into migrated cloud configurations even when an older live config only contains 10 languages.
    if(!(d.languages||[]).some(x=>x.code==='fil')){
      d.languages.push({code:'fil',name:'Tagalog / Filipino',native:'Filipino / Tagalog',enabled:true,dir:'ltr'});
    }
    const filLang=(d.languages||[]).find(x=>x.code==='fil');
    if(filLang){filLang.name='Tagalog / Filipino';filLang.native='Filipino / Tagalog';filLang.enabled=filLang.enabled!==false;filLang.dir='ltr';}
    if(c.factors && typeof c.factors==='object') Object.keys(d.factors).forEach(k=>d.factors[k]=mergeText(d.factors[k],c.factors[k]));
    if(c.ui && typeof c.ui==='object') Object.keys(d.ui).forEach(l=>{d.ui[l]={...d.ui[l],...(c.ui[l]||{})};});
    // Preserve edited open questions while adding translations introduced by newer releases.
    if(Array.isArray(c.openQuestions)){
      const defOpen=new Map((d.openQuestions||[]).map(q=>[q.id,q]));
      d.openQuestions=c.openQuestions.map(q=>{
        const def=defOpen.get(q.id)||{};
        return {...def,...clone(q),...mergeText(def,q),id:q.id||def.id};
      });
    }

    // Preserve role edits while enforcing the final four-questionnaire structure.
    const savedRoles=Array.isArray(c.roles)?c.roles:[];
    const exactMap=new Map(savedRoles.map(r=>[r.id,r]));
    d.roles=d.roles.map(def=>{
      let cur=exactMap.get(def.id);
      if(!cur && def.id===MERGED_ROLE) cur=exactMap.get('Engineer / Supervisor') || exactMap.get('Technician');
      if(!cur) return def;
      // When migrating from the old separate roles, keep the new merged label by design.
      const migratingMerged = def.id===MERGED_ROLE && cur.id!==MERGED_ROLE;
      return {
        ...def,
        icon:cur.icon||def.icon,
        enabled:cur.enabled!==false,
        text:migratingMerged?def.text:mergeText(def.text,cur.text),
        description:mergeText(def.description,cur.description)
      };
    });

    // Preserve questionnaire edits while merging in any new language translations.
    if(c.questions && typeof c.questions==='object'){
      const out={};
      d.roles.forEach(r=>{
        const defList=clone(d.questions[r.id]||[]);
        const curList=clone(r.id===MERGED_ROLE
          ? (c.questions[MERGED_ROLE] || c.questions['Engineer / Supervisor'] || defList)
          : (c.questions[r.id] || defList));
        const defById=new Map(defList.map(q=>[q.id,q]));
        out[r.id]=curList.map(q=>{
          const def=defById.get(q.id);
          if(!def) return q;
          return {...def,...q,text:mergeText(def.text,q.text)};
        });
      });
      d.questions=out;
    }

    d.version='10.8-final'; d.release='10.8-final'; d.schema='hajr-safety-climate-v10';
    return d;
  }
  const roleObject = (config,id) => (config.roles||[]).find(r=>r.id===canonicalRole(id));
  const roleLabel = (config,id,lang='en') => tx(roleObject(config,id)?.text,lang) || canonicalRole(id);
  const roleDescription = (config,id,lang='en') => tx(roleObject(config,id)?.description,lang);
  const classify = v => v == null ? 'none' : v <= 2 ? 'unfavourable' : v === 3 ? 'neutral' : 'favourable';
  return {clone,esc,tx,canonicalRole,normalizedValue,pct,migrateConfig,roleObject,roleLabel,roleDescription,classify,LEGACY_ROLE_MAP,MERGED_ROLE};
})();
