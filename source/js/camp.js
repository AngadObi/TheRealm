/* ---------- campaigns as projects: topics, stages, cards, notes ---------- */
const TPLS={
 board:{name:'Standard board',sub:'Backlog, Doing, Blocked, Done',icon:'list',cols:[['Backlog'],['Doing'],['Blocked'],['Done',1]]},
 research:{name:'Research',sub:'To look into, Researching, Done, Revisit',icon:'compass',cols:[['To look into'],['Researching'],['Done',1],['Revisit']]},
 own:{name:'My own',sub:'You set the stages inside the topic',icon:'pen',cols:[['To do'],['Done',1]]}
};
const DEFCOLS=()=>[{id:'ideas',name:'Ideas'},{id:'todo',name:'To do'},{id:'doing',name:'Doing'},{id:'blocked',name:'Blocked'},{id:'done',name:'Done',done:true}];
function mkCols(k){return (TPLS[k]||TPLS.board).cols.map(([n,d])=>d?{id:'c'+uid(),name:n,done:true}:{id:'c'+uid(),name:n});}
function tpsOf(q){if(!q.topics)q.topics=[];return q.topics;}
function looseOf(q){
  let l=tpsOf(q).find(x=>x.loose);
  if(!l){
    const old=q.cols&&q.cols.length?q.cols:(S.tasks.some(t=>t.q===q.id)?DEFCOLS():[{id:'loose',name:'Unsorted'},{id:'done',name:'Done',done:true}]);
    l={id:'loose',qid:q.id,name:'Loose ends',desc:'Quick log. Sort these into topics when you feel like it.',loose:true,tpl:'own',cols:old};
    q.topics.push(l);
  }
  return l;
}
const asTp=x=>x.name!==undefined?x:looseOf(x);
function topicOf(q,id){return tpsOf(q).find(x=>x.id===id);}
function tpOfTask(t,q){q=q||questOf(t.q);return (t.topic&&topicOf(q,t.topic))||looseOf(q);}
function colsOf(x){const tp=asTp(x);if(!tp.cols||!tp.cols.length)tp.cols=mkCols('board');return tp.cols;}
function startCol(x){const cs=colsOf(x);return (cs.find(c=>c.id==='todo')||cs.find(c=>!c.done)||cs[0]).id;}
function doneCol(x){const cs=colsOf(x);return (cs.find(c=>c.done)||cs[cs.length-1]).id;}
function colOfTask(t,q){const tp=tpOfTask(t,q),cs=colsOf(tp);if(t.col&&cs.some(c=>c.id===t.col))return t.col;return t.done?doneCol(tp):startCol(tp);}
function tpTasks(q,tp){return S.tasks.filter(t=>t.q===q.id&&tpOfTask(t,q)===tp);}
function cardsOf(q,id,tp){
  tp=tp||looseOf(q);
  const ts=tpTasks(q,tp).filter(t=>colOfTask(t,q)===id);
  const miss=ts.filter(t=>typeof t.ord!=='number').sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  let m=Math.max(-10,...ts.filter(t=>typeof t.ord==='number').map(t=>t.ord));
  miss.forEach(t=>{m+=10;t.ord=m;});
  return ts.sort((a,b)=>a.ord-b.ord);
}
function endOrd(q,col,except,tp){
  const ts=cardsOf(q,col,tp).filter(t=>t!==except);
  return ts.length?ts[ts.length-1].ord+10:0;
}
function syncCol(t){
  if(!t.q)return;const q=questOf(t.q);if(!q)return;
  const tp=tpOfTask(t,q),cur=colsOf(tp).find(c=>c.id===t.col);
  if(t.done){if(!cur||!cur.done){t.col=doneCol(tp);t.ord=endOrd(q,t.col,t,tp);}}
  else if(!cur||cur.done){t.col=startCol(tp);t.ord=endOrd(q,t.col,t,tp);}
}
function assignCol(t,colId){
  if(!t.q){delete t.col;delete t.ord;delete t.topic;return;}
  const q=questOf(t.q);if(!q)return;const tp=tpOfTask(t,q),cs=colsOf(tp);
  const id=cs.some(c=>c.id===colId)?colId:(cs.some(c=>c.id===t.col)?t.col:(t.done?doneCol(tp):startCol(tp)));
  if(t.col!==id){t.col=id;t.ord=endOrd(q,id,t,tp);}
  const c=cs.find(x=>x.id===id);
  if(c.done&&!t.done){t.done=true;t.doneAt=Date.now();(t.steps||[]).forEach(s=>s.done=true);}
  else if(!c.done&&t.done){t.done=false;t.doneAt=null;}
}
/* the topic an open add sheet is working in */
function addTp(a){const q=questOf(a.q);if(!q)return null;const t=a.id&&S.tasks.find(x=>x.id===a.id);return t&&t.q===q.id?tpOfTask(t,q):looseOf(q);}

function cardHTML(t){
  const meta=[];
  if(t.date)meta.push(`<span class="kd2">${esc(shortDue(t.date).toLowerCase())}${t.time?' '+t.time:''}</span>`);
  (t.lab||[]).slice(0,3).forEach(l=>meta.push(`<span class="klb">${esc(l)}</span>`));
  if(t.note)meta.push(`<span class="kd2">${ico('pen',11,'currentColor',2)} note</span>`);
  return `<div class="kc ${t.done?'done':''}" data-id="${t.id}"><button type="button" class="cb" data-act="kTick" data-id="${t.id}" aria-label="${t.done?'Mark not done':'Mark done'}: ${esc(t.title)}" aria-pressed="${!!t.done}"><i class="${t.done?'on':''}">${t.done?ico('check',14,'currentColor',3.2):''}</i></button><div class="kt" data-act="cardOpen" data-id="${t.id}"><b>${esc(t.title)}</b>${t.desc?`<span class="kds">${esc(t.desc)}</span>`:''}${meta.length?`<span class="kmt">${meta.join('')}</span>`:''}</div></div>`;
}

