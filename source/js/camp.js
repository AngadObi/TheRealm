/* ---------- campaigns: board, notes, columns, drag and drop ---------- */
const DEFCOLS=()=>[{id:'ideas',name:'Ideas'},{id:'todo',name:'To do'},{id:'doing',name:'Doing'},{id:'blocked',name:'Blocked'},{id:'done',name:'Done',done:true}];
function colsOf(q){if(!q.cols||!q.cols.length)q.cols=DEFCOLS();return q.cols;}
function startCol(q){const cs=colsOf(q);return (cs.find(c=>c.id==='todo')||cs.find(c=>!c.done)||cs[0]).id;}
function doneCol(q){const cs=colsOf(q);return (cs.find(c=>c.done)||cs[cs.length-1]).id;}
function colOfTask(t,q){const cs=colsOf(q);if(t.col&&cs.some(c=>c.id===t.col))return t.col;return t.done?doneCol(q):startCol(q);}
function cardsOf(q,id){
  const ts=S.tasks.filter(t=>t.q===q.id&&colOfTask(t,q)===id);
  const miss=ts.filter(t=>typeof t.ord!=='number').sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  let m=Math.max(-10,...ts.filter(t=>typeof t.ord==='number').map(t=>t.ord));
  miss.forEach(t=>{m+=10;t.ord=m;});
  return ts.sort((a,b)=>a.ord-b.ord);
}
function endOrd(q,col,except){
  const ts=cardsOf(q,col).filter(t=>t!==except);
  return ts.length?ts[ts.length-1].ord+10:0;
}
function syncCol(t){
  if(!t.q)return;const q=questOf(t.q);if(!q)return;
  const cur=colsOf(q).find(c=>c.id===t.col);
  if(t.done){if(!cur||!cur.done){t.col=doneCol(q);t.ord=endOrd(q,t.col,t);}}
  else if(!cur||cur.done){t.col=startCol(q);t.ord=endOrd(q,t.col,t);}
}
function assignCol(t,colId){
  if(!t.q){delete t.col;delete t.ord;return;}
  const q=questOf(t.q);if(!q)return;const cs=colsOf(q);
  const id=cs.some(c=>c.id===colId)?colId:(cs.some(c=>c.id===t.col)?t.col:(t.done?doneCol(q):startCol(q)));
  if(t.col!==id){t.col=id;t.ord=endOrd(q,id,t);}
  const c=cs.find(x=>x.id===id);
  if(c.done&&!t.done){t.done=true;t.doneAt=Date.now();(t.steps||[]).forEach(s=>s.done=true);}
  else if(!c.done&&t.done){t.done=false;t.doneAt=null;}
}

function cardHTML(t){
  const meta=[];
  if(t.date)meta.push(shortDue(t.date).toLowerCase()+(t.time?' '+t.time:''));
  if(t.steps&&t.steps.length)meta.push(t.steps.filter(s=>s.done).length+'/'+t.steps.length);
  if(t.note)meta.push('note');
  const tier=tierOf(t);
  return `<div class="kc ${t.done?'done':''}" data-id="${t.id}"><button type="button" class="cb" data-act="kTick" data-id="${t.id}" aria-label="${t.done?'Mark not done':'Mark done'}: ${esc(t.title)}" aria-pressed="${!!t.done}"><i class="${t.done?'on':''}">${t.done?ico('check',14,'currentColor',3.2):''}</i></button><div class="kt" data-act="edit" data-id="${t.id}"><b>${esc(t.title)}</b>${meta.length||tier?`<em>${tier?TAGS[tier]+(meta.length?' · ':''):''}${esc(meta.join(' · '))}</em>`:''}</div></div>`;
}

