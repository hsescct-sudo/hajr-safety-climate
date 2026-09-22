window.Admin = (() => {
  let config=null,responses=[],dashRole='Overall',dashDivision='All',dashFactor='All',dashSearch='';
  let lastQuestionGroups=new Map();
  let changeSerial=0,savedSerial=0,saveTimer=null,saving=false,saveAgain=false;
  const $=id=>document.getElementById(id), E=Core.esc, T=(o,l='en')=>Core.tx(o,l);
  const roleLabel=(id,l='en')=>Core.roleLabel(config,id,l), canonical=r=>Core.canonicalRole(r);
  const enabledRoles=()=> (config.roles||[]).filter(r=>r.enabled!==false);
  const value=a=>Core.normalizedValue(a);
  const pct=(vals,p,d=1)=>Core.pct(vals,p,d);
  const responseRole=r=>canonical(r?.role);
  const projectLine=()=>`${config.project.code} – ${T(config.project.name)}`;
  const download=(name,content,type='application/json')=>{const b=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);};
  const notifyDashboard=()=>window.dispatchEvent(new CustomEvent('hajr:data',{detail:{config,responses}}));


  function stableStringify(value){
    if(value===null || typeof value!=="object") return JSON.stringify(value);
    if(Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  function persistSignature(c){
    const copy=Core.clone(c||{});
    // Server-managed metadata must not make a successful save look like a failure.
    delete copy.updatedAt;
    delete copy.serverSavedAt;
    delete copy.lastSavedAt;
    return stableStringify(copy);
  }

  function setSaveState(kind,text){const el=$('saveState');if(!el)return;el.className=`save-state ${kind||''}`.trim();$('saveStateText').textContent=text;}
  function markDirty(){changeSerial++;setSaveState('saving','Unsaved changes');clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(false),900);}
  async function saveNow(manual=true){
    clearTimeout(saveTimer);
    if(saving){saveAgain=true;return;}
    if(changeSerial===savedSerial && !manual){setSaveState('','Saved');return;}
    saving=true;const startSerial=changeSerial;setSaveState('saving','Saving…');
    try{
      config.version='10.4-final';config.release='10.4-final';config.schema='hajr-safety-climate-v10';
      const snapshot=Core.clone(config);
      const expected=persistSignature(snapshot);
      const out=await Cloud.saveConfig(snapshot);
      // The save endpoint now writes, reads back with strong consistency, and returns
      // the exact stored object. Verify that raw stored object before applying any
      // migration/default normalization in the browser.
      if(!out?.ok || !out?.config) throw new Error('The server did not return the stored configuration for verification.');
      const stored=out.config;
      if(persistSignature(stored)!==expected){
        console.error('Save verification mismatch',{expectedConfig:snapshot,storedConfig:stored});
        throw new Error('The server stored a different configuration than the one sent. Please retry once, then run the central storage test.');
      }
      const verified=Core.migrateConfig(window.DEFAULT_CONFIG,stored);
      savedSerial=Math.max(savedSerial,startSerial);
      if(changeSerial===startSerial){
        config=verified;applyTheme();renderAll();
        setSaveState('',`Saved & verified ${out?.savedAt?new Date(out.savedAt).toLocaleTimeString():''}`.trim());
      }else{setSaveState('saving','New changes pending');saveAgain=true;}
      if(manual) alert('Changes saved and verified on central storage.');
    }catch(e){setSaveState('error','Save failed');if(manual)alert('Could not save configuration: '+e.message);}
    finally{saving=false;if(saveAgain){saveAgain=false;if(changeSerial!==savedSerial)setTimeout(()=>saveNow(false),100);}}
  }

  async function login(){
    const key=$('adminKey').value.trim();if(!key)return;
    const ok=await Cloud.login(key);if(!ok){alert('Invalid admin key.');return;}
    $('loginView').classList.add('hidden');$('adminApp').classList.remove('hidden');
    config=await Cloud.getConfig(window.DEFAULT_CONFIG);
    try{responses=await Cloud.getResponses();}catch(e){responses=[];alert('Admin opened, but responses could not be loaded: '+e.message);}
    savedSerial=changeSerial=0;applyTheme();renderAll();setMode();setSaveState('','Saved');
  }
  function setMode(){const cloud=Cloud.mode==='cloud';$('modeBadge').textContent=cloud?'● CLOUD / SHARED DATA':Cloud.mode==='local'?'● LOCAL PREVIEW':'● CLOUD ERROR';$('modeBadge').className=`status-badge ${cloud?'status-cloud':Cloud.mode==='local'?'status-local':'status-local'}`;}
  function applyTheme(){document.documentElement.style.setProperty('--primary',config.theme?.primary||'#071a3a');document.documentElement.style.setProperty('--accent',config.theme?.accent||'#087a4a');$('adminProject').textContent=projectLine();}
  function tab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));['dashboard','campaigns','settings','questions','audience','data'].forEach(n=>$(`panel_${n}`).classList.toggle('hidden',n!==name));if(name==='dashboard')renderDashboard();if(name==='campaigns')renderCampaigns();if(name==='settings')renderSettings();if(name==='questions')renderQuestionBuilder();if(name==='audience')renderAudience();}
  function renderAll(){ensureCampaigns();renderLanguageSelectors();renderRoleSelector();renderDashboardTabs();renderDashboard();renderCampaigns();renderSettings();renderQuestionBuilder();renderAudience();notifyDashboard();}
  function renderLanguageSelectors(){const options=(config.languages||[]).map(l=>`<option value="${E(l.code)}">${E(l.native)} — ${E(l.name)}</option>`).join('');['contentLang','questionLang','audienceLang'].forEach(id=>{const el=$(id);if(!el)return;const old=el.value;el.innerHTML=options;if([...el.options].some(o=>o.value===old))el.value=old;});}
  function renderRoleSelector(){const el=$('questionRole'),old=el.value;el.innerHTML=enabledRoles().map(r=>`<option value="${E(r.id)}">${E(roleLabel(r.id))}</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old;}

  function renderDashboardTabs(){
    const tabs=[{id:'Overall',label:'Overall'},...enabledRoles().map(r=>({id:r.id,label:roleLabel(r.id)}))];
    if(!tabs.some(x=>x.id===dashRole))dashRole='Overall';
    const host=$('dashboardTabs');host.innerHTML=tabs.map((x,i)=>`<button type="button" class="dash-tab ${x.id===dashRole?'active':''}" data-dash-index="${i}">${E(x.label)}</button>`).join('');
    host.querySelectorAll('[data-dash-index]').forEach(btn=>btn.addEventListener('click',()=>{const x=tabs[Number(btn.dataset.dashIndex)];if(x){dashRole=x.id;renderDashboardTabs();renderDashboard();}}));
  }
  function roleScopedResponses(){return dashRole==='Overall'?responses:responses.filter(r=>responseRole(r)===dashRole);}
  function filteredResponses(){return roleScopedResponses().filter(r=>dashDivision==='All'||(r.division||'Not specified')===dashDivision);}
  function answerValues(rs,factor=dashFactor){return (rs||[]).flatMap(r=>(r.answers||[]).filter(a=>factor==='All'||a.factor===factor).map(value).filter(Number.isFinite));}
  function percentParts(vals){const n=vals.length;if(!n)return{bad:0,neutral:0,good:0};const bad=vals.filter(x=>x<=2).length/n*100,neutral=vals.filter(x=>x===3).length/n*100,good=100-bad-neutral;return{bad:+bad.toFixed(1),neutral:+neutral.toFixed(1),good:+good.toFixed(1)};}
  function stackHtml(vals){if(!vals.length)return '<div class="stack"><div class="seg" style="width:100%;background:#edf2f4;color:#73818b">No data</div></div>';const p=percentParts(vals),lab=x=>x>=7?`${x.toFixed(1)}%`:'';return `<div class="stack"><div class="seg bad" style="width:${p.bad}%">${lab(p.bad)}</div><div class="seg neutral" style="width:${p.neutral}%">${lab(p.neutral)}</div><div class="seg good" style="width:${p.good}%">${lab(p.good)}</div></div>`;}
  function renderDistribution(vals){
    const host=$('distributionDonut'),legend=$('distributionLegend');if(!host||!legend)return;
    const p=percentParts(vals),total=vals.length;
    host.innerHTML=`<div class="donut-ring" style="--mix-bad-angle:${(p.bad*3.6).toFixed(2)}deg;--mix-neutral-angle:${((p.bad+p.neutral)*3.6).toFixed(2)}deg"><div class="donut-center"><b>${total?`${p.good.toFixed(1)}%`:'—'}</b><span>Favourable</span><small>${total} answers</small></div></div>`;
    legend.innerHTML=[['Unfavourable',p.bad,'var(--bad)'],['Neutral',p.neutral,'var(--neutral)'],['Favourable',p.good,'var(--good)']].map(x=>`<div class="donut-legend-row"><i style="background:${x[2]}"></i><span>${x[0]}</span><b>${total?x[1].toFixed(1)+'%':'—'}</b></div>`).join('');
  }
  function heatColor(p){
    if(p==null)return '#f1f4f6';
    if(p<40)return `hsl(4 55% ${84-Math.min(22,p/2)}%)`;
    if(p<65)return `hsl(42 72% ${88-Math.min(18,(p-40)/2)}%)`;
    return `hsl(110 38% ${88-Math.min(24,(p-65)/1.6)}%)`;
  }
  function renderHeatmap(){
    const host=$('heatmapDashboard');if(!host)return;
    const roles=enabledRoles(),factors=Object.keys(config.factors||{});
    const base=responses.filter(r=>dashDivision==='All'||(r.division||'Not specified')===dashDivision);
    const header=`<div class="heatmap-row heatmap-head"><div class="heatmap-role">Role</div>${factors.map(f=>`<div title="${E(T(config.factors[f]))}">${E(T(config.factors[f]).split(' ').slice(0,2).join(' '))}</div>`).join('')}</div>`;
    const rows=roles.map(r=>{
      const rr=base.filter(x=>responseRole(x)===r.id);
      const cells=factors.map(f=>{const vals=answerValues(rr,f),p=vals.length?pct(vals,x=>x>=4,0):null;return `<button type="button" class="heatmap-cell" data-heat-role="${E(r.id)}" data-heat-factor="${E(f)}" style="background:${heatColor(p)}" title="${E(roleLabel(r.id))} • ${E(T(config.factors[f]))}">${p==null?'—':p+'%'}</button>`;}).join('');
      return `<div class="heatmap-row"><button type="button" class="heatmap-role heatmap-role-btn" data-heat-role-only="${E(r.id)}">${E(roleLabel(r.id))}</button>${cells}</div>`;
    }).join('');
    host.innerHTML=`<div class="heatmap-table">${header}${rows}</div>`;
    host.querySelectorAll('[data-heat-role][data-heat-factor]').forEach(btn=>btn.addEventListener('click',()=>{dashRole=btn.dataset.heatRole;dashFactor=btn.dataset.heatFactor;renderDashboardTabs();renderDashboard();$('questionDashboard').scrollIntoView({behavior:'smooth',block:'start'});}));
    host.querySelectorAll('[data-heat-role-only]').forEach(btn=>btn.addEventListener('click',()=>{dashRole=btn.dataset.heatRoleOnly;dashFactor='All';renderDashboardTabs();renderDashboard();}));
  }
  function renderDashboardFilterOptions(){
    const base=roleScopedResponses();const divs=[...new Set(base.map(r=>r.division||'Not specified'))].sort();
    const divEl=$('dashDivision');divEl.innerHTML='<option value="All">All divisions</option>'+divs.map(d=>`<option value="${E(d)}">${E(d)}</option>`).join('');if(divs.includes(dashDivision))divEl.value=dashDivision;else{dashDivision='All';divEl.value='All';}
    const fEl=$('dashFactor');fEl.innerHTML='<option value="All">All safety climate factors</option>'+Object.entries(config.factors||{}).map(([k,v])=>`<option value="${E(k)}">${E(T(v))}</option>`).join('');if(config.factors?.[dashFactor])fEl.value=dashFactor;else{dashFactor='All';fEl.value='All';}
    $('dashSearch').value=dashSearch;
  }
  function setDashboardDivision(v){dashDivision=v;renderDashboard();}
  function setDashboardFactor(v){dashFactor=v;renderDashboard();}
  function setDashboardSearch(v){dashSearch=v.trim();renderQuestions(filteredResponses());}
  function clearDashboardFilters(){dashDivision='All';dashFactor='All';dashSearch='';renderDashboard();}

  function renderDashboard(){
    renderDashboardFilterOptions();
    const rs=filteredResponses(),vals=answerValues(rs);
    const commentAnswers=rs.flatMap(r=>(r.answers||[]).filter(a=>(dashFactor==='All'||a.factor===dashFactor)&&(a.comment||'').trim()));
    const openCount=dashFactor==='All'?rs.flatMap(r=>r.openAnswers||[]).filter(x=>(x.text||'').trim()).length:0;
    $('dResponses').textContent=rs.length;$('dFav').textContent=vals.length?`${pct(vals,x=>x>=4,1)}%`:'—';$('dNeutral').textContent=vals.length?`${pct(vals,x=>x===3,1)}%`:'—';$('dUnfav').textContent=vals.length?`${pct(vals,x=>x<=2,1)}%`:'—';$('dComments').textContent=commentAnswers.length+openCount;
    renderDistribution(vals);renderHeatmap();renderFactors(rs);renderRoleBreakdown();renderDivisions();renderQuestions(rs);renderComments(rs);renderRecent(rs);
  }
  function renderFactors(rs){
    const groups={};Object.keys(config.factors||{}).forEach(f=>groups[f]=[]);rs.forEach(r=>(r.answers||[]).forEach(a=>{const v=value(a);if(Number.isFinite(v)&&a.factor)(groups[a.factor]??=[]).push(v);}));
    const host=$('factorDashboard');host.innerHTML=Object.entries(groups).map(([f,vals])=>{const p=vals.length?pct(vals,x=>x>=4,1):null;return `<button type="button" class="factor-card ${dashFactor===f?'active':''}" data-factor="${E(f)}"><div class="factor-card-head"><b>${E(T(config.factors[f]))}</b><span>${p==null?'No data':p+'% favourable'}</span></div>${stackHtml(vals)}</button>`;}).join('');
    host.querySelectorAll('[data-factor]').forEach(btn=>btn.addEventListener('click',()=>{dashFactor=btn.dataset.factor;$('dashFactor').value=dashFactor;renderDashboard();$('questionDashboard').scrollIntoView({behavior:'smooth',block:'start'});}));
  }
  function renderRoleBreakdown(){
    const groups={};enabledRoles().forEach(r=>groups[r.id]={values:[],responses:0});
    responses.filter(r=>dashDivision==='All'||(r.division||'Not specified')===dashDivision).forEach(r=>{const id=responseRole(r);if(!groups[id])return;groups[id].responses++;groups[id].values.push(...(r.answers||[]).filter(a=>dashFactor==='All'||a.factor===dashFactor).map(value).filter(Number.isFinite));});
    const host=$('roleDashboard');host.innerHTML=enabledRoles().map(r=>{const g=groups[r.id],p=g.values.length?pct(g.values,x=>x>=4,1):0;return `<button type="button" class="role-row interactive-row ${dashRole===r.id?'active':''}" data-role-drill="${E(r.id)}"><div><b>${E(roleLabel(r.id))}</b></div><div class="bar"><i style="width:${p||0}%"></i></div><div class="bar-pct"><b>${g.values.length?p+'%':'—'}</b><span>${g.responses} resp.</span></div></button>`;}).join('');
    host.querySelectorAll('[data-role-drill]').forEach(btn=>btn.addEventListener('click',()=>{dashRole=btn.dataset.roleDrill;renderDashboardTabs();renderDashboard();}));
  }
  function renderDivisions(){
    const rs=roleScopedResponses(),groups={};rs.forEach(r=>{const k=r.division||'Not specified';groups[k]??={values:[],responses:0};groups[k].responses++;groups[k].values.push(...(r.answers||[]).filter(a=>dashFactor==='All'||a.factor===dashFactor).map(value).filter(Number.isFinite));});
    const entries=Object.entries(groups).sort((a,b)=>b[1].responses-a[1].responses),host=$('divisionDashboard');host.innerHTML=entries.length?entries.map(([k,g])=>{const p=g.values.length?pct(g.values,x=>x>=4,1):0;return `<button type="button" class="division-row interactive-row ${dashDivision===k?'active':''}" data-division-drill="${E(k)}"><div>${E(k)}</div><div class="bar good"><i style="width:${p||0}%"></i></div><div class="bar-pct"><b>${g.values.length?p+'%':'—'}</b><span>${g.responses} resp.</span></div></button>`;}).join(''):'<div class="no-data">No responses.</div>';
    host.querySelectorAll('[data-division-drill]').forEach(btn=>btn.addEventListener('click',()=>{dashDivision=btn.dataset.divisionDrill;renderDashboard();}));
  }
  function currentQuestionMap(){const map=new Map();enabledRoles().forEach(r=>(config.questions?.[r.id]||[]).forEach((q,i)=>map.set(`${r.id}::${q.id}`,{role:r.id,q,index:i})));return map;}
  function buildQuestionGroups(rs){
    const defs=currentQuestionMap(),groups=new Map();
    if(dashRole!=='Overall') (config.questions?.[dashRole]||[]).forEach((q,i)=>groups.set(`${dashRole}::${q.id}`,{key:`${dashRole}::${q.id}`,role:dashRole,q,index:i,legacy:false,entries:[],factor:q.factor}));
    rs.forEach(r=>{const role=responseRole(r);(r.answers||[]).forEach(a=>{const qid=a.qid||`legacy_${Math.random()}`,key=`${role}::${qid}`,def=defs.get(key);if(!groups.has(key))groups.set(key,{key,role,qid,q:def?.q||null,index:def?.index??999,legacy:!def,entries:[],factor:a.factor||def?.q?.factor||'',sampleText:a.questionText||null});groups.get(key).entries.push({response:r,answer:a,value:value(a)});});});
    return groups;
  }
  function questionTitle(g){return g.q?T(g.q.text):T(g.sampleText)||g.qid||g.key;}
  function renderQuestions(rs){
    lastQuestionGroups=buildQuestionGroups(rs);let list=[...lastQuestionGroups.values()];
    if(dashRole==='Overall')list=list.filter(g=>g.entries.length);
    if(dashFactor!=='All')list=list.filter(g=>g.factor===dashFactor);
    if(dashSearch){const s=dashSearch.toLowerCase();list=list.filter(g=>questionTitle(g).toLowerCase().includes(s)||roleLabel(g.role).toLowerCase().includes(s));}
    list.sort((a,b)=>{const ra=enabledRoles().findIndex(r=>r.id===a.role),rb=enabledRoles().findIndex(r=>r.id===b.role);return ra-rb||a.index-b.index||String(a.key).localeCompare(String(b.key));});
    $('questionFilterNote').textContent=`Showing ${list.length} question${list.length===1?'':'s'}${dashFactor!=='All'?' in '+T(config.factors[dashFactor]):''}${dashSearch?' matching “'+dashSearch+'”':''}.`;
    const host=$('questionDashboard');host.innerHTML=list.length?list.map(g=>{const vals=g.entries.map(e=>e.value).filter(Number.isFinite),p=percentParts(vals),comments=g.entries.filter(e=>(e.answer.comment||'').trim()).length,roleBadge=dashRole==='Overall'?`<span class="pill">${E(roleLabel(g.role))}</span>`:'';return `<div class="question-result" data-question-key="${E(g.key)}"><div class="question-result-top"><div style="flex:1"><div class="q-title">${roleBadge} ${g.legacy?'<span class="pill" style="background:#fff2d9;color:#77540d">Legacy</span> ':''}${E(questionTitle(g))}</div><div class="question-meta"><span class="mini-pill">${E(T(config.factors[g.factor])||g.factor)}</span><span class="mini-pill">${vals.length} responses</span><span class="mini-pill">${comments} comments</span><span class="mini-pill">${vals.length?p.good.toFixed(1)+'% favourable':'No data'}</span></div></div><div class="question-arrow">›</div></div>${stackHtml(vals)}<div class="click-hint">Click to view detailed response distribution and comments</div></div>`;}).join(''):'<div class="no-data">No question data matches the selected filters.</div>';
    host.querySelectorAll('[data-question-key]').forEach(el=>el.addEventListener('click',()=>openQuestionModal(el.dataset.questionKey)));
    const withData=list.filter(g=>g.entries.some(e=>Number.isFinite(e.value))).map(g=>{const parts=percentParts(g.entries.map(e=>e.value).filter(Number.isFinite));return{...g,...parts};});
    if(!withData.length){$('highlights').innerHTML='<div class="no-data">No data yet.</div>';return;}
    const best=[...withData].sort((a,b)=>b.good-a.good)[0],worst=[...withData].sort((a,b)=>b.bad-a.bad)[0];$('highlights').innerHTML=`<div class="highlight good" data-highlight-key="${E(best.key)}"><b>↑ Most favourable</b><p>${E(questionTitle(best))}</p><strong>${best.good.toFixed(1)}% favourable</strong></div><div class="highlight bad" data-highlight-key="${E(worst.key)}" style="margin-top:9px"><b>↓ Most unfavourable</b><p>${E(questionTitle(worst))}</p><strong>${worst.bad.toFixed(1)}% unfavourable</strong></div>`;$('highlights').querySelectorAll('[data-highlight-key]').forEach(el=>el.addEventListener('click',()=>openQuestionModal(el.dataset.highlightKey)));
  }
  function renderComments(rs){
    const items=[];rs.forEach(r=>{const role=responseRole(r);(r.answers||[]).forEach(a=>{if((dashFactor==='All'||a.factor===dashFactor)&&(a.comment||'').trim())items.push({time:r.timestamp,role,division:r.division,key:`${role}::${a.qid}`,question:T(a.questionText),text:a.comment,rating:a.value});});if(dashFactor==='All')(r.openAnswers||[]).forEach(o=>{if((o.text||'').trim())items.push({time:r.timestamp,role,division:r.division,key:null,question:T(o.questionText),text:o.text,rating:null});});});items.sort((a,b)=>String(b.time).localeCompare(String(a.time)));const host=$('commentsFeed');host.innerHTML=items.length?items.slice(0,20).map((x,i)=>`<div class="comment-item ${x.key?'clickable':''}" data-comment-index="${i}"><div class="small">${E(roleLabel(x.role))} • ${E(x.division||'')} • ${x.time?new Date(x.time).toLocaleDateString():''} ${x.rating?`• <span class="comment-rating r${x.rating}">Rating ${x.rating}/5</span>`:''}</div><b>${E(x.question||'Open feedback')}</b><div style="margin-top:5px">${E(x.text)}</div></div>`).join(''):'<div class="no-data">No comments or justifications in this view.</div>';host.querySelectorAll('[data-comment-index]').forEach(el=>el.addEventListener('click',()=>{const x=items[Number(el.dataset.commentIndex)];if(x?.key)openQuestionModal(x.key);}));
  }
  function renderRecent(rs){const x=[...rs].sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||''))).slice(0,15);$('recentResponses').innerHTML=x.length?`<div style="overflow:auto"><table class="table"><thead><tr><th>Date</th><th>Role</th><th>Division</th><th>Language</th><th>Favourable</th></tr></thead><tbody>${x.map(r=>{const vals=(r.answers||[]).filter(a=>dashFactor==='All'||a.factor===dashFactor).map(value).filter(Number.isFinite);return `<tr><td>${r.timestamp?new Date(r.timestamp).toLocaleString():''}</td><td>${E(roleLabel(responseRole(r)))}</td><td>${E(r.division||'')}</td><td>${E(r.language||'')}</td><td>${vals.length?pct(vals,v=>v>=4,1)+'%':'—'}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="no-data">No responses.</div>';}

  function openQuestionModal(key){
    const g=lastQuestionGroups.get(key);if(!g)return;
    const entries=g.entries||[],vals=entries.map(e=>e.value).filter(Number.isFinite),parts=percentParts(vals),comments=entries.filter(e=>(e.answer.comment||'').trim());
    $('modalFactor').textContent=T(config.factors[g.factor])||g.factor;$('modalQuestion').textContent=questionTitle(g);$('modalMeta').textContent=`${roleLabel(g.role)} • ${vals.length} responses • ${comments.length} comments`;
    const rawCounts=[1,2,3,4,5].map(n=>entries.filter(e=>Number(e.answer.value)===n).length),avg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):'—';
    const roleGroups={},divGroups={};entries.forEach(e=>{const rid=responseRole(e.response),div=e.response.division||'Not specified';(roleGroups[rid]??=[]).push(e.value);(divGroups[div]??=[]).push(e.value);});
    const roleRows=Object.entries(roleGroups).map(([k,v])=>rowBar(roleLabel(k),v)).join('')||'<div class="no-data">No role breakdown.</div>';
    const divRows=Object.entries(divGroups).sort((a,b)=>b[1].length-a[1].length).map(([k,v])=>rowBar(k,v)).join('')||'<div class="no-data">No division breakdown.</div>';
    const commentHtml=comments.length?[...comments].sort((a,b)=>String(b.response.timestamp||'').localeCompare(String(a.response.timestamp||''))).map(e=>`<div class="comment-item"><div class="small">${E(roleLabel(responseRole(e.response)))} • ${E(e.response.division||'')} • ${e.response.timestamp?new Date(e.response.timestamp).toLocaleString():''} • <span class="comment-rating r${e.answer.value}">Rating ${e.answer.value}/5</span></div><div style="margin-top:5px">${E(e.answer.comment)}</div></div>`).join(''):'<div class="no-data">No comments were submitted for this question.</div>';
    $('modalBody').innerHTML=`<div class="detail-kpis"><div class="detail-kpi"><b>${vals.length}</b><span>Responses</span></div><div class="detail-kpi"><b>${parts.good.toFixed(1)}%</b><span>Favourable</span></div><div class="detail-kpi"><b>${parts.bad.toFixed(1)}%</b><span>Unfavourable</span></div><div class="detail-kpi"><b>${avg}</b><span>Average normalised score / 5</span></div></div><div class="detail-panel"><h3 style="margin-top:0">Response distribution</h3>${stackHtml(vals)}<div class="rating-dist">${rawCounts.map((c,i)=>`<div class="rating-box"><b>${c}</b><span>${['Strongly disagree','Disagree','Neutral','Agree','Strongly agree'][i]}</span></div>`).join('')}</div></div><div class="detail-grid" style="margin-top:14px"><div class="detail-panel"><h3 style="margin-top:0">Favourable responses by Role</h3>${roleRows}</div><div class="detail-panel"><h3 style="margin-top:0">Favourable responses by Division</h3>${divRows}</div></div><div class="detail-panel" style="margin-top:14px"><h3 style="margin-top:0">Comments / Justifications (${comments.length})</h3><div class="comment-list">${commentHtml}</div></div>`;
    $('questionModal').classList.remove('hidden');document.body.style.overflow='hidden';
  }
  function rowBar(label,vals){const clean=vals.filter(Number.isFinite),p=clean.length?pct(clean,x=>x>=4,1):0;return `<div class="role-row"><div>${E(label)}</div><div class="bar"><i style="width:${p||0}%"></i></div><div class="bar-pct"><b>${clean.length?p+'%':'—'}</b><span>${clean.length} ans.</span></div></div>`;}
  function closeQuestionModal(){$('questionModal').classList.add('hidden');document.body.style.overflow='';}
  function modalBackdrop(e){if(e.target===$('questionModal'))closeQuestionModal();}

  async function refreshResponses(){try{responses=await Cloud.getResponses();renderDashboard();notifyDashboard();}catch(e){alert('Could not refresh responses: '+e.message);}}

  function ensureCampaigns(){
    if(!Array.isArray(config.campaigns)||!config.campaigns.length){
      const c=config.campaign||{};
      config.campaigns=[{id:c.id||'campaign_baseline_2026',name:c.name||'Baseline Safety Climate Survey 2026',status:['Draft','Open','Closed','Archived'].includes(c.status)?c.status:'Open',startDate:c.startDate||'',endDate:c.endDate||'',description:c.description||'Baseline safety climate survey campaign.',isActive:true,createdAt:c.createdAt||new Date().toISOString()}];
    }
    let active=config.campaigns.find(x=>x.isActive);
    if(!active&&config.campaign)active=config.campaigns.find(x=>x.id===config.campaign.id)||config.campaigns.find(x=>x.name===config.campaign.name);
    if(!active)active=config.campaigns.find(x=>x.status==='Open')||config.campaigns[0];
    config.campaigns.forEach(x=>x.isActive=x.id===active.id);
    config.campaign={...active};
    return active;
  }
  function campaignResponses(c){return responses.filter(r=>(r.campaignId&&c.id&&r.campaignId===c.id)||(!r.campaignId&&(r.campaign||'Legacy / Previous')===c.name));}
  function campaignStatusClass(s){return s==='Open'?'open':s==='Closed'?'closed':s==='Archived'?'archived':'draft';}
  function renderCampaigns(){
    if(!$('campaignEditors'))return;const active=ensureCampaigns();const count=campaignResponses(active).length;
    $('activeCampaignSummary').innerHTML=`<div class="campaign-active-name">${E(active.name)}</div><div class="campaign-meta"><span class="campaign-status ${campaignStatusClass(active.status)}">${E(active.status)}</span><span>${count} responses</span>${active.startDate?`<span>Start ${E(active.startDate)}</span>`:''}${active.endDate?`<span>End ${E(active.endDate)}</span>`:''}</div><p class="small" style="margin-top:9px">${E(active.description||'No description.')}</p>`;
    const list=[...config.campaigns].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    $('campaignEditors').innerHTML=list.map(c=>{const n=campaignResponses(c).length,isActive=!!c.isActive;return `<article class="campaign-card ${isActive?'active':''}"><div class="campaign-card-head"><div><div class="campaign-card-title">${E(c.name)}</div><div class="campaign-meta"><span class="campaign-status ${campaignStatusClass(c.status)}">${E(c.status)}</span>${isActive?'<span class="campaign-active-pill">ACTIVE</span>':''}<span>${n} responses</span></div></div><div class="inline-actions">${!isActive?`<button class="btn btn-primary" onclick="Admin.activateCampaign('${E(c.id)}')">Activate</button>`:''}${c.status==='Open'?`<button class="btn btn-secondary" onclick="Admin.closeCampaign('${E(c.id)}')">Close</button>`:''}${!isActive&&c.status!=='Archived'?`<button class="btn btn-secondary" onclick="Admin.archiveCampaign('${E(c.id)}')">Archive</button>`:''}</div></div><div class="campaign-edit-grid"><div class="field"><label>Campaign name${n?' (locked after responses)':''}</label><input value="${E(c.name)}" ${n?'disabled title="Campaign name is locked after responses are collected to preserve historical reporting."':''} oninput="Admin.updateCampaign('${E(c.id)}','name',this.value)"></div><div class="field"><label>Status</label><input value="${E(c.status)}" readonly></div><div class="field"><label>Start date</label><input type="date" value="${E(c.startDate||'')}" oninput="Admin.updateCampaign('${E(c.id)}','startDate',this.value)"></div><div class="field"><label>End date</label><input type="date" value="${E(c.endDate||'')}" oninput="Admin.updateCampaign('${E(c.id)}','endDate',this.value)"></div><div class="field campaign-desc"><label>Description</label><textarea rows="2" oninput="Admin.updateCampaign('${E(c.id)}','description',this.value)">${E(c.description||'')}</textarea></div></div></article>`;}).join('');
  }
  function createCampaign(){
    ensureCampaigns();const name=$('newCampaignName').value.trim(),start=$('newCampaignStart').value,end=$('newCampaignEnd').value,description=$('newCampaignDescription').value.trim();
    if(!name){alert('Enter a campaign name.');return;}if(config.campaigns.some(c=>c.name.toLowerCase()===name.toLowerCase())){alert('A campaign with this name already exists.');return;}if(start&&end&&end<start){alert('End date cannot be before start date.');return;}
    config.campaigns.push({id:`campaign_${Date.now()}`,name,status:'Draft',startDate:start,endDate:end,description,isActive:false,createdAt:new Date().toISOString()});
    $('newCampaignName').value='';$('newCampaignStart').value='';$('newCampaignEnd').value='';$('newCampaignDescription').value='';renderCampaigns();markDirty();notifyDashboard();
  }
  function updateCampaign(id,key,val){ensureCampaigns();const c=config.campaigns.find(x=>x.id===id);if(!c)return;if(key==='name'){if(campaignResponses(c).length){alert('Campaign name is locked after responses are collected to preserve historical reporting.');renderCampaigns();return;}val=String(val||'').trimStart();if(!val)return;}if(key==='status'){if(!['Draft','Open','Closed','Archived'].includes(val))return;if(c.isActive&&val==='Archived'){alert('Activate another campaign before archiving the active campaign.');renderCampaigns();return;}}c[key]=val;if(c.isActive)config.campaign={...c};markDirty();notifyDashboard();}
  function activateCampaign(id){ensureCampaigns();const target=config.campaigns.find(x=>x.id===id);if(!target)return;const current=config.campaigns.find(x=>x.isActive);if(current&&current.id!==id&&current.status==='Open')current.status='Closed';config.campaigns.forEach(x=>x.isActive=x.id===id);target.status='Open';config.campaign={...target};renderCampaigns();markDirty();notifyDashboard();}
  function closeCampaign(id){ensureCampaigns();const c=config.campaigns.find(x=>x.id===id);if(!c)return;if(!confirm(`Close campaign "${c.name}"? New submissions will stop if this is the active campaign.`))return;c.status='Closed';if(c.isActive)config.campaign={...c};renderCampaigns();markDirty();notifyDashboard();}
  function archiveCampaign(id){ensureCampaigns();const c=config.campaigns.find(x=>x.id===id);if(!c)return;if(c.isActive){alert('Activate another campaign before archiving the active campaign.');return;}if(!confirm(`Archive "${c.name}"? Historical responses will be preserved.`))return;c.status='Archived';renderCampaigns();markDirty();notifyDashboard();}
  function renderSettings(){const l=$('contentLang').value||'en';$('projectCode').value=config.project.code||'';$('projectName').value=T(config.project.name,l);$('surveyNameEdit').value=T(config.project.surveyName,l);$('surveySubtitleEdit').value=T(config.project.subtitle,l);$('primaryColor').value=config.theme?.primary||'#071a3a';$('accentColor').value=config.theme?.accent||'#087a4a';$('logoEditors').innerHTML=(config.logos||[]).map((x,i)=>`<div class="logo-editor"><img src="${E(x.src)}"><div style="font-weight:850;margin:7px 0">${E(x.name)}</div><label class="small"><input type="checkbox" ${x.enabled!==false?'checked':''} onchange="Admin.toggleLogo(${i},this.checked)"> Enabled</label><div class="inline-actions" style="justify-content:center;margin-top:7px"><label class="btn btn-secondary" style="font-size:10px;padding:6px 8px">Replace<input type="file" accept="image/*" hidden onchange="Admin.replaceLogo(${i},this.files[0]);this.value=''"></label><button class="btn btn-danger" style="font-size:10px;padding:6px 8px" onclick="Admin.deleteLogo(${i})">Delete</button></div></div>`).join('');}
  function setProjectCode(v){config.project.code=v;applyTheme();markDirty();}
  function setProjectText(k,v){const l=$('contentLang').value||'en';config.project[k][l]=v;applyTheme();markDirty();}
  function setTheme(k,v){config.theme[k]=v;applyTheme();markDirty();}
  function setCampaignName(v){config.campaign??={name:'Baseline Safety Climate Survey 2026',status:'Open'};config.campaign.name=v;markDirty();notifyDashboard();}
  function setCampaignStatus(v){config.campaign??={name:'Baseline Safety Climate Survey 2026',status:'Open'};config.campaign.status=v;markDirty();notifyDashboard();}
  function fileData(file){return new Promise((res,rej)=>{if(!file)return rej(new Error('No file selected'));if(file.size>1500000)return rej(new Error('Please use an image smaller than 1.5 MB.'));const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}
  async function addLogo(file){try{config.logos.push({id:`logo_${Date.now()}`,name:file.name,src:await fileData(file),enabled:true});renderSettings();markDirty();}catch(e){alert(e.message);}}
  async function replaceLogo(i,file){try{config.logos[i].src=await fileData(file);config.logos[i].name=file.name;renderSettings();markDirty();}catch(e){alert(e.message);}}
  function toggleLogo(i,v){config.logos[i].enabled=v;markDirty();}
  function deleteLogo(i){if(confirm('Delete this logo?')){config.logos.splice(i,1);renderSettings();markDirty();}}

  function renderQuestionBuilder(){const role=$('questionRole').value||enabledRoles()[0]?.id,l=$('questionLang').value||'en',qs=config.questions?.[role]||[];$('questionEditors').innerHTML=qs.map((q,i)=>`<div class="question-editor"><div class="question-editor-head"><div style="display:flex;gap:8px;align-items:center"><div class="qnum">${i+1}</div><b>${E(q.id)}</b></div><div class="inline-actions"><button class="btn btn-secondary" style="padding:6px 8px" onclick="Admin.moveQuestion(${i},-1)">↑</button><button class="btn btn-secondary" style="padding:6px 8px" onclick="Admin.moveQuestion(${i},1)">↓</button><button class="btn btn-secondary" style="padding:6px 8px" onclick="Admin.duplicateQuestion(${i})">Duplicate</button><button class="btn btn-danger" style="padding:6px 8px" onclick="Admin.deleteQuestion(${i})">Delete</button></div></div><div class="qedit-grid"><div class="field"><label>Factor</label><select onchange="Admin.setQuestion(${i},'factor',this.value)">${Object.keys(config.factors||{}).map(f=>`<option value="${E(f)}" ${f===q.factor?'selected':''}>${E(T(config.factors[f],l))}</option>`).join('')}</select></div><div class="field"><label>Question wording — ${E(l.toUpperCase())}</label><textarea rows="3" oninput="Admin.setQuestionText(${i},${JSON.stringify(l)},this.value)">${E(T(q.text,l))}</textarea></div><label style="font-size:11px;padding-top:27px"><input type="checkbox" ${q.negative?'checked':''} onchange="Admin.setQuestion(${i},'negative',this.checked)"> Negative statement / reverse scoring</label></div></div>`).join('')||'<div class="no-data">No questions in this questionnaire.</div>';renderOpenEditors(l);}
  function setQuestion(i,k,v){const role=$('questionRole').value;config.questions[role][i][k]=v;markDirty();}
  function setQuestionText(i,l,v){const role=$('questionRole').value;config.questions[role][i].text[l]=v;markDirty();}
  function addQuestion(){const role=$('questionRole').value,text={};(config.languages||[]).forEach(x=>text[x.code]=x.code==='en'?'Enter the new question here.':'');config.questions[role].push({id:`q_${Date.now()}`,factor:'org',negative:false,text});renderQuestionBuilder();markDirty();}
  function moveQuestion(i,d){const role=$('questionRole').value,a=config.questions[role],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderQuestionBuilder();markDirty();}
  function duplicateQuestion(i){const role=$('questionRole').value,q=Core.clone(config.questions[role][i]);q.id=`${q.id}_copy_${Date.now()}`;config.questions[role].splice(i+1,0,q);renderQuestionBuilder();markDirty();}
  function deleteQuestion(i){if(confirm('Delete this question from future surveys?')){config.questions[$('questionRole').value].splice(i,1);renderQuestionBuilder();markDirty();}}
  function renderOpenEditors(l){$('openEditors').innerHTML=(config.openQuestions||[]).map((q,i)=>`<div class="question-editor"><div class="question-editor-head"><b>${E(q.id)}</b><button class="btn btn-danger" style="padding:6px 8px" onclick="Admin.deleteOpen(${i})">Delete</button></div><div class="field"><label>Open question — ${E(l.toUpperCase())}</label><textarea rows="3" oninput="Admin.setOpen(${i},${JSON.stringify(l)},this.value)">${E(T(q,l))}</textarea></div></div>`).join('');}
  function addOpenQuestion(){const q={id:`open_${Date.now()}`};(config.languages||[]).forEach(x=>q[x.code]=x.code==='en'?'Enter the new open question here.':'');config.openQuestions.push(q);renderQuestionBuilder();markDirty();}
  function setOpen(i,l,v){config.openQuestions[i][l]=v;markDirty();}
  function deleteOpen(i){if(confirm('Delete this open question?')){config.openQuestions.splice(i,1);renderQuestionBuilder();markDirty();}}

  function renderAudience(){const l=$('audienceLang').value||'en';$('languageEditors').innerHTML=(config.languages||[]).map((x,i)=>`<div class="question-editor" style="padding:10px"><div class="grid2"><div class="field"><label>Native label</label><input value="${E(x.native)}" oninput="Admin.setLanguage(${i},'native',this.value)"></div><label style="padding-top:27px"><input type="checkbox" ${x.enabled!==false?'checked':''} onchange="Admin.setLanguage(${i},'enabled',this.checked)"> Enabled — ${E(x.name)}</label></div></div>`).join('');$('roleEditors').innerHTML=(config.roles||[]).map((r,i)=>`<div class="question-editor" style="padding:10px"><div class="grid2"><div class="field"><label>Role name — ${E(l.toUpperCase())}</label><input value="${E(T(r.text,l))}" oninput="Admin.setRoleText(${i},'text',${JSON.stringify(l)},this.value)"></div><div class="field"><label>Description — ${E(l.toUpperCase())}</label><input value="${E(T(r.description,l))}" oninput="Admin.setRoleText(${i},'description',${JSON.stringify(l)},this.value)"></div></div><div class="grid2" style="margin-top:8px"><div class="field"><label>Icon / emoji</label><input value="${E(r.icon||'')}" oninput="Admin.setRole(${i},'icon',this.value)"></div><label style="padding-top:27px"><input type="checkbox" ${r.enabled!==false?'checked':''} onchange="Admin.setRole(${i},'enabled',this.checked)"> Enabled</label></div></div>`).join('');$('divisionEditor').value=(config.divisions||[]).join('\n');}
  function setLanguage(i,k,v){config.languages[i][k]=v;markDirty();}
  function setRole(i,k,v){config.roles[i][k]=v;renderRoleSelector();renderDashboardTabs();markDirty();}
  function setRoleText(i,k,l,v){config.roles[i][k][l]=v;renderRoleSelector();renderDashboardTabs();markDirty();}
  function setDivisions(v){config.divisions=v.split('\n').map(x=>x.trim()).filter(Boolean);markDirty();}

  async function testStorage(){const box=$('storageStatus');box.className='storage-card warn';box.querySelector('.small').textContent='Testing central read/write/delete access…';try{const out=await Cloud.storageCheck();box.className='storage-card good';box.querySelector('.small').textContent=out.message||'Central storage is working.';}catch(e){box.className='storage-card bad';box.querySelector('.small').textContent='Storage test failed: '+e.message;}}
  async function resetResponses(){if(!confirm('Delete ALL submitted responses and reset the dashboard to zero?'))return;if(!confirm('Final confirmation: this cannot be undone unless you exported a backup.'))return;try{const check=await Cloud.storageCheck();if(!check?.ok)throw new Error(check?.message||'Storage test failed.');const out=await Cloud.resetResponses();responses=[];renderDashboard();alert(`Dashboard reset completed. ${out?.deleted??0} stored responses deleted.`);}catch(e){alert('Reset failed: '+e.message);}}
  function exportConfig(){download('HAJR_Safety_Climate_V10_4_Config.json',JSON.stringify(config,null,2));}
  function exportJSON(){download('HAJR_Safety_Climate_V10_4_Results.json',JSON.stringify(responses,null,2));}
  function exportCSV(){const rows=[['Timestamp','Campaign','Role','Division','Area','Language','Question ID','Factor','Rating','Normalised rating','Comment']];responses.forEach(r=>(r.answers||[]).forEach(a=>rows.push([r.timestamp,r.campaign||'Legacy / Previous',responseRole(r),r.division,r.area,r.language,a.qid,a.factor,a.value,value(a),a.comment||''])));download('HAJR_Safety_Climate_V10_4_Results.csv',rows.map(row=>row.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(',')).join('\n'),'text/csv');}
  async function changePin(){const p=$('newLocalPin').value.trim();if(p.length<4){alert('Use at least 4 characters.');return;}await Cloud.changeLocalPin(p);$('newLocalPin').value='';alert('Local preview PIN changed.');}

  window.addEventListener('beforeunload',e=>{if(changeSerial!==savedSerial){e.preventDefault();e.returnValue='';}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('questionModal').classList.contains('hidden'))closeQuestionModal();});

  return {login,tab,refreshResponses,setDashboardDivision,setDashboardFactor,setDashboardSearch,clearDashboardFilters,openQuestionModal,closeQuestionModal,modalBackdrop,renderSettings,setProjectCode,setProjectText,setTheme,setCampaignName,setCampaignStatus,renderCampaigns,createCampaign,updateCampaign,activateCampaign,closeCampaign,archiveCampaign,addLogo,replaceLogo,toggleLogo,deleteLogo,saveNow,renderQuestionBuilder,setQuestion,setQuestionText,addQuestion,moveQuestion,duplicateQuestion,deleteQuestion,addOpenQuestion,setOpen,deleteOpen,renderAudience,setLanguage,setRole,setRoleText,setDivisions,testStorage,resetResponses,exportConfig,exportJSON,exportCSV,changePin,getConfig:()=>config,getResponses:()=>responses,notifyDashboard};
})();
if(sessionStorage.getItem('hajr_admin_key')){document.getElementById('adminKey').value=sessionStorage.getItem('hajr_admin_key');Admin.login();}
