/* ---------- campaigns: founding ceremony, journal, victory ---------- */
const FOUND_ICONS=['flag','work','study','home','money','travel','family','fitness','health','creative','garden','tech'];
function qlog(q,text){q.log=q.log||[];q.log.push({at:Date.now(),text});}
function hashPick(a,key){let h=0;for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))>>>0;return a[h%a.length];}
function openFound(){
  U.toast=null;renderToast();U.menu=false;U.sheet=null;
  U.council={kind:'found',focus:'',dragonId:null,mood:'steady',pickOpen:false,line:''};
  const R=ritStart('found',false);
  R.f={name:'',icon:'flag',goal:'',stakes:'',enemy:'',due:'',reward:'',cry:'',moves:[]};
  renderOverlay();
}
function openVictory(qid){
  const q=questOf(qid);if(!q||q.done)return;
  U.toast=null;renderToast();U.sheet=null;
  U.council={kind:'victory',focus:'',dragonId:null,mood:'steady',pickOpen:false,line:''};
  const R=ritStart('victory',false);R.qid=qid;renderOverlay();
}
const STAKE_R=['Noted. I will tell your descendants it was a close one.','Grim. Good. Stakes are what turn a list into a campaign.','I have written that in the margin, in small letters.','High stakes, low sleep. Classic.','Understood. I shall wince on your behalf.'];
function reactEnemy(t){
  t=(t||'').trim();if(!t)return '';const l=t.toLowerCase();
  if(/job|hunt|interview|\bcv\b|resume|career|recruit/.test(l))return 'Recruiters. The oldest enemy. They ghost you, then ask for a call.';
  if(/move|house|flat|apartment|boxes/.test(l))return 'Boxes. They multiply in the night. I have seen it.';
  if(/exam|study|thesis|degree|course/.test(l))return 'Knowledge. A fearsome foe, mostly because it is boring.';
  if(/procrast|lazy|motivation|sofa|phone/.test(l))return 'Procrastination. An old rival of ours, my lord.';
  if(/run|marathon|weight|gym|fit/.test(l))return 'Your own legs, and a sofa that knows your weaknesses.';
  if(/tax|admin|paper|bureau/.test(l))return 'Paperwork. It does not die. It is merely filed.';
  return hashPick(['“'+t+'”. A worthy name for a villain. I shall draw it menacingly.','“'+t+'”. I have already begun to dislike it.','“'+t+'”. It does not know what is coming. Neither do I, but I am hopeful.'],t);
}
function foundStepHTML(){
  const C=U.council,R=C.rit,f=R.f,s=ritStep();
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  const ban=()=>`<div class="banr"><span class="bi">${ico(f.icon,28,'#FFF3E3',1.5)}</span><b id="fBannerT">${esc(f.name||'Unnamed campaign')}</b></div>`;
  if(s==='summons')return ritHero(1)+`<p class="rcap">A NEW CAMPAIGN</p><h1>A new campaign, my lord.</h1><p class="rsay big">${esc(R.wline)}</p>`;
  if(s==='name')return ritHero(3,'s')+sh('flag','var(--brass-l)','Name the campaign','Every great war has a title')+ban()+`<input id="fName" class="inp" type="text" value="${esc(f.name)}" placeholder="Operation Dream Job" autocomplete="off" aria-label="Campaign name" style="margin-top:12px"><div class="ricons">${FOUND_ICONS.map(k=>`<button type="button" class="chip ${f.icon===k?'on':''}" style="width:46px;padding:0;justify-content:center" data-act="fIcon" data-v="${k}" aria-label="${k}">${ico(k,22,'var(--brass-l)',1.5)}</button>`).join('')}</div>`;
  if(s==='goal')return ritHero(1,'s')+sh('compass','var(--brass-l)','The goal','What does victory look like?')+`<textarea id="fGoal" class="tb big" rows="4" placeholder="One clear sentence" aria-label="The goal">${esc(f.goal)}</textarea>`;
  if(s==='stakes')return ritHero(4,'s')+sh('flame','var(--glow)','The stakes','And if you fail?')+`<textarea id="fStakes" class="tb big" rows="4" placeholder="What is lost, and who notices" aria-label="The stakes">${esc(f.stakes)}</textarea><p class="rsay" id="fReact">${f.stakes.trim()?esc(hashPick(STAKE_R,f.stakes.trim().split(/\s+/)[0])):''}</p>`;
  if(s==='enemy')return ritHero(10,'s')+sh('eye','var(--glow)','The enemy','Name the thing in your way')+`<input id="fEnemy" class="inp" type="text" value="${esc(f.enemy)}" placeholder="Recruiter ghosting, procrastination..." autocomplete="off" aria-label="The enemy" style="margin-top:12px"><p class="rsay" id="fReact">${esc(reactEnemy(f.enemy))}</p>`;
  if(s==='terms'){
    return ritHero(1,'s')+sh('week','var(--brass-l)','The terms','A deadline, and what you win')+`<div class="fd"><label for="fDue">DEADLINE</label><input id="fDue" class="inp" type="date" value="${esc(f.due)}" aria-label="Deadline"></div><div class="chips sm" style="margin:8px 0 0">${[['14','2 weeks'],['30','1 month'],['90','3 months'],['','No date']].map(([d,l])=>`<button type="button" class="chip" data-act="fDue" data-v="${d}">${l}</button>`).join('')}</div><div class="fd" style="margin-top:14px"><label for="fReward">THE SPOILS</label><textarea id="fReward" class="tb" rows="2" placeholder="What do you get when you win?" aria-label="The spoils">${esc(f.reward)}</textarea></div>`;
  }
  if(s==='cry')return ritHero(8,'s')+sh('bolt','var(--brass-l)','A war cry','Optional. Sir Reg will shout it at you')+`<input id="fCry" class="inp" type="text" value="${esc(f.cry)}" placeholder="Onward." autocomplete="off" aria-label="War cry" style="margin-top:12px"><div class="chips sm" style="margin:8px 0 0">${['Onward.','No retreat.','One card at a time.','Fortune favours the finished.'].map((x,i)=>`<button type="button" class="chip" data-act="fCry" data-v="${i}">${esc(x)}</button>`).join('')}</div>`;
  if(s==='moves'){
    const chips=f.moves.map((m,i)=>`<div class="rchip"><span class="tl2">${ico('plus',16,'var(--brass-l)',2)}</span><span class="rt">${esc(m)}</span><small>TO DO</small><button type="button" class="ib quiet" style="width:34px;height:34px;border:0;background:none" data-act="fMoveDel" data-v="${i}" aria-label="Remove">${ico('x',16,'currentColor',2)}</button></div>`).join('');
    return ritHero(5,'s')+sh('path','var(--brass-l)','The first moves','Commas between them, each becomes a card')+`<div class="arow" style="margin-top:12px"><input id="fMoveIn" class="inp" type="text" placeholder="Update CV, list targets, call Max" autocomplete="off" enterkeyhint="done" aria-label="First moves"><button type="button" class="go" data-act="fMoveAdd" aria-label="Add">${ico('plus',22,'currentColor',2.6)}</button></div><div class="rchips">${chips}</div>`;
  }
  if(s==='oath'){
    return ban()+`<div class="osum">${f.goal?`<p>${esc(f.goal)}</p>`:''}${f.enemy?`<small>ENEMY</small><b>${esc(f.enemy)}</b>`:''}${f.due?`<small>DEADLINE</small><b>${esc(shortDue(f.due))}</b>`:''}${f.moves.length?`<small>FIRST MOVES</small><b>${f.moves.length}</b>`:''}</div>
    <div class="oath" data-oath role="button" tabindex="0" aria-label="Hold to swear the oath"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="70" class="o0"/><circle cx="80" cy="80" r="70" class="o1"/></svg><span class="od">${ico(f.icon,44,'#FFF3E3',1.5)}</span></div><p class="rsay">Hold the seal to swear the oath.</p>`;
  }
  /* sworn */
  const q=questOf(R.qid),n=S.tasks.filter(t=>q&&t.q===q.id).length;
  const sparks=Array.from({length:14},(_,i)=>`<i style="--a:${i*360/14}deg"></i>`).join('');
  return `<div class="wax"><span class="ring"></span><span class="sparks">${sparks}</span><span class="disc">${ico(f.icon,54,'#FFF3E3',1.6)}</span></div><h1 class="sealh">The campaign is sworn.</h1><p class="rsay big">${esc(R.seal||'There is no refund.')}</p>
  <div class="rsum"><div><i>CAMPAIGN</i><b>${esc(f.name)}</b></div>${f.cry?`<div><i>WAR CRY</i><b>${esc(f.cry)}</b></div>`:''}${n?`<div><i>CARDS</i><b>${n} on the board</b></div>`:''}${f.due?`<div><i>DEADLINE</i><b>${esc(shortDue(f.due))}</b></div>`:''}</div>`;
}
function foundFootHTML(){
  const s=ritStep();
  if(s==='summons')return `<button type="button" class="btn big" data-act="rNext">Unroll the map</button><button type="button" class="rskip" data-act="closeCouncil">Not now</button>`;
  if(s==='name')return `<button type="button" class="btn big" data-act="rNext">Next</button>`;
  if(s==='oath')return `<span class="rnote" style="text-align:center">Nothing is created until you swear.</span>`;
  if(s==='sworn')return `<button type="button" class="btn big" data-act="rFinish">Open the war room</button>`;
  return `<button type="button" class="btn big" data-act="rNext">Next</button><button type="button" class="rskip" data-act="rNext">Skip this step</button>`;
}
function foundRead(){
  const R=U.council.rit;const g=$('#fMoveIn');if(g&&g.value.trim())foundMoves(g.value);
}
function foundMoves(raw){
  const R=U.council.rit;String(raw).split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>R.f.moves.push(x[0].toUpperCase()+x.slice(1)));
  const g=$('#fMoveIn');if(g)g.value='';
}
function foundSetDue(d){const R=U.council.rit;if(!d)R.f.due='';else R.f.due=addDays(today(),+d);}
const DAY1=['Day 1. The adventurer begins. Provisions: optimism.','Day 1. The map is unrolled. The enemy has not noticed us yet.','Day 1. A campaign is sworn. The quills are sharp and the coffee is hot.'];
function ritOath(){
  const C=U.council,R=C.rit,f=R.f;if(!f||!f.name.trim())return;
  const g=$('#fMoveIn');if(g&&g.value.trim())foundMoves(g.value);
  const q={id:uid(),title:f.name.trim(),icon:f.icon,due:f.due||'',created:Date.now(),cols:DEFCOLS(),log:[],ms:[]};
  ['goal','stakes','reward','enemy','cry'].forEach(k=>{if((f[k]||'').trim())q[k]=f[k].trim();});
  S.quests.push(q);
  const col=startCol(q);
  f.moves.forEach(m=>{const t={id:uid(),title:m,cat:S.last||S.cats[0].id,date:'',time:'',dur:30,done:false,moves:0,createdAt:Date.now(),rep:'',q:q.id,col,ord:endOrd(q,col)};S.tasks.push(t);assignCol(t,col);logEv('added',t,{raw:m,catManual:false,suggested:'',batch:false,viaCeremony:true});});
  qlog(q,hashPick(DAY1,q.id)+(q.enemy?' Enemy sighted: '+q.enemy+'.':'')+(f.moves.length?' '+f.moves.length+(f.moves.length===1?' card':' cards')+' in the first muster.':''));
  q.rank=rankOf(campStats(q),q)[0];
  R.qid=q.id;R.seal=hashPick(['There is no refund.','The seal is dry. The die is cast.','Sworn. I have told the scribes.'],q.id);
  R.i=R.steps.indexOf('sworn');R.fresh=true;
  save();LC.key='';render(true);renderOverlay();R.fresh=false;
  try{navigator.vibrate&&navigator.vibrate([20,40,60]);}catch(x){}
}
/* hold to swear */
let oathT=0;
function oathStop(){if(oathT){clearTimeout(oathT);oathT=0;}document.querySelectorAll('.oath.hold').forEach(b=>b.classList.remove('hold'));}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest('[data-oath]');if(!b||!U.council||!U.council.rit||U.council.rit.kind!=='found')return;
  e.preventDefault();b.classList.add('hold');oathStop();b.classList.add('hold');
  oathT=setTimeout(()=>{oathT=0;if(U.council&&U.council.rit&&ritStep()==='oath')ritOath();},1800);
  try{navigator.vibrate&&navigator.vibrate(12);}catch(x){}
});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,oathStop));
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('[data-oath]'))e.preventDefault();});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-oath]')&&U.council&&U.council.rit&&U.council.rit.kind==='found'){e.preventDefault();ritOath();}});
/* live inputs */
document.addEventListener('input',e=>{
  const t=e.target,R=U.council&&U.council.rit;if(!R||R.kind!=='found')return;
  const map={fName:'name',fGoal:'goal',fStakes:'stakes',fEnemy:'enemy',fDue:'due',fReward:'reward',fCry:'cry'};
  const k=map[t.id];if(!k)return;R.f[k]=t.value;
  if(k==='name'){const b=$('#fBannerT');if(b)b.textContent=t.value||'Unnamed campaign';}
  if(k==='stakes'||k==='enemy'){const r=$('#fReact');if(r)r.textContent=k==='enemy'?reactEnemy(t.value):(t.value.trim()?hashPick(STAKE_R,t.value.trim().split(/\s+/)[0]):'');}
});
document.addEventListener('keydown',e=>{
  const R=U.council&&U.council.rit;if(!R||R.kind!=='found'||e.key!=='Enter')return;
  if(e.target.id==='fName'||e.target.id==='fEnemy'||e.target.id==='fCry'){e.preventDefault();ritNext();}
  else if(e.target.id==='fMoveIn'){e.preventDefault();foundAct('fMoveAdd');}
});
/* ---------- victory ---------- */
function victStepHTML(){
  const C=U.council,R=C.rit,q=questOf(R.qid),s=ritStep();if(!q)return '';
  const st=campStats(q),days=Math.max(1,diffDays(today(),ymd(new Date(q.created||Date.now())))+1);
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  if(s==='triumph')return ritHero(6)+`<p class="rcap">${esc(q.title.toUpperCase())}</p><h1>It is done, my lord.</h1><p class="rsay big">${esc(q.enemy?q.enemy+' has fallen. I will not say I doubted you.':'Every card cleared. The realm is yours.')}</p>`;
  if(s==='tally')return ritHero(6,'s')+sh('crown','var(--brass-l)','The tally','What the war was made of')+`<div class="rsum" style="max-width:none"><div><i>DAYS</i><b>${days}</b></div><div><i>SLAIN</i><b>${st.done} cards</b></div><div><i>XP</i><b>${st.xp}</b></div>${q.enemy?`<div><i>ENEMY</i><b>${esc(q.enemy)}, defeated</b></div>`:''}${q.cry?`<div><i>WAR CRY</i><b>${esc(q.cry)}</b></div>`:''}</div>`;
  if(s==='spoils')return ritHero(3,'s')+sh('flag','var(--glow)','The spoils','Claim what you swore to win')+`<div class="spoils"><i>THE SPOILS</i><b>${esc(q.reward||'Glory, and the right to say “I told you so”.')}</b></div><p class="rsay">You earned the smugness. Use it responsibly.</p>`;
  const sparks=Array.from({length:14},(_,i)=>`<i style="--a:${i*360/14}deg"></i>`).join('');
  return `<div class="wax"><span class="ring"></span><span class="sparks">${sparks}</span><span class="disc">${ico('crown',54,'#FFF3E3',1.6)}</span></div><h1 class="sealh">Campaign complete.</h1><p class="rsay big">${esc(R.seal||'Another one for the chronicles.')}</p><div class="rsum"><div><i>CAMPAIGN</i><b>${esc(q.title)}</b></div><div><i>DAYS</i><b>${days}</b></div></div>`;
}
function victFootHTML(){
  const s=ritStep();
  if(s==='triumph')return `<button type="button" class="btn big" data-act="rNext">Onward</button>`;
  if(s==='spoils')return `<button type="button" class="btn big" data-act="rNext">Claim the spoils</button>`;
  if(s==='seal')return `<button type="button" class="btn big" data-act="rFinish">Back to the realm</button>`;
  return `<button type="button" class="btn big" data-act="rNext">Next</button>`;
}
function ritClaim(){
  const R=U.council.rit,q=questOf(R.qid);if(!q||q.done)return;
  q.done=true;q.doneAt=Date.now();qlog(q,'Victory. '+(q.reward?'Spoils claimed: '+q.reward:'Glory claimed.'));
  R.seal=hashPick(['Another one for the chronicles.','The enemy sends its regrets.','Victory, sealed and filed.'],q.id);
  save();LC.key='';render(true);
}
/* ---------- progress hook: milestones and rank ups ---------- */
function campProgress(t){
  if(!t||!t.q||!t.done)return;const q=questOf(t.q);if(!q||q.done)return;
  const s=campStats(q);q.ms=q.ms||[];let line=null;
  const add=(k,txt,short)=>{if(q.ms.includes(k))return;q.ms.push(k);qlog(q,txt);line=short;};
  add('first','First blood. One card slain.','First blood.');
  [[25,'The troops are mustered (25%).','Troops mustered.'],[50,'The border is crossed (50%).','Border crossed.'],[75,'The gates are in sight (75%).','At the gates.']].forEach(m=>{if(s.pc>=m[0])add('m'+m[0],m[1],m[2]);});
  const rk=rankOf(s,q)[0];
  if(q.rank&&q.rank!==rk&&rk!=='Victory'){qlog(q,'Promoted: '+rk+'.');line='Rank up: '+rk+'.';}
  q.rank=rk;save();
  if(s.n&&s.done===s.n){setTimeout(()=>{if(!U.council)openVictory(q.id);},600);return;}
  if(line)setTimeout(()=>toast({face:6,text:line}),900);
}
/* ---------- brief extras ---------- */
function briefExtras(q){
  const s=campStats(q);
  const st=q.done||(s.n&&s.done===s.n)?'Defeated':s.pc>=75?'Fleeing':s.pc>=50?'Wounded':s.pc>0?'Rattled':'Lurking';
  const pinned=S.settings.pin===q.id;
  const log=(q.log||[]).slice().reverse().slice(0,8);
  return {
    cry:q.cry?`<p class="cry">“${esc(q.cry)}”</p>`:'',
    enemy:q.enemy?`<div class="etile"><span class="qtile">${ico('horned',24,'var(--glow)',1.5)}</span><div><i>THE ENEMY</i><b>${esc(q.enemy)}</b></div><em>${st.toUpperCase()}</em></div>`:'',
    journal:log.length?`<div class="jlog">${log.map(e=>{const d=new Date(e.at);return `<div><span class="mono">${d.getDate()} ${MON[d.getMonth()].toUpperCase()}</span><p>${esc(e.text)}</p></div>`;}).join('')}</div>`:'',
    pin:`<button type="button" class="btn ghost pinb" data-act="campPin" data-id="${q.id}">${pinned?'Unpin from home':'Pin to home'}</button>`
  };
}
function foundAct(act,v,id){
  const C=U.council,R=C&&C.rit;
  switch(act){
    case 'fIcon':if(R){R.f.icon=v;renderOverlay();}return true;
    case 'fDue':if(R){foundSetDue(v);renderOverlay();}return true;
    case 'fCry':if(R){R.f.cry=['Onward.','No retreat.','One card at a time.','Fortune favours the finished.'][+v];renderOverlay();}return true;
    case 'fMoveAdd':{if(!R)return true;const g=$('#fMoveIn');if(g&&g.value.trim()){foundMoves(g.value);renderOverlay();const x=$('#fMoveIn');x&&x.focus();}return true;}
    case 'fMoveDel':if(R){R.f.moves.splice(+v,1);renderOverlay();}return true;
    case 'campPin':{S.settings.pin=S.settings.pin===id?'':id;save();render(true);renderOverlay();return true;}
  }
  return false;
}