function campStats(q){
  const ts=S.tasks.filter(t=>t.q===q.id),n=ts.length,done=ts.filter(t=>t.done).length;
  const inCol=id=>ts.filter(t=>colOfTask(t,q)===id&&!t.done).length;
  const left=q.due?diffDays(q.due,today()):null;
  return {n,done,pc:n?Math.round(done/n*100):0,doing:inCol('doing'),blocked:inCol('blocked'),left,xp:done*10};
}
function rankOf(s,q){
  if(q.done||(s.n&&s.done===s.n))return ['Victory','crown'];
  if(!s.n)return ['Mustering','flag'];
  if(s.pc<40)return ['On the march','path'];
  if(s.pc<75)return ['Deep in enemy lands','compass'];
  return ['At the gates','focus'];
}
const CL={
 empty:[5,['A campaign without cards is a rumour. Give me three, my lord.','Every great war began with a list. Start the list.','The map is empty. That is fine. Maps are cheap.']],
 blocked:[4,['Something blocks the road. Name it. Blockers hate being named.','A blocker is just a task you have not been introduced to yet.']],
 late:[7,['The deadline has passed. The war has not. Move the date and march on.','Late, but not lost. Armies have been later.']],
 soon:[9,['The battle is close. Spend your cards wisely, not widely.','Few days left. This is where legends are made, or at least finished.']],
 won:[6,['Every card cleared. Mark the campaign complete. You earned the smugness.','Victory. I will pretend I never doubted you.']],
 high:[3,['The gates are in sight. Do not stop to admire them.','Nearly there. The enemy is rehearsing a speech about mercy.']],
 mid:[3,['Steady progress. The enemy has noticed. Good.','Keep the cards moving. Doing beats planning, narrowly.','You are further along than it feels. That is how campaigns work.']]
};
function campLine(q){
  const s=campStats(q);let k='mid';
  if(!s.n)k='empty';else if(s.done===s.n)k='won';else if(s.left!==null&&s.left<0&&!q.done)k='late';else if(s.blocked)k='blocked';else if(s.left!==null&&s.left<=7)k='soon';else if(s.pc>=75)k='high';
  const [face,ls]=CL[k];let h=0;const key=q.id+today()+k;for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))>>>0;
  return {face,text:ls[h%ls.length]};
}
const MILES=[[25,'Muster the troops'],[50,'Cross the border'],[75,'Storm the gates'],[100,'Victory']];
function journeyHTML(q,s){
  const rk=rankOf(s,q);
  return `<div class="jr2"><div class="hbar"><i style="width:${Math.max(3,s.pc)}%"></i></div><b>${rk[0]}</b></div>`;
}
function dueHTML(q){
  const td=today();
  const ts=S.tasks.filter(t=>t.q===q.id&&!t.done&&t.date).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.time||'99')<(b.time||'99')?-1:1);
  if(!ts.length)return '<p class="bempty">Nothing dated yet. Give a card a date and it shows up here.</p>';
  const rows=ts.slice(0,5).map(t=>{const d=diffDays(t.date,td);const w=d<0?`<span class="od">${shortDue(t.date).toLowerCase()}</span>`:d===0?'<span class="soon">today</span>':d===1?'tomorrow':shortDue(t.date).toLowerCase();
    return `<div class="dr"><button type="button" class="cb" data-act="kTick" data-id="${t.id}" aria-label="Mark done: ${esc(t.title)}"><i></i></button><span class="kt" data-act="edit" data-id="${t.id}"><b>${esc(t.title)}</b></span><em>${w}${t.time?' '+t.time:''}</em></div>`;}).join('');
  return `<div class="dues">${rows}</div>${ts.length>5?`<p class="bempty" style="margin-top:10px">and ${ts.length-5} more on the board</p>`:''}`;
}
function briefHTML(q){
  const s=campStats(q),rk=rankOf(s,q),L=campLine(q),C=U.camp,ex=briefExtras(q);
  const ta=(k,ph)=>`<textarea id="bf_${k}" class="note ta" rows="3" placeholder="${ph}" data-k="${k}" aria-label="${ph}">${esc(q[k]||'')}</textarea>`;
  const field=(k,cls,ph,add)=>C.edit===k?ta(k,ph):q[k]?`<div class="${cls}" data-act="briefEdit" data-v="${k}">${linkify(q[k])}</div>`:`<button type="button" class="badd" data-act="briefEdit" data-v="${k}">+ ${add}</button>`;
  const cry=C.edit==='cry'?ta('cry','A war cry, one line'):q.cry?`<p class="cry" data-act="briefEdit" data-v="cry">“${esc(q.cry)}”</p>`:`<button type="button" class="badd quiet" data-act="briefEdit" data-v="cry">+ War cry</button>`;
  const done=q.done||(s.n&&s.done===s.n);
  const st=done?'Defeated':s.pc>=75?'Fleeing':s.pc>=50?'Wounded':s.pc>0?'Rattled':'Lurking';
  const enemy=C.edit==='enemy'?ta('enemy','Who or what stands in your way?'):q.enemy?`<div class="etile" data-act="briefEdit" data-v="enemy"><span class="qtile">${ico('horned',26,'var(--glow)',1.5)}</span><div><b>${esc(q.enemy)}</b><i>${st.toUpperCase()}</i></div></div><div class="ehp" aria-hidden="true"><i style="width:${done?0:Math.max(4,100-s.pc)}%"></i></div>`:`<button type="button" class="badd" data-act="briefEdit" data-v="enemy">+ Name the enemy</button>`;
  const road=`<ol class="road">${MILES.map((m,i)=>{const on=s.pc>=m[0],now=!on&&(i===0||s.pc>=MILES[i-1][0]);return `<li class="${on?'on':''} ${now?'now':''}"><span>${on?ico('check',14,'currentColor',3):''}</span><b>${m[1]}</b></li>`;}).join('')}</ol>`;
  const sec=(t,inner)=>`<section class="bsec"><h4>${t}</h4>${inner}</section>`;
  return `<div class="brief"><section class="hero"><div class="hglow"></div><span class="crest">${ico(q.icon,34,'#FFF3E3',1.5)}</span><h1>${esc(q.title)}</h1>${cry}
  <div class="hgoal">${field('goal','goal','What does victory look like?','State the goal')}</div>
  <div class="prog"><div class="hbar"><i style="width:${Math.max(3,s.pc)}%"></i></div><b class="rk">${rk[0]}</b></div>
  <div class="sirl"><img src="${kn(L.face)}" alt=""><p>${esc(L.text)}</p></div></section>
  ${sec('The stakes and the spoils',`<div class="duo"><div class="mc stake"><i>AT STAKE</i>${field('stakes','mv','What is lost if you fail?','State the stakes')}</div><div class="mc spoil"><i>THE SPOILS</i>${field('reward','mv','What do you win?','Name the spoils')}</div></div>`)}
  ${sec('The enemy',enemy)}
  ${sec('Next up',dueHTML(q))}
  ${sec('The road',road)}
  ${ex.journal?sec('The journal',ex.journal):''}
  <button type="button" class="lnk pinl" data-act="campPin" data-id="${q.id}">${S.settings.pin===q.id?'Unpin from home':'Pin to home'}</button></div>`;
}
function campHTML(){
  const C=U.camp,q=questOf(C.id);if(!q){U.camp=null;return '';}
  const cs=colsOf(q);
  const due=q.done?'COMPLETE':q.due?'DUE '+shortDue(q.due):'NO DEADLINE';
  const tabs=`<div class="trow"><div class="seg" role="tablist">${[['board','Board'],['brief','Brief'],['notes','Notes']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${(C.tab||'board')===k}" class="${(C.tab||'board')===k?'on':''}" data-act="campTab" data-v="${k}">${l}</button>`).join('')}</div>${(C.tab||'board')==='board'?`<button type="button" class="cbk colb" data-act="colsOpen" aria-label="Columns">${ico('gear',20,'var(--brass-l)',1.6)}</button>`:''}</div>`;
  let body;
  if(C.tab==='brief')body=briefHTML(q);
  else if(C.tab==='notes')body=notesTabHTML(q);
  else{
    body=`<div class="kboard">${cs.map(c=>{const cards=cardsOf(q,c.id);return `<div class="kcol ${c.done?'dn':''}" data-col="${c.id}"><div class="kh"><b>${esc(c.name)}</b><span>${cards.length}</span></div><div class="kcards">${cards.map(cardHTML).join('')}</div><input class="kin" data-col="${c.id}" placeholder="+ Add a card" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" aria-label="Add a card to ${esc(c.name)}"></div>`;}).join('')}</div>`;
  }
  return `<div class="full camp" role="dialog" aria-label="${esc(q.title)}"><div class="chd"><button type="button" class="cbk" data-act="campBack" aria-label="Back">${ico('chevr',22,'var(--bone)',2)}</button><div class="ctt ${C.tab==='brief'?'solo':''}">${C.tab==='brief'?'':`<b>${esc(q.title)}</b>`}<i>${due}</i></div><button type="button" class="cbk ed" data-act="qEdit" aria-label="Edit campaign">${ico('pen',20,'var(--brass-l)',1.7)}</button></div>${C.note&&C.tab==='notes'?'':tabs}${C.tab==='board'||!C.tab?journeyHTML(q,campStats(q)):''}${body}</div>`;
}
function colsSheetHTML(){
  const q=questOf(U.camp.id);if(!q)return '';const cs=colsOf(q);
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Columns"><h2>Columns</h2>
  ${cs.map((c,i)=>`<div class="st"><input class="stin cin" data-i="${i}" value="${esc(c.name)}" aria-label="Column name" autocomplete="off"><button type="button" class="stx" data-act="colUp" data-i="${i}" aria-label="Move left" ${i?'':'disabled style="opacity:.15"'}>↑</button><button type="button" class="stx" data-act="colDn" data-i="${i}" aria-label="Move right" ${i<cs.length-1?'':'disabled style="opacity:.15"'}>↓</button>${c.done?'<span class="stx" style="visibility:hidden">×</span>':`<button type="button" class="stx" data-act="colDel" data-i="${i}" aria-label="Remove column">×</button>`}</div>`).join('')}
  <div class="st add"><span class="stp">+</span><input id="colNew" class="stin" placeholder="New column" autocomplete="off" aria-label="New column"></div>
  <p class="note" style="margin:10px 0 0;border:0;background:none;padding:0">The last ticked-off column counts as done. Removing a column moves its cards to the first column.</p></div>`;
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,i=+el.dataset.i;
  if(Date.now()<suppress)return;
  const q=U.camp?questOf(U.camp.id):null;
  switch(a){
    case 'campBack':U.camp=null;renderOverlay();renderMain();break;
    case 'campTab':U.camp.tab=el.dataset.v;U.camp.noteEdit=false;U.camp.note=null;U.camp.nedit=false;renderOverlay();if(el.dataset.v==='board')campFocusBoard();break;
    case 'campNoteEdit':U.camp.noteEdit=true;renderOverlay();{const x=$('#campNoteTx');x&&x.focus();}break;
    case 'briefEdit':U.camp.edit=el.dataset.v;renderOverlay();{const x=$('#bf_'+el.dataset.v);x&&x.focus();}break;
    case 'kTick':tick(el.dataset.id);break;
    case 'qEdit':{if(!q)break;U.qs={id:q.id,title:q.title,icon:q.icon,due:q.due||'',open:null,confirmDel:false,done:q.done};U.sheet='quest';renderOverlay();break;}
    case 'colsOpen':U.sheet='cols';renderOverlay();break;
    case 'colUp':if(q&&i>0){const c=colsOf(q);[c[i-1],c[i]]=[c[i],c[i-1]];save();renderOverlay();}break;
    case 'colDn':if(q){const c=colsOf(q);if(i<c.length-1){[c[i+1],c[i]]=[c[i],c[i+1]];save();renderOverlay();}}break;
    case 'colDel':if(q){const c=colsOf(q),gone=c[i];if(!gone||gone.done||c.length<2)break;c.splice(i,1);const to=(c.find(x=>!x.done)||c[0]).id;S.tasks.forEach(t=>{if(t.q===q.id&&t.col===gone.id){t.col=to;t.ord=endOrd(q,to,t);}});save();renderOverlay();}break;
  }
});
function addCol(){
  const q=questOf(U.camp.id),x=$('#colNew');if(!q||!x)return;const n=x.value.trim();if(!n)return;
  const c=colsOf(q),di=c.findIndex(k=>k.done);c.splice(di<0?c.length:di,0,{id:'c'+uid(),name:n});save();renderOverlay();setTimeout(()=>{const y=$('#colNew');y&&y.focus();},30);
}
function kAdd(col,txt){
  const q=questOf(U.camp.id);txt=(txt||'').trim();if(!q||!txt)return;
  const t={id:uid(),title:txt,cat:S.last||S.cats[0].id,date:'',time:'',dur:30,done:false,moves:0,createdAt:Date.now(),rep:'',q:q.id,col,ord:endOrd(q,col)};
  S.tasks.push(t);assignCol(t,col);save();logEv('added',t,{raw:txt,catManual:false,suggested:'',batch:false,viaBoard:true});
  renderOverlay();renderMain();setTimeout(()=>{const x=document.querySelector('.kin[data-col="'+col+'"]');if(x){x.focus();x.scrollIntoView({block:'nearest',inline:'nearest'});}},30);
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  if(e.target.classList&&e.target.classList.contains('kin')){e.preventDefault();kAdd(e.target.dataset.col,e.target.value);}
  else if(e.target.id==='colNew'){e.preventDefault();addCol();}
  else if(e.target.classList&&e.target.classList.contains('cin')){e.preventDefault();e.target.blur();}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset&&t.dataset.k&&t.id.startsWith('bf_')&&U.camp){const q=questOf(U.camp.id);if(q){q[t.dataset.k]=t.value;save();}}
  else if(t.id==='campNoteTx'&&U.camp){const q=questOf(U.camp.id);if(q){q.note=t.value;save();}}
  else if(t.classList&&t.classList.contains('cin')&&U.camp){const q=questOf(U.camp.id);const c=q&&colsOf(q)[+t.dataset.i];if(c){c.name=t.value;save();}}
});
document.addEventListener('focusout',e=>{
  if(e.target.id&&e.target.id.startsWith('bf_')&&U.camp){const q=questOf(U.camp.id),k=e.target.dataset.k;if(q){q[k]=(q[k]||'').trim();if(!q[k])delete q[k];save();}U.camp.edit=null;setTimeout(()=>{if(U.camp&&U.camp.tab==='brief'&&!U.sheet)renderOverlay();},0);}
  else if(e.target.id==='campNoteTx'&&U.camp){const q=questOf(U.camp.id);if(q){q.note=(q.note||'').trim();if(!q.note)delete q.note;save();}U.camp.noteEdit=false;setTimeout(()=>{if(U.camp&&U.camp.tab==='notes'&&!U.sheet)renderOverlay();},0);}
  else if(e.target.classList&&e.target.classList.contains('cin')){const q=U.camp&&questOf(U.camp.id);if(q){colsOf(q).forEach(c=>{if(!c.name.trim())c.name='Column';});save();}}
});

