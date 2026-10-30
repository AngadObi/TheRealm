/* ---------- the guided Council ritual (Day and Week) ---------- */
const RIT_STEPS={emergency:['welcome','chamber','triage','dragon','exit'],day:['welcome','focus','goals','left','dragon','mood','seal'],week:['welcome','focus','goals','week','left','dragon','seal']};
const RIT_FACE={welcome:1,focus:1,goals:5,week:4,left:2,dragon:8,mood:3,seal:6};
function ritStore(kind){return (kind==='day'||kind==='emergency')?(S.plans[today()]||{}):(S.cplans[wkKey()]||{});}
function ritWanted(kind){
  const p=ritStore(kind);
  if(p.saved)return false;
  if(p.step===undefined&&(p.focus||p.dragonId||p.mood))return false; /* plans from before the ritual */
  if(kind==='day'&&new Date().getHours()>=18)return false;
  return true;
}
function ritWelcome(kind,c){
  const d=new Date(),h=d.getHours(),dow=d.getDay();
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  if(kind==='emergency'){
    if(h>=21||h<5)return 'It is late and everything looks bigger at night. Write it down and we shall shrink it.';
    return pick(['Breathe, my lord. The realm will wait. I have told it to.','Emergency council. Sit. Nothing here is on fire that cannot be put in a list.','Whatever it is, we will make it smaller. Sit down.','The doors are closed and the candles are lit. Nobody is coming in until you are ready.']);
  }
  if(kind==='week'){
    if(dow===1)return pick(['A new week, my lord. It has not done anything wrong yet.','Monday. The week is blank and full of promise. Mostly blank.']);
    if(dow===0)return pick(['Sunday planning. The wise, or the anxious. Possibly both.','Planning on a Sunday. The realm salutes you and worries slightly.']);
    return pick(['The weekly council. We look ahead and I pretend not to be nervous.','A week is seven days and one of them is always a problem. Let us find it.']);
  }
  if(c.over.length>=4)return 'The overdue pile has grown a council of its own. We shall deal with it, in order.';
  if(h<8)return 'Up before the roosters. Suspicious, but welcome. Let us decide what today is for.';
  if(dow===1)return pick(['Monday. The realm is in no hurry, but I am.','A Monday council. Brave. Sit, the candles are lit.']);
  if(dow===5)return pick(['Friday. The finish line is visible. Do not trip on it.','Friday council. Let us leave the week in good order, or at least in order.']);
  if(dow===0||dow===6)return pick(['A weekend council. The realm admires your commitment and questions your priorities.','Weekend duties. Noble, and slightly alarming.']);
  return pick(['The council is in session. Sit. The candles are lit and the day is mostly unspent.','Welcome, my lord. Let us spend today on purpose, for once.','The hall is warm and the quills are sharp. Shall we begin?']);
}
const RIT_LINES={
  focus:{day:['One sentence. Make it a good one. The scribes are listening.'],week:['One sentence for the whole week. No pressure. Some pressure.']},
  goals:{day:['Name your deeds. Commas between them, and each becomes a task.'],week:['Name the deeds of the week. Add a day like “fri” to place one, or it lands on today.']},
  left:{day:['Old business. Each one gets a verdict.'],week:['Old business first. A clean slate needs a broom.']},
  mood:{day:['And lastly, how shall we ride today?']}
};
function ritStart(kind,resume){
  const c=context(),p=ritStore(kind),steps=RIT_STEPS[kind].filter(s=>s!=='left'||c.over.length>0);
  let i=resume&&p.step>0?Math.min(p.step,steps.length-2):0;
  U.council.rit={kind,steps,i,fresh:true,goals:[],wline:ritWelcome(kind,c),dline:'',seal:null,text:'',made:{},noteAt:0,moved:0};
  const R=U.council.rit;if(kind==='day'){U.council.mood=U.council.mood||'steady';}
  return R;
}
function ritStep(){const R=U.council.rit;return R.steps[R.i];}
function ritGo(i){
  const R=U.council.rit;ritRead();const dir=i>=R.i?1:-1;
  R.i=Math.max(0,Math.min(R.steps.length-1,i));R.fresh=true;
  if(ritStep()==='left'&&!context().over.length){R.i+=dir;}
  if(ritStep()==='seal')ritSeal();
  if(ritStep()==='exit')ritEmSave();
  renderOverlay();R.fresh=false;
  setTimeout(()=>{const x=$('#goalIn')||$('#focusTxt');if(x&&ritStep()!=='seal'&&ritStep()!=='welcome')x.focus();},320);
}
function ritNext(){ritGo(U.council.rit.i+1);}
function ritBack(){const R=U.council.rit;if(R.i>0)ritGo(R.i-1);}
function ritCanBack(){const R=U.council&&U.council.rit;return !!R&&R.i>0&&ritStep()!=='seal';}
function ritRead(){
  const C=U.council,f=$('#focusTxt');if(f)C.focus=f.value;
  if(C.rit.kind==='emergency'&&ritStep()==='chamber')ritChamber();
  const g=$('#goalIn');if(g&&g.value.trim())ritCommit(g.value);
}
function ritTask(raw){
  const p=parseQuick(raw,pctx());const title=(p.title||raw).trim();if(!title)return null;
  const t={id:uid(),title:title[0].toUpperCase()+title.slice(1),cat:p.cat||S.last||S.cats[0].id,date:p.date||today(),time:p.time||'',dur:p.dur||p.guess||60,done:false,moves:0,createdAt:Date.now(),rep:'',q:''};
  S.tasks.push(t);learn(t.title,t.cat);logEv('added',t,{raw,catManual:false,suggested:p.cat?cat(p.cat).name:'',batch:false,viaCouncil:true});
  return t;
}
function ritCommit(raw){
  const R=U.council.rit;let n=0;
  String(raw).split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>{const t=ritTask(x);if(t){R.goals.push(t.id);n++;}});
  if(n){save();render(true);}
  const g=$('#goalIn');if(g)g.value='';
  return n;
}
function ritSave(done){
  const C=U.council,R=C.rit,p=ritStore(R.kind);
  if(R.kind==='emergency'){ritEmSave();return;}
  const next=Object.assign({},p,{focus:C.focus||'',dragonId:C.dragonId||null});
  if(R.kind==='day')next.mood=C.mood||'steady';else next.quests=C.quests||p.quests||[];
  if(done){next.saved=Date.now();delete next.step;}else{next.step=R.i;}
  if(R.kind==='day')S.plans[today()]=next;else S.cplans[wkKey()]=next;
  save();
}
function ritSeal(){
  const C=U.council,R=C.rit;ritSave(true);
  R.seal=say('saved');LC.key='';
}
function ritPersist(){
  const C=U.council;if(!C||!C.rit)return;
  const R=C.rit;if(ritStep()==='seal'||ritStep()==='exit')return;
  if(R.kind==='emergency'){if(ritStep()==='chamber')ritChamber();ritEmSave();return;}
  const f=$('#focusTxt');if(f)C.focus=f.value;
  if(R.i>0||C.focus)ritSave(false);
}
function ritFinish(){U.council=null;LC.key='';render();renderHead();}
function ritDots(){const R=U.council.rit;return R.steps.map((s,i)=>`<i class="${i===R.i?'on':i<R.i?'dn':''}"></i>`).join('');}
function ritAgainBtn(kind){return (kind==='day'||kind==='week')?`<button type="button" class="rskip" data-act="ritAgain" data-v="${kind}">Hold the ceremony again</button>`:'';}
function ritHero(face,cls){return `<div class="rk ${cls||''}"><img src="${kn(face)}" alt="Sir Reg"></div>`;}
function ritSky(){let h='';for(let i=0;i<16;i++){const x=(i*37+11)%100,y=(i*53+7)%62,d=(i*0.6)%5;h+=`<i class="st" style="left:${x}%;top:${y}%;animation-delay:-${d}s"></i>`;}
  for(let i=0;i<9;i++){const x=(i*29+8)%100,d=(i*1.7)%9;h+=`<i class="em" style="left:${x}%;animation-delay:-${d}s;animation-duration:${8+(i%4)*2}s"></i>`;}return h;}
