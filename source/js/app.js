(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const z2=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+z2(d.getMonth()+1)+'-'+z2(d.getDate());
const today=()=>ymd(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d);};
const diffDays=(a,b)=>Math.round((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/864e5);
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtHead=s=>{const d=new Date(s+'T12:00:00');return DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()];};
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
const hhmm=m=>z2(Math.floor(m/60))+':'+z2(m%60);

/* ---------- storage ---------- */
const KEY='sirreg.v1';
const PAL=[['#2B4542','#5E8F85'],['#5A2B26','#C4543F'],['#4A4128','#A89462'],['#3D2E3F','#9A7BA0'],['#2F3A4A','#6F8FB5'],['#4A2F2B','#C98A6B'],['#3A3A2A','#9C9A5E'],['#2B3A33','#6FAE8E']];
function defaultHalls(){return [{id:'scriptorium',name:'The Scriptorium',icon:'study',pal:0},{id:'hearth',name:'The Hearth',icon:'home',pal:2},{id:'yard',name:'The Training Yard',icon:'fitness',pal:1},{id:'tavern',name:'The Tavern',icon:'social',pal:3}];}
function seed(){
  const td=today();
  const cats=[{id:'work',name:'Work',icon:'work',pal:0},{id:'health',name:'Health',icon:'health',pal:1},{id:'home',name:'Home',icon:'home',pal:2},{id:'money',name:'Personal',icon:'admin',pal:3},{id:'shopping',name:'Shopping',icon:'shopping',pal:4},{id:'social',name:'Social',icon:'social',pal:5},{id:'travel',name:'Travel',icon:'travel',pal:6}];
  const q={flat:uid(),han:uid(),half:uid(),ital:uid()};
  const quests=[
    {id:q.flat,title:'Move to the new flat',icon:'home',due:addDays(td,32),created:Date.now()-864e5*20,s:1},
    {id:q.han,title:'Hanse proposal',icon:'work',due:addDays(td,8),created:Date.now()-864e5*12,s:1},
    {id:q.half,title:'Half marathon',icon:'fitness',due:addDays(td,172),created:Date.now()-864e5*40,s:1},
    {id:q.ital,title:'Learn Italian',icon:'study',due:'',created:Date.now()-864e5*30,s:1}];
  const mk=(title,cat,time,dur,extra)=>Object.assign({id:uid(),title,cat,date:td,time:time||'',dur:dur||30,done:false,moves:0,createdAt:Date.now()-864e5*3,s:1},extra||{});
  const tasks=[
    mk('Send Hanse proposal','work','09:30',30,{done:true,doneAt:Date.now(),q:q.han}),
    mk('Review sprint board','work','12:00',90,{moves:3,q:q.han}),
    mk('Call with Lena','work','14:30',30),
    mk('Dentist','health','15:00',60,{moves:2}),
    mk('Evening run, 5 km','health','18:30',60,{q:q.half}),
    mk('Water the ferns','home','',30),
    mk('Take out the recycling','home','',15),
    mk('Pay rent','money','',15),
    mk('Book the van','home','',30,{date:addDays(td,-1),q:q.flat}),
    mk('Order moving boxes','home','',30,{date:addDays(td,3),q:q.flat}),
    mk('Lesson 4: the subjunctive','money','',45,{date:addDays(td,2),q:q.ital})
  ];
  const ago=n=>Date.now()-864e5*n;
  const ideas=[
    {id:uid(),title:'Write that short story',hall:'scriptorium',created:ago(41),s:1},
    {id:uid(),title:'Learn the lute',hall:'scriptorium',created:ago(76),s:1},
    {id:uid(),title:'Build a standing desk',hall:'hearth',created:ago(2),s:1},
    {id:uid(),title:'Repaint the bike',hall:'hearth',created:ago(76),s:1},
    {id:uid(),title:'Tomatoes on the balcony',hall:'hearth',created:ago(118),s:1},
    {id:uid(),title:'Run a 10k',hall:'yard',created:ago(10),s:1},
    {id:uid(),title:'Try bouldering',hall:'yard',created:ago(30),s:1},
    {id:uid(),title:'Host a board game night',hall:'tavern',created:ago(14),s:1},
    {id:uid(),title:'Organise a reunion',hall:'tavern',created:ago(60),s:1}];
  const plans={};plans[td]={focus:'',dragonId:tasks[1].id,mood:'focus'};
  return {v:1,rev:0,cats,tasks,plans,quests,ideas,halls:defaultHalls(),cplans:{},kw:{},last:'work',shut:{},settings:{mute:false},sample:true,logq:[]};
}
let S;
function load(){try{const j=localStorage.getItem(KEY);if(j){const o=JSON.parse(j);if(o&&o.v===1&&o.cats&&o.tasks)return o;}}catch(e){}return seed();}
let memOnly=false;
let syncing=false;
function save(noPush){if(!noPush)S.rev=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){memOnly=true;}if(!noPush&&typeof pushSoon==='function')pushSoon();}
S=load();S.logq=S.logq||[];S.quests=S.quests||[];S.ideas=S.ideas||[];S.halls=S.halls||defaultHalls();S.cplans=S.cplans||{};S.rev=S.rev||0;
(function migrate(){const m=S.cats.find(c=>c.id==='money'&&c.name==='Money');if(m){m.name='Personal';m.icon='admin';}
  if(!S.cats.some(c=>c.name.toLowerCase()==='travel'))S.cats.push({id:'travel',name:'Travel',icon:'travel',pal:6});save();})();

/* ---------- task log (for tuning Sir Reg's lines; synced to the artifact database) ---------- */
let DB=null,flushing=false;
async function flush(){
  if(!DB||flushing||!S.logq.length)return;flushing=true;
  try{while(S.logq.length){const e=S.logq[0];await DB.collection('log').doc(e.id).set(e);S.logq.shift();save(true);}}catch(err){}
  flushing=false;
}
function logEv(ev,t,extra){
  if(!t||t.s)return;
  const k=S.cats.find(c=>c.id===t.cat);
  S.logq.push(Object.assign({id:uid(),ev,title:t.title,cat:k?k.name:'',date:t.date,time:t.time||'',dur:t.dur||0,moves:t.moves||0,at:new Date().toISOString()},extra||{}));
  if(S.logq.length>1000)S.logq.splice(0,S.logq.length-1000);
  save();flush();
}
try{if(window.claude&&claude.use)claude.use('db').then(d=>{DB=d;flush();if(typeof syncInit==='function')syncInit();},()=>{});}catch(e){}

/* ---------- theme ---------- */
function applyTheme(){let t=(S.settings&&S.settings.theme)||'dark';if(t==='system'){try{t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}catch(e){t='dark';}}document.documentElement.setAttribute('data-rt',t);}
try{matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(S.settings.theme==='system'){applyTheme();try{render();}catch(e){}}});}catch(e){}
applyTheme();

const kn=f=>'knight/'+(document.documentElement.getAttribute('data-rt')==='light'?'l':'n')+f+'.png';