/* drag and drop: long-press on touch, immediate drag with a mouse */
let kd=null;
function kLift(){
  if(!kd||kd.on)return;kd.on=true;
  const r=kd.el.getBoundingClientRect();
  const g=kd.el.cloneNode(true);g.classList.add('kghost');g.style.width=r.width+'px';g.style.left=r.left+'px';g.style.top=r.top+'px';
  document.body.appendChild(g);kd.ghost=g;kd.ox=kd.x-r.left;kd.oy=kd.y-r.top;kd.cx=kd.x;kd.cy=kd.y;
  kd.el.classList.add('ph');if(navigator.vibrate)try{navigator.vibrate(12);}catch(x){}
  kd.loop=setInterval(kScroll,16);
}
function kScroll(){
  if(!kd||!kd.on)return;
  const b=document.querySelector('.kboard');
  if(b){const r=b.getBoundingClientRect();if(kd.cx<r.left+44)b.scrollLeft-=14;else if(kd.cx>r.right-44)b.scrollLeft+=14;}
  const at=document.elementFromPoint(kd.cx,kd.cy),box=at&&at.closest&&at.closest('.kcol')&&at.closest('.kcol').querySelector('.kcards');
  if(box){const r=box.getBoundingClientRect();if(kd.cy<r.top+40)box.scrollTop-=10;else if(kd.cy>r.bottom-40)box.scrollTop+=10;}
  kPlace();
}
function kPlace(){
  if(!kd||!kd.on)return;
  kd.ghost.style.transform='translate('+(kd.cx-kd.x)+'px,'+(kd.cy-kd.y)+'px)';
  kd.ghost.style.visibility='hidden';const at=document.elementFromPoint(kd.cx,kd.cy);kd.ghost.style.visibility='';
  const col=at&&at.closest&&at.closest('.kcol');if(!col)return;
  document.querySelectorAll('.kcol.hot').forEach(c=>{if(c!==col)c.classList.remove('hot');});col.classList.add('hot');
  const box=col.querySelector('.kcards');const cards=[...box.querySelectorAll('.kc:not(.ph)')];
  let before=null;for(const c of cards){const r=c.getBoundingClientRect();if(kd.cy<r.top+r.height/2){before=c;break;}}
  if(before){if(kd.el.nextSibling!==before||kd.el.parentNode!==box)box.insertBefore(kd.el,before);}
  else if(box.lastElementChild!==kd.el)box.appendChild(kd.el);
}
function kEnd(drop){
  if(!kd)return;const d=kd;kd=null;clearTimeout(d.t);if(!d.on)return;
  clearInterval(d.loop);d.ghost.remove();d.el.classList.remove('ph');document.querySelectorAll('.kcol.hot').forEach(c=>c.classList.remove('hot'));
  suppress=Date.now()+400;
  if(!drop){renderOverlay();return;}
  const t=S.tasks.find(x=>x.id===d.id),q=t&&questOf(t.q),colEl=d.el.closest('.kcol');if(!t||!q||!colEl){renderOverlay();return;}
  const col=colEl.dataset.col;
  [...colEl.querySelectorAll('.kc')].forEach((c,i)=>{const x=S.tasks.find(y=>y.id===c.dataset.id);if(x)x.ord=i*10;});
  const was=!!t.done,toDone=!!colsOf(q).find(c=>c.id===col).done;
  const from=d.from,pord=d.pord,cname=colsOf(q).find(c=>c.id===col).name;
  t.col=col;
  const undoMove=()=>{t.col=from;t.ord=pord;if(!!t.done!==was){t.done=was;t.doneAt=was?t.doneAt:null;(t.steps||[]).forEach(s=>{if(!was)s.done=false;});}save();render();};
  if(was!==toDone){tick(t.id);}else{save();renderOverlay();renderMain();if(from!==col)toast({face:5,text:'Moved to '+cname+'.'},undoMove);}
}
document.addEventListener('pointerdown',e=>{
  if(!U.camp||U.sheet)return;
  const c=e.target.closest('.kc');if(!c||e.target.closest('.cb'))return;
  const tk=S.tasks.find(x=>x.id===c.dataset.id)||{};kd={from:c.closest('.kcol').dataset.col,pord:tk.ord,el:c,id:c.dataset.id,x:e.clientX,y:e.clientY,pid:e.pointerId,on:false,mouse:e.pointerType==='mouse'};
  if(!kd.mouse)kd.t=setTimeout(kLift,260);
});
document.addEventListener('pointermove',e=>{
  if(!kd||e.pointerId!==kd.pid)return;
  if(!kd.on){
    const dx=e.clientX-kd.x,dy=e.clientY-kd.y;
    if(kd.mouse){if(Math.abs(dx)+Math.abs(dy)>6)kLift();else return;}
    else{if(Math.abs(dx)>9||Math.abs(dy)>9){clearTimeout(kd.t);kd=null;}return;}
  }
  kd.cx=e.clientX;kd.cy=e.clientY;kPlace();
});
document.addEventListener('pointerup',e=>{if(kd&&e.pointerId===kd.pid){if(kd.on)kEnd(true);else{clearTimeout(kd.t);kd=null;}}});
document.addEventListener('pointercancel',e=>{if(kd&&e.pointerId===kd.pid){if(kd.on)kEnd(false);else{clearTimeout(kd.t);kd=null;}}});
document.addEventListener('touchmove',e=>{if(kd&&kd.on)e.preventDefault();},{passive:false});
document.addEventListener('contextmenu',e=>{if(kd||e.target.closest&&e.target.closest('.kc'))e.preventDefault();});