function ritStepHTML(){
  const C=U.council,R=C.rit,s=ritStep(),c=context(),wk=R.kind==='week';
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  const line=(RIT_LINES[s]||{})[R.kind];const say1=line?`<p class="rsay">${esc(line[0])}</p>`:'';
  if(s==='welcome'){
    const em=R.kind==='emergency',head=wk?`WEEK ${isoWeek(today()).w}`:fmtHead(today()).toUpperCase();
    return ritHero(em?3:c.over.length>=4&&!wk?2:1)+`<p class="rcap">THE ${em?'EMERGENCY':wk?'WEEKLY':'DAILY'} COUNCIL · ${head}</p><h1>${em?'Sit down, my lord.':'Welcome, my lord.'}</h1><p class="rsay big">${esc(R.wline)}</p>`;
  }
  if(s==='focus'){
    return ritHero(RIT_FACE.focus,'s')+sh('flag','var(--brass-l)',wk?'Focus of the week':'Focus of the day',wk?'What is this week for?':'What is today for?')+say1+`<textarea id="focusTxt" class="tb big" rows="3" placeholder="One sentence, for yourself" aria-label="Focus">${esc(C.focus||'')}</textarea>`;
  }
  if(s==='goals'){
    const ts=R.goals.map(id=>S.tasks.find(t=>t.id===id)).filter(Boolean);
    const chips=ts.map(t=>`<div class="rchip"><span class="tl2">${ico(iconOf(cat(t.cat)),18,'var(--brass-l)',1.6)}</span><span class="rt">${esc(t.title)}</span><small>${t.date===today()?'TODAY':shortDue(t.date)}</small><button type="button" class="ib quiet" style="width:34px;height:34px;border:0;background:none" data-act="rGoalDel" data-id="${t.id}" aria-label="Remove">${ico('x',16,'currentColor',2)}</button></div>`).join('');
    return ritHero(RIT_FACE.goals,'s')+sh('sun','var(--brass-l)','What shall we achieve?',wk?'The deeds of the week':'The deeds of the day')+say1+
      `<div class="arow" style="margin-top:12px"><input id="goalIn" class="inp" type="text" placeholder="Pay rent, call mum, gym" autocomplete="off" enterkeyhint="done" aria-label="Goals, separated by commas"><button type="button" class="go" data-act="rGoalAdd" aria-label="Add">${ico('plus',22,'currentColor',2.6)}</button></div><div class="rchips">${chips}</div>${ts.length?`<p class="rnote">${ts.length} ${ts.length===1?'task':'tasks'} added to the realm.</p>`:''}`;
  }
  if(s==='week'){
    const dn=new Date().getDay()||7,mon=addDays(today(),1-dn),counts=[];
    for(let i=0;i<7;i++){const d=addDays(mon,i);counts.push(S.tasks.filter(t=>t.date===d&&!t.done).length);}
    const mx=Math.max(1,...counts),busy=counts.indexOf(Math.max(...counts)),labs=['MON','TUE','WED','THU','FRI','SAT','SUN'];
    const note=Math.max(...counts)===0?'An empty week. I am suspicious, and a little proud.':`${DAYS[(busy+1)%7]} is the heavy one, ${counts[busy]} tasks. Plan around it.`;
    return ritHero(RIT_FACE.week,'s')+sh('week','var(--brass-l)','The week ahead','Open tasks per day')+`<div class="bars">${counts.map((n,i)=>`<div><span class="bn">${n}</span><span class="b" style="height:${Math.max(4,n/mx*90)}px;${i===busy&&n>0?'background:var(--ember)':''}"></span><span class="bl">${labs[i]}</span></div>`).join('')}</div><p class="rsay">${esc(note)}</p>`;
  }
  if(s==='left'){
    const t=c.over[0],n=c.over.length;
    if(!t)return '';
    const days=diffDays(c.td,t.date);
    return ritHero(RIT_FACE.left,'s')+sh('rest','var(--brass-l)','Yesterday’s leftovers',n+(n===1?' task awaits':' tasks await')+' a verdict')+say1+
      `<div class="rcard"><b>${esc(t.title)}</b><span class="mono">${esc(cat(t.cat).name)} · due ${days===1?'yesterday':days+' days ago'}${t.moves?' · moved '+t.moves+'x':''}</span></div>
      <div class="rverd"><button type="button" class="btn" data-act="rLf" data-id="${t.id}" data-v="today">Today</button><button type="button" class="btn ghost" data-act="rLf" data-id="${t.id}" data-v="tomorrow">Tomorrow</button><button type="button" class="btn danger" data-act="rLf" data-id="${t.id}" data-v="drop">Drop</button></div>
      ${n>1?`<div class="rall"><button type="button" class="rskip" data-act="rLfAll" data-v="today">All ${n} to today</button><button type="button" class="rskip" data-act="rLfAll" data-v="tomorrow">All ${n} to tomorrow</button></div>`:''}`;
  }
  if(s==='dragon'){
    const dt=S.tasks.find(t=>t.id===C.dragonId&&!t.done);
    const pool=(wk?candidates():c.open.slice().sort((a,b)=>(b.moves||0)-(a.moves||0)));
    const em=R.kind==='emergency',name=em?'Your dragon':wk?'Slay the Elder Dragon':'Slay the Dragon';
    let body;
    if(dt)body=`<div class="dcard"><div style="flex:1;line-height:1.2"><div style="font-size:17px;font-weight:600">${esc(dt.title)}</div><div class="mono" style="font-size:12px;color:var(--dim)">${esc(cat(dt.cat).name)}${dt.moves?' · moved '+dt.moves+' times':''}</div></div><button type="button" class="ib quiet" style="border:0;background:none" data-act="dragonClear" aria-label="Clear the dragon">${ico('x',20,'currentColor',2)}</button></div><div class="rg"><img src="${kn(8)}" alt=""><span>${esc(C.line||'A brave choice. I would have picked the easier dread.')}</span></div>`;
    else{
      const sug=pool.find(t=>t.moves>0);
      body=(pool.length?`<div class="pick">${pool.slice(0,8).map(t=>`<button type="button" data-act="dragonPick" data-id="${t.id}">${ico(iconOf(cat(t.cat)),18,'var(--brass-l)',1.6)}${esc(t.title)}${t.moves?`<small>moved ${t.moves}x</small>`:''}</button>`).join('')}</div>`:'<p class="rsay">Nothing to slay yet. Name a dragon below.</p>')+(sug?`<p class="rnote">Sir Reg suggests ${esc(sug.title)}. It has been moved ${sug.moves} times.</p>`:'')+newDragonHTML();
    }
    return ritHero(RIT_FACE.dragon,'s')+sh('flame','var(--glow)',name,(em?'Keep it, change it, or let it rest today':'The one you dread most '+(wk?'this week':'today')))+(em&&!dt?'<p class="rsay">A smaller dragon is allowed.</p>':'')+body;
  }
  if(s==='mood'){
    return ritHero(RIT_FACE.mood,'s')+sh('compass','var(--brass-l)','Mood and mindset','How shall we approach today?')+say1+`<div class="rmoods" role="radiogroup" aria-label="Mood">${MOODS.map(([k,n,sub,i])=>`<button type="button" class="mood g ${C.mood===k?'on':''}" data-act="mood" data-v="${k}" role="radio" aria-checked="${C.mood===k}">${ico(i,36,C.mood===k?'var(--glow)':'var(--brass-l)',1.5)}<b>${n}</b><span>${sub}</span></button>`).join('')}</div>`;
  }
  if(s==='chamber'){
    return ritHero(RIT_FACE.focus,'s')+sh('pen','var(--brass-l)','The agenda','What is on your mind?')+`<textarea id="chamberTx" class="tb big" rows="8" placeholder="Write freely. Nobody is judging. Sir Reg is, but quietly." aria-label="Your thoughts">${esc(R.text||'')}</textarea><p class="rnote">Start a line with #task and end it with a comma or a new line to make it a task.</p><div class="rchips" id="chamberChips">${ritChips(R.text||'')}</div>`;
  }
  if(s==='triage'){
    const dg=C.dragonId,items=context().over.concat(context().open).filter(t=>!t.done);
    const rows=items.map(t=>`<div class="left"><span>${esc(t.title)}${t.date<today()?' <small class="rtag">OVERDUE</small>':''}${t.id===dg?' <small class="rtag hot">DRAGON</small>':''}</span>${t.id===dg?'':`<button class="mini" data-act="rTri" data-id="${t.id}" data-v="tomorrow">Tomorrow</button><button class="mini" data-act="rTri" data-id="${t.id}" data-v="drop">Drop</button>`}</div>`).join('');
    const movable=items.filter(t=>t.id!==dg).length;
    return ritHero(RIT_FACE.left,'s')+sh('list','var(--brass-l)','What is on your plate?',items.length?items.length+(items.length===1?' duty':' duties')+', no moves counted':'A clear plate')+(items.length?'':'<p class="rsay">Nothing on your plate. The overwhelm is imaginary, or at least unscheduled.</p>')+(movable>1?`<button type="button" class="rclear" data-act="rClear"><span>${ico('bolt',20,'currentColor',1.8)}Clear the decks</span><small>all but the dragon, to tomorrow</small></button>`:'')+`<div style="margin-top:8px">${rows}</div>`;
  }
  if(s==='exit'){
    const n=R.goals.length,dt=S.tasks.find(t=>t.id===C.dragonId&&!t.done);
    const lines=['Better. Not solved, but smaller. That is what councils are for.','The realm stands. So do you. Go gently.','Smaller. That is the whole trick.'];
    return ritHero(6)+`<h1 class="sealh" style="margin-top:6px">Council adjourned.</h1><p class="rsay big">${esc(lines[(Date.now()>>10)%lines.length])}</p><div class="rsum">${R.text&&R.text.trim()?'<button type="button" class="rrow" data-act="notesOpen"><i>NOTE</i><b>Saved on today. Tap to read.</b></button>':''}${n?`<div><i>TASKS</i><b>${n} added</b></div>`:''}${dt?`<div><i>DRAGON</i><b>${esc(dt.title)}</b></div>`:''}</div>`;
  }
  /* seal */
  const dt=S.tasks.find(t=>t.id===C.dragonId),mood=(MOODS.find(m=>m[0]===C.mood)||[])[1];
  const duties=wk?S.tasks.filter(t=>!t.done&&t.date&&t.date>=today()&&t.date<=addDays(today(),7-(new Date().getDay()||7))).length:context().open.length;
  const sparks=Array.from({length:14},(_,i)=>`<i style="--a:${i*360/14}deg"></i>`).join('');
  return `<div class="wax"><span class="ring"></span><span class="sparks">${sparks}</span><span class="disc">${ico('crown',54,'#FFF3E3',1.6)}</span></div>
  <h1 class="sealh">The plan is sealed.</h1><p class="rsay big">${esc((R.seal&&R.seal.text)||'The council is adjourned.')}</p>
  <div class="rsum">${C.focus?`<div><i>FOCUS</i><b>${esc(C.focus)}</b></div>`:''}<div><i>${wk?'THIS WEEK':'TODAY'}</i><b>${duties} ${duties===1?'duty':'duties'}</b></div>${dt?`<div><i>DRAGON</i><b>${esc(dt.title)}</b></div>`:''}${!wk&&mood?`<div><i>MOOD</i><b>${esc(mood)}</b></div>`:''}</div>`;
}
function ritFootHTML(){
  const R=U.council.rit,s=ritStep();
  if(s==='welcome')return `<button type="button" class="btn big" data-act="rNext">Begin</button><button type="button" class="rskip" data-act="closeCouncil">Not now</button>`;
  if(s==='seal')return `<button type="button" class="btn big" data-act="rFinish">To battle</button>`;
  if(s==='exit')return `<button type="button" class="btn big" data-act="rFinish">Back to the realm</button>`;
  if(s==='left')return `<button type="button" class="rskip" data-act="rNext">Skip the leftovers</button>`;
  const last=R.steps[R.i+1]==='seal'||R.steps[R.i+1]==='exit';
  const label=R.kind==='emergency'?(last?'Done':'Next'):last?'Seal the plan':'Next';
  return `<button type="button" class="btn big" data-act="rNext">${label}</button><button type="button" class="rskip" data-act="rNext">Skip this step</button>`;
}
function ritHTML(){
  const R=U.council.rit,s=ritStep();
  return `<div class="full g rit" role="dialog" aria-label="The Council"><div class="rglow"></div><div class="rsky" aria-hidden="true">${ritSky()}</div>
  <div class="rtop">${ritTopHTML()}</div><div class="rbody ${R.fresh?'enter':''}" data-step="${s}">${ritStepHTML()}</div><div class="rfoot">${ritFootHTML()}</div></div>`;
}
function ritTopHTML(){
  const R=U.council.rit,s=ritStep();
  return `${ritCanBack()?`<button type="button" class="ib quiet" data-act="rBack" aria-label="Back" style="border:0;background:none"><span style="display:flex;transform:scaleX(-1)">${ico('chevr',22,'currentColor',2)}</span></button>`:'<span style="width:40px"></span>'}<div class="rdots">${ritDots()}</div><button type="button" class="ib quiet" data-act="closeCouncil" aria-label="Close the Council" style="border:0;background:none">${ico('x',22,'currentColor',2)}</button>`;
}
/* redraw only the moving parts so the sky never restarts */
function ritDraw(){
  const el=document.querySelector('#overlay .rit');if(!el)return false;
  const R=U.council.rit,b=el.querySelector('.rbody');
  const kb=b.scrollTop;
  el.querySelector('.rtop').innerHTML=ritTopHTML();
  b.className='rbody'+(R.fresh?' enter':'');b.dataset.step=ritStep();b.innerHTML=ritStepHTML();
  el.querySelector('.rfoot').innerHTML=ritFootHTML();
  if(!R.fresh)b.scrollTop=kb;
  return true;
}
function ritAct(act,v,id){
  const C=U.council;
  switch(act){
    case 'notesOpen':U.menu=false;U.sheet='notes';renderOverlay();return true;
    case 'notesDel':{const p=S.plans[v];if(p&&p.notes){p.notes=p.notes.filter(e=>String(e.at)!==String(id));if(!p.notes.length)delete p.notes;save();render(true);renderOverlay();}return true;}
    case 'rTri':{const t=S.tasks.find(x=>x.id===id);if(!t)return true;
      if(v==='tomorrow')t.date=addDays(today(),1);
      else{const snap=JSON.parse(JSON.stringify(t));S.tasks=S.tasks.filter(x=>x.id!==id);toast({face:2,text:'Dropped. Gone from the realm.'},()=>{S.tasks.push(snap);save();render(true);renderOverlay();});}
      save();render(true);renderOverlay();return true;}
    case 'rClear':{
      const dg=C.dragonId,items=context().over.concat(context().open).filter(t=>!t.done&&t.id!==dg),old=items.map(t=>[t.id,t.date]);
      items.forEach(t=>{t.date=addDays(today(),1);});save();render(true);renderOverlay();
      toast({face:6,text:'The decks are clear. '+items.length+' moved to tomorrow.'},()=>{old.forEach(([i,d])=>{const t=S.tasks.find(x=>x.id===i);if(t)t.date=d;});save();render(true);renderOverlay();});return true;}
    case 'rNext':ritNext();return true;
    case 'rBack':ritBack();return true;
    case 'rFinish':ritFinish();return true;
    case 'rGoalAdd':{const g=$('#goalIn');if(g&&g.value.trim()){ritCommit(g.value);renderOverlay();const x=$('#goalIn');x&&x.focus();}return true;}
    case 'rGoalDel':{const R=C.rit,t=S.tasks.find(x=>x.id===id);S.tasks=S.tasks.filter(x=>x.id!==id);R.goals=R.goals.filter(x=>x!==id);save();render(true);renderOverlay();return true;}
    case 'rLf':{
      const t=S.tasks.find(x=>x.id===id);if(!t)return true;
      if(v==='today')t.date=today();
      else if(v==='tomorrow'){t.date=addDays(today(),1);t.moves=(t.moves||0)+1;}
      else{const snap=JSON.parse(JSON.stringify(t));S.tasks=S.tasks.filter(x=>x.id!==id);save();render(true);toast({face:2,text:'Dropped. Gone from the realm.'},()=>{S.tasks.push(snap);save();render(true);renderOverlay();});}
      save();render(true);
      if(!context().over.length)ritNext();else renderOverlay();return true;}
    case 'rLfAll':{
      context().over.forEach(t=>{if(v==='today')t.date=today();else{t.date=addDays(today(),1);t.moves=(t.moves||0)+1;}});
      save();render(true);ritNext();return true;}
    case 'ritAgain':{const k=v;openCouncil(k,true);return true;}
  }
  return false;
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='goalIn'){e.preventDefault();ritAct('rGoalAdd');}});