/* ---------- ui state ---------- */
const U={view:'list',sheet:null,add:null,nc:null,bubble:null,toast:null,council:null,menu:false,placing:null,confirm:null,scrollRoad:false,opens:0};
const cat=id=>S.cats.find(c=>c.id===id)||S.cats[0];
const plan=()=>S.plans[today()]||{};
const iconOf=c=>c.icon;
function isoWeek(ds){const d=new Date(ds+'T12:00:00');const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-dn);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return {y:t.getUTCFullYear(),w:Math.ceil(((t-y0)/864e5+1)/7)};}
const wkKey=ds=>{const o=isoWeek(ds||today());return 'w'+o.y+'-'+z2(o.w);};
const moKey=ds=>'m'+(ds||today()).slice(0,7);
const yrKey=ds=>'y'+(ds||today()).slice(0,4);
const TAGS={dragon:'DRAGON',elder:'ELDER',wyrm:'WYRM',ancient:'ANCIENT'};
const TIERS=[['dragon','Dragon','The day','flame'],['elder','Elder Dragon','The week','wing'],['wyrm','Great Wyrm','The month','serpent'],['ancient','Ancient Wyrm','The year','horned']];
function tierOf(t){
  if(!t||t.done)return '';
  const cp=S.cplans;
  if((cp[wkKey()]&&cp[wkKey()].dragonId===t.id)||(t.moves||0)>=7)return 'elder';
  if(plan().dragonId===t.id)return 'dragon';
  return '';
}
const questOf=id=>S.quests.find(q=>q.id===id);
function addMonths(ds,n){const d=new Date(ds+'T12:00:00');const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return ymd(d);}
function nextDate(ds,rep){
  if(rep==='daily')return addDays(ds,1);
  if(rep==='weekly')return addDays(ds,7);
  if(rep==='monthly')return addMonths(ds,1);
  if(rep==='weekdays'){let d=addDays(ds,1);for(let i=0;i<7;i++){const w=new Date(d+'T12:00:00').getDay();if(w!==0&&w!==6)return d;d=addDays(d,1);}return d;}
  return ds;
}
const REPS=[['','Once'],['daily','Daily'],['weekdays','Weekdays'],['weekly','Weekly'],['monthly','Monthly']];


/* ---------- Sir Reg ---------- */
function context(){
  const td=today(),all=S.tasks,tt=all.filter(t=>t.date===td),open=tt.filter(t=>!t.done),over=all.filter(t=>!t.done&&t.date&&t.date<td);
  const cl=all.filter(t=>t.done&&t.doneAt&&t.date&&t.date<td&&ymd(new Date(t.doneAt))===td).length;
  return {td,tt,open,over,done:tt.length-open.length+cl,total:tt.length+over.length+cl};
}
function scenario(c){
  if(S.settings.mute)return ['muted',{n:c.open.length}];
  const h=new Date().getHours(),n=c.open.length;
  if(c.tt.length===0&&c.over.length===0)return ['empty',{}];
  if(n===0&&c.over.length===0)return ['allDone',{}];
  if(c.over.length>=4)return ['pile',{overdue:c.over.length}];
  const old=c.over.slice().sort((a,b)=>a.date<b.date?-1:1)[0];
  if(old&&diffDays(c.td,old.date)>=3)return ['overdue',{task:old.title,days:diffDays(c.td,old.date)}];
  if(n+c.over.length>=10)return ['overloaded',{n:n+c.over.length}];
  const dr=c.open.find(t=>/\b(dentist|doctor|dr\.?|arzt|tax|bill)\b/i.test(t.title));
  if(dr)return ['dread',{task:dr.title}];
  const mv=c.open.filter(t=>t.moves>=3).sort((a,b)=>b.moves-a.moves)[0];
  if(mv)return ['postponed',{task:mv.title,moves:mv.moves}];
  if(h>=22||h<5)return ['late',{n:n+c.over.length}];
  if(n===1)return ['one',{}];
  return ['briefing',{n:n+c.over.length}];
}
let LC={key:'',line:null};
function currentLine(c){
  if(U.bubble&&U.bubble.until>Date.now())return U.bubble;
  const [k,v]=scenario(c);const key=c.td+k+JSON.stringify(v);
    if(LC.key!==key){
    let st=null;try{st=JSON.parse(localStorage.getItem('sirreg.line')||'null');}catch(e){}
    if(st&&st.key===key&&st.line&&st.line.text)LC={key,line:st.line};
    else{let nl=pickLine(k,v);for(let i=0;i<6&&nl.text===EVT;i++)nl=pickLine(k,v);LC={key,line:nl};try{localStorage.setItem('sirreg.line',JSON.stringify({key,line:LC.line}));}catch(e){}}
  }
  return LC.line;
}
let bubbleTimer=0,PEND=null,EVT='';
function say(key,vars){
  const ln=pickLine(key,vars);EVT=ln.text;try{localStorage.removeItem('sirreg.line');}catch(e){}LC={key:''};
  return ln;
}
function toast(line,undo){
  U.toast={face:line.face,text:line.text,undo:undo||null,id:Date.now()};
  const id=U.toast.id;renderToast();
  setTimeout(()=>{if(U.toast&&U.toast.id===id){U.toast=null;renderToast();}},undo?5500:3200);
}

/* ---------- actions ---------- */
function tick(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  const prev={done:t.done,doneAt:t.doneAt,steps:(t.steps||[]).map(s=>s.done)};const tier0=tierOf(t);let spawned=null;
  t.done=!t.done;t.doneAt=t.done?Date.now():null;if(t.done&&t.steps)t.steps.forEach(s=>s.done=true);syncCol(t);
  if(t.done&&t.rep&&!t.spawn){const nd=nextDate(t.date<today()?today():t.date,t.rep);spawned={id:uid(),title:t.title,cat:t.cat,date:nd,time:t.time||'',dur:t.dur,done:false,moves:0,createdAt:Date.now(),rep:t.rep,q:t.q};if(t.note)spawned.note=t.note;if(t.steps&&t.steps.length)spawned.steps=t.steps.map(s=>({id:uid(),t:s.t,done:false}));S.tasks.push(spawned);t.spawn=spawned.id;}
  else if(!t.done&&t.spawn){const sp=S.tasks.find(x=>x.id===t.spawn);if(sp&&!sp.done)S.tasks.splice(S.tasks.indexOf(sp),1);t.spawn=null;}
  save();
  if(t.done)logEv('done',t,{ageDays:diffDays(today(),t.date)});
  let line;
  if(t.done){
    const c=context();const age=diffDays(c.td,t.date);
    if(tier0)line=say('dragonSlain');
    else if(age>=14)line=say('longOverdue',{days:age});
    else if(Date.now()-t.createdAt<60000)line=say('quick');
    else line=say('done',{n:c.open.length});
    toast(line,()=>{t.done=prev.done;t.doneAt=prev.doneAt;(t.steps||[]).forEach((s,i)=>{s.done=!!prev.steps[i];});syncCol(t);if(spawned){const i=S.tasks.indexOf(spawned);if(i>=0)S.tasks.splice(i,1);t.spawn=null;}save();U.bubble=null;render();});
  }else{U.bubble=null;}
  render();
}
function postpone(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  const prev={date:t.date,moves:t.moves};
  t.date=addDays(today(),1);t.moves=(t.moves||0)+1;save();logEv('postponed',t);
  const line=t.moves===7?say('promoted',{task:t.title}):say('postpone',{moves:t.moves,id:t.id,task:t.title});
  toast(line,()=>{t.date=prev.date;t.moves=prev.moves;save();U.bubble=null;render();});
  render();
}
function removeTask(id){
  const i=S.tasks.findIndex(x=>x.id===id);if(i<0)return;
  const t=S.tasks.splice(i,1)[0];save();logEv('dropped',t);
  const line=say('dropped');toast(line,()=>{S.tasks.push(t);save();render();});
}
function learn(title,catId){S.last=catId;for(const w of title.toLowerCase().split(/[^a-zäöüß0-9]+/)){if(w.length>3)S.kw[w]=catId;}}

