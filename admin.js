
window.Admin = (() => {
 let config,responses=[],dashRole="Management";
 const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
 const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const roleLabel=(r,l="en")=>config.ui?.[l]?.[({"Management":"management","HSE":"hse","Engineers & Supervisors":"engsup","Workers":"workers"})[r]]||r;
 const tx=(o,l="en")=>o?.[l]||o?.en||"";
 function download(name,content,type="application/json"){const b=new Blob([content],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
 async function login(){
   const key=$("adminKey").value.trim();if(!key)return;
   const ok=await Cloud.login(key);if(!ok){alert("Invalid admin key / PIN.");return}
   $("loginView").classList.add("hidden");$("adminApp").classList.remove("hidden");
   config=await Cloud.getConfig(window.DEFAULT_CONFIG);responses=await Cloud.getResponses();applyTheme();renderAll();setMode()
 }
 function setMode(){const cloud=Cloud.mode==="cloud";$("modeBadge").textContent=cloud?"● CLOUD / SHARED DATA":"● LOCAL DEMO";$("modeBadge").className=`status-badge ${cloud?"status-cloud":"status-local"}`}
 function applyTheme(){document.documentElement.style.setProperty("--primary",config.theme?.primary||"#071A3A");document.documentElement.style.setProperty("--accent",config.theme?.accent||"#087A4A")}
 function tab(name){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));["dashboard","settings","questions","languages","data"].forEach(n=>$(`panel_${n}`).classList.toggle("hidden",n!==name));if(name==="dashboard")renderDashboard();if(name==="settings")renderSettings();if(name==="questions")renderQuestionBuilder();if(name==="languages")renderAudience()}
 function renderAll(){
   renderLanguageSelects();renderRoleSelect();renderDashboardTabs();renderDashboard();renderSettings();renderQuestionBuilder();renderAudience()
 }
 function renderLanguageSelects(){
   const opts=(config.languages||[]).map(l=>`<option value="${l.code}">${esc(l.native)} — ${esc(l.name)}</option>`).join("");
   ["contentLang","questionLang","audienceLang"].forEach(id=>{const el=$(id);if(!el)return;const old=el.value;el.innerHTML=opts;if([...el.options].some(o=>o.value===old))el.value=old});
 }
 function renderRoleSelect(){
   const opts=(config.roles||[]).map(r=>`<option value="${esc(r.id)}">${esc(roleLabel(r.id))}</option>`).join("");const old=$("questionRole").value;$("questionRole").innerHTML=opts;if([...$("questionRole").options].some(o=>o.value===old))$("questionRole").value=old
 }
 function renderDashboardTabs(){
   $("dashboardTabs").innerHTML=(config.roles||[]).filter(r=>r.enabled!==false).map(r=>`<button class="dash-tab ${r.id===dashRole?"active":""}" onclick="Admin.selectDashRole('${r.id.replaceAll("'","\\'")}')">${esc(roleLabel(r.id))}</button>`).join("")
 }
 function selectDashRole(r){dashRole=r;renderDashboardTabs();renderDashboard()}
 function normalized(answer){return answer.negative?6-answer.value:answer.value}
 function pct(vals,pred){return vals.length?Math.round(vals.filter(pred).length/vals.length*100):0}
 function currentRoleResponses(){return responses.filter(r=>r.role===dashRole)}
 function renderDashboard(){
   const rs=currentRoleResponses(), vals=rs.flatMap(r=>(r.answers||[]).map(normalized)), comments=rs.flatMap(r=>r.answers||[]).filter(a=>(a.comment||"").trim());
   $("dResponses").textContent=rs.length;$("dFav").textContent=vals.length?pct(vals,v=>v>=4)+"%":"—";$("dNeutral").textContent=vals.length?pct(vals,v=>v===3)+"%":"—";$("dComments").textContent=comments.length;
   const factors={};Object.keys(config.factors||{}).forEach(f=>factors[f]=[]);
   rs.forEach(r=>(r.answers||[]).forEach(a=>{(factors[a.factor]??=[]).push(normalized(a))}));
   $("factorDashboard").innerHTML=Object.entries(factors).map(([f,v])=>{const p=pct(v,x=>x>=4);return `<div class="factor-row"><div><b>${esc(tx(config.factors[f]))}</b></div><div class="simple-bar"><i style="width:${p}%"></i></div><div><b>${v.length?p+"%":"—"}</b></div></div>`}).join("");
   renderDivision(rs);renderQuestions(rs);renderComments(rs)
 }
 function renderDivision(rs){
   const g={};rs.forEach(r=>(g[r.division||"Not specified"]??=[]).push(...(r.answers||[]).map(normalized)));
   $("divisionDashboard").innerHTML=Object.entries(g).sort((a,b)=>b[1].length-a[1].length).map(([k,v])=>{const p=pct(v,x=>x>=4);return `<div class="division-row"><div>${esc(k)}</div><div class="simple-bar"><i style="width:${p}%"></i></div><div><b>${p}%</b></div></div>`}).join("")||'<p class="small">No responses yet.</p>'
 }
 function renderQuestions(rs){
   const qs=config.questions?.[dashRole]||[], results=[];
   qs.forEach((q,i)=>{
     const arr=[];rs.forEach(r=>{const a=(r.answers||[]).find(x=>x.qid===q.id);if(a)arr.push(normalized(a))});
     const bad=pct(arr,x=>x<=2),neu=pct(arr,x=>x===3),good=arr.length?100-bad-neu:0;
     results.push({q,i,arr,bad,neu,good});
   });
   $("questionDashboard").innerHTML=results.map(x=>`<div class="question-result"><div class="qresult-title">${x.i+1}. ${esc(tx(x.q.text))}</div><div class="stack">${x.arr.length?`<div class="seg bad" style="width:${x.bad}%">${x.bad>=8?x.bad+"%":""}</div><div class="seg neutral" style="width:${x.neu}%">${x.neu>=8?x.neu+"%":""}</div><div class="seg good" style="width:${x.good}%">${x.good>=8?x.good+"%":""}</div>`:"<div class='seg' style='width:100%'>No responses</div>"}</div></div>`).join("");
   const withData=results.filter(x=>x.arr.length);
   if(!withData.length){$("highlights").innerHTML='<p class="small">No responses yet.</p>';return}
   const best=[...withData].sort((a,b)=>b.good-a.good)[0], worst=[...withData].sort((a,b)=>b.bad-a.bad)[0];
   $("highlights").innerHTML=`<div class="highlight good"><b>↑ Most favourable</b><p>${esc(tx(best.q.text))}</p><strong>${best.good}% favourable</strong></div><div class="highlight bad" style="margin-top:10px"><b>↓ Most unfavourable</b><p>${esc(tx(worst.q.text))}</p><strong>${worst.bad}% unfavourable</strong></div>`
 }
 function renderComments(rs){
   const all=[];rs.forEach(r=>(r.answers||[]).forEach(a=>{if((a.comment||"").trim())all.push({r,a})}));
   $("commentsFeed").innerHTML=all.slice().reverse().map(({r,a})=>`<div class="comment-item"><div class="small">${esc(r.division||"")} • ${new Date(r.timestamp).toLocaleDateString()} • Rating ${a.value}/5</div><b>${esc(tx(a.questionText))}</b><div style="margin-top:6px">${esc(a.comment)}</div></div>`).join("")||'<p class="small">No question comments yet.</p>'
 }
 function renderSettings(){
   const l=$("contentLang").value||"en";$("projectCode").value=config.project.code||"";$("projectName").value=tx(config.project.name,l);$("surveyName").value=tx(config.project.surveyName,l);$("surveySubtitle").value=tx(config.project.subtitle,l);$("primaryColor").value=config.theme.primary||"#071A3A";$("accentColor").value=config.theme.accent||"#087A4A";
   $("logoEditors").innerHTML=(config.logos||[]).map((x,i)=>`<div class="logo-editor"><img src="${esc(x.src)}"><div style="font-weight:850;margin:8px 0">${esc(x.name)}</div><label class="small"><input type="checkbox" ${x.enabled!==false?"checked":""} onchange="Admin.toggleLogo(${i},this.checked)"> Enabled</label><div class="inline-actions" style="justify-content:center;margin-top:8px"><label class="btn btn-secondary" style="font-size:11px;padding:7px 9px">Replace<input type="file" accept="image/*" hidden onchange="Admin.replaceLogo(${i},this.files[0]);this.value=''"></label><button class="btn btn-danger" style="font-size:11px;padding:7px 9px" onclick="Admin.deleteLogo(${i})">Delete</button></div></div>`).join("")
 }
 function setProjectCode(v){config.project.code=v}
 function setProjectText(k,v){const l=$("contentLang").value||"en";config.project[k][l]=v}
 function setTheme(k,v){config.theme[k]=v;applyTheme()}
 function fileData(file){return new Promise((res,rej)=>{if(!file)return rej();if(file.size>900000)return rej(new Error("Please use an image smaller than 900 KB."));const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
 async function addLogo(file){try{const src=await fileData(file);config.logos.push({id:`logo_${Date.now()}`,name:file.name,src,enabled:true});renderSettings()}catch(e){alert(e.message||"Unable to read image")}}
 async function replaceLogo(i,file){try{config.logos[i].src=await fileData(file);config.logos[i].name=file.name;renderSettings()}catch(e){alert(e.message||"Unable to read image")}}
 function toggleLogo(i,v){config.logos[i].enabled=v}
 function deleteLogo(i){if(confirm("Delete this logo?")){config.logos.splice(i,1);renderSettings()}}
 async function saveConfig(){try{await Cloud.saveConfig(config);alert("Changes saved.");}catch(e){alert("Could not save: "+e.message)}}
 function renderQuestionBuilder(){
   const role=$("questionRole").value||config.roles[0].id,l=$("questionLang").value||"en",qs=config.questions[role]||[];
   $("questionEditors").innerHTML=qs.map((q,i)=>`<div class="question-editor"><div class="question-editor-head"><div style="display:flex;gap:9px;align-items:center"><div class="qnum">${i+1}</div><b>${esc(q.id)}</b></div><div class="inline-actions"><button class="btn btn-secondary" style="padding:7px 9px" onclick="Admin.moveQuestion(${i},-1)">↑</button><button class="btn btn-secondary" style="padding:7px 9px" onclick="Admin.moveQuestion(${i},1)">↓</button><button class="btn btn-secondary" style="padding:7px 9px" onclick="Admin.duplicateQuestion(${i})">Duplicate</button><button class="btn btn-danger" style="padding:7px 9px" onclick="Admin.deleteQuestion(${i})">Delete</button></div></div><div class="qedit-grid"><div class="field"><label>Safety climate factor</label><select onchange="Admin.setQuestion(${i},'factor',this.value)">${Object.keys(config.factors).map(f=>`<option value="${f}" ${f===q.factor?"selected":""}>${esc(tx(config.factors[f],l))}</option>`).join("")}</select></div><div class="field"><label>Question wording — ${l.toUpperCase()}</label><textarea rows="3" oninput="Admin.setQuestionText(${i},'${l}',this.value)">${esc(tx(q.text,l))}</textarea></div><label style="font-size:12px;padding-top:28px"><input type="checkbox" ${q.negative?"checked":""} onchange="Admin.setQuestion(${i},'negative',this.checked)"> Negative statement / reverse score</label></div></div>`).join("");
   renderOpenEditors(l)
 }
 function setQuestion(i,k,v){const role=$("questionRole").value;config.questions[role][i][k]=v}
 function setQuestionText(i,l,v){const role=$("questionRole").value;config.questions[role][i].text[l]=v}
 function addQuestion(){const role=$("questionRole").value;const text={};config.languages.forEach(l=>text[l.code]=l.code==="en"?"Enter the new question here.":"");config.questions[role].push({id:`${role.replace(/\W+/g,"_").toLowerCase()}_${Date.now()}`,factor:"org",negative:false,text});renderQuestionBuilder()}
 function moveQuestion(i,d){const role=$("questionRole").value,a=config.questions[role],j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderQuestionBuilder()}
 function duplicateQuestion(i){const role=$("questionRole").value,q=clone(config.questions[role][i]);q.id=q.id+"_copy_"+Date.now();config.questions[role].splice(i+1,0,q);renderQuestionBuilder()}
 function deleteQuestion(i){if(confirm("Delete this question from future surveys?")){config.questions[$("questionRole").value].splice(i,1);renderQuestionBuilder()}}
 function renderOpenEditors(l){$("openEditors").innerHTML=(config.openQuestions||[]).map((q,i)=>`<div class="question-editor"><div class="question-editor-head"><b>${esc(q.id)}</b><button class="btn btn-danger" style="padding:7px 9px" onclick="Admin.deleteOpen(${i})">Delete</button></div><div class="field"><label>Open question — ${l.toUpperCase()}</label><textarea oninput="Admin.setOpen(${i},'${l}',this.value)">${esc(tx(q,l))}</textarea></div></div>`).join("")}
 function addOpenQuestion(){const q={id:`open_${Date.now()}`};config.languages.forEach(l=>q[l.code]=l.code==="en"?"Enter the new open question here.":"");config.openQuestions.push(q);renderQuestionBuilder()}
 function setOpen(i,l,v){config.openQuestions[i][l]=v}
 function deleteOpen(i){if(confirm("Delete this open question?")){config.openQuestions.splice(i,1);renderQuestionBuilder()}}
 function renderAudience(){
   const editLang=$("audienceLang")?.value||"en";
   $("languageEditors").innerHTML=(config.languages||[]).map((l,i)=>`<div class="question-editor" style="padding:11px"><div class="grid2"><div class="field"><label>Native label</label><input value="${esc(l.native)}" oninput="Admin.setLanguage(${i},'native',this.value)"></div><label style="padding-top:28px"><input type="checkbox" ${l.enabled!==false?"checked":""} onchange="Admin.setLanguage(${i},'enabled',this.checked)"> Enabled (${esc(l.name)})</label></div></div>`).join("");
   $("roleEditors").innerHTML=(config.roles||[]).map((r,i)=>{
     const k=({"Management":"management","HSE":"hse","Engineers & Supervisors":"engsup","Workers":"workers"})[r.id];
     return `<div class="question-editor" style="padding:11px"><div class="grid2"><div class="field"><label>Role name — ${editLang.toUpperCase()}</label><input value="${esc(config.ui?.[editLang]?.[k]||config.ui?.en?.[k]||r.id)}" oninput="Admin.setRoleText(${i},'label',this.value)"></div><div class="field"><label>Role description — ${editLang.toUpperCase()}</label><input value="${esc(config.ui?.[editLang]?.[k+'Desc']||config.ui?.en?.[k+'Desc']||'')}" oninput="Admin.setRoleText(${i},'desc',this.value)"></div></div><div style="margin-top:8px"><label><input type="checkbox" ${r.enabled!==false?"checked":""} onchange="Admin.setRole(${i},'enabled',this.checked)"> Enabled</label> &nbsp; <span>${r.icon}</span></div></div>`
   }).join("");
   $("divisionEditor").value=(config.divisions||[]).join("\n")
 }
 function setLanguage(i,k,v){config.languages[i][k]=v}
 function setRole(i,k,v){config.roles[i][k]=v}
 function setRoleText(i,kind,v){
   const l=$("audienceLang")?.value||"en",r=config.roles[i],k=({"Management":"management","HSE":"hse","Engineers & Supervisors":"engsup","Workers":"workers"})[r.id];
   config.ui[l]??={};config.ui[l][kind==="desc"?k+"Desc":k]=v;
 }
 function setDivisions(v){config.divisions=v.split("\n").map(x=>x.trim()).filter(Boolean)}
 async function refreshResponses(){responses=await Cloud.getResponses();renderDashboard()}
 async function resetResponses(){if(!confirm("Delete ALL submitted responses? This cannot be undone."))return;await Cloud.resetResponses();responses=[];renderDashboard();alert("Dashboard reset to zero.")}
 function exportConfig(){download("HAJR_Safety_Climate_Config.json",JSON.stringify(config,null,2))}
 function exportJSON(){download("HAJR_Safety_Climate_Results.json",JSON.stringify(responses,null,2))}
 function exportCSV(){
   const rows=[["Timestamp","Role","Division","Company","Area","Language","Question ID","Rating","Comment"]];
   responses.forEach(r=>(r.answers||[]).forEach(a=>rows.push([r.timestamp,r.role,r.division,r.company,r.area,r.language,a.qid,a.value,a.comment||""])));
   download("HAJR_Safety_Climate_Results.csv",rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n"),"text/csv")
 }
 async function changePin(){const p=$("newLocalPin").value.trim();if(p.length<4){alert("Use at least 4 characters.");return}await Cloud.changeLocalPin(p);$("newLocalPin").value="";alert("Local demo PIN changed.")}
 return {login,tab,selectDashRole,refreshResponses,renderSettings,setProjectCode,setProjectText,setTheme,addLogo,replaceLogo,toggleLogo,deleteLogo,saveConfig,renderQuestionBuilder,setQuestion,setQuestionText,addQuestion,moveQuestion,duplicateQuestion,deleteQuestion,addOpenQuestion,setOpen,deleteOpen,renderAudience,setLanguage,setRole,setRoleText,setDivisions,resetResponses,exportConfig,exportJSON,exportCSV,changePin}
})();
if(sessionStorage.getItem("hajr_admin_key")){document.getElementById("adminKey").value=sessionStorage.getItem("hajr_admin_key");Admin.login()}
