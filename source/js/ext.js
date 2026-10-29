/* ---------- extensions: quests, side quests, dragons, councils, sync, shortcuts ---------- */
Object.assign(ICONS,{
  dice:'<path d="M12 2.5l8.5 5v9l-8.5 5-8.5-5v-9z"/><path d="M12 7.5l4.2 7.5H7.8z"/><path d="M12 2.5v5M3.5 7.5L7.8 15M20.5 7.5L16.2 15M7.8 15l-4.3 1.5M16.2 15l4.3 1.5M12 21.5V15"/>',
  wing:'<path d="M3 18c4-1 6-4 7-8 1 3 3 5 6 6M10 10c0-4 3-7 8-8-1 4-3 6-6 8M16 16c2 0 4-1 5-3"/>',
  serpent:'<path d="M16.5 5c-3-2.5-9-1.5-9 2s8 3 8 6.500-6 4-9 2"/><circle cx="17.500" cy="5.500" r=".9"/>',
  horned:'<path d="M7 9c0-3 2-5 5-5s5 2 5 5v3c0 3-2 6-5 8-3-2-5-5-5-8z"/><path d="M7 8L4 3M17 8l3-5M10 12h.01M14 12h.01M10.500 16h3"/>'
});
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const shortDue=ds=>{if(!ds)return 'NO DATE';const d=new Date(ds+'T12:00:00');return d.getDate()+' '+MON[d.getMonth()].toUpperCase();};
const ageDays=ms=>Math.max(0,Math.floor((Date.now()-ms)/864e5));
const ideaNote=d=>d<7?'fresh from the forge':d<30?'still warm':d<60?'aged well':d<100?'the idea is patient':'no one is asking';
const hallOf=id=>S.halls.find(h=>h.id===id)||S.halls[0];
const sections=(ic,col,t,sub,tag)=>`<div class="sh"><span class="tl">${ico(ic,20,col,1.7)}</span><div><b>${t}</b><i>${sub}</i></div>${tag?`<span class="tag" style="margin-left:auto">${tag}</span>`:''}</div>`;

/* ---------- view heads and lines ---------- */
let VL={key:'',line:null};
function viewLine(pool,vars,key){
  const k=today()+key+JSON.stringify(vars||{});
  if(VL.key!==k)VL={key:k,line:pickLine(pool,vars)};
  return VL.line;
}
function extHead(){
  const live=S.quests.filter(q=>!q.done).length,ni=S.ideas.length,nh=new Set(S.ideas.map(i=>i.hall)).size;
  if(U.bubble&&U.bubble.until>Date.now()){
    const b=U.bubble;
    if(U.view==='main')return {title:'Main Quests',sub:live+(live===1?' CAMPAIGN':' CAMPAIGNS'),line:b};
    if(U.view==='side')return {title:'Side Quests',sub:ni+(ni===1?' IDEA':' IDEAS')+' IN '+nh+(nh===1?' HALL':' HALLS'),line:b};
    return {title:'The Dragons',sub:'HUNT BOARD',line:b};
  }
  if(U.view==='main')return {title:'Main Quests',sub:live+(live===1?' CAMPAIGN':' CAMPAIGNS'),line:S.settings.mute?pickLine('muted',{n:live}):viewLine(live===1?'questsOne':live?'quests':'questsNone',{n:live},'q')};
  if(U.view==='side')return {title:'Side Quests',sub:ni+(ni===1?' IDEA':' IDEAS')+' IN '+nh+(nh===1?' HALL':' HALLS'),line:S.settings.mute?pickLine('muted',{n:ni}):viewLine(ni?'ideas':'ideasNone',{n:ni},'i')};
  const nd=dragonList().filter(d=>d.t).length;
  return {title:'The Dragons',sub:nd+' ON THE HUNT',line:S.settings.mute?pickLine('muted',{n:nd}):viewLine(nd===1?'dragonsOne':nd?'dragonsSome':'dragonsNone',{n:nd},'d')};
}
function dragonList(){
  const cp=S.cplans,get=id=>S.tasks.find(t=>t.id===id&&!t.done);
  const w=cp[wkKey()],m=cp[moKey()],y=cp[yrKey()];
  const elder=get(w&&w.dragonId)||S.tasks.filter(t=>!t.done&&(t.moves||0)>=7).sort((a,b)=>b.moves-a.moves)[0];
  return [
    {tier:'dragon',t:get(plan().dragonId)},
    {tier:'elder',t:elder},
    {tier:'wyrm',t:get(m&&m.dragonId)},
    {tier:'ancient',t:get(y&&y.dragonId)}];
}

/* ---------- Main Quests ---------- */
function questStats(q){
  const ts=S.tasks.filter(t=>t.q===q.id);
  const done=ts.filter(t=>t.done).length;
  const next=ts.filter(t=>!t.done).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.time||'99')<(b.time||'99')?-1:1)[0];
  const top=ts.map(tierOf).filter(Boolean).sort((a,b)=>['dragon','elder','wyrm','ancient'].indexOf(b)-['dragon','elder','wyrm','ancient'].indexOf(a))[0];
  return {n:ts.length,done,next,top};
}
function questCard(q){
  const st=questStats(q),pc=st.n?Math.round(st.done/st.n*100):0;
  return `<button type="button" class="qcard g ${q.done?'fin':''}" data-act="openQuest" data-id="${q.id}">
    <div class="qh"><span class="qtile">${ico(q.icon,24,'var(--brass-l)',1.5)}</span><span class="qt">${esc(q.title)}</span>${st.top?`<span class="tag" style="margin:0">${TAGS[st.top]}</span>`:''}<span class="qd">${q.done?'DONE':shortDue(q.due)}</span></div>
    <div class="qbar"><i style="width:${pc}%"></i></div>
    <div class="qf"><span>${st.done} OF ${st.n} TASKS</span>${st.next?`<em>Next: ${esc(st.next.title)}</em>`:`<em>${st.n?'Nothing left. Suspicious.':'No tasks yet. Add one.'}</em>`}</div></button>`;
}
function mainHTML(){
  if(!S.quests.length)return '<div class="empty">No campaigns yet.<br>Tap the red button to start one.</div>';
  const live=S.quests.filter(q=>!q.done).sort((a,b)=>(a.due||'9999')<(b.due||'9999')?-1:1),fin=S.quests.filter(q=>q.done);
  return live.map(questCard).join('')+(fin.length?`<p class="note" style="margin:14px 0 8px">Finished</p>`+fin.map(questCard).join(''):'')+(S.sample?'<p class="note">Tap a campaign to see its tasks, add one, or edit it. A task linked to a quest shows up on Today as usual.</p>':'');
}