/* ---------- add / edit sheet ---------- */
const pctx=()=>({today:today(),cats:S.cats,kw:S.kw});
function linkify(s){return esc(s).replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/g,(m)=>{const u=m.replace(/[.,;:!?)]+$/,''),tail=m.slice(u.length);return `<a class="lk" href="${u.startsWith('www.')?'https://'+u:u}" target="_blank" rel="noopener">${u}</a>${tail}`;}).replace(/\n/g,'<br>');}
function curTask(){return U.add&&U.add.id?S.tasks.find(x=>x.id===U.add.id):null;}
function noteHTML(){
  const t=curTask();if(!t)return '';
  if(t.note&&!U.add.noteEdit)return `<div class="note" data-act="noteEdit">${linkify(t.note)}</div>`;
  return `<textarea id="addNoteTx" class="note ta" rows="${t.note?3:2}" placeholder="Notes, links, anything for later" aria-label="Notes">${esc(t.note||'')}</textarea>`;
}
function stepsHTML(){
  const t=curTask();if(!t)return '';
  const st=t.steps||[];
  return st.map((s,i)=>`<div class="st ${s.done?'done':''}"><button type="button" class="cb" data-act="stTick" data-i="${i}" aria-label="${s.done?'Mark step not done':'Mark step done'}" aria-pressed="${!!s.done}"><i class="${s.done?'on':''}">${s.done?ico('check',12,'currentColor',3.2):''}</i></button><input class="stin" data-i="${i}" value="${esc(s.t)}" aria-label="Step" autocomplete="off"><button type="button" class="stx" data-act="stDel" data-i="${i}" aria-label="Remove step">\u00d7</button></div>`).join('')+`<div class="st add"><span class="stp">+</span><input id="stNew" class="stin" placeholder="Add a step" enterkeyhint="next" autocomplete="off" aria-label="New step"></div>`;
}
function refreshSteps(focusNew){const m=$('#addSteps');if(m)m.innerHTML=stepsHTML();if(focusNew){const i=$('#stNew');i&&i.focus();}}
function stepAdd(txt){const t=curTask();if(!t)return;txt=(txt||'').trim();if(!txt)return;(t.steps=t.steps||[]).push({id:uid(),t:txt,done:false});save();refreshSteps(true);}
function stepTick(i){const t=curTask();if(!t||!t.steps||!t.steps[i])return;const s=t.steps[i];s.done=!s.done;save();refreshSteps();
  if(s.done&&!t.done&&t.steps.every(x=>x.done)){toast({face:3,text:'All steps done. Tick the task itself?'});}}
function openAdd(id){U.toast=null;renderToast();
  const t=id?S.tasks.find(x=>x.id===id):null;
  U.add={id:id||null,text:t?t.title:'',date:t?t.date:today(),time:t?t.time:'',cat:t?t.cat:(S.last||S.cats[0].id),dur:t?t.dur:30,rep:t?(t.rep||''):'',q:t?(t.q||''):'',col:t?(t.col||''):'',over:{date:!!t,time:!!t,cat:!!t,dur:!!t,rep:!!t},confirmDel:false,open:null};
  U.sheet='add';renderOverlay();
  if(!id)setTimeout(()=>{const i=$('#addInput');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},60);
}
function metaHTML(){
  const a=U.add,td=today(),tm=addDays(td,1),k=cat(a.cat);
  const dl=!a.date?'No date':a.date===td?'Today':a.date===tm?'Tomorrow':fmtHead(a.date);
  const dur=a.dur>=60&&a.dur%60===0?(a.dur/60)+' h':a.dur+' min';
  const pill=(id,inner)=>`<button type="button" class="chip ${U.add.open===id?'on':''}" data-act="pick" data-v="${id}">${inner}</button>`;
  let h=`<div class="chips sm">${a.n>1?`<span class="cnt2">${a.n} tasks</span>`:''}${pill('date',esc(dl))}${pill('time',a.time||'No time')}${pill('cat',ico(iconOf(k),16,'var(--brass-l)',1.6)+esc(k.name))}${pill('dur',dur)}${a.rep?pill('rep','\u21bb '+(REPS.find(r=>r[0]===a.rep)||[0,''])[1]):pill('rep','Repeat')}${S.quests.some(q=>!q.done)||a.q?pill('quest',(questOf(a.q)?esc(questOf(a.q).title):'No quest')):''}${a.q&&questOf(a.q)?pill('col',esc((()=>{const qq=questOf(a.q),cs=colsOf(qq);const c=cs.find(x=>x.id===a.col);return c?c.name:cs.find(x=>x.id===(a.id?(S.tasks.find(t=>t.id===a.id)||{}).col:''))?.name||cs.find(x=>x.id===startCol(qq)).name;})())):''}</div>`;
  const o=a.open;
  if(o==='date')h+=`<div class="chips sm sub"><button type="button" class="chip ${a.date===td?'on':''}" data-act="setDate" data-v="${td}">Today</button><button type="button" class="chip ${a.date===tm?'on':''}" data-act="setDate" data-v="${tm}">Tomorrow</button>${a.q?`<button type="button" class="chip ${!a.date?'on':''}" data-act="setDate" data-v="">No date</button>`:''}<input type="date" id="addDate" value="${a.date}" aria-label="Date"></div>`;
  else if(o==='time')h+=`<div class="chips sm sub"><input type="time" id="addTime" value="${a.time||''}" aria-label="Time"><button type="button" class="chip" data-act="clearTime">No time</button></div>`;
  else if(o==='cat')h+=`<div class="chips sm sub">${S.cats.map(c=>`<button type="button" class="chip ${a.cat===c.id?'on':''}" data-act="setCat" data-v="${c.id}">${ico(iconOf(c),16,'var(--brass-l)',1.6)}${esc(c.name)}</button>`).join('')}<button type="button" class="chip" data-act="newCat">${ico('plus',16)}New</button></div>`;
  else if(o==='rep')h+=`<div class="chips sm sub">${REPS.map(([v,l])=>`<button type="button" class="chip ${a.rep===v?'on':''}" data-act="setRep" data-v="${v}">${l}</button>`).join('')}</div>`;
  else if(o==='quest')h+=`<div class="chips sm sub"><button type="button" class="chip ${!a.q?'on':''}" data-act="setQuest" data-v="">None</button>${S.quests.filter(q=>!q.done).map(q=>`<button type="button" class="chip ${a.q===q.id?'on':''}" data-act="setQuest" data-v="${q.id}">${ico(q.icon,16,'var(--brass-l)',1.6)}${esc(q.title)}</button>`).join('')}</div>`;
  else if(o==='col'&&questOf(a.q))h+=`<div class="chips sm sub">${colsOf(questOf(a.q)).map(c=>`<button type="button" class="chip ${(a.col||(S.tasks.find(t=>t.id===a.id)||{}).col||startCol(questOf(a.q)))===c.id?'on':''}" data-act="setCol" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
  else if(o==='dur')h+=`<div class="chips sm sub">${[[15,'15 min'],[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'90 min'],[120,'2 h']].map(([v,l])=>`<button type="button" class="chip ${a.dur===v?'on':''}" data-act="setDur" data-v="${v}">${l}</button>`).join('')}</div>`;
  return h;
}
function addSheetHTML(){
  const a=U.add,edit=!!a.id;
  return `<div class="scrim" data-act="closeSheet"></div>
  <div class="sheet" role="dialog" aria-label="${edit?'Edit task':'Add a task'}">
    <div class="arow"><input id="addInput" class="inp" type="text" value="${esc(a.text)}" placeholder="${edit?'Title':'What needs doing? Try: dentist fri 3pm'}" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" aria-label="Task"><button type="button" class="go" data-act="submit" aria-label="${edit?'Save':'Add task'}">${ico(edit?'check':'plus',22,'currentColor',2.6)}</button></div>
    <div id="addMeta">${metaHTML()}</div>
    ${edit?`<div id="addNote">${noteHTML()}</div><div id="addSteps" class="steps">${stepsHTML()}</div>`:''}
    ${edit?`<button type="button" class="lnk" data-act="delTask">${a.confirmDel?'Tap again to drop this task':'Drop this task'}</button>`:''}
  </div>`;
}
function refreshMeta(){const m=$('#addMeta');if(m)m.innerHTML=metaHTML();}
function onAddInput(v){
  const a=U.add;a.text=v;if(a.id)return;
  const parts=v.split(',').map(x=>x.trim()).filter(Boolean);a.n=parts.length;
  const p=parseQuick(parts[0]||'',pctx());
  if(!a.over.date)a.date=p.date||(p.time?today():a.date&&!a.over.date?today():today());
  if(!a.over.time)a.time=p.time||'';
  if(!a.over.cat&&p.cat)a.cat=p.cat;
  if(!a.over.dur)a.dur=p.dur||p.guess||30;
  if(!a.over.rep)a.rep=p.rep||'';
  refreshMeta();
}
function submitAdd(){
  const a=U.add;const raw=($('#addInput').value||'').trim();if(!raw)return;
  if(a.id){
    const t=S.tasks.find(x=>x.id===a.id);if(!t)return;
    const oc=t.cat;t.title=raw;t.date=a.date||(a.q?'':today());t.time=a.time||'';t.cat=a.cat;t.dur=a.dur;t.rep=a.rep||'';t.q=a.q||'';assignCol(t,a.col);learn(raw,a.cat);save();if(oc!==a.cat)logEv('recat',t,{from:cat(oc).name});U.sheet=null;render();return;
  }
  const parts=raw.split(',').map(x=>x.trim()).filter(Boolean);
  const made=[];
  parts.forEach((part,i)=>{
    const p=parseQuick(part,pctx());const title=p.title||part;
    let date,time,dur,cid;
    if(parts.length===1){date=a.date||today();time=a.time||'';dur=a.dur||30;cid=a.cat;}
    else{
      date=p.date||(a.over.date?a.date:today());time=p.time||(a.over.time?a.time:'');
      dur=p.dur||(a.over.dur?a.dur:(p.guess||30));cid=a.over.cat?a.cat:(p.cat||a.cat||S.last);
    }
    const t={id:uid(),title,cat:cid,date,time,dur,done:false,moves:0,createdAt:Date.now()+i,rep:(parts.length===1?a.rep:(p.rep||(a.over.rep?a.rep:'')))||'',q:a.q||''};
    S.tasks.push(t);made.push(t);if(t.q)assignCol(t,'');learn(title,cid);
    if(p.dragon){S.plans[date]=Object.assign({},S.plans[date]||{},{dragonId:t.id});t.dragonSet=true;}
    logEv('added',t,{raw:part,catManual:parts.length===1?!!a.over.cat:!!a.over.cat,suggested:p.cat?cat(p.cat).name:'',batch:parts.length>1});
  });
  save();
  const dm=made.find(t=>t.dragonSet);const line=dm?say('dragonPicked',{id:dm.id,task:dm.title}):say('added',{id:made[made.length-1].id});
  if(made.length>1)line.text=made.length+' tasks added. '+line.text;
  toast(line,()=>{made.forEach(t=>{const i=S.tasks.indexOf(t);if(i>=0)S.tasks.splice(i,1);});save();render();});
  U.add=Object.assign(U.add,{n:0,open:null,text:'',date:today(),time:'',dur:30,rep:'',over:{date:false,time:false,cat:false,dur:false,rep:false}});
  const inp=$('#addInput');if(inp){inp.value='';inp.focus();}
  refreshMeta();render(true);
}
function newCatHTML(){
  const n=U.nc;
  const icons=CATICONS.map(([k,l])=>`<button type="button" class="chip ${n.icon===k?'on':''}" style="width:58px;height:58px;padding:0;justify-content:center" data-act="ncIcon" data-v="${k}" aria-label="${l}">${ico(k,28,'var(--brass-l)',1.5)}</button>`).join('');
  const cols=PAL.map((p,i)=>`<button type="button" class="chip ${n.pal===i?'on':''}" style="width:52px;padding:0;justify-content:center" data-act="ncPal" data-v="${i}" aria-label="Colour ${i+1}"><i style="width:28px;height:18px;border-radius:2px;background:${p[0]};border-left:4px solid ${p[1]}"></i></button>`).join('');
  return `<div class="scrim" data-act="ncBack"></div><div class="sheet" role="dialog" aria-label="New category"><h2>New category</h2>
  <input id="ncName" class="inp" type="text" value="${esc(n.name)}" placeholder="Name, e.g. Garden" autocomplete="off" aria-label="Category name">
  <span class="lbl">Emblem</span><div class="fields" style="flex-wrap:wrap;gap:8px">${icons}</div>
  <span class="lbl">Colour</span><div class="chips">${cols}</div>
  <div class="btns"><button type="button" class="btn ghost" data-act="ncBack">Back</button><button type="button" class="btn" data-act="ncSave">Create</button></div></div>`;
}