/* kept for the victory screen and the pinned row */
function campStats(q){
  const ts=S.tasks.filter(t=>t.q===q.id),n=ts.length,done=ts.filter(t=>t.done).length;
  const inCol=id=>ts.filter(t=>colOfTask(t,q)===id&&!t.done).length;
  const left=q.due?diffDays(q.due,today()):null;
  const pc=n?Math.round(done/n*100):0;
  if(pc>(q.peak||0))q.peak=pc;
  return {n,done,pc,hold:Math.max(q.peak||0,pc),doing:inCol('doing'),blocked:inCol('blocked'),left,xp:done*10};
}
function rankOf(s,q){
  if(q.done||(s.n&&s.done===s.n))return ['Victory','crown'];
  if(!s.n)return ['Mustering','flag'];
  if(s.hold<40)return ['On the march','path'];
  if(s.hold<75)return ['Deep in enemy lands','compass'];
  return ['At the gates','focus'];
}
const MILES=[[25,'Muster the troops'],[50,'Cross the border'],[75,'Storm the gates'],[100,'Victory']];
function barHTML(s){return `<div class="hbar"><i class="held" style="width:${Math.max(3,s.hold)}%"></i><i style="width:${Math.max(3,s.pc)}%"></i></div>`;}

/* ---------- Sir Reg lines ---------- */
const PLINES={
 none:['No topics yet. A campaign without topics is a mood. Add one.','Start with one topic. Three is a lot. One is a beginning.'],
 some:['Pick a topic. Any topic. I will pretend to be impressed.','Big things are just small things that nobody sorted.','Log it now, sort it later. That is what the Loose ends are for.','Each topic is a drawer. Put things in drawers.'],
 topic0:['Empty stage. Add a card with the plus. It is not a commitment.','Nothing here yet. A fine place to begin.']
};
function pline(key,seed){const l=PLINES[key];let h=0;const k=seed+today();for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return l[h%l.length];}