/* ---------- Side Quests ---------- */
function sideHTML(){
  if(!S.ideas.length&&!S.halls.length)return '<div class="empty">No ideas yet.</div>';
  let h='';
  for(const hl of S.halls){
    const items=S.ideas.filter(i=>i.hall===hl.id).sort((a,b)=>a.created-b.created);
    const key='h:'+hl.id,shut=S.shut[key];
    h+=`<section class="cat ${shut?'shut':''}"><button type="button" class="bplus" data-act="addIdea" data-v="${hl.id}" aria-label="Add an idea to ${esc(hl.name)}">${ico('plus',18,'var(--bone)',2.2)}</button>
    <button type="button" class="ban g" style="background-color:${PAL[hl.pal%PAL.length][0]}" data-act="shut" data-v="${key}" aria-expanded="${!shut}">${ico(hl.icon,22,'var(--brass-l)',1.6)}<b>${esc(hl.name)}</b><span class="chv">${ico('chev',18,'var(--bone)',1.8)}</span></button>
    ${items.length?items.map(i=>{const d=ageDays(i.created);return `<div class="iw" data-id="${i.id}"><div class="igp">${ico('flag',16,'currentColor',2)} QUEST</div><div class="irow g" data-id="${i.id}" data-act="openIdea"><span class="qtile" style="width:38px;height:38px">${ico(hl.icon,20,'var(--brass-l)',1.5)}</span><span class="it"><b>${esc(i.title)}</b><i>${ideaNote(d)}</i></span><span class="age">${d} D</span></div></div>`;}).join(''):'<div class="irow g" style="min-height:44px"><span class="it"><i>Nothing here yet.</i></span></div>'}</section>`;
  }
  return h+'<p class="note" style="text-align:center">Swipe right to turn an idea into a quest.</p>';
}

/* ---------- Dragons board ---------- */
const TIERLINE={elder:'elderHas',wyrm:'wyrmHas',ancient:'ancientHas'};
function dragonsHTML(){
  const list=dragonList();
  let h=list.map(({tier,t})=>{
    const [,name,sub,ic]=TIERS.find(x=>x[0]===tier);
    let body;
    if(t){
      const since=DOW[new Date(t.date+'T12:00:00').getDay()];
      const line=tier==='dragon'?pickLine('dragonPicked'):pickLine(TIERLINE[tier],{since:DAYS[new Date(t.createdAt).getDay()]});
      body=`<div class="dcard" data-act="edit" data-id="${t.id}" style="cursor:pointer"><div style="flex:1;line-height:1.2"><div style="font-size:16px;font-weight:600">${esc(t.title)}</div><div class="mono" style="font-size:12px;color:var(--dim)">${esc(cat(t.cat).name)}${t.moves?' · moved '+t.moves+' times':''} · ${shortDue(t.date)}</div></div><span class="tag" style="margin:0">${TAGS[tier]}</span></div>
      <div class="rg"><img src="${kn(tier==='ancient'?2:tier==='wyrm'?7:8)}" alt=""><span>${esc(line.text)}</span></div>`;
    }else body=`<button type="button" class="dcard" style="border-style:dashed;color:var(--dim);font:italic 17px var(--fell)" data-act="dragonCall" data-v="${tier}">Name one in the ${tier==='dragon'?'Daily':tier==='elder'?'Weekly':tier==='wyrm'?'Monthly':'Yearly'} Council</button>`;
    return `<div class="drc g"><div class="drh"><span class="qtile">${ico(ic,24,'var(--glow)',1.5)}</span><div><b>${name}</b><i>${sub.toUpperCase()}</i></div></div>${body}</div>`;
  }).join('');
  h+=`<p class="note" style="margin:14px 0 4px;font-style:normal;font:500 11.5px var(--mono);letter-spacing:.12em">RULES</p>
  <p class="note" style="margin-top:0">One dragon per tier. Name it in the matching Council. Postpone any task seven times and it becomes an Elder Dragon by itself. Slaying any dragon earns Sir Reg’s delighted face. The higher tier wins when a task is named twice.</p>`;
  return h;
}
function extMainHTML(){return U.view==='main'?mainHTML():U.view==='side'?sideHTML():dragonsHTML();}
function extDock(){
  const pill=(v,ic,l)=>`<button type="button" role="tab" aria-selected="${U.view===v}" class="${U.view===v?'on':''}" data-act="goto" data-v="${v}">${ico(ic,20,'currentColor',1.7)}${l}</button>`;
  if(U.view==='dragons')return `<div class="dock"><div class="pill" style="width:150px"><button type="button" class="on" data-act="goto" data-v="list" style="width:100%">${ico('list',20,'currentColor',1.8)}Today</button></div></div>`;
  return `<div class="dock"><div class="pill" role="tablist" aria-label="Quests">${pill('main','flag','Main')}${pill('side','path','Side')}</div>
  ${U.view==='side'?`<button type="button" class="tray" data-act="roll" aria-label="Roll the dice for a side quest">${ico('dice',26,'currentColor',1.5)}</button>`:''}</div>
  <button type="button" class="fab" data-act="${U.view==='main'?'addQuest':'addIdea'}" aria-label="${U.view==='main'?'Add a quest':'Add an idea'}">${ico('plus',28,'currentColor',2.4)}</button>`;
}