/* ---------- views ---------- */
function sortTasks(a,b){if(a.done!==b.done)return a.done?1:-1;const ta=a.time||'99:99',tb=b.time||'99:99';return ta<tb?-1:ta>tb?1:a.createdAt-b.createdAt;}
function rowHTML(t,over){
  const tier=tierOf(t),dragon=!!tier;
  let rem='';
  if(over)rem=`due ${diffDays(today(),t.date)} ${diffDays(today(),t.date)===1?'day':'days'} ago`;
  else if(t.moves>=2&&!t.done)rem=`moved ${t.moves} times`;
  if(!over&&!rem&&t.q&&questOf(t.q))rem='for '+esc(questOf(t.q).title);
  if(t.rep&&!t.done)rem=(rem?rem+' \u00b7 ':'')+'repeats '+t.rep;
  if(t.steps&&t.steps.length){const sd=t.steps.filter(x=>x.done).length;rem=(rem?rem+' \u00b7 ':'')+sd+'/'+t.steps.length+' steps';}
  if(t.note&&!t.done)rem=(rem?rem+' \u00b7 ':'')+'note';
  return `<div class="rw" data-id="${t.id}"><div class="bgl">${ico('chevr',18,'var(--glow)',2)} Tomorrow</div><div class="bgp">Drop ${ico('x',18,'var(--glow)',2)}</div>
  <div class="row g ${t.done?'done':''} ${dragon?'dragon':''}" data-id="${t.id}">
    <button type="button" class="cb" data-act="tick" data-id="${t.id}" aria-label="${t.done?'Mark not done':'Mark done'}: ${esc(t.title)}" aria-pressed="${t.done}"><i class="${t.done?'on':''}">${t.done?ico('check',14,'currentColor',3.2):''}</i></button>
    <div class="nm" data-act="edit" data-id="${t.id}"><b>${esc(t.title)}</b>${rem?`<em>${rem}</em>`:''}</div>
    ${dragon?`<span class="tag">${TAGS[tier]}</span>`:''}${t.time&&!t.done?`<span class="tm" data-act="edit" data-id="${t.id}">${t.time}</span>`:''}
  </div></div>`;
}
function banner(id,name,count,bg,icon,shut){
  const plus=id==='__over'?'':`<button type="button" class="bplus" data-act="addIn" data-v="${id}" aria-label="Add a task to ${esc(name)}">${ico('plus',18,'var(--bone)',2.2)}</button>`;
  return `${plus}<button type="button" class="ban g" style="background-color:${bg}" data-act="shut" data-v="${id}" aria-expanded="${!shut}">${ico(icon,22,'var(--brass-l)',1.6)}<b>${esc(name)}</b>${id==='__over'?`<span>${count}</span>`:''}<span class="chv">${ico('chev',18,'var(--bone)',1.8)}</span></button>`;
}
function listHTML(){
  const c=context();let h='';
  if(c.over.length){
    h+=`<section class="cat ${S.shut.__over?'shut':''}">${banner('__over','Overdue',c.over.length,'#5A2B26','rest',S.shut.__over)}${c.over.sort(sortTasks).map(t=>rowHTML(t,true)).join('')}</section>`;
  }
  const openIn=k=>c.tt.filter(t=>t.cat===k.id&&!t.done).length;
  const cats=S.cats.slice().sort((p,q)=>openIn(q)-openIn(p)||p.name.localeCompare(q.name));
  for(const k of cats){
    const ts=c.tt.filter(t=>t.cat===k.id).sort(sortTasks);if(!ts.length)continue;
    h+=`<section class="cat ${S.shut[k.id]?'shut':''}">${banner(k.id,k.name,ts.length,PAL[k.pal%PAL.length][0],iconOf(k),S.shut[k.id])}${ts.map(t=>rowHTML(t,false)).join('')}</section>`;
  }
  if(!h)h='<div class="empty">Nothing on the scroll for today.<br>Tap the red button to add something.</div>';
  if(S.sample)h+='<p class="note">These are sample tasks so you can try things. Swipe a task right to move it to tomorrow, left to drop it, tap it to edit. Clear them in the menu.</p>';
  return h;
}
const HS=6,HE=24,PH=56;
function roadHTML(){
  const td=today();let h='';
  const pl=S.tasks.find(t=>t.id===U.placing);
  if(pl)h+=`<div class="hint">${ico('road',20,'currentColor',1.7)}<span>Tap a time for ${esc(pl.title)}</span><button type="button" data-act="cancelPlace" aria-label="Cancel">${ico('x',20,'currentColor',2)}</button></div>`;
  let hrs='';
  for(let x=HS;x<HE;x++)hrs+=`<div class="hr" style="top:${(x-HS)*PH}px"></div><div class="hl" style="top:${(x-HS)*PH}px">${z2(x)}:00</div>`;
  const items=S.tasks.filter(t=>t.date===td&&t.time).map(t=>{const s=mins(t.time)-HS*60;return {t,s,e:s+Math.max(t.dur||30,30)};}).sort((a,b)=>a.s-b.s);
  let cluster=[],cend=-1;const out=[];
  const flush=()=>{if(!cluster.length)return;const cols=[];cluster.forEach(it=>{let i=cols.findIndex(e=>e<=it.s);if(i<0){i=cols.length;cols.push(0);}cols[i]=it.e;it.col=i;});cluster.forEach(it=>{it.cols=cols.length;out.push(it);});cluster=[];};
  items.forEach(it=>{if(it.s>=cend)flush();cluster.push(it);cend=Math.max(cend,it.e);});flush();
  let blocks='';
  out.forEach(({t,s,e,col,cols})=>{
    const k=cat(t.cat),p=PAL[k.pal%PAL.length],tr=tierOf(t),dg=!!tr;
    const top=s/60*PH,hg=Math.max((e-s)/60*PH-2,28);
    blocks+=`<div class="blk g ${t.done?'done':''} ${dg?'dragon':''}" data-id="${t.id}" style="top:${top}px;height:${hg}px;left:${col*100/cols}%;width:calc(${100/cols}% - 3px);background-color:${p[0]};border-left-color:${p[1]};">
      <button type="button" class="cb" data-act="tick" data-id="${t.id}" aria-label="${t.done?'Mark not done':'Mark done'}: ${esc(t.title)}"><i class="${t.done?'on':''}">${t.done?ico('check',12,'currentColor',3.2):''}</i></button>
      <div style="min-width:0;flex:1"><span class="t1">${esc(t.title)}</span>${hg>40?`<span class="t2">${t.time} to ${hhmm(mins(t.time)+(t.dur||30))}</span>`:''}</div>${dg?`<span class="tag">${TAGS[tr]}</span>`:''}</div>`;
  });
  const d=new Date(),nm=d.getHours()*60+d.getMinutes()-HS*60;
  const now=nm>=0&&nm<(HE-HS)*60?`<div class="nowl" id="nowl" style="top:${nm/60*PH}px"><i>NOW</i></div>`:'';
  return `${h}<div class="road ${pl?'placing':''}" id="road" style="height:${(HE-HS)*PH}px">${hrs}<div class="lane" id="lane">${blocks}</div>${now}</div>`;
}
function unplaced(){const c=context();return c.tt.filter(t=>!t.time&&!t.done);}

