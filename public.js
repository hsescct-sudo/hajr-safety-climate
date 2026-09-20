
window.App = (() => {
  let config, lang="en", selectedRole="", answers={}, comments={}, openAnswers={};
  const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
  const rtl=()=>{const L=config.languages.find(x=>x.code===lang);return L&&L.dir==="rtl"};
  const tx=(obj,l=lang)=>obj?.[l]||obj?.en||"";
  const ui=k=>config.ui?.[lang]?.[k]||config.ui?.en?.[k]||k;
  const roleKey=r=>({"Management":"management","HSE":"hse","Engineers & Supervisors":"engsup","Workers":"workers"})[r]||r;
  const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  function hide(){["languageView","homeView","profileView","surveyView","successView"].forEach(x=>$(x).classList.add("hidden"))}
  function applyTheme(){document.documentElement.style.setProperty("--primary",config.theme?.primary||"#071A3A");document.documentElement.style.setProperty("--accent",config.theme?.accent||"#087A4A")}
  function enabledLogos(){return (config.logos||[]).filter(x=>x.enabled!==false)}
  function renderLogos(){
    const html=enabledLogos().map(x=>`<img src="${esc(x.src)}" alt="${esc(x.name)}" class="${x.id==="hajr"?"hajr":""}">`).join("");
    $("languageLogos").innerHTML=html;$("headerLogos").innerHTML=html;
  }
  function renderLanguages(){
    $("languageGrid").innerHTML=(config.languages||[]).filter(x=>x.enabled!==false).map(x=>`<button class="lang-card" onclick="App.chooseLanguage('${x.code}')"><div class="lang-native">${esc(x.native)}</div><div class="lang-en">${esc(x.name)}</div></button>`).join("");
  }
  function applyLanguage(){
    document.documentElement.lang=lang;document.documentElement.dir=rtl()?"rtl":"ltr";document.body.classList.toggle("rtl",rtl());
    $("languageButton").textContent=ui("language");$("miniProject").textContent=tx(config.project.name);$("projectChip").textContent=`${config.project.code} – ${tx(config.project.name).replace(/^.*?–\s*/,"")}`;
    $("surveyTitle").textContent=tx(config.project.surveyName);$("surveySubtitle").textContent=tx(config.project.subtitle);
    $("selectRoleTitle").textContent=ui("selectRole");$("selectRoleSub").textContent=ui("roleSub");
    $("step1").textContent=ui("step1");$("whereTitle").textContent=ui("where");$("privacyText").textContent=ui("privacy");$("roleLabel").textContent=ui("role");$("divisionLabel").textContent=ui("division");$("companyLabel").textContent=ui("company");$("areaLabel").textContent=ui("area");$("backBtn").textContent=ui("back");$("startBtn").textContent=ui("begin");
    $("step2").textContent=ui("step2");$("cancelBtn").textContent=ui("cancel");$("submitBtn").textContent=ui("submit");$("thanksTitle").textContent=ui("thanks");$("thanksSub").textContent=ui("thanksSub");$("returnBtn").textContent=ui("return");
    renderRoles();renderDivisions();
  }
  function renderRoles(){
    const list=(config.roles||[]).filter(r=>r.enabled!==false);
    $("roleCount").textContent=list.length;
    $("roleGrid").innerHTML=list.map(r=>`<button class="role-card" onclick="App.selectRole('${r.id.replaceAll("'","\\'")}')"><div class="role-icon">${r.icon||"👤"}</div><h3>${esc(ui(roleKey(r.id)))}</h3><p>${esc(ui(roleKey(r.id)+"Desc"))}</p></button>`).join("");
  }
  function renderDivisions(){const prev=$("divisionField").value;$("divisionField").innerHTML=`<option value="">${esc(ui("selectDivision"))}</option>`+(config.divisions||[]).map(d=>`<option>${esc(d)}</option>`).join("");if(config.divisions?.includes(prev))$("divisionField").value=prev}
  function showLanguages(){hide();$("publicHeader").classList.add("hidden");$("languageView").classList.remove("hidden")}
  function chooseLanguage(l){lang=l;sessionStorage.setItem("hajr_v4_lang",l);applyLanguage();showHome()}
  function showHome(){hide();$("publicHeader").classList.remove("hidden");$("homeView").classList.remove("hidden");applyLanguage();window.scrollTo(0,0)}
  function selectRole(r){selectedRole=r;hide();$("publicHeader").classList.remove("hidden");$("profileView").classList.remove("hidden");$("roleField").value=ui(roleKey(r));renderDivisions();window.scrollTo(0,0)}
  function openSurvey(){
    if(!$("divisionField").value){alert(ui("selectDivision"));return}
    const qs=config.questions[selectedRole]||[];answers={};comments={};openAnswers={};
    hide();$("publicHeader").classList.remove("hidden");$("surveyView").classList.remove("hidden");$("surveyRole").textContent=ui(roleKey(selectedRole));
    $("questionCount").textContent=`${qs.length+(config.openQuestions||[]).length} ${ui("questions")}`;
    const labels=[ui("sd"),ui("d"),ui("n"),ui("a"),ui("sa")];
    let html="";
    qs.forEach((q,i)=>{
      html+=`<section class="question-card" data-qid="${q.id}"><span class="factor">${esc(tx(config.factors[q.factor]))}</span><div class="question-text">${i+1}. ${esc(tx(q.text))}</div><div class="rating-grid">`+
        labels.map((lab,j)=>`<label class="rating-option" id="opt_${q.id}_${j+1}"><input type="radio" name="q_${q.id}" value="${j+1}" onchange="App.answer('${q.id}',${j+1})">${esc(lab)}</label>`).join("")+
        `</div><button type="button" class="comment-toggle" onclick="App.toggleComment('${q.id}')">＋ ${esc(ui("addComment"))}</button><div class="comment-box hidden" id="commentWrap_${q.id}"><div class="comment-hint hidden" id="commentHint_${q.id}">${esc(ui("strongComment"))}</div><div class="field"><textarea id="comment_${q.id}" placeholder="${esc(ui("commentPlaceholder"))}" oninput="App.setComment('${q.id}',this.value)"></textarea></div></div></section>`;
    });
    (config.openQuestions||[]).forEach((q,j)=>{
      html+=`<section class="question-card"><span class="factor">${esc(ui("open"))}</span><div class="question-text">${qs.length+j+1}. ${esc(tx(q))}</div><div class="field"><textarea placeholder="${esc(ui("type"))}" oninput="App.setOpen('${q.id}',this.value)"></textarea></div></section>`;
    });
    $("surveyForm").innerHTML=html;window.scrollTo(0,0)
  }
  function answer(qid,v){
    answers[qid]=v;
    document.querySelectorAll(`[name="q_${qid}"]`).forEach(x=>x.closest("label").classList.toggle("selected",+x.value===v));
    const wrap=$(`commentWrap_${qid}`), hint=$(`commentHint_${qid}`);
    if(v===1){wrap.classList.remove("hidden");hint.classList.remove("hidden")}else{hint.classList.add("hidden")}
  }
  function toggleComment(qid){$(`commentWrap_${qid}`).classList.toggle("hidden")}
  function setComment(qid,v){comments[qid]=v}
  function setOpen(qid,v){openAnswers[qid]=v}
  async function submit(){
    const qs=config.questions[selectedRole]||[];
    for(let i=0;i<qs.length;i++){if(!answers[qs[i].id]){alert(`${ui("required")} ${i+1}`);document.querySelector(`[data-qid="${qs[i].id}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});return}}
    const record={
      id:(crypto.randomUUID?crypto.randomUUID():`R${Date.now()}`),timestamp:new Date().toISOString(),language:lang,role:selectedRole,
      division:$("divisionField").value,company:$("companyField").value.trim(),area:$("areaField").value.trim(),
      answers:qs.map(q=>({qid:q.id,factor:q.factor,negative:!!q.negative,value:+answers[q.id],comment:(comments[q.id]||"").trim(),questionText:clone(q.text)})),
      openAnswers:(config.openQuestions||[]).map(q=>({qid:q.id,text:(openAnswers[q.id]||"").trim(),questionText:clone(q)}))
    };
    $("submitBtn").disabled=true;$("submitBtn").textContent="…";
    try{await Cloud.submitResponse(record);hide();$("publicHeader").classList.remove("hidden");$("successView").classList.remove("hidden");}
    catch(e){alert("Unable to submit right now. Please check the connection and try again.")}
    finally{$("submitBtn").disabled=false;$("submitBtn").textContent=ui("submit")}
  }
  async function init(){
    config=await Cloud.getConfig(window.DEFAULT_CONFIG);applyTheme();renderLogos();renderLanguages();$("languageCount").textContent=(config.languages||[]).filter(x=>x.enabled!==false).length;
    const saved=sessionStorage.getItem("hajr_v4_lang");if(saved&&config.languages.some(x=>x.code===saved&&x.enabled!==false)){lang=saved;applyLanguage();showHome()}else showLanguages()
  }
  return {init,showLanguages,chooseLanguage,showHome,selectRole,openSurvey,answer,toggleComment,setComment,setOpen,submit}
})();
App.init();