/* ---------- sheets: quest, idea, roll ---------- */
function questSheetHTML(){
  const q=U.qs,edit=!!q.id;
  const dl=q.due?shortDue(q.due):'No date';
  const pill=(id,inner)=>`<button type="button" class="chip ${q.open===id?'on':''}" data-act="qOpen" data-v="${id}">${inner}</button>`;
  let opts='';
  if(q.open==='due')opts=`<div class="chips sm sub"><input type="date" id="qDue" value="${q.due||''}" aria-label="Due date"><button type="button" class="chip" data-act="qNoDate">No date</button></div>`;
  else if(q.open==='icon')opts=`<div class="chips sm sub" style="gap:6px">${CATICONS.map(([k,l])=>`<button type="button" class="chip ${q.icon===k?'on':''}" style="width:46px;padding:0;justify-content:center" data-act="qIcon" data-v="${k}" aria-label="${l}">${ico(k,22,'var(--brass-l)',1.5)}</button>`).join('')}</div>`;
  let tasks='';
  if(edit){
    const ts=S.tasks.filter(t=>t.q===q.id).sort((a,b)=>a.done!==b.done?(a.done?1:-1):a.date<b.date?-1:1);
    tasks=`<div class="qts">${ts.map(t=>`<div class="qt2 ${t.done?'done':''}"><button type="button" class="cb" data-act="qTick" data-id="${t.id}" aria-label="Toggle ${esc(t.title)}"><i class="${t.done?'on':''}">${t.done?ico('check',14,'currentColor',3.2):''}</i></button><span data-act="qEditTask" data-id="${t.id}">${esc(t.title)}</span><em>${shortDue(t.date)}</em></div>`).join('')||'<p class="note" style="margin:6px 0">No tasks yet.</p>'}</div>
    <div class="btns" style="margin-top:10px"><button type="button" class="btn ghost" data-act="qAddTask">Add a task</button><button type="button" class="btn ghost" data-act="qDone">${q.done?'Reopen':'Complete'}</button></div>`;
  }
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="${edit?'Edit quest':'New quest'}">
    <div class="arow"><input id="qTitle" class="inp" type="text" value="${esc(q.title)}" placeholder="Name the campaign" autocomplete="off" aria-label="Quest name"><button type="button" class="go" data-act="qSave" aria-label="Save quest">${ico(edit?'check':'plus',22,'currentColor',2.6)}</button></div>
    <div class="chips sm">${pill('due',esc(dl))}${pill('icon',ico(q.icon,16,'var(--brass-l)',1.6)+'Emblem')}</div>${opts}${tasks}
    ${edit?`<button type="button" class="lnk" data-act="qDel">${q.confirmDel?'Tap again to drop this quest':'Drop this quest'}</button>`:''}</div>`;
}
function ideaSheetHTML(){
  const i=U.is,edit=!!i.id;
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="${edit?'Edit idea':'New idea'}">
    <div class="arow"><input id="iTitle" class="inp" type="text" value="${esc(i.text)}" placeholder="${edit?'Idea':'An idea, or several, separated by commas'}" autocomplete="off" aria-label="Idea"><button type="button" class="go" data-act="iSave" aria-label="Save idea">${ico(edit?'check':'plus',22,'currentColor',2.6)}</button></div>
    <div class="chips sm">${S.halls.map(h=>`<button type="button" class="chip ${i.hall===h.id?'on':''}" data-act="iHall" data-v="${h.id}">${ico(h.icon,16,'var(--brass-l)',1.6)}${esc(h.name.replace(/^The /,''))}</button>`).join('')}</div>
    ${edit?`<div class="btns" style="margin-top:12px"><button type="button" class="btn ghost" data-act="iQuest">Make it a quest</button><button type="button" class="btn ghost" data-act="iToday">Do it today</button></div><button type="button" class="lnk" data-act="iDel">${i.confirmDel?'Tap again to drop this idea':'Drop this idea'}</button>`:''}</div>`;
}
function rollSheetHTML(){
  const r=U.roll,idea=S.ideas.find(i=>i.id===r.id);
  if(!idea)return `<div class="scrim" data-act="closeSheet"></div><div class="sheet"><h2>The dice</h2><p class="note" style="margin:0">No ideas to roll. Add some first.</p><div class="btns"><button type="button" class="btn ghost" data-act="closeSheet">Close</button></div></div>`;
  const hl=hallOf(idea.hall);
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Side quest drawn"><h2>${esc(r.line||'The dice have spoken.')}</h2>
    <div class="dcard" style="margin-top:6px"><span class="qtile">${ico(hl.icon,24,'var(--brass-l)',1.5)}</span><div style="flex:1;line-height:1.2"><div style="font-size:17px;font-weight:600">${esc(idea.title)}</div><div class="mono" style="font-size:12px;color:var(--dim)">${esc(hl.name)} · ${ageDays(idea.created)} d old</div></div></div>
    <div class="btns" style="margin-top:14px"><button type="button" class="btn ghost" data-act="rollAgain">Roll again</button><button type="button" class="btn" data-act="rollToday">Do it today</button></div></div>`;
}
function extSheets(){
  if(U.sheet==='quest'&&U.qs)return questSheetHTML();
  if(U.sheet==='idea'&&U.is)return ideaSheetHTML();
  if(U.sheet==='roll'&&U.roll)return rollSheetHTML();
  return '';
}

/* ---------- actions ---------- */
function goto(v){U.menu=false;U.council=null;U.sheet=null;U.view=v;U.placing=null;U.scrollRoad=v==='road';U.bubble=null;VL={key:'',line:null};render();}
const HALLCAT={scriptorium:'money',hearth:'home',yard:'health',tavern:'social'};
function ideaToTask(idea){
  const cid=S.cats.some(c=>c.id===HALLCAT[idea.hall])?HALLCAT[idea.hall]:S.cats[0].id;
  const t={id:uid(),title:idea.title,cat:cid,date:today(),time:'',dur:30,done:false,moves:0,createdAt:Date.now(),from:'idea'};
  S.tasks.push(t);return t;
}
function promoteIdea(idea){
  const hl=hallOf(idea.hall);
  const q={id:uid(),title:idea.title,icon:hl.icon,due:'',created:Date.now()};
  S.quests.push(q);S.ideas=S.ideas.filter(i=>i.id!==idea.id);save();
  const line=say('ideaPromoted');
  toast(line,()=>{S.quests=S.quests.filter(x=>x.id!==q.id);S.ideas.push(idea);save();render();});
  U.sheet=null;render();
}
function rollIdea(){
  const pool=S.ideas;if(!pool.length){U.roll={id:null};return;}
  let pick=pool[Math.floor(Math.random()*pool.length)];
  if(pool.length>1&&U.roll&&U.roll.id===pick.id)pick=pool[(pool.indexOf(pick)+1)%pool.length];
  U.roll={id:pick.id,line:pickLine('rolled').text};
}
function openCouncil(kind){
  U.toast=null;renderToast();U.menu=false;
  if(kind==='day'){const p=plan();U.council={kind:'day',focus:p.focus||'',dragonId:p.dragonId||null,mood:p.mood||'steady',pickOpen:false,line:''};}
  else{
    const key=kind==='week'?wkKey():kind==='month'?moKey():yrKey(),p=S.cplans[key]||{};
    U.council={kind,key,focus:p.focus||'',dragonId:p.dragonId||null,quests:(p.quests||[]).slice(),pickOpen:false,qOpen:false,line:''};
  }
  renderOverlay();
}
function candidates(){return S.tasks.filter(t=>!t.done).sort((a,b)=>(b.moves||0)-(a.moves||0)||(a.date<b.date?-1:1)).slice(0,20);}
function extAct(act,v,id,el){
  switch(act){
    case 'goto':goto(v);break;
    case 'sync':if(window.realmSync){realmSync.user()?realmSync.signOut():realmSync.signIn();}break;
    case 'councilK':openCouncil(v);break;
    case 'dragonCall':openCouncil({dragon:'day',elder:'week',wyrm:'month',ancient:'year'}[v]);break;
    /* quests */
    case 'addQuest':U.qs={id:null,title:'',icon:'flag',due:'',open:null,confirmDel:false};U.sheet='quest';renderOverlay();setTimeout(()=>{const x=$('#qTitle');x&&x.focus();},60);break;
    case 'openQuest':{const q=questOf(id);if(!q)break;U.qs={id:q.id,title:q.title,icon:q.icon,due:q.due||'',open:null,confirmDel:false,done:q.done};U.sheet='quest';renderOverlay();break;}
    case 'qOpen':{U.qs.title=($('#qTitle')||{}).value||U.qs.title;U.qs.open=U.qs.open===v?null:v;renderOverlay();break;}
    case 'qNoDate':U.qs.due='';U.qs.open=null;renderOverlay();break;
    case 'qIcon':U.qs.icon=v;U.qs.open=null;renderOverlay();break;
    case 'qSave':{
      const q=U.qs;q.title=(($('#qTitle')||{}).value||'').trim();if(!q.title)break;
      if(q.id){const o=questOf(q.id);if(o){o.title=q.title;o.icon=q.icon;o.due=q.due;}}
      else S.quests.push({id:uid(),title:q.title,icon:q.icon,due:q.due,created:Date.now()});
      save();U.sheet=null;U.qs=null;say('added');render();break;}
    case 'qTick':{tick(id);U.qs&&U.qs.id&&(U.sheet='quest');renderOverlay();break;}
    case 'qEditTask':U.sheet=null;openAdd(id);break;
    case 'qAddTask':{const qid=U.qs.id;U.sheet=null;openAdd(null);U.add.q=qid;refreshMeta();break;}
    case 'qDone':{const o=questOf(U.qs.id);if(o){o.done=!o.done;save();if(o.done){const l=say('questDone');toast(l);}U.sheet=null;render();}break;}
    case 'qDel':if(U.qs.confirmDel){const qid=U.qs.id;S.tasks.forEach(t=>{if(t.q===qid)t.q='';});S.quests=S.quests.filter(x=>x.id!==qid);save();U.sheet=null;render();}else{U.qs.title=($('#qTitle')||{}).value||U.qs.title;U.qs.confirmDel=true;renderOverlay();}break;
    /* ideas */
    case 'addIdea':U.is={id:null,text:'',hall:v||S.halls[0].id,confirmDel:false};U.sheet='idea';renderOverlay();setTimeout(()=>{const x=$('#iTitle');x&&x.focus();},60);break;
    case 'openIdea':{if(Date.now()<suppressI)break;const i=S.ideas.find(x=>x.id===id);if(!i)break;U.is={id:i.id,text:i.title,hall:i.hall,confirmDel:false};U.sheet='idea';renderOverlay();break;}
    case 'iHall':U.is.text=($('#iTitle')||{}).value||U.is.text;U.is.hall=v;renderOverlay();break;
    case 'iSave':{
      const i=U.is;const raw=(($('#iTitle')||{}).value||'').trim();if(!raw)break;
      if(i.id){const o=S.ideas.find(x=>x.id===i.id);if(o){o.title=raw;o.hall=i.hall;}U.sheet=null;}
      else{raw.split(',').map(x=>x.trim()).filter(Boolean).forEach((t,k)=>S.ideas.push({id:uid(),title:t[0].toUpperCase()+t.slice(1),hall:i.hall,created:Date.now()+k}));U.sheet=null;}
      save();say('added');render();break;}
    case 'iDel':if(U.is.confirmDel){S.ideas=S.ideas.filter(x=>x.id!==U.is.id);save();U.sheet=null;say('dropped');render();}else{U.is.text=($('#iTitle')||{}).value||U.is.text;U.is.confirmDel=true;renderOverlay();}break;
    case 'iQuest':{const i=S.ideas.find(x=>x.id===U.is.id);if(i)promoteIdea(i);break;}
    case 'iToday':{const i=S.ideas.find(x=>x.id===U.is.id);if(!i)break;ideaToTask(i);S.ideas=S.ideas.filter(x=>x.id!==i.id);save();U.sheet=null;toast(say('added'));render();break;}
    case 'roll':rollIdea();U.sheet='roll';renderOverlay();break;
    case 'rollAgain':rollIdea();renderOverlay();break;
    case 'rollToday':{const i=S.ideas.find(x=>x.id===U.roll.id);if(!i)break;ideaToTask(i);S.ideas=S.ideas.filter(x=>x.id!==i.id);save();U.sheet=null;toast(say('added'));render();break;}
    /* week / month / year councils */
    case 'yqOpen':U.council.focus=($('#focusTxt')||{}).value||'';U.council.qOpen=!U.council.qOpen;renderOverlay();break;
    case 'yqPick':U.council.focus=($('#focusTxt')||{}).value||'';if(U.council.quests.length<3)U.council.quests.push(id);U.council.qOpen=false;renderOverlay();break;
    case 'yqDel':U.council.focus=($('#focusTxt')||{}).value||'';U.council.quests=U.council.quests.filter(x=>x!==id);renderOverlay();break;
    case 'saveCouncilK':{const C=U.council;C.focus=($('#focusTxt')||{}).value||'';S.cplans[C.key]={focus:C.focus,dragonId:C.dragonId,quests:C.quests||[],saved:Date.now()};save();U.council=null;LC.key='';render();const l=say('saved');renderHead();toast(l);break;}
  }
}
let suppressI=0;
function extInput(t){
  if(t.id==='qTitle'&&U.qs)U.qs.title=t.value;
  else if(t.id==='qDue'&&U.qs){U.qs.due=t.value;}
  else if(t.id==='iTitle'&&U.is)U.is.text=t.value;
}
document.addEventListener('change',e=>{if(e.target.id==='qDue'&&U.qs){U.qs.due=e.target.value;U.qs.open=null;renderOverlay();}});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='qTitle'){e.preventDefault();const b=document.querySelector('[data-act=qSave]');b&&b.click();}
  else if(e.key==='Enter'&&e.target.id==='iTitle'){e.preventDefault();const b=document.querySelector('[data-act=iSave]');b&&b.click();}
});
function extKey(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return false;
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return false;
  if(U.sheet||U.council||U.menu)return false;
  const k=e.key.toLowerCase();
  if(k==='n'){if(U.view==='main')extAct('addQuest');else if(U.view==='side')extAct('addIdea');else openAdd(null);return true;}
  if(k==='t'){goto('list');return true;}
  if(k==='r'){goto('road');return true;}
  if(k==='q'){goto('main');return true;}
  if(k==='s'){goto('side');return true;}
  if(k==='d'){goto('dragons');return true;}
  if(k==='c'){openCouncil('day');return true;}
  if(k==='m'){U.toast=null;renderToast();U.menu=true;U.confirm=null;renderOverlay();return true;}
  return false;
}

/* swipe right on an idea: make it a quest */
let isw=null;
document.addEventListener('pointerdown',e=>{
  const row=e.target.closest('.irow');if(!row||!row.dataset.id||U.view!=='side')return;
  isw={row,id:row.dataset.id,x:e.clientX,y:e.clientY,dx:0,on:false,pid:e.pointerId};
});
document.addEventListener('pointermove',e=>{
  if(!isw||e.pointerId!==isw.pid)return;
  const dx=e.clientX-isw.x,dy=e.clientY-isw.y;
  if(!isw.on){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.6&&dx>0){isw.on=true;try{isw.row.setPointerCapture(e.pointerId);}catch(x){}}else if(Math.abs(dy)>12){isw=null;return;}}
  if(isw&&isw.on){isw.dx=Math.max(0,dx);isw.row.style.transform='translateX('+isw.dx+'px)';}
});
function endISwipe(){
  if(!isw)return;const s=isw;isw=null;
  if(!s.on)return;suppressI=Date.now()+400;
  if(s.dx>90){const i=S.ideas.find(x=>x.id===s.id);s.row.style.transition='transform .15s';s.row.style.transform='translateX(110%)';setTimeout(()=>{if(i)promoteIdea(i);},120);}
  else{s.row.style.transition='transform .15s';s.row.style.transform='';}
}
document.addEventListener('pointerup',endISwipe);document.addEventListener('pointercancel',endISwipe);

/* ---------- week, month, year councils ---------- */
function extCouncilHTML(){
  const C=U.council,kind=C.kind;
  const tier={week:'elder',month:'wyrm',year:'ancient'}[kind],tinfo=TIERS.find(x=>x[0]===tier);
  const now=new Date(),td=today();
  let head,sub,title,focusLbl,focusQ,mid='';
  if(kind==='week'){
    const dn=now.getDay()||7,mon=addDays(td,1-dn),sun=addDays(mon,6),wk=isoWeek(td).w;
    head=`WEEK ${wk} · ${new Date(mon+'T12:00:00').getDate()} TO ${new Date(sun+'T12:00:00').getDate()} ${MON[new Date(sun+'T12:00:00').getMonth()].toUpperCase()}`;
    title='The Weekly Council';sub='Look ahead, my lord. Seven days, one list.';focusLbl='Focus of the week';focusQ='What is this week for?';
    const counts=[];for(let i=0;i<7;i++){const d=addDays(mon,i);counts.push(S.tasks.filter(t=>t.date===d&&!t.done).length);}
    const mx=Math.max(1,...counts),busy=counts.indexOf(Math.max(...counts)),labs=['MON','TUE','WED','THU','FRI','SAT','SUN'];
    const busyDate=addDays(mon,busy),moved=S.tasks.filter(t=>t.date===busyDate&&!t.done&&t.moves>0).length;
    const note=Math.max(...counts)===0?'An empty week. I am suspicious, and a little proud.':`${DAYS[(busy+1)%7]} is the heavy one, ${counts[busy]} tasks. ${moved?moved+' of them have been moved before.':'I have moved nothing. Yet.'}`;
    mid=sections('week','var(--brass-l)','The week ahead','Open tasks per day')+`<div class="bars">${counts.map((n,i)=>`<div><span class="bn">${n}</span><span class="b" style="height:${Math.max(4,n/mx*90)}px;${i===busy&&n>0?'background:var(--ember)':''}"></span><span class="bl">${labs[i]}</span></div>`).join('')}</div><p class="note" style="margin:6px 0 0">${esc(note)}</p>`;
  }else if(kind==='month'){
    const y=now.getFullYear(),mo=now.getMonth(),first=new Date(y,mo,1),last=new Date(y,mo+1,0).getDate(),off=(first.getDay()+6)%7;
    head=(MON[mo]+' '+y).toUpperCase();title='The Monthly Council';sub='The long view, my lord. Breathe first.';focusLbl='Theme of the month';focusQ='What is '+MONTHS[mo]+' for?';
    const dt=S.tasks.find(t=>t.id===C.dragonId),ringDate=dt?dt.date:'';
    const dots=new Set(S.quests.filter(q=>!q.done&&q.due).map(q=>q.due));
    let cells='';for(const l of ['MO','TU','WE','TH','FR','SA','SU'])cells+=`<span class="ch">${l}</span>`;
    for(let i=0;i<off;i++)cells+='<span></span>';
    for(let d=1;d<=last;d++){const ds=y+'-'+z2(mo+1)+'-'+z2(d);cells+=`<span class="cd ${ds===ringDate?'ring':''} ${ds===td?'tod':''}">${d}${dots.has(ds)?'<i class="dot"></i>':''}</span>`;}
    mid=sections('moon','var(--brass-l)','The month at a glance','Dots are quests due, the ring is a dragon')+`<div class="cal">${cells}</div>`;
  }else{
    const y=now.getFullYear(),left=Math.max(0,Math.ceil((new Date(y,11,31,23,59)-now)/864e5));
    head=String(y);title='The Yearly Council';sub=`${left} days to go, my lord. ${left>200?'Plenty. That is how it starts.':'Do not panic.'}`;focusLbl='Theme of the year';focusQ='What is '+y+' for?';
    const sel=C.quests.map(id=>questOf(id)).filter(Boolean);
    const avail=S.quests.filter(q=>!q.done&&!C.quests.includes(q.id));
    mid=sections('crown','var(--brass-l)','Three great quests','Only three. Pick with care.')+sel.map((q,i)=>`<div class="yq"><b>${i+1}</b><span class="qtile" style="width:38px;height:38px">${ico(q.icon,20,'var(--brass-l)',1.5)}</span><span class="it"><b>${esc(q.title)}</b><i>Main quest, ${q.due?'due '+shortDue(q.due).toLowerCase():'no date'}</i></span><button type="button" class="ib quiet" style="border:0;background:none" data-act="yqDel" data-id="${q.id}" aria-label="Remove">${ico('x',18,'currentColor',2)}</button></div>`).join('')+
      (sel.length<3?`<button type="button" class="dcard" style="border-style:dashed;color:var(--dim);font:italic 17px var(--fell);margin-top:8px" data-act="yqOpen">${avail.length?'Choose a main quest':'No main quests to choose from'}</button>`:'')+
      (C.qOpen?`<div class="pick">${avail.map(q=>`<button type="button" data-act="yqPick" data-id="${q.id}">${ico(q.icon,18,'var(--brass-l)',1.6)}${esc(q.title)}</button>`).join('')}</div>`:'');
  }
  const dt=S.tasks.find(t=>t.id===C.dragonId&&!t.done),cands=candidates();
  const dragonName={elder:'Elder Dragon',wyrm:'Great Wyrm',ancient:'Ancient Wyrm'}[tier],scope={week:'this week',month:'this month',year:'this year'}[kind];
  let dr;
  if(dt)dr=`<div class="dcard"><div style="flex:1;line-height:1.2"><div style="font-size:16.5px;font-weight:600">${esc(dt.title)}</div><div class="mono" style="font-size:12px;color:var(--dim)">${esc(cat(dt.cat).name)}${dt.moves?' · moved '+dt.moves+' times':''} · ${shortDue(dt.date)}</div></div><button type="button" class="ib quiet" style="border:0;background:none" data-act="dragonClear" aria-label="Clear the dragon">${ico('x',20,'currentColor',2)}</button></div>
    <div class="rg"><img src="${kn(tier==='ancient'?2:tier==='wyrm'?7:8)}" alt=""><span>${esc(C.line||pickLine(TIERLINE[tier],{since:DAYS[new Date(dt.createdAt).getDay()]}).text)}</span></div>`;
  else dr=`<button type="button" class="dcard" style="border-style:dashed;color:var(--dim);font:italic 18px var(--fell)" data-act="dragonOpen">${cands.length?'Pick the task you dread most':'No open tasks to pick from'}</button>`;
  const picker=C.pickOpen?`<div class="pick">${cands.map(t=>`<button type="button" data-act="dragonPick" data-id="${t.id}">${ico(iconOf(cat(t.cat)),18,'var(--brass-l)',1.6)}${esc(t.title)}${t.moves?`<small>moved ${t.moves}x</small>`:''}</button>`).join('')}</div>`:'';
  return `<div class="full g" role="dialog" aria-label="${title}"><div style="display:flex;align-items:center;height:84px;padding-top:40px"><button type="button" class="ib quiet" data-act="closeCouncil" aria-label="Close the Council">${ico('x',22,'currentColor',2)}</button><span class="mono" style="margin-left:auto;font:500 12.5px var(--mono);letter-spacing:.1em;color:var(--dim)">${head}</span></div>
  <h1 class="fell" style="margin:6px 0 0;text-align:center;font:400 38px/1 var(--fell)">${title}</h1><p class="fell" style="margin:6px 0 0;text-align:center;font:italic 17px var(--fell);color:var(--dim)">${sub}</p>
  ${sections('flag','var(--brass-l)',focusLbl,focusQ)}<textarea id="focusTxt" class="tb" rows="2" placeholder="One sentence, for yourself" aria-label="${focusLbl}">${esc(C.focus||'')}</textarea>
  ${mid}
  ${sections('flame','var(--glow)','Slay the '+dragonName,'The one you dread most '+scope,TAGS[tier])}${dr}${picker}
  <div class="btns" style="margin-top:22px"><button type="button" class="btn" data-act="saveCouncilK">Save Plan</button></div></div>`;
}

/* ---------- sync across devices through the artifact database ---------- */
var pushT=0;
function pushSoon(){clearTimeout(pushT);pushT=setTimeout(push,1500);}
async function push(){
  if(!DB)return;
  try{
    const copy=Object.assign({},S);delete copy.logq;const st=Object.assign({},S.settings);delete st.theme;copy.settings=st;
    await DB.doc('state/main').set({rev:S.rev,json:JSON.stringify(copy),at:new Date().toISOString()});
  }catch(e){}
}
function syncInit(){
  if(!DB)return;
  try{
    DB.doc('state/main').onSnapshot(snap=>{
      if(!snap.exists){if(S.rev>0)push();return;}
      const d=snap.data();if(!d||!d.json)return;
      if(d.rev>S.rev){
        try{
          const o=JSON.parse(d.json);
          if(o&&o.v===1&&o.cats&&o.tasks){
            const keep={logq:S.logq,theme:S.settings.theme};
            S=o;S.logq=keep.logq;S.settings=S.settings||{};S.settings.theme=keep.theme;S.rev=d.rev;
            S.quests=S.quests||[];S.ideas=S.ideas||[];S.halls=S.halls||defaultHalls();S.cplans=S.cplans||{};
            save(true);applyTheme();LC.key='';
            if(!document.activeElement||!/INPUT|TEXTAREA/.test(document.activeElement.tagName))render();
          }
        }catch(e){}
      }else if(d.rev<S.rev){pushSoon();}
    },()=>{});
  }catch(e){}
}


/* ---------- the one-liner library: lines fire only when their use-when condition is true ---------- */
const pick0=window.pickLine;
const TOPICS={
  doctor:[/\b(doctor|dentist|clinic|check-?up|physio|blood|appointment|arzt|zahnarzt)/i,null],
  emails:[/\b(emails?|mail|reply|respond|inbox|message|slack)/i,'messages'],
  calls:[/\b(call|phone|ring|anrufen)/i,null],
  paper:[/\b(tax|bill|invoice|insurance|form|renew|visa|passport|permit|id|receipt|expenses|portal|login|account|upload|password|paperwork|rent|steuer)\b/i,'admin'],
  chores:[/\b(laundry|washing|dishes|dishwasher|bins|trash|recycling|groceries|clean|hoover|vacuum|fix|repair|cook|dinner|water|plants|assemble|ikea|furniture|sheets|bed|linen)/i,'home'],
  exercise:[/\b(gym|run|walk|swim|yoga|stretch|cycle|bike|leg|workout|jog|lift|exercise|training)/i,'fitness'],
  social:[/\b(birthday|dinner|wedding|party|family|date night|gift|present|drinks|pub|bar|friend|meet|rsvp|invite)/i,'social']
};
const MEDRX=TOPICS.doctor[0];
const LREC={};let sessAdd=0,sessPost=0;
function topicsOf(t){
  if(!t)return [];
  const c=cat(t.cat),cid=(c&&c.id)||'';
  return Object.keys(TOPICS).filter(k=>TOPICS[k][0].test(t.title));
}
function libCtx(kind,vars){
  vars=vars||{};
  const td=today(),now=new Date(),hr=now.getHours()+now.getMinutes()/60,tt=S.tasks.filter(t=>t.date===td),open=tt.filter(t=>!t.done);
  const over=S.tasks.filter(t=>!t.done&&t.date<td);
  let tk=vars.id?S.tasks.find(t=>t.id===vars.id):null;
  if(!tk&&vars.task)tk=S.tasks.find(t=>t.title===vars.task);
  if(!tk&&kind==='dragon'&&U.council&&U.council.dragonId)tk=S.tasks.find(t=>t.id===U.council.dragonId);
  if(!tk&&kind==='open'&&vars.task)tk=S.tasks.find(t=>t.title===vars.task);
  const dr=S.tasks.find(t=>t.id===plan().dragonId&&!t.done);
  const catOf=t=>((cat(t.cat)||{}).name||'').toLowerCase();
  const task=tk?{title:tk.title.toLowerCase(),words:tk.title.trim().split(/\s+/).length,cat:catOf(tk),moves:tk.moves||0,od:(!tk.done&&tk.date<td)?diffDays(td,tk.date):0,today:tk.date===td,dd:diffDays(tk.date,td),timed:!!tk.time,hh:tk.time?(+tk.time.slice(0,2)+ +tk.time.slice(3,5)/60):0,dow:new Date(tk.date+'T12:00:00').getDay(),dragon:!!dr&&dr.id===tk.id,age:Math.floor((Date.now()-(tk.createdAt||Date.now()))/864e5),hasDate:tk.date!==td}:null;
  const tm=addDays(td,1),emails=open.filter(t=>TOPICS.emails[0].test(t.title)||t.cat==='messages').length,calls=open.filter(t=>TOPICS.calls[0].test(t.title)).length;
  const timed=open.filter(t=>t.time),tms=timed.map(t=>t.time),
    by={};open.forEach(t=>{const k=ymd(new Date(t.createdAt||0));by[k]=(by[k]||0)+1;});
  const x={kind,n:open.length,nt:tt.length,over:over.length,emails,calls,hr,dow:now.getDay(),
    opens:(U.opens||1),tmr:S.tasks.filter(t=>!t.done&&t.date===tm).length,
    tmrEarly:S.tasks.some(t=>!t.done&&t.date===tm&&t.time&&t.time<'08:00'),
    ft:timed.length?Math.min(...timed.map(t=>+t.time.slice(0,2))):null,
    oldest:Math.max(0,...S.tasks.filter(t=>!t.done&&t.date<td).map(t=>diffDays(td,t.date)),...open.map(t=>t.moves||0)),
    drg:dr||null,dragonDone:!!S.tasks.find(t=>t.id===plan().dragonId&&t.done),ideas:(S.ideas||[]).length,
    noMed:!S.tasks.some(t=>!t.done&&MEDRX.test(t.title)&&diffDays(t.date,td)<=60),
    cleared:S.tasks.some(t=>t.done&&t.doneAt&&ymd(new Date(t.doneAt))===td&&t.date<td),
    sa:sessAdd,sp:sessPost,dupTime:new Set(tms).size<tms.length,
    noLunch:!open.some(t=>/lunch|break/i.test(t.title)),catsUsed:new Set(open.map(t=>t.cat)).size,
    sameDay:Math.max(0,...Object.values(by)),durSum:timed.reduce((s,t)=>s+(t.dur||0),0),
    homeToday:open.filter(t=>t.cat==='home').length,
    social7:S.tasks.filter(t=>!t.done&&t.cat==='social'&&diffDays(t.date,td)>=0&&diffDays(t.date,td)<=7).length,
    t:task,
    ndDiff:tk?diffDays(tk.date,td):0,ndDow:tk?new Date(tk.date+'T12:00:00').getDay():0,ndCount:tk?S.tasks.filter(t=>!t.done&&t.date===tk.date).length:0,
    has(re){return !!tk&&re.test(tk.title);}};
  return {x,tk};
}
const MOMENT={briefing:['briefing'],one:['briefing'],empty:['empty'],allDone:['allDone'],overdue:['overdue'],overloaded:['overloaded'],late:['late'],postponed:['postponed'],postpone:['postponed'],added:['added'],dragonPicked:['frogPicked','frog'],dread:[]};
const FILL=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:'');
function libPick(key,vars){
  const moments=MOMENT[key];if(!moments||typeof LIB==='undefined')return null;
  const kind=key==='added'?'add':(key==='postpone')?'postpone':key==='dragonPicked'?'dragon':'open';
  if(key==='added')sessAdd++;if(key==='postpone')sessPost++;
  const {x,tk}=libCtx(kind,vars);
  const late=key==='late';
  const ok=(m,i)=>{try{return LIB[m][i][1](x);}catch(e){return false;}};
  const collect=ms=>{const r=[];ms.forEach(m=>LIB[m]&&LIB[m].forEach((l,i)=>{if(ok(m,i))r.push([m,i]);}));return r;};
  let main=collect(moments),spec=[];
  if(tk)topicsOf(tk).forEach(g=>{spec=spec.concat(collect([g]).filter(([m,i])=>true));});
  if(tk&&tk.id===(plan().dragonId||'')&&kind!=='dragon')spec=spec.concat(collect(['frog']));
  spec=spec.filter(([m,i])=>!(LIB[m][i][0]&&false));
  /* a specific line needs a real condition, not Any: drop group lines whose condition is always true unless they have text about the topic (they all do), keep all */
  let pool=main;
  if(spec.length&&(kind!=='open'||key==='dread')&&Math.random()<0.65)pool=spec;
  else if(!main.length)pool=spec;
  if(!pool.length)return null;
  const fresh=pool.filter(([m,i])=>!(LREC[m]||[]).includes(i));
  const [m,i]=(fresh.length?fresh:pool)[Math.floor(Math.random()*(fresh.length?fresh.length:pool.length))];
  (LREC[m]=LREC[m]||[]).push(i);if(LREC[m].length>12)LREC[m].shift();
  const now=new Date(),DAYN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayDate=tk?new Date(tk.date+'T12:00:00'):now;
  const v={n:x.n,task:tk?tk.title:(vars&&vars.task)||'',time:tk&&tk.time?tk.time:z2(now.getHours())+':'+z2(now.getMinutes()),day:DAYN[dayDate.getDay()],days:(vars&&vars.days)||(x.t&&x.t.od)||'',times:tk?(tk.moves||0):'',emails:x.emails,overdue:x.over};
  let text=FILL(LIB[m][i][0],v);text=text.charAt(0).toUpperCase()+text.slice(1);
  const base=LINES[key]||LINES.briefing;
  return {face:base.face||5,text};
}
function pickLine(key,vars){
  let r=null;try{r=libPick(key,vars);}catch(e){r=null;}
  return r||pick0(key,vars);
}

/* ---------- boot ---------- */
$('#app').insertAdjacentHTML('afterbegin','<header class="head" id="head"></header><main class="scroll" id="main"></main><div id="dockhost"></div><div id="overlay"></div><div id="toast"></div>');
try{const k='sirreg.opens.'+today(),n=(+localStorage.getItem(k)||0)+1;localStorage.setItem(k,n);U.opens=n;}catch(x){U.opens=1;}
render();
})();