function headHTML(){
  const c=context(),eh=(U.view==='list'||U.view==='road')?null:extHead(),line=eh?eh.line:currentLine(c);
  return `<img class="bust" src="${kn(line.face)}" alt="Sir Reg" width="134" height="134"><div class="shelf"></div>
  <h1 class="ttl">${eh?eh.title:fmtHead(c.td)}</h1><span class="cnt">${eh?eh.sub:c.done+' of '+c.total+' done'}</span>
  <div class="top">${(U.view==='list'||U.view==='road')?`<button type="button" class="ib" data-act="goto" data-v="main" aria-label="Campaigns">${ico('flag',22,'currentColor',1.7)}</button><button type="button" class="ib" data-act="council" aria-label="The Council: plan your day">${ico('crown',22,'currentColor',1.7)}</button>`:`<button type="button" class="ib" data-act="goto" data-v="list" aria-label="Back to Today">${ico('home',22,'currentColor',1.7)}</button>`}<button type="button" class="ib" data-act="menu" aria-label="Open menu">${ico('menu',22,'currentColor',2)}</button></div>
  <div class="bub g ${line.text.length>105?'s4':line.text.length>80?'s3':line.text.length>55?'s2':''}" role="status">${esc(line.text)}</div>`;
}
function dockHTML(){
  if(U.view!=='list'&&U.view!=='road')return extDock();
  const u=unplaced().length;
  return `<div class="dock"><div class="pill" role="tablist" aria-label="View"><button type="button" role="tab" aria-selected="${U.view==='list'}" class="${U.view==='list'?'on':''}" data-act="view" data-v="list">${ico('list',20,'currentColor',1.8)}List</button><button type="button" role="tab" aria-selected="${U.view==='road'}" class="${U.view==='road'?'on':''}" data-act="view" data-v="road">${ico('road',20,'currentColor',1.7)}Road</button></div>
  ${U.view==='road'?`<button type="button" class="tray" data-act="tray" aria-label="Unplaced tasks, ${u}">${ico('basket',24,'currentColor',1.6)}${u?`<b>${u}</b>`:''}</button>`:''}</div>
  <button type="button" class="fab" data-act="add" aria-label="Add a task">${ico('plus',28,'currentColor',2.4)}</button>`;
}
function menuHTML(){
  const row=(icon,t,sub,act,extra,dis,v)=>`<button type="button" class="mrow" ${dis?'disabled':''} ${act?`data-act="${act}"`:''} ${v?`data-v="${v}"`:''}><span class="tl">${ico(icon,20,'var(--brass-l)',1.6)}</span><span class="tx"><b>${t}</b><i>${sub}</i></span>${extra||ico('chevr',18,'var(--dim)',1.8)}</button>`;
  const bn=(n,col,ic)=>`<div class="ban g" style="background-color:${col};border-radius:3px 3px 0 0">${ico(ic,22,'var(--brass-l)',1.6)}<b>${n}</b></div>`;
  return `<div class="full g" role="dialog" aria-label="Menu"><div style="display:flex;align-items:center;height:64px;padding-top:16px;margin-bottom:12px"><h1 class="fell" style="margin:0;flex:1;font:400 34px var(--fell)">The Realm</h1><button type="button" class="ib quiet" data-act="closeMenu" aria-label="Close menu">${ico('x',20,'currentColor',2)}</button></div>
${bn('Quests','#4A4128','flag')}
  ${row('list','Today','the list and the road','goto','',false,'list')}
  ${row('week','Calendar','the week, day by day','goto','',false,'cal')}
  ${row('flame','The Dragons','day and week','goto','',false,'dragons')}
  ${row('flag','Campaigns','projects, boards and goals','goto','',false,'main')}
  ${row('path','Side Quests','ideas, in halls','goto','',false,'side')}
  <div style="height:12px"></div>${bn('The Council','#2B4542','crown')}
  ${row('sun','The Day','plan today, now','councilK','', false,'day')}
  ${row('week','The Week','look ahead','councilK','',false,'week')}
  <div style="height:12px"></div><button type="button" class="ban g sbtn" data-act="setToggle" style="background-color:#3D2E3F;border-radius:3px 3px 0 0;width:100%;border:0;text-align:left" aria-expanded="${!!U.setOpen}">${ico('gear',22,'var(--brass-l)',1.6)}<b>Settings</b><span style="margin-left:auto">${ico('chev',18,'var(--brass-l)',2)}</span></button>
  ${U.setOpen?`  ${row('sun','Theme',{dark:'dark',light:'light',system:'follows your phone'}[S.settings.theme||'dark'],null,'<span></span>')}
  <div class="themes">${['dark','light','system'].map(v=>`<button type="button" class="chip ${(S.settings.theme||'dark')===v?'on':''}" data-act="theme" data-v="${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div>
  ${row('eye','Sir Reg speaks',S.settings.mute?'muted':'on, dry as ever','mute',`<span class="tag ${S.settings.mute?'dim':''}" style="margin:0">${S.settings.mute?'OFF':'ON'}</span>`)}
  ${row('tech','Sync across devices',(window.realmSync?realmSync.status():(DB?'on, through this link':'off')),'sync',window.realmSync&&realmSync.user()?'<span class="tag" style="margin:0">ON</span>':'')}
  ${row('admin','Copy data as JSON','your backup, as text','export')}
  ${row('tech','Reset to sample tasks',U.confirm==='reset'?'tap again to confirm':'start over with the examples','reset')}
  ${row('rest','Clear everything',U.confirm==='clear'?'tap again to confirm':'delete all tasks','clear')}`:''}
    <p class="note" style="text-align:center;font:500 11px var(--mono);letter-spacing:.12em;border:0;background:none">THE REALM \u00b7 VERSION 1.0</p>
    <p class="note">${memOnly?'Storage is blocked here, so changes last only until you close this page.':'Data is kept on this device, and synced when sync is on. Task titles are also logged so Sir Reg can learn your habits.'}</p></div>`;
}
const MOODS=[['steady','Steady','Calm and consistent.','steady'],['focus','Focused','One task at a time.','focus'],['bolt','Relentless','No mercy today.','bolt'],['easy','Easy going','We do what we can.','easy'],['eye','Wary','Trust nothing, tick everything.','eye'],['flame','Bold','Do the scary thing first.','flame']];
const newDragonHTML=()=>`<div class="arow" style="margin-top:10px"><input id="dragonNew" class="inp" type="text" placeholder="Or name a new dragon" autocomplete="off" aria-label="New dragon"><button type="button" class="go" data-act="dragonNew" aria-label="Add as dragon">${ico('plus',22,'currentColor',2.6)}</button></div>`;
function councilHTML(){
  if(U.council.kind&&U.council.kind!=='day')return extCouncilHTML();
  const C=U.council,c=context();
  const sh=(ic,col,t,sub)=>`<div class="sh"><span class="tl">${ico(ic,20,col,1.7)}</span><div><b>${t}</b><i>${sub}</i></div></div>`;
  let left='';
  if(c.over.length){left=sh('rest','var(--brass-l)','Yesterday’s leftovers','Decide each one')+c.over.map(t=>`<div class="left"><span>${esc(t.title)}</span><button class="mini" data-act="lf" data-id="${t.id}" data-v="today">Today</button><button class="mini" data-act="lf" data-id="${t.id}" data-v="tomorrow">Later</button><button class="mini" data-act="lf" data-id="${t.id}" data-v="drop">Drop</button></div>`).join('');}
  const dt=S.tasks.find(t=>t.id===C.dragonId);
  const cands=c.open.concat(c.over.filter(t=>false));
  const sug=cands.slice().sort((a,b)=>b.moves-a.moves)[0];
  let dr;
  if(dt)dr=`<div class="dcard"><div style="flex:1;line-height:1.2"><div style="font-size:16.5px;font-weight:600">${esc(dt.title)}</div><div class="mono" style="font-size:12px;color:var(--dim)">${esc(cat(dt.cat).name)}${dt.time?' · '+dt.time:''}${dt.moves?' · moved '+dt.moves+' times':''}</div></div><button type="button" class="ib quiet" style="border:0;background:none" data-act="dragonClear" aria-label="Clear the dragon">${ico('x',20,'currentColor',2)}</button></div>
    <div class="rg"><img src="${kn(8)}" alt="Sir Reg, scheming"><span>${esc(C.line||'A brave choice. I would have picked the easier dread.')}</span></div>`;
  else dr=`<button type="button" class="dcard" style="border-style:dashed;color:var(--dim);font:italic 18px var(--fell)" data-act="dragonOpen">${cands.length?'Pick the task you dread most':'No open tasks yet'}</button>${sug&&sug.moves>0?`<p class="note" style="margin-top:8px">Sir Reg suggests ${esc(sug.title)}. It has been moved ${sug.moves} times.</p>`:''}`;
  const picker=C.pickOpen?`<div class="pick">${cands.map(t=>`<button type="button" data-act="dragonPick" data-id="${t.id}">${ico(iconOf(cat(t.cat)),18,'var(--brass-l)',1.6)}${esc(t.title)}${t.moves?`<small>moved ${t.moves}x</small>`:''}</button>`).join('')}</div>`:'';
  const moods=MOODS.map(([k,n,s,i])=>`<button type="button" class="mood g ${C.mood===k?'on':''}" data-act="mood" data-v="${k}" role="radio" aria-checked="${C.mood===k}">${ico(i,38,C.mood===k?'var(--glow)':'var(--brass-l)',1.5)}<b>${n}</b><span>${s}</span></button>`).join('');
  return `<div class="full g" role="dialog" aria-label="The Council"><div style="display:flex;align-items:center;height:64px;padding-top:16px"><button type="button" class="ib quiet" data-act="closeCouncil" aria-label="Close the Council">${ico('x',22,'currentColor',2)}</button><span class="mono" style="margin-left:auto;font:500 12.5px var(--mono);letter-spacing:.1em;color:var(--dim)">${fmtHead(c.td).toUpperCase()}</span></div>
  <h1 class="fell" style="margin:6px 0 0;text-align:center;font:400 40px/1 var(--fell)">The Council</h1><p class="fell" style="margin:6px 0 0;text-align:center;font:italic 17px var(--fell);color:var(--dim)">Plan your day with intention, my lord.</p>
  ${left}
  ${sh('flag','var(--brass-l)','Focus of the day','What is today for?')}<textarea id="focusTxt" class="tb" rows="2" placeholder="One sentence, for yourself" aria-label="Focus of the day">${esc(C.focus||'')}</textarea>
  ${sh('flame','var(--glow)','Slay the Dragon','The one you dread most today')}${dr}${picker}${dt?'':newDragonHTML()}
  ${sh('compass','var(--brass-l)','Mood and mindset','How shall we approach today?')}<div class="moods" role="radiogroup" aria-label="Mood">${moods}</div>
  <div class="btns" style="margin-top:22px"><button type="button" class="btn" data-act="saveCouncil">Save Plan</button></div></div>`;
}
function trayHTML(){
  const u=unplaced();
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Unplaced tasks"><h2>Not on the road yet</h2>${u.length?`<div class="pick">${u.map(t=>`<button type="button" data-act="place" data-id="${t.id}">${ico(iconOf(cat(t.cat)),18,'var(--brass-l)',1.6)}${esc(t.title)}<small>tap to place</small></button>`).join('')}</div>`:'<p class="note" style="margin:0">Everything for today has a time. Impressive.</p>'}<div class="btns"><button type="button" class="btn ghost" data-act="closeSheet">Close</button></div></div>`;
}

/* ---------- render ---------- */
let _hh='';function renderHead(){const h=headHTML();if(h===_hh)return;_hh=h;$('#head').innerHTML=h;}
let _mh='';function renderMain(){
  const m=$('#main');const keep=m.scrollTop;
  const mh=U.view==='list'?listHTML():U.view==='road'?roadHTML():extMainHTML();
  if(mh===_mh&&!U.scrollRoad)return;_mh=mh;
  m.innerHTML=mh;
  if(U.view==='road'&&U.scrollRoad){const d=new Date();m.scrollTop=Math.max(0,((d.getHours()-HS-1.5)*PH));U.scrollRoad=false;}else m.scrollTop=keep;
}
let _dh='';function renderDock(){const h=dockHTML();if(h===_dh)return;_dh=h;$('#dockhost').innerHTML=h;}
function renderOverlay(){
  let h='';
  if(U.menu)h+=menuHTML();
  if(U.council)h+=councilHTML();
  if(U.camp)h+=campHTML();
  h+=extSheets();
  if(U.sheet==='add')h+=addSheetHTML();
  if(U.sheet==='newcat')h+=newCatHTML();
  if(U.sheet==='tray')h+=trayHTML();
  const host=$('#overlay');const keepB=host.querySelector('.kboard');const kbs=keepB?keepB.scrollLeft:0;const kcs={};host.querySelectorAll('.kcol').forEach(k=>{kcs[k.dataset.col]=k.querySelector('.kcards').scrollTop;});const keepF=host.querySelector('.full');const ks=keepF?keepF.scrollTop:0;
  const sig=el=>el.className+'|'+(el.getAttribute('aria-label')||'');
  const prev=new Set([...host.children].map(sig));
  host.innerHTML=h;
  [...host.children].forEach(el=>{if(prev.has(sig(el)))el.style.animation='none';});
  const f=host.querySelector('.full');if(f)f.scrollTop=ks;
  const nb=host.querySelector('.kboard');if(nb)nb.scrollLeft=kbs;host.querySelectorAll('.kcol').forEach(k=>{if(kcs[k.dataset.col])k.querySelector('.kcards').scrollTop=kcs[k.dataset.col];});
  if(typeof navSync==='function')navSync();
}
function renderToast(){
  const t=U.toast,host=$('#toast');
  if(!t){host.innerHTML='';return;}
  const top=U.sheet==='add'||U.council||U.menu;
  host.innerHTML=`<div class="toast g" role="status" style="${top?'bottom:auto;top:16px':''}"><img src="${kn(t.face)}" alt=""><span>${esc(t.text)}</span>${t.undo?'<button type="button" data-act="undo">UNDO</button>':''}</div>`;
}
function render(keepOverlay){renderHead();renderMain();renderDock();if(!keepOverlay)renderOverlay();else if(typeof navSync==='function')navSync();renderToast();}

/* ---------- events ---------- */
let suppress=0;
document.addEventListener('click',e=>{
  if(Date.now()<suppress)return;
  if(e.target.closest('a.lk'))return;
  const el=e.target.closest('[data-act]');if(!el)return;
  const act=el.dataset.act,v=el.dataset.v,id=el.dataset.id;
  switch(act){
    case 'noteEdit':U.add.noteEdit=true;{const m=$('#addNote');if(m){m.innerHTML=noteHTML();const x=$('#addNoteTx');x&&x.focus();}}break;
    case 'stTick':stepTick(+el.dataset.i);break;
    case 'stDel':{const t=curTask();if(t&&t.steps){t.steps.splice(+el.dataset.i,1);if(!t.steps.length)delete t.steps;save();refreshSteps();}}break;
    case 'tick':tick(id);break;
    case 'edit':openAdd(id);break;
    case 'add':U.placing=null;openAdd(null);break;
    case 'addIn':U.placing=null;openAdd(null);U.add.cat=v;U.add.over.cat=true;refreshMeta();break;
    case 'shut':S.shut[v]=!S.shut[v];save();renderMain();break;
    case 'view':U.view=v;U.placing=null;U.scrollRoad=v==='road';render();break;
    case 'closeSheet':U.sheet=null;U.placing=U.placing;renderOverlay();renderToast();renderMain();renderDock();break;
    case 'pick':U.add.open=U.add.open===v?null:v;refreshMeta();break;
    case 'setDate':U.add.date=v;U.add.over.date=true;U.add.open=null;refreshMeta();break;
    case 'clearTime':U.add.time='';U.add.over.time=true;U.add.open=null;refreshMeta();break;
    case 'setCat':U.add.cat=v;U.add.over.cat=true;U.add.open=null;refreshMeta();break;
    case 'setDur':U.add.dur=+v;U.add.over.dur=true;U.add.open=null;refreshMeta();break;
    case 'submit':submitAdd();break;
    case 'delTask':if(U.add.confirmDel){const i=U.add.id;U.sheet=null;removeTask(i);render();}else{U.add.confirmDel=true;renderOverlay();}break;
    case 'newCat':{const i=$('#addInput');if(i)U.add.text=i.value;U.nc={name:'',icon:'garden',pal:S.cats.length%PAL.length};U.sheet='newcat';renderOverlay();setTimeout(()=>{const x=$('#ncName');x&&x.focus();},60);break;}
    case 'ncIcon':{const x=$('#ncName');if(x)U.nc.name=x.value;U.nc.icon=v;renderOverlay();break;}
    case 'ncPal':{const x=$('#ncName');if(x)U.nc.name=x.value;U.nc.pal=+v;renderOverlay();break;}
    case 'ncBack':U.sheet='add';renderOverlay();break;
    case 'ncSave':{const name=($('#ncName').value||'').trim();if(!name)break;const c={id:'c'+uid(),name,icon:U.nc.icon,pal:U.nc.pal};S.cats.push(c);save();U.add.cat=c.id;U.add.over.cat=true;U.sheet='add';renderOverlay();break;}
    case 'undo':{const u=U.toast&&U.toast.undo;U.toast=null;if(u)u();renderToast();break;}
    case 'menu':U.toast=null;renderToast();U.menu=true;U.confirm=null;renderOverlay();break;
    case 'closeMenu':U.menu=false;renderOverlay();break;
    case 'theme':S.settings.theme=v;save();applyTheme();renderOverlay();renderHead();renderToast();break;
    case 'mute':S.settings.mute=!S.settings.mute;save();LC.key='';renderOverlay();renderHead();break;
    case 'export':{const j=JSON.stringify(S,null,1);let ok=false;try{navigator.clipboard.writeText(j).then(()=>toast({face:5,text:'Copied. Paste it somewhere safe.'}),()=>toast({face:5,text:'Copy was refused here.'}));ok=true;}catch(err){}if(!ok)toast({face:5,text:'Copy was refused here.'});break;}
    case 'reset':if(U.confirm==='reset'){{const q=S.logq;S=seed();S.logq=q;}save();U.confirm=null;U.menu=false;LC.key='';render();}else{U.confirm='reset';renderOverlay();}break;
    case 'clear':if(U.confirm==='clear'){S.tasks=[];S.plans={};S.quests=[];S.ideas=[];S.cplans={};S.sample=false;save();U.confirm=null;U.menu=false;LC.key='';render();}else{U.confirm='clear';renderOverlay();}break;
    case 'setToggle':U.setOpen=!U.setOpen;renderOverlay();break;
    case 'council':{U.toast=null;renderToast();const p=plan();U.menu=false;U.council={focus:p.focus||'',dragonId:p.dragonId||null,mood:p.mood||'steady',pickOpen:false,line:''};renderOverlay();break;}
    case 'closeCouncil':U.council=null;renderOverlay();renderToast();break;
    case 'dragonOpen':U.council.focus=($('#focusTxt')||{}).value||'';U.council.pickOpen=!U.council.pickOpen;renderOverlay();break;
    case 'dragonPick':U.council.focus=($('#focusTxt')||{}).value||'';U.council.dragonId=id;U.council.pickOpen=false;U.council.line=pickLine('dragonPicked').text;renderOverlay();break;
    case 'dragonClear':U.council.focus=($('#focusTxt')||{}).value||'';U.council.dragonId=null;renderOverlay();break;
    case 'mood':U.council.focus=($('#focusTxt')||{}).value||'';U.council.mood=v;renderOverlay();break;
    case 'lf':{U.council.focus=($('#focusTxt')||{}).value||'';const t=S.tasks.find(x=>x.id===id);if(!t)break;if(v==='today'){t.date=today();}else if(v==='tomorrow'){t.date=addDays(today(),1);t.moves=(t.moves||0)+1;}else{S.tasks=S.tasks.filter(x=>x.id!==id);}save();renderOverlay();renderMain();renderHead();break;}
    case 'saveCouncil':{const C=U.council;C.focus=($('#focusTxt')||{}).value||'';S.plans[today()]={focus:C.focus,dragonId:C.dragonId,mood:C.mood};save();U.council=null;LC.key='';render();const line=say('saved');renderHead();toast(line);break;}
    case 'tray':U.sheet='tray';renderOverlay();break;
    case 'place':U.placing=id;U.sheet=null;U.view='road';render();break;
    case 'cancelPlace':U.placing=null;renderMain();break;
    case 'setRep':U.add.rep=v;U.add.over.rep=true;U.add.open=null;refreshMeta();break;
    case 'setCol':U.add.col=v;U.add.open=null;refreshMeta();break;
    case 'setQuest':U.add.col='';U.add.q=v;U.add.open=null;refreshMeta();break;
    default:extAct(act,v,id,el);
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='addInput')onAddInput(t.value);
  else if(t.id==='addNoteTx'){const k=curTask();if(k){k.note=t.value;save();}}
  else if(t.classList&&t.classList.contains('stin')&&t.id!=='stNew'){const k=curTask();if(k&&k.steps&&k.steps[+t.dataset.i]){k.steps[+t.dataset.i].t=t.value;save();}}
  else if(t.id==='addDate'){U.add.date=t.value;U.add.over.date=true;}
  else if(t.id==='addTime'){U.add.time=t.value;U.add.over.time=true;}
  else if(t.id==='focusTxt'&&U.council)U.council.focus=t.value;
  else if(t.id==='ncName'&&U.nc)U.nc.name=t.value;
  else extInput(t);
});
document.addEventListener('change',e=>{if(e.target.id==='addDate'||e.target.id==='addTime')refreshMetaKeep();});
function refreshMetaKeep(){refreshMeta();return;const m=$('#addMeta');if(!m)return;/* chips depend on date only */const chips=m.querySelectorAll('[data-act=setDate]');chips.forEach(c=>c.classList.toggle('on',c.dataset.v===U.add.date));}
document.addEventListener('focusout',e=>{if(e.target.id==='addNoteTx'&&U.add){const k=curTask();if(k){k.note=(k.note||'').trim();if(!k.note)delete k.note;save();}U.add.noteEdit=false;setTimeout(()=>{const m=$('#addNote');if(m&&U.sheet==='add')m.innerHTML=noteHTML();},0);}});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='stNew'){e.preventDefault();stepAdd(e.target.value);}
  else if(e.key==='Enter'&&e.target.classList.contains('stin')){e.preventDefault();e.target.blur();}
  else if(e.key==='Enter'&&e.target.id==='addInput'){e.preventDefault();submitAdd();}
  else if(e.key==='Enter'&&e.target.id==='ncName'){e.preventDefault();const b=document.querySelector('[data-act=ncSave]');b&&b.click();}
  else if(e.key==='Escape'){if(U.sheet==='newcat'){U.sheet='add';renderOverlay();}else if(U.sheet){U.sheet=null;renderOverlay();}else if(U.camp){U.camp=null;renderOverlay();renderMain();}else if(U.council){U.council=null;renderOverlay();}else if(U.menu){U.menu=false;renderOverlay();}}
  else if(extKey(e)){e.preventDefault();}
});