function ritChips(tx){
  const out=[],re=/#task[ \t]*([^,\n]*)/gi;let m;
  while((m=re.exec(tx))){const raw=m[1].trim();if(raw)out.push(raw);}
  return out.map(x=>`<div class="rchip"><span class="tl2">${ico('plus',16,'var(--brass-l)',2)}</span><span class="rt">${esc(x[0].toUpperCase()+x.slice(1))}</span><small>TASK</small></div>`).join('');
}
function ritChamber(){
  const R=U.council.rit,tx=R.text||'';let n=0;
  const re=/#task[ \t]*([^,\n]*)/gi;let m;
  while((m=re.exec(tx))){const raw=m[1].trim();if(!raw||R.made[raw])continue;const t=ritTask(raw);if(t){R.made[raw]=t.id;R.goals.push(t.id);n++;}}
  if(n){save();render(true);}
  if(tx.trim()){
    const k=today(),p=S.plans[k]||(S.plans[k]={});p.notes=p.notes||[];
    let e=R.noteAt&&p.notes.find(x=>x.at===R.noteAt);
    if(!e){R.noteAt=Date.now();e={at:R.noteAt,text:''};p.notes.push(e);}
    e.text=tx.trim();save();
  }
}
function ritEmSave(){
  const C=U.council,R=C.rit;
  if(R.text&&R.text.trim())ritChamber();
  const p=S.plans[today()]||(S.plans[today()]={});
  if((p.dragonId||null)!==(C.dragonId||null)){p.dragonId=C.dragonId||null;}
  save();
}
function ritNotesHTML(){
  const n=(plan().notes||[]);if(!n.length)return '';
  return `<div class="sh"><span class="tl">${ico('pen',20,'var(--brass-l)',1.7)}</span><div><b>Emergency notes</b><i>Written in the chamber today</i></div></div>`+n.map(e=>{const d=new Date(e.at);return `<div class="enote"><span class="mono">${z2(d.getHours())}:${z2(d.getMinutes())}</span><p>${esc(e.text)}</p></div>`;}).join('');
}
document.addEventListener('input',e=>{
  if(e.target.id==='chamberTx'&&U.council&&U.council.rit){U.council.rit.text=e.target.value;const c=$('#chamberChips');if(c)c.innerHTML=ritChips(e.target.value);}
});

function notesSheetHTML(){
  const days=Object.keys(S.plans).filter(k=>(S.plans[k].notes||[]).length).sort().reverse();
  const body=days.length?days.map(k=>`<p class="ndh">${fmtHead(k).toUpperCase()}</p>`+S.plans[k].notes.slice().sort((a,b)=>b.at-a.at).map(e=>{const d=new Date(e.at);return `<div class="enote"><span class="mono">${z2(d.getHours())}:${z2(d.getMinutes())}</span><p>${esc(e.text)}</p><button type="button" class="ib quiet" style="border:0;background:none;width:34px;height:34px;flex:none" data-act="notesDel" data-id="${e.at}" data-v="${k}" aria-label="Delete note">${ico('x',16,'currentColor',2)}</button></div>`;}).join('')).join(''):'<p class="note" style="margin:0">No notes yet. They are written in the Emergency Council.</p>';
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Chamber notes"><h2>Chamber notes</h2>${body}<div class="btns"><button type="button" class="btn ghost" data-act="closeSheet">Close</button></div></div>`;
}