function campFocusBoard(){const b=document.querySelector('.kboard');if(!b)return;const k=[...b.querySelectorAll('.kcol')].find(x=>x.querySelector('.kc'));if(k)b.scrollLeft=Math.max(0,k.offsetLeft-b.offsetLeft-16);}

/* ---------- week calendar ---------- */
const monOf=ds=>{const d=new Date(ds+'T12:00:00');return addDays(ds,-((d.getDay()+6)%7));};
function calStart(){if(!U.calStart)U.calStart=monOf(today());return U.calStart;}
function calHead(){
  const s=calStart(),e=addDays(s,6),ds=[...Array(7)].map((_,i)=>addDays(s,i));
  const open=S.tasks.filter(t=>!t.done&&t.date>=s&&t.date<=e).length;
  const pool=!open?['An empty week. Suspicious, but welcome.']:open<6?['Manageable. Do not tell the week I said so.']:open<14?[open+' open this week. Spread thin, spread kind.']:['Busy. The week has opinions, and so do I.'];
  const a=new Date(s+'T12:00:00'),b=new Date(e+'T12:00:00');
  const rng=a.getDate()+' '+MON[a.getMonth()]+' to '+b.getDate()+' '+MON[b.getMonth()];
  return {title:'Calendar',sub:rng.toUpperCase(),line:S.settings.mute?pickLine('muted',{n:open}):{face:open>13?4:open?5:6,text:pool[0]}};
}
function weekHTML(){
  const s=calStart(),td=today(),isNow=s===monOf(td);
  let h=`<div class="wnav"><button type="button" class="chip" data-act="calPrev" aria-label="Previous week">\u2039</button><button type="button" class="chip ${isNow?'on':''}" data-act="calToday">This week</button><button type="button" class="chip" data-act="calNext" aria-label="Next week">\u203a</button></div>`;
  for(let i=0;i<7;i++){
    const d=addDays(s,i),ts=S.tasks.filter(t=>t.date===d).sort((x,y)=>x.done!==y.done?(x.done?1:-1):(x.time||'99')<(y.time||'99')?-1:(x.time||'99')>(y.time||'99')?1:0);
    const dl=S.quests.filter(q=>!q.done&&q.due===d);
    const open=ts.filter(t=>!t.done).length;
    h+=`<section class="wd ${d===td?'now':''} ${d<td?'past':''}"><div class="wh"><b>${fmtHead(d)}</b><span>${d===td?'TODAY':d===addDays(td,1)?'TOMORROW':''}${open?(d===td||d===addDays(td,1)?' \u00b7 ':'')+open+' OPEN':''}</span><button type="button" class="wplus" data-act="calAdd" data-v="${d}" aria-label="Add a task on ${fmtHead(d)}">${ico('plus',18,'var(--bone)',2.2)}</button></div>`+
      dl.map(q=>`<div class="wdl" data-act="openQuest" data-id="${q.id}">${ico('flag',16,'var(--brass-l)',1.8)}<span>${esc(q.title)}</span><em>DEADLINE</em></div>`).join('')+
      (ts.length?ts.map(t=>rowHTML(t,false)).join(''):dl.length?'':'<p class="wfree">Free.</p>')+'</section>';
  }
  return h;
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||Date.now()<suppress)return;
  const a=el.dataset.act;
  if(a==='calPrev'){U.calStart=addDays(calStart(),-7);renderHead();renderMain();}
  else if(a==='calNext'){U.calStart=addDays(calStart(),7);renderHead();renderMain();}
  else if(a==='calToday'){U.calStart=monOf(today());renderHead();renderMain();}
  else if(a==='calAdd'){openAdd(null);U.add.date=el.dataset.v;U.add.over.date=true;U.add.time='';refreshMeta();}
  else if(a==='goto'&&el.dataset.v==='cal'){U.calStart=monOf(today());}
});