/* swipe left to postpone (list) */
let sw=null;
document.addEventListener('pointerdown',e=>{
  const row=e.target.closest('.row');if(!row||e.target.closest('.cb')||U.view!=='list')return;
  sw={row,id:row.dataset.id,x:e.clientX,y:e.clientY,dx:0,on:false,pid:e.pointerId};
});
document.addEventListener('pointermove',e=>{
  if(!sw||e.pointerId!==sw.pid)return;
  const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
  if(!sw.on){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.6){sw.on=true;try{sw.row.setPointerCapture(e.pointerId);}catch(x){}}else if(Math.abs(dy)>12){sw=null;return;}}
  if(sw.on){sw.dx=dx;sw.row.style.transform='translateX('+sw.dx+'px)';}
});
function endSwipe(e){
  if(!sw)return;const s=sw;sw=null;
  if(!s.on)return;suppress=Date.now()+350;
  if(s.dx<-90){s.row.style.transition='transform .15s';s.row.style.transform='translateX(-110%)';setTimeout(()=>{removeTask(s.id);render();},120);}
  else if(s.dx>90){s.row.style.transition='transform .15s';s.row.style.transform='translateX(110%)';setTimeout(()=>postpone(s.id),120);}
  else{s.row.style.transition='transform .15s';s.row.style.transform='';}
}
document.addEventListener('pointerup',endSwipe);document.addEventListener('pointercancel',endSwipe);