/* ---------- the three screens ---------- */
const TPICON=k=>(TPLS[k]||TPLS.board).icon;
function accentOf(q,tp){const i=tpsOf(q).filter(x=>!x.loose).indexOf(tp);return PAL[(i<0?2:i+1)%PAL.length][1];}
function projBody(q){
  const C=U.camp,tops=tpsOf(q).filter(x=>!x.loose),lo=looseOf(q);
  const ln=tpTasks(q,lo).filter(t=>!t.done),latest=ln.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
  const due=q.done?'COMPLETE':q.due?'DUE '+shortDue(q.due):'';
  const desc=q.desc?`<p class="pdesc" data-act="qEdit">${linkify(q.desc)}</p>`:`<button type="button" class="badd" data-act="qEdit">+ A line about it</button>`;
  const tcard=(tp,acc)=>{
    const act=colsOf(tp).filter(c=>!c.done&&cardsOf(q,c.id,tp).length).slice(0,3);
    return `<button type="button" class="tcard" style="--tc:${acc}" data-act="topicOpen" data-id="${tp.id}"><span class="ti">${ico(tp.loose?'basket':TPICON(tp.tpl),22,acc,1.6)}</span><span class="tx"><b>${esc(tp.name)}</b>${tp.desc?`<i>${esc(tp.desc)}</i>`:''}${tp.loose&&latest?`<em class="tgs2"><span>Latest: ${esc(latest.title.length>34?latest.title.slice(0,33)+'…':latest.title)}</span></em>`:act.length?`<em class="tgs2">${act.map(c=>`<span>${esc(c.name)}</span>`).join('')}</em>`:''}</span>${ico('chevr',18,'var(--dim)',2)}</button>`;
  };
  return `<div class="tview" data-lv="top"><section class="phero"><span class="crest">${ico(q.icon,30,'#FFF3E3',1.5)}</span><div class="pht"><h1>${esc(q.title)}</h1>${due?`<span class="pdue">${due}</span>`:''}</div></section>${desc}
  <div class="sirl"><img src="${kn(tops.length?6:5)}" alt=""><p>${esc(pline(tops.length?'some':'none',q.id))}</p></div>
  <div class="arow plog"><input id="qlog" class="inp" type="text" placeholder="Quick log: type it now, sort it later" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" aria-label="Quick log"><button type="button" class="go" data-act="qlog" aria-label="Log it">${ico('plus',22,'currentColor',2.6)}</button></div>
  <h4 class="psec">Topics</h4>
  <div class="tgrid">${tops.map(tp=>tcard(tp,accentOf(q,tp))).join('')}<button type="button" class="tcard tnew" data-act="topicNew"><span class="ti">${ico('plus',22,'var(--dim)',2)}</span><span class="tx"><b>Add a topic</b><i>A big area inside this campaign</i></span></button>${tcard(lo,'#9DB6C8')}</div></div>`;
}
function topicBody(q,tp){
  const C=U.camp,cs=colsOf(tp),acc=accentOf(q,tp);C.shut=C.shut||{};
  const total=tpTasks(q,tp).length;
  const secs=cs.map(c=>{
    const cards=cardsOf(q,c.id,tp),shut=(c.id in C.shut)?C.shut[c.id]:!!c.done,col=c.done?'#7C7A6E':acc;
    return `<section class="kcol stg ${shut?'shut':''} ${c.done?'dn':''}" data-col="${c.id}" style="--tc:${col}"><button type="button" class="bplus" data-act="stgAdd" data-v="${c.id}" aria-label="Add a card to ${esc(c.name)}">${ico('plus',18,'var(--bone)',2.2)}</button><button type="button" class="wbn wbb" style="--tc:${col}" data-act="stgShut" data-v="${c.id}" aria-expanded="${!shut}">${ico(c.done?'check':'flag',20,col,1.7)}<b>${esc(c.name)}</b><span class="chv">${ico('chev',18,'var(--dim)',1.8)}</span></button><div class="kcards">${cards.map(cardHTML).join('')}</div>${C.addIn===c.id?`<input class="kin" data-col="${c.id}" placeholder="New card, then Enter" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" aria-label="Add a card to ${esc(c.name)}">`:''}</section>`;
  }).join('');
  return `<div class="tview" data-lv="t:${tp.id}">${tp.desc?`<p class="pdesc" style="margin-top:0">${esc(tp.desc)}</p>`:''}${total?'':`<div class="sirl"><img src="${kn(5)}" alt=""><p>${esc(pline('topic0',tp.id))}</p></div>`}${secs}</div>`;
}
function cardBody(q,tp,t){
  const C=U.camp,cs=colsOf(tp),cur=colOfTask(t,q),tops=tpsOf(q);
  const lab=(t.lab||[]).map((l,i)=>`<span class="kw">${esc(l)}<button type="button" data-act="labDel" data-v="${i}" aria-label="Remove ${esc(l)}">${ico('x',12,'currentColor',2.4)}</button></span>`).join('');
  return `<div class="tview cdt" data-lv="c:${t.id}"><input id="cdTitle" class="inp ctitle" type="text" value="${esc(t.title)}" autocomplete="off" aria-label="Card title"><input id="cdDesc" class="inp" style="margin-top:10px" type="text" value="${esc(t.desc||'')}" placeholder="One line about it" autocomplete="off" aria-label="One line about it">
  <h4 class="psec">Stage</h4><div class="chips sm">${cs.map(c=>`<button type="button" class="chip ${c.id===cur?'on':''}" data-act="cardStage" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>
  <h4 class="psec">Topic</h4><div class="chips sm">${tops.filter(x=>!x.loose).concat([looseOf(q)]).map(x=>`<button type="button" class="chip ${x===tp?'on':''}" data-act="cardTopic" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
  <h4 class="psec">Labels</h4><div class="kws">${lab}</div><div class="arow" style="margin-top:${lab?12:0}px"><input id="cdLab" class="inp" type="text" placeholder="Add a label, then Enter" autocomplete="off" aria-label="Add a label"><button type="button" class="go" data-act="labAdd" aria-label="Add label">${ico('plus',22,'currentColor',2.6)}</button></div>
  <h4 class="psec">Date</h4><div class="arow"><input id="cdDate" class="inp" type="date" value="${t.date||''}" aria-label="Date"><button type="button" class="btn ghost" style="flex:none;min-width:0;padding:0 16px" data-act="cdNoDate">Clear</button></div><p class="pnote">A date puts this card on your Today list on that day.</p>
  <h4 class="psec">Notes</h4><textarea id="cdNote" class="tb cdnote" rows="7" placeholder="Details, links, who you are waiting for, anything." aria-label="Notes">${esc(t.note||'')}</textarea>
  <button type="button" class="lnk" data-act="cardDel">${C.cdel?'Tap again to drop this card':'Drop this card'}</button></div>`;
}
function campHTML(){
  const C=U.camp,q=questOf(C.id);if(!q){U.camp=null;return '';}
  tpsOf(q);looseOf(q);
  if(C.tab!=='notes')C.tab='topics';
  const tp=C.topic?topicOf(q,C.topic):null,t=C.card?S.tasks.find(x=>x.id===C.card&&x.q===q.id):null;
  if(C.topic&&!tp)C.topic=null;if(C.card&&!t)C.card=null;
  const back=`<button type="button" class="cbk" data-act="campBack" aria-label="Back">${ico('chevr',22,'var(--bone)',2)}</button>`;
  let head,body,tabs='';
  if(t){
    const ttp=tpOfTask(t,q);
    head=`<div class="chd">${back}<div class="ctt"><b>${esc(t.title.length>26?t.title.slice(0,25)+'…':t.title)}</b><i>${esc(ttp.name.toUpperCase())}</i></div><span class="cbk" style="visibility:hidden"></span></div>`;
    body=cardBody(q,ttp,t);
  }else if(tp){
    head=`<div class="chd">${back}<div class="ctt"><b>${esc(tp.name)}</b><i>${esc(q.title.toUpperCase())}</i></div><button type="button" class="cbk" data-act="colsOpen" aria-label="Stages">${ico('gear',20,'var(--brass-l)',1.6)}</button><button type="button" class="cbk ed" data-act="topicEdit" aria-label="Edit topic">${ico('pen',20,'var(--brass-l)',1.7)}</button></div>`;
    body=topicBody(q,tp);
  }else{
    const due=q.done?'COMPLETE':q.due?'DUE '+shortDue(q.due):'NO DEADLINE';
    head=`<div class="chd">${back}<div class="ctt"><b>${esc(q.title)}</b><i>${due}</i></div><button type="button" class="cbk ed" data-act="qEdit" aria-label="Edit campaign">${ico('pen',20,'var(--brass-l)',1.7)}</button></div>`;
    if(!(C.note&&C.tab==='notes'))tabs=`<div class="trow"><div class="seg" role="tablist">${[['topics','Topics'],['notes','Notes']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${C.tab===k}" class="${C.tab===k?'on':''}" data-act="campTab" data-v="${k}">${l}</button>`).join('')}</div></div>`;
    body=C.tab==='notes'?notesTabHTML(q):projBody(q);
  }
  return `<div class="full camp" role="dialog" aria-label="${esc(q.title)}">${head}${tabs}${body}</div>`;
}

/* ---------- stage editor (per topic) ---------- */
function colsSheetHTML(){
  const q=questOf(U.camp.id),tp=q&&topicOf(q,U.camp.topic);if(!tp)return '';const cs=colsOf(tp);
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Stages"><h2>Stages</h2>
  ${cs.map((c,i)=>`<div class="st"><input class="stin cin" data-i="${i}" value="${esc(c.name)}" aria-label="Stage name" autocomplete="off"><button type="button" class="stx" style="${c.done?'color:var(--glow)':''}" data-act="colDone" data-i="${i}" aria-label="${c.done?'Counts as done':'Does not count as done'}" aria-pressed="${!!c.done}">${ico('check',16,c.done?'var(--glow)':'var(--dim)',2.2)}</button><button type="button" class="stx" data-act="colUp" data-i="${i}" aria-label="Move up" ${i?'':'disabled style="opacity:.15"'}>↑</button><button type="button" class="stx" data-act="colDn" data-i="${i}" aria-label="Move down" ${i<cs.length-1?'':'disabled style="opacity:.15"'}>↓</button><button type="button" class="stx" data-act="colDel" data-i="${i}" aria-label="Remove stage" ${cs.length<2?'disabled style="opacity:.15"':''}>×</button></div>`).join('')}
  <div class="st add"><span class="stp">+</span><input id="colNew" class="stin" placeholder="New stage" autocomplete="off" aria-label="New stage"></div>
  <p class="note" style="margin:10px 0 0;border:0;background:none;padding:0">The tick marks a stage that counts as done. Removing a stage moves its cards to the first one.</p>
  <h3 style="margin:14px 0 6px;font:500 12px var(--mono);letter-spacing:.12em;color:var(--dim)">OR START FROM A TEMPLATE</h3>
  <div class="chips sm" style="margin-top:0"><button type="button" class="chip" data-act="colTpl" data-v="board">Standard board</button><button type="button" class="chip" data-act="colTpl" data-v="research">Research</button></div></div>`;
}
/* ---------- topic sheet ---------- */
function topicSheetHTML(){
  const p=U.tp,edit=!!p.id;
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="${edit?'Edit topic':'New topic'}"><h2>${edit?'Topic':'New topic'}</h2>
  <div class="arow"><input id="tpName" class="inp" type="text" value="${esc(p.name)}" placeholder="Topic name, e.g. Networking" autocomplete="off" aria-label="Topic name"><button type="button" class="go" data-act="tpSave" aria-label="Save topic">${ico(edit?'check':'plus',22,'currentColor',2.6)}</button></div>
  <input id="tpDesc" class="inp" style="margin-top:10px" type="text" value="${esc(p.desc||'')}" placeholder="One line about it (optional)" autocomplete="off" aria-label="One line about the topic">
  ${edit?'':`<h3 style="margin:14px 0 6px;font:500 12px var(--mono);letter-spacing:.12em;color:var(--dim)">STAGES</h3><div class="tpls">${Object.keys(TPLS).map(k=>`<button type="button" class="tpl ${p.tpl===k?'on':''}" data-act="tpTpl" data-v="${k}"><b>${TPLS[k].name}</b><i>${TPLS[k].sub}</i></button>`).join('')}</div>`}
  ${edit&&!p.loose?`<button type="button" class="lnk" data-act="tpDel">${p.confirmDel?'Tap again to drop this topic. Its cards move to Loose ends':'Drop this topic'}</button>`:''}</div>`;
}

/* ---------- guided creation ---------- */
function pgOpen(){U.pg={step:0,title:'',desc:'',due:'',icon:'flag',topics:[],tin:''};U.menu=false;renderOverlay();setTimeout(()=>{const x=$('#pgTitle');x&&x.focus();},120);}
function pgHTML(){
  const P=U.pg,back=`<button type="button" class="cbk" data-act="pgBack" aria-label="Back">${ico('chevr',22,'var(--bone)',2)}</button>`;
  const head=`<div class="chd">${back}<div class="ctt"><b>New campaign</b><i>${P.step?'THE TOPICS':'THE BRIEF'}</i></div><span class="pgd"><i class="${P.step?'':'on'}"></i><i class="${P.step?'on':''}"></i></span></div>`;
  let body,foot;
  if(!P.step){
    body=`<div class="tview" data-lv="pg0"><div class="sirl"><img src="${kn(5)}" alt=""><p>What are we taking on? Give it a name and a line of what it is.</p></div>
    <h4 class="psec">Name</h4><input id="pgTitle" class="inp" type="text" value="${esc(P.title)}" placeholder="e.g. Job hunt" enterkeyhint="next" autocomplete="off" autocapitalize="sentences" aria-label="Campaign name">
    <h4 class="psec">What is it about? <small>optional</small></h4><textarea id="pgDesc" class="tb" rows="3" placeholder="A line or two. Why this exists." aria-label="Description">${esc(P.desc)}</textarea>
    <h4 class="psec">Deadline <small>optional</small></h4><div class="arow"><input id="pgDue" class="inp" type="date" value="${P.due||''}" aria-label="Deadline"><button type="button" class="btn ghost" style="flex:none;min-width:0;padding:0 16px" data-act="pgNoDue">None</button></div>
    <h4 class="psec">Emblem</h4><div class="chips sm" style="gap:6px">${CATICONS.map(([k,l])=>`<button type="button" class="chip ${P.icon===k?'on':''}" style="width:46px;padding:0;justify-content:center" data-act="pgIcon" data-v="${k}" aria-label="${l}">${ico(k,22,'var(--brass-l)',1.5)}</button>`).join('')}</div></div>`;
    foot=`<button type="button" class="btn" data-act="pgNext">Next: topics</button>`;
  }else{
    body=`<div class="tview" data-lv="pg1"><div class="sirl"><img src="${kn(6)}" alt=""><p>Topics are the big areas inside. Add the first few now. More can come later.</p></div>
    <div class="arow"><input id="pgTin" class="inp" type="text" value="${esc(P.tin)}" placeholder="e.g. Documents, Networking" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" aria-label="Topic name"><button type="button" class="go" data-act="pgAddT" aria-label="Add topic">${ico('plus',22,'currentColor',2.6)}</button></div>
    ${P.topics.map((x,i)=>`<div class="pgt"><div class="pgth"><b>${esc(x.name)}</b><button type="button" class="stx" data-act="pgDelT" data-i="${i}" aria-label="Remove ${esc(x.name)}">${ico('x',16,'currentColor',2)}</button></div><div class="chips sm" style="margin-top:8px">${Object.keys(TPLS).map(k=>`<button type="button" class="chip ${x.tpl===k?'on':''}" data-act="pgTpl" data-i="${i}" data-v="${k}">${TPLS[k].name}</button>`).join('')}</div></div>`).join('')}
    ${P.topics.length?`<p class="pnote">${P.topics.some(x=>x.tpl==='own')?'My own: you set the stages the first time you open the topic. ':''}Standard board is Backlog, Doing, Blocked, Done. Research is To look into, Researching, Done, Revisit.</p>`:`<p class="pnote">You can also skip this and add topics inside the campaign.</p>`}</div>`;
    foot=`<button type="button" class="btn" data-act="pgCreate">Create campaign</button>`;
  }
  return `<div class="full camp pg" role="dialog" aria-label="New campaign">${head}${body}<div class="pgfoot">${foot}</div></div>`;
}
function pgAddTopic(){
  const P=U.pg,x=$('#pgTin'),n=((x&&x.value)||P.tin||'').trim();if(!n)return;
  P.topics.push({name:n[0].toUpperCase()+n.slice(1),tpl:'board'});P.tin='';renderOverlay();setTimeout(()=>{const y=$('#pgTin');y&&y.focus();},30);
}
function pgCreate(){
  const P=U.pg,pend=($('#pgTin')||{}).value;if(pend&&pend.trim())pgAddTopic();
  const q={id:uid(),title:P.title.trim(),icon:P.icon,due:P.due||'',created:Date.now(),topics:[]};
  if(P.desc.trim())q.desc=P.desc.trim();
  q.topics.push({id:'loose',qid:q.id,name:'Loose ends',desc:'Quick log. Sort these into topics when you feel like it.',loose:true,tpl:'own',cols:[{id:'loose',name:'Unsorted'},{id:'done',name:'Done',done:true}]});
  P.topics.forEach(x=>q.topics.push({id:'t'+uid(),qid:q.id,name:x.name,desc:'',tpl:x.tpl,cols:mkCols(x.tpl),fresh:x.tpl==='own'}));
  S.quests.push(q);save();U.pg=null;U.camp={id:q.id,tab:'topics'};say('added');render();
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,i=+el.dataset.i,v=el.dataset.v,id=el.dataset.id;
  if(Date.now()<suppress)return;
  if(U.pg){
    const P=U.pg;
    switch(a){
      case 'pgBack':if(P.step){P.step=0;renderOverlay();}else{U.pg=null;renderOverlay();}return;
      case 'pgNext':{const x=$('#pgTitle');if(x)P.title=x.value;if(!P.title.trim()){toast({face:2,text:'A campaign needs a name, my lord.'});return;}P.step=1;renderOverlay();setTimeout(()=>{const y=$('#pgTin');y&&y.focus();},120);return;}
      case 'pgIcon':P.icon=v;renderOverlay();return;
      case 'pgNoDue':P.due='';renderOverlay();return;
      case 'pgAddT':pgAddTopic();return;
      case 'pgDelT':P.topics.splice(i,1);renderOverlay();return;
      case 'pgTpl':if(P.topics[i]){P.topics[i].tpl=v;renderOverlay();}return;
      case 'pgCreate':pgCreate();return;
    }
  }
  const C=U.camp,q=C?questOf(C.id):null,tp=q&&C.topic?topicOf(q,C.topic):null,t=q&&C.card?S.tasks.find(x=>x.id===C.card):null;
  switch(a){
    case 'campBack':
      if(C.card){C.card=null;C.cdel=false;renderOverlay();}
      else if(C.topic){C.topic=null;C.addIn=null;renderOverlay();}
      else{U.camp=null;renderOverlay();renderMain();}break;
    case 'campTab':C.tab=v;C.noteEdit=false;C.note=null;C.nedit=false;renderOverlay();break;
    case 'campNoteEdit':C.noteEdit=true;renderOverlay();{const x=$('#campNoteTx');x&&x.focus();}break;
    case 'kTick':tick(id);break;
    case 'qEdit':{if(!q)break;U.qs={id:q.id,title:q.title,desc:q.desc||'',icon:q.icon,due:q.due||'',open:null,confirmDel:false,done:q.done};U.sheet='quest';renderOverlay();break;}
    case 'qlog':qLog();break;
    case 'topicOpen':{if(!q)break;const x=topicOf(q,id);if(!x)break;C.topic=x.id;C.shut={};C.addIn=null;if(x.fresh){delete x.fresh;save();U.sheet='cols';}renderOverlay();break;}
    case 'topicNew':U.tp={id:null,name:'',desc:'',tpl:'board'};U.sheet='topic';renderOverlay();setTimeout(()=>{const x=$('#tpName');x&&x.focus();},60);break;
    case 'topicEdit':if(tp){U.tp={id:tp.id,name:tp.name,desc:tp.desc||'',tpl:tp.tpl,loose:!!tp.loose,confirmDel:false};U.sheet='topic';renderOverlay();}break;
    case 'tpTpl':U.tp.tpl=v;renderOverlay();break;
    case 'tpSave':{
      const p=U.tp;p.name=(($('#tpName')||{}).value||'').trim();p.desc=(($('#tpDesc')||{}).value||'').trim();if(!p.name){toast({face:2,text:'A topic needs a name.'});break;}
      if(p.id){const o=q&&topicOf(q,p.id);if(o){o.name=p.name;if(p.desc)o.desc=p.desc;else delete o.desc;}}
      else if(q){const nt={id:'t'+uid(),qid:q.id,name:p.name,desc:p.desc,tpl:p.tpl,cols:mkCols(p.tpl),fresh:p.tpl==='own'};q.topics.push(nt);}
      save();U.sheet=null;U.tp=null;renderOverlay();break;}
    case 'tpDel':{
      if(!U.tp.confirmDel){U.tp.name=($('#tpName')||{}).value||U.tp.name;U.tp.confirmDel=true;renderOverlay();break;}
      const lo=q&&looseOf(q),gone=q&&topicOf(q,U.tp.id);if(!gone||gone.loose)break;
      S.tasks.filter(x=>x.q===q.id&&x.topic===gone.id).forEach(x=>{x.topic=lo.id;x.col=x.done?doneCol(lo):startCol(lo);x.ord=endOrd(q,x.col,x,lo);});
      q.topics=q.topics.filter(x=>x!==gone);C.topic=null;save();U.sheet=null;U.tp=null;render();break;}
    case 'colsOpen':U.sheet='cols';renderOverlay();break;
    case 'colUp':if(tp&&i>0){const c=colsOf(tp);[c[i-1],c[i]]=[c[i],c[i-1]];save();renderOverlay();}break;
    case 'colDn':if(tp){const c=colsOf(tp);if(i<c.length-1){[c[i+1],c[i]]=[c[i],c[i+1]];save();renderOverlay();}}break;
    case 'colDone':if(tp){const c=colsOf(tp)[i];if(c){c.done=!c.done;if(!c.done)delete c.done;S.tasks.forEach(x=>{if(x.q===q.id&&tpOfTask(x,q)===tp)syncCol(x);});save();renderOverlay();renderMain();}}break;
    case 'colDel':if(tp){const c=colsOf(tp);if(c.length<2)break;const gone=c[i];if(!gone)break;c.splice(i,1);const to=(c.find(x=>!x.done)||c[0]).id;S.tasks.forEach(x=>{if(x.q===q.id&&tpOfTask(x,q)===tp&&x.col===gone.id){x.col=to;x.ord=endOrd(q,to,x,tp);}});S.tasks.forEach(x=>{if(x.q===q.id&&tpOfTask(x,q)===tp)syncCol(x);});save();renderOverlay();renderMain();}break;
    case 'colTpl':if(tp){const old=colsOf(tp).slice(),nc=mkCols(v);
      S.tasks.forEach(x=>{if(!(x.q===q.id&&tpOfTask(x,q)===tp))return;const oc=old.find(c=>c.id===(x.col||''));const m=oc&&nc.find(c=>c.name.toLowerCase()===oc.name.toLowerCase());x.col=m?m.id:(x.done?(nc.find(c=>c.done)||nc[0]).id:(nc.find(c=>!c.done)||nc[0]).id);});
      tp.cols=nc;tp.tpl=v;S.tasks.forEach(x=>{if(x.q===q.id&&tpOfTask(x,q)===tp){x.ord=undefined;syncCol(x);}});save();renderOverlay();renderMain();}break;
    case 'stgShut':{C.shut=C.shut||{};const c=tp&&colsOf(tp).find(x=>x.id===v);const cur=(v in C.shut)?C.shut[v]:!!(c&&c.done);C.shut[v]=!cur;renderOverlay();break;}
    case 'stgAdd':{C.addIn=C.addIn===v?null:v;C.shut=C.shut||{};C.shut[v]=false;renderOverlay();setTimeout(()=>{const x=document.querySelector('.kin');x&&x.focus();},40);break;}
    case 'cardOpen':C.card=id;C.cdel=false;renderOverlay();break;
    case 'cardStage':if(t&&q){const ttp=tpOfTask(t,q),was=!!t.done,toDone=!!colsOf(ttp).find(c=>c.id===v).done;t.col=v;t.ord=endOrd(q,v,t,ttp);if(was!==toDone)tick(t.id);else{save();renderOverlay();renderMain();}}break;
    case 'cardTopic':if(t&&q){const nt=topicOf(q,id);if(!nt)break;t.topic=nt.id;t.col=t.done?doneCol(nt):startCol(nt);t.ord=endOrd(q,t.col,t,nt);save();renderOverlay();renderMain();}break;
    case 'labAdd':cardLabel();break;
    case 'labDel':if(t){(t.lab||[]).splice(i,1);if(!t.lab.length)delete t.lab;save();renderOverlay();}break;
    case 'cdNoDate':if(t){t.date='';t.time='';save();renderOverlay();renderMain();}break;
    case 'cardDel':if(t){if(!C.cdel){C.cdel=true;renderOverlay();break;}const idx=S.tasks.indexOf(t);S.tasks.splice(idx,1);C.card=null;C.cdel=false;save();render();toast({face:6,text:'Card dropped.'},()=>{S.tasks.splice(Math.min(idx,S.tasks.length),0,t);save();render();});}break;
  }
});
function qLog(){
  const C=U.camp,q=C&&questOf(C.id),x=$('#qlog');if(!q||!x)return;const txt=x.value.trim();if(!txt)return;
  const lo=looseOf(q),col=startCol(lo);
  const t={id:uid(),title:txt[0].toUpperCase()+txt.slice(1),cat:S.last||S.cats[0].id,date:'',time:'',dur:30,done:false,moves:0,createdAt:Date.now(),rep:'',q:q.id,topic:lo.id,col,ord:endOrd(q,col,null,lo)};
  S.tasks.push(t);save();logEv('added',t,{raw:txt,catManual:false,suggested:'',batch:false,viaLog:true});
  renderOverlay();renderMain();toast({face:6,text:'Logged in Loose ends.'});setTimeout(()=>{const y=$('#qlog');y&&y.focus();},40);
}
function cardLabel(){
  const C=U.camp,q=C&&questOf(C.id),t=q&&S.tasks.find(x=>x.id===C.card),x=$('#cdLab');if(!t||!x)return;const l=x.value.trim();if(!l)return;
  t.lab=t.lab||[];if(!t.lab.some(y=>y.toLowerCase()===l.toLowerCase()))t.lab.push(l);save();renderOverlay();setTimeout(()=>{const y=$('#cdLab');y&&y.focus();},40);
}
function addCol(){
  const q=questOf(U.camp.id),tp=q&&topicOf(q,U.camp.topic),x=$('#colNew');if(!tp||!x)return;const n=x.value.trim();if(!n)return;
  const c=colsOf(tp),di=c.findIndex(k=>k.done);c.splice(di<0?c.length:di,0,{id:'c'+uid(),name:n});save();renderOverlay();setTimeout(()=>{const y=$('#colNew');y&&y.focus();},30);
}
function kAdd(col,txt){
  const q=questOf(U.camp.id),tp=q&&topicOf(q,U.camp.topic);txt=(txt||'').trim();if(!q||!tp||!txt)return;
  const t={id:uid(),title:txt[0].toUpperCase()+txt.slice(1),cat:S.last||S.cats[0].id,date:'',time:'',dur:30,done:false,moves:0,createdAt:Date.now(),rep:'',q:q.id,topic:tp.id,col,ord:endOrd(q,col,null,tp)};
  S.tasks.push(t);assignCol(t,col);save();logEv('added',t,{raw:txt,catManual:false,suggested:'',batch:false,viaBoard:true});
  renderOverlay();renderMain();setTimeout(()=>{const x=document.querySelector('.kin[data-col="'+col+'"]');if(x){x.focus();x.scrollIntoView({block:'nearest'});}},30);
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;const t=e.target,id=t.id;
  if(t.classList&&t.classList.contains('kin')){e.preventDefault();kAdd(t.dataset.col,t.value);}
  else if(id==='colNew'){e.preventDefault();addCol();}
  else if(t.classList&&t.classList.contains('cin')){e.preventDefault();t.blur();}
  else if(id==='qlog'){e.preventDefault();qLog();}
  else if(id==='cdLab'){e.preventDefault();cardLabel();}
  else if(id==='cdTitle'||id==='cdDesc'){e.preventDefault();t.blur();}
  else if(id==='pgTin'){e.preventDefault();pgAddTopic();}
  else if(id==='pgTitle'){e.preventDefault();U.pg&&(U.pg.title=t.value);const b=document.querySelector('[data-act=pgNext]');b&&b.click();}
  else if(id==='tpName'){e.preventDefault();const b=document.querySelector('[data-act=tpSave]');b&&b.click();}
});
document.addEventListener('input',e=>{
  const t=e.target,id=t.id;
  if(U.pg){if(id==='pgTitle')U.pg.title=t.value;else if(id==='pgDesc')U.pg.desc=t.value;else if(id==='pgDue')U.pg.due=t.value;else if(id==='pgTin')U.pg.tin=t.value;return;}
  if(U.tp&&id==='tpName')U.tp.name=t.value;else if(U.tp&&id==='tpDesc')U.tp.desc=t.value;
  if(U.qs&&id==='qDesc')U.qs.desc=t.value;
  if(!U.camp)return;
  const q=questOf(U.camp.id);if(!q)return;
  if(id==='campNoteTx'){q.note=t.value;save();}
  else if(t.classList&&t.classList.contains('cin')){const tp=topicOf(q,U.camp.topic),c=tp&&colsOf(tp)[+t.dataset.i];if(c){c.name=t.value;save();}}
  else if(id==='cdTitle'||id==='cdDesc'||id==='cdNote'||id==='cdDate'){
    const k=S.tasks.find(x=>x.id===U.camp.card);if(!k)return;
    if(id==='cdTitle'){if(t.value.trim())k.title=t.value;}
    else if(id==='cdDesc'){if(t.value.trim())k.desc=t.value;else delete k.desc;}
    else if(id==='cdNote'){if(t.value.trim())k.note=t.value;else delete k.note;}
    else{k.date=t.value||'';if(!k.date)k.time='';}
    save();if(id==='cdDate')renderMain();
  }
});
document.addEventListener('focusout',e=>{
  const t=e.target,id=t.id;if(!U.camp)return;
  if(id==='campNoteTx'){const q=questOf(U.camp.id);if(q){q.note=(q.note||'').trim();if(!q.note)delete q.note;save();}U.camp.noteEdit=false;setTimeout(()=>{if(U.camp&&U.camp.tab==='notes'&&!U.sheet)renderOverlay();},0);}
  else if(id==='cdTitle'){const k=S.tasks.find(x=>x.id===U.camp.card);if(k&&!t.value.trim())t.value=k.title;}
  else if(t.classList&&t.classList.contains('cin')){const q=questOf(U.camp.id),tp=q&&topicOf(q,U.camp.topic);if(tp){colsOf(tp).forEach(c=>{if(!c.name.trim())c.name='Stage';});save();}}
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
  const sc=document.querySelector('.tview');
  if(sc){const r=sc.getBoundingClientRect();if(kd.cy<r.top+70)sc.scrollTop-=12;else if(kd.cy>r.bottom-70)sc.scrollTop+=12;}
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
  const ttp=tpOfTask(t,q),was=!!t.done,toDone=!!colsOf(ttp).find(c=>c.id===col).done;
  const from=d.from,pord=d.pord,cname=colsOf(ttp).find(c=>c.id===col).name;
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
    h+=`<section data-d="${d}" class="wd ${d===td?'now':''} ${d<td?'past':''}"><div class="wh"><b>${fmtHead(d)}</b><span>${d===td?'TODAY':d===addDays(td,1)?'TOMORROW':''}${open?(d===td||d===addDays(td,1)?' \u00b7 ':'')+open+' OPEN':''}</span><button type="button" class="wplus" data-act="calAdd" data-v="${d}" aria-label="Add a task on ${fmtHead(d)}">${ico('plus',18,'var(--bone)',2.2)}</button></div>`+
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

/* ---------- calendar: long-press a task, drag it to another day ---------- */
let cd=null;
function cdClear(){document.querySelectorAll('.wd.drop,.wnav .chip.hov').forEach(e=>e.classList.remove('drop','hov'));}
function cdLoop(){
  if(!cd||!cd.lifted)return;
  const m=$('#main');if(m){const r=m.getBoundingClientRect();let v=0;
    if(cd.cy<r.top+80)v=-Math.min(14,(r.top+80-cd.cy)/5);else if(cd.cy>r.bottom-100)v=Math.min(14,(cd.cy-(r.bottom-100))/5);
    if(v)m.scrollTop+=v;}
  cdTarget();cd.raf=requestAnimationFrame(cdLoop);
}
function cdTarget(){
  const el=document.elementFromPoint(cd.cx,cd.cy);cdClear();
  const nav=el&&el.closest('[data-act="calPrev"],[data-act="calNext"]');
  if(nav){nav.classList.add('hov');const a=nav.dataset.act;
    if(cd.nav!==a){cd.nav=a;clearTimeout(cd.nt);cd.nt=setTimeout(()=>{U.calStart=addDays(calStart(),a==='calPrev'?-7:7);renderHead();renderMain();cd.nav=null;},650);}
    cd.tgt=null;return;
  }
  if(cd.nav){cd.nav=null;clearTimeout(cd.nt);}
  const sec=el&&el.closest('.wd');
  if(sec){sec.classList.add('drop');cd.tgt=sec.dataset.d;}else cd.tgt=null;
}
document.addEventListener('pointerdown',e=>{
  if(U.view!=='cal'||U.sheet||U.council||U.camp)return;
  const row=e.target.closest('.row');if(!row||e.target.closest('.cb')||!row.dataset.id)return;
  cd={row,id:row.dataset.id,x:e.clientX,y:e.clientY,cx:e.clientX,cy:e.clientY,pid:e.pointerId,lifted:false,tgt:null};
  cd.t=setTimeout(()=>{
    if(!cd)return;cd.lifted=true;
    const r=row.getBoundingClientRect();cd.ox=cd.x-r.left;cd.oy=cd.y-r.top;
    const g=row.cloneNode(true);g.classList.add('cdghost');g.style.width=r.width+'px';g.style.left='0';g.style.top='0';
    document.body.appendChild(g);cd.g=g;g.style.transform='translate('+(cd.cx-cd.ox)+'px,'+(cd.cy-cd.oy)+'px) rotate(-1.5deg)';
    row.classList.add('cdlift');document.body.classList.add('cdon');
    if(navigator.vibrate)try{navigator.vibrate(14);}catch(x){}
    cd.raf=requestAnimationFrame(cdLoop);
  },280);
});
document.addEventListener('pointermove',e=>{
  if(!cd||e.pointerId!==cd.pid)return;
  cd.cx=e.clientX;cd.cy=e.clientY;
  if(!cd.lifted){if(Math.abs(cd.cx-cd.x)>9||Math.abs(cd.cy-cd.y)>9){clearTimeout(cd.t);cd=null;}return;}
  cd.g.style.transform='translate('+(cd.cx-cd.ox)+'px,'+(cd.cy-cd.oy)+'px) rotate(-1.5deg)';
});
document.addEventListener('touchmove',e=>{if(cd&&cd.lifted)e.preventDefault();},{passive:false});
function cdEnd(cancel){
  if(!cd)return;const d=cd;cd=null;clearTimeout(d.t);clearTimeout(d.nt);cancelAnimationFrame(d.raf);
  if(!d.lifted)return;
  suppress=Date.now()+400;cdClear();document.body.classList.remove('cdon');if(d.g)d.g.remove();
  const t=S.tasks.find(x=>x.id===d.id);
  if(!cancel&&t&&d.tgt&&d.tgt!==t.date){
    const prev={date:t.date,moves:t.moves},later=d.tgt>t.date;
    t.date=d.tgt;if(later){t.moves=(t.moves||0)+1;}save();if(later)logEv('postponed',t);
    if(!(later&&askWhy(t,prev)))toast({face:5,text:'Moved to '+fmtHead(d.tgt)+'.'},()=>{t.date=prev.date;t.moves=prev.moves;save();U.bubble=null;render();});
  }
  renderHead();renderMain();
}
document.addEventListener('pointerup',()=>cdEnd(false));document.addEventListener('pointercancel',()=>cdEnd(true));