/* road: tap to place, long-press to lift and move */
let dr=null;
function snap15(m){return Math.round(m/15)*15;}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.blk');if(!b||e.target.closest('.cb'))return;
  dr={el:b,id:b.dataset.id,x:e.clientX,y:e.clientY,lifted:false,moved:false,pid:e.pointerId,dm:0};
  dr.t=setTimeout(()=>{if(dr){dr.lifted=true;b.classList.add('lift');if(navigator.vibrate)try{navigator.vibrate(12);}catch(x){}}},260);
});
document.addEventListener('pointermove',e=>{
  if(!dr||e.pointerId!==dr.pid)return;
  const dy=e.clientY-dr.y,dx=e.clientX-dr.x;
  if(!dr.lifted){if(Math.abs(dy)>8||Math.abs(dx)>8){clearTimeout(dr.t);dr=null;}return;}
  dr.moved=true;dr.dm=snap15(dy/PH*60);
  dr.el.style.transform='translateY('+(dr.dm/60*PH)+'px) rotate(-1deg)';
  const t=S.tasks.find(x=>x.id===dr.id);const nm=Math.max(HS*60,Math.min(HE*60-15,mins(t.time)+dr.dm));
  const sp=dr.el.querySelector('.t2');if(sp)sp.textContent=hhmm(nm)+' to '+hhmm(nm+(t.dur||30));
});
document.addEventListener('touchmove',e=>{if(dr&&dr.lifted)e.preventDefault();},{passive:false});
function endDrag(){
  if(!dr)return;const d=dr;dr=null;clearTimeout(d.t);
  if(d.lifted){
    suppress=Date.now()+350;
    const t=S.tasks.find(x=>x.id===d.id);
    if(t&&d.dm){t.time=hhmm(Math.max(HS*60,Math.min(HE*60-15,mins(t.time)+d.dm)));save();say('placed');}
    renderMain();renderHead();
  }else{ if(Date.now()>suppress)openAdd(d.id); }
}
document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',()=>{if(dr){clearTimeout(dr.t);dr=null;renderMain();}});
document.addEventListener('click',e=>{
  if(U.view!=='road'||!U.placing)return;
  const lane=e.target.closest('#lane');if(!lane||e.target.closest('.blk'))return;
  const r=lane.getBoundingClientRect();const m=snap15(((e.clientY-r.top)/PH)*60+HS*60);
  const t=S.tasks.find(x=>x.id===U.placing);if(!t)return;
  t.time=hhmm(Math.max(HS*60,Math.min(HE*60-15,m)));t.date=today();if(!t.dur)t.dur=30;save();U.placing=null;
  const line=say('placed');toast(line);render();
},true);

/* clock */
setInterval(()=>{if(dr&&dr.lifted)return;const n=$('#nowl');if(n){const d=new Date(),m=d.getHours()*60+d.getMinutes()-HS*60;n.style.top=(m/60*PH)+'px';}if(!U.sheet&&!U.council&&!U.menu){renderHead();}},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){LC.key='';render();}});

