/* ---------- task tags: Gauntlets, Cobwebs, Nibbles, Sworn Dates ---------- */
/* Names live here. Change a name and it changes everywhere. */
const TAGDEF=[
  {id:'shadow',name:'Gauntlet',plural:'Gauntlets',sub:'Weighs on me',icon:'flame',col:'#B39BE0'},
  {id:'sworn',name:'Sworn Date',plural:'Sworn Dates',sub:'Must be done by a date',icon:'flag',col:'#F0803F'},
  {id:'cobweb',name:'Cobweb',plural:'Cobwebs',sub:'Putting it off',icon:'wheel',col:'#9DB6C8'},
  {id:'nibble',name:'Nibble',plural:'Nibbles',sub:'Small and irritating',icon:'easy',col:'#A9C46F'}
];
const tagDef=id=>TAGDEF.find(x=>x.id===id);
const hasTag=(t,id)=>!!(t&&t.tags&&t.tags.includes(id));
function tagPills(t){
  if(!t||!t.tags||!t.tags.length||t.done)return '';
  return `<span class="tgs">${TAGDEF.filter(d=>t.tags.includes(d.id)).slice(0,2).map(d=>`<i style="--tc:${d.col}">${d.name.toUpperCase()}</i>`).join('')}</span>`;
}
function tagToggle(arr,id){const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);else arr.push(id);return arr;}

/* ----- word lists: what the dump listens for ----- */
const TAG_WORDS={
  shadow:['anxious','anxiety','nervous','worried','worry','worrying','stressed','stressful','stress','dread','dreading','scared','afraid','frightened','terrified','overwhelmed','overwhelming','uneasy','panic','weighing on me','weighing me down','weighs on me','weighs me down','heavy on me','keeping me up','freaking out','fear'],
  cobweb:["don't want to","dont want to","do not want to","not want to","putting off","put off","been avoiding","avoiding","pending for","pending since","been pending","for days","for weeks","keep forgetting","procrastinat","lazy","still haven't","still have not","been meaning to","should have done","ages ago","forever"],
  nibble:['annoying','irritating','irritating to','tedious','boring','small thing','tiny','quick one','quick thing','just need to','just have to','minor','little thing','get it over with','over and done','nuisance','chore','faff','five minutes','5 minutes'],
  sworn:['deadline','due ','must be done','has to be done','have to be done','coming over','is coming','are coming','arrives','arriving','visiting','guests','tonight','before they','last day','expires','no later than','by end of','end of day','cutoff','cut-off']
};
const SWORN_RE=/\b(?:by|before|until|till)\s+(?:the\s+)?(?:tomorrow|tonight|today|mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next|end of|the \d|\d)/i;
const TFILL=new Set(['really','also','today','tomorrow','would','like','just','still','need','needs','want','going','think','thing','things','some','something','very','much','more','than','been','being','make','take','done','doing','getting','anything','everything']);
const reEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function tagGuess(sent){
  const s=String(sent).toLowerCase().replace(/[\u2019]/g,"'"),ids=[],why={};
  TAGDEF.forEach(d=>{
    for(const w of TAG_WORDS[d.id]){
      const tr=w.trim(),re=new RegExp('(^|[^a-z])'+reEsc(tr)+((w.endsWith(' ')||tr.length<5)?'($|[^a-z])':''));
      if(re.test(s)&&!(((S.tmute||{})[d.id]||{})[tr.toLowerCase()]>=2)){ids.push(d.id);why[d.id]={w:tr};break;}
    }
  });
  const tl=S.tlearn||{};
  TAGDEF.forEach(d=>{
    if(ids.includes(d.id)||!tl[d.id])return;
    for(const w of wordsOf(s)){if((tl[d.id][w]||0)>=2&&!TFILL.has(w)){ids.push(d.id);why[d.id]={w,l:true};break;}}
  });
  if(!ids.includes('sworn')&&SWORN_RE.test(sent)){ids.push('sworn');why.sworn={w:(SWORN_RE.exec(sent)||[''])[0].trim()};}
  return {ids,why};
}

/* ----- splitting a ramble into thoughts ----- */
const TRIG=/\b(?:need to|needs to|have to|has to|got to|gotta|must|should|want to|wanna|going to|gonna|supposed to|ought to|remember to|don'?t forget to|forgot to|(?:would|'d)\s+(?:also\s+)?like to|plan to|planning to|hope to|hoping to|better)\s+/i;
const SPLITV='call|email|e-mail|book|pay|buy|send|clean|scan|write|finish|submit|schedule|prepare|ask|talk|order|cancel|renew|fix|update|check|plan|set up|organi[sz]e|read|reply|text|ring|sort|tidy|wash|cook|pack|print|sign|upload|apply|review|draft|look for|find|take|give|return|pick up|drop off|go|clear|empty|water|feed|shower|visit|cut|iron|vacuum|fold|bring|research|meet|get|make|do';
const ACTV=/^(?:take|give|return|pick up|drop off|go|clear|empty|water|feed|shower|visit|cut|iron|vacuum|fold|bring|research|meet|call|email|e-mail|book|pay|buy|send|clean|scan|write|finish|submit|schedule|prepare|ask|talk|order|cancel|renew|fix|update|check|plan|set up|organi[sz]e|read|reply|text|ring|sort|tidy|wash|cook|pack|print|sign|upload|apply|review|draft|look for|find)\b/i;
function dumpClean(s){
  s=String(s).replace(/^[\s,;:\-–]+/,'');let prev;
  do{prev=s;s=s.replace(/^(?:and|also|so|oh|then|plus|but|okay|ok|well|first|lastly|finally|anyway|um|uh|honestly|basically|right now|now)\b[\s,]*/i,'');}while(s!==prev);
  return s.trim();
}
function dumpSplit(text){
  const need="need|have|should|must|want|got|gotta|would|'d|plan|hope|better|going|gonna|wanna";
  const t=String(text).replace(/\r/g,'')
    .replace(/([.!?;])\s+/g,'$1\u0001')
    .replace(new RegExp("\\s+(?:and|plus|then)\\s+(?:also\\s+)?(?=(?:i|we)\\s+(?:also\\s+|really\\s+|still\\s+|just\\s+)*(?:"+need+"))","gi"),'\u0001')
    .replace(new RegExp("(?:,\\s*(?:and\\s+|then\\s+|also\\s+)?|\\s+(?:and|then|plus)\\s+(?:also\\s+)?)(?=(?:"+SPLITV+")\\b)","gi"),'\u0001')
    .replace(/\n+/g,'\u0001');
  return t.split('\u0001').map(x=>x.trim().replace(/[.!?;]+$/,'')).filter(x=>x.length>2);
}
function dumpTitle(sent){
  let s=dumpClean(sent),title='',fix=false;
  const m=TRIG.exec(s);
  if(m){
    let after=s.slice(m.index+m[0].length);
    after=after.split(/[,;]|\s+(?:because|since|so that|which|that's|that is|it's|it is|and then|as it|as i|but)\b/i)[0].trim();
    title=after.replace(/\b(?:that|this|those|these)\s+/gi,'').replace(/\s+(?:today|tonight|asap|soon|really)$/i,'').trim();
    if(/^(?:get|do|make|sort|finish|handle|deal with|fix|take care of)(?:\s+(?:it|them|done|sorted|out))*$/i.test(title)||title.length<5){
      const before=s.slice(0,m.index);
      const mm=/\bthe ([a-z]+) (?:is|are) (?:so |very |really |too )?([a-z]+)/i.exec(before);
      if(mm){const adj=mm[2].toLowerCase();title=(/unclean|dirty|messy|cluttered|filthy|untidy|chaos/.test(adj)?'Clean':'Sort out')+' the '+mm[1];}
      else title=before.replace(/^(?:i'?m|i am|i)\s+(?:also\s+|really\s+)*/i,'').trim()||title;
      fix=true;
    }
  }else title=s;
  title=title.replace(/^(?:i'?m|i am)\s+(?:also\s+|really\s+)*/i,'').trim();
  if(!title)title=s;
  return {title:title[0].toUpperCase()+title.slice(1),fix};
}
const STOPW=new Set(['the','and','for','with','about','that','this','from','have','need','want','should','will','into','your','you','are','but','not','all','any','get','set','make','done','new','one','out','off','own','too','its','our','has','had','was','were','can','may','who','how','why','what','when','then','than','them','they','their']);
const wordsOf=s=>String(s).toLowerCase().split(/[^a-zäöüß0-9]+/).filter(w=>w.length>=3&&!STOPW.has(w));
function simWords(a,b){
  const A=new Set(wordsOf(a)),B=new Set(wordsOf(b));if(!A.size||!B.size)return 0;
  let n=0;A.forEach(w=>{if(B.has(w))n++;});return n/Math.max(A.size,B.size);
}
function dupMatch(title){
  let best=null,bs=0;
  S.tasks.forEach(t=>{if(t.done)return;const sc=simWords(title,t.title);if(sc>bs){bs=sc;best=t;}});
  return bs>=0.6?best:null;
}

/* ----- campaign keywords ----- */
function campWords(q){
  const auto=wordsOf(q.title||'');
  const off=q.kwOff||[],custom=(q.kw||[]).map(x=>String(x).toLowerCase());
  const all=[];auto.concat(custom).forEach(w=>{if(!all.includes(w)&&!off.includes(w))all.push(w);});
  return {all,auto:auto.filter((w,i)=>auto.indexOf(w)===i),custom,off};
}
function campMatch(title){
  const tw=wordsOf(title);if(!tw.length)return null;
  let best=null,bs=0;
  S.quests.filter(q=>!q.done).forEach(q=>{
    const kw=campWords(q).all;let n=0;
    tw.forEach(w=>{if(kw.some(k=>k===w||(w.length>=5&&k.length>=5&&(w.startsWith(k)||k.startsWith(w)))))n++;});
    if(n>bs){bs=n;best=q;}
  });
  return best;
}

/* ----- parsing the ramble into cards ----- */
function dumpParse(text){
  const out=[];
  dumpSplit(text).forEach(sent=>{
    const g=tagGuess(sent),clean=dumpClean(sent);
    const isTask=TRIG.test(clean)||ACTV.test(clean);
    const k=uid();
    if(!isTask){out.push({k,thought:true,asTask:false,orig:sent,title:clean[0].toUpperCase()+clean.slice(1),tags:[],why:{},g:{thought:true,tags:[]}});return;}
    const dt=dumpTitle(sent);
    const p=parseQuick(dt.title,pctx());let p2=null;
    const title=(p.title||dt.title).trim();
    if(!p.date)p2=parseQuick(sent,pctx());
    const date=p.date||(p2&&p2.date)||today();
    const cid=p.cat||(p2&&p2.cat)||S.last||S.cats[0].id;
    const tags=g.ids.slice();
    if(tags.includes('sworn')&&!tags.includes('shadow')){}
    const dup=dupMatch(title),q=dup?dup.q:campMatch(title);
    const it={k,thought:false,orig:sent,title:title[0].toUpperCase()+title.slice(1),fix:dt.fix,cat:cid,date,time:p.time||'',dur:tags.includes('nibble')?15:(p.dur||p.guess||30),tags,why:g.why,q:q&&q.id||(dup&&dup.q)||'',sid:dup?dup.id:'',dupTitle:dup?dup.title:''};
    it.g={title:it.title,tags:tags.slice(),cat:cid,q:it.q};
    if(dup){(dup.tags||[]).forEach(x=>{if(!it.tags.includes(x))it.tags.push(x);});it.date=dup.date<today()?today():dup.date;it.cat=dup.cat;}
    out.push(it);
  });
  return out;
}

/* ----- the day Council: mode, input, sort, shape ----- */
const DSTEPS_RAMBLE=['welcome','mode','input','sort','shape','seal'];
const DSTEPS_ORG=['welcome','mode','input','shape','seal'];
function dayStepGo(R,dir){
  if(R.steps[R.i]==='sort'){
    if(R.mode==='organise'){R.i+=dir;return;}
    if(R.parsedFor!==R.text){R.items=dumpParse(R.text||'');R.parsedFor=R.text;}
  }
}
function dayNote(R,txt){
  const k=today(),p=S.plans[k]||(S.plans[k]={});p.notes=p.notes||[];
  let e=R.noteAt&&p.notes.find(x=>x.at===R.noteAt);
  if(!e){R.noteAt=Date.now();e={at:R.noteAt,text:''};p.notes.push(e);}
  e.text=txt;
}
function dayCommit(){
  const R=U.council.rit;if(!R)return;
  (R.items||[]).forEach(it=>{
    if(it.done)return;
    if(it.thought&&!it.asTask)return;
    if(it.drop)return;
    if(it.sid){
      const t=S.tasks.find(x=>x.id===it.sid);
      if(t){t.tags=it.tags.slice();t.date=it.date||t.date;if(it.q&&!t.q){t.q=it.q;assignCol(t,'');}}
      it.done=true;return;
    }
    const t={id:uid(),title:it.title,cat:it.cat,date:it.date||today(),time:it.time||'',dur:it.dur||30,done:false,moves:0,createdAt:Date.now(),rep:'',q:it.q||'',tags:it.tags.slice()};
    S.tasks.push(t);if(t.q)assignCol(t,'');learn(t.title,t.cat);
    logEv('added',t,{raw:it.orig,catManual:false,suggested:'',batch:false,viaCouncil:true});
    R.goals.push(t.id);it.done=true;it.sid=t.id;
  });
  const txt=(R.text||'').trim();
  if(txt)dayNote(R,txt);
  try{
    const ent={at:Date.now(),text:txt,items:(R.items||[]).map(it=>({s:it.orig,g:it.g,f:it.thought&&!it.asTask?{kept:'note'}:{t:it.title,tags:it.tags,c:it.cat,q:it.q,d:it.date,conv:it.conv?1:0,dup:it.dupTitle||''}})).concat(R.dropped||[])};
    if(txt){S.dlog=(S.dlog||[]).concat([ent]).slice(-30);}
  }catch(e){}
  U.council.dragonId=null;
  save();render(true);
}
function dayList(){
  const R=U.council.rit,td=today(),rows=[],seen=new Set();
  (R.items||[]).forEach(it=>{
    if(it.thought&&!it.asTask)return;if(it.drop)return;
    const t=it.sid&&S.tasks.find(x=>x.id===it.sid);
    if(t)seen.add(t.id);
    rows.push({key:it.k,title:t&&it.done?t.title:it.title,tags:t&&it.done?(t.tags||[]):it.tags,date:it.date,item:it,task:t||null});
  });
  S.tasks.forEach(t=>{
    if(t.done||seen.has(t.id)||!t.date)return;
    const mine=(R.goals||[]).includes(t.id);
    if(t.date<=td||mine)rows.push({key:t.id,title:t.title,tags:t.tags||[],date:t.date,item:null,task:t});
  });
  return rows;
}
function dayGroup(r){
  const tg=r.tags||[];
  if(r.date>today())return 'later';
  if(tg.includes('shadow'))return 'shadow';
  if(tg.includes('sworn'))return 'sworn';
  if(!tg.includes('cobweb')&&!tg.includes('nibble'))return 'plain';
  return 'sweep';
}
const DGROUPS=[['shadow','Face these first','flame'],['sworn','Sworn dates','flag'],['plain','The rest of the day','list'],['sweep','One sweep: cobwebs and nibbles','easy'],['later','Moved to later','chev']];

/* ---- HTML ---- */
function dayStepHTML(s){
  const C=U.council,R=C.rit;
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  if(s==='mode'){
    return ritHero(1,'s')+sh('pen','var(--brass-l)','How shall we begin?',R.wline2||'Two ways in. Pick by how your head feels.')+
    `<div class="dmodes"><button type="button" class="dmode g" data-act="rMode" data-v="ramble"><span class="tl">${ico('pen',26,'var(--glow)',1.6)}</span><b>Ramble</b><i>Tell me everything, in any order. I will sort it into gauntlets, cobwebs and the rest.</i></button>
    <button type="button" class="dmode g" data-act="rMode" data-v="organise"><span class="tl">${ico('list',26,'var(--glow)',1.6)}</span><b>Organise</b><i>I know what I need. Let me place each thing myself.</i></button></div>`;
  }
  if(s==='input'&&R.mode==='organise')return orgHTML();
  if(s==='input'){
    return ritHero(1,'s')+sh('pen','var(--brass-l)','What is on your mind?','Tasks, worries, who to call, how you feel')+
    `<textarea id="dumpTx" class="tb big" rows="9" placeholder="Today I need to... I'm worried about... I keep putting off..." aria-label="Brain dump">${esc(R.text||'')}</textarea><p class="rnote">Say it however it comes. Words like anxious, don't want to, annoying and deadline tell me where it belongs. You fix anything I get wrong on the next screen.</p>`;
  }
  if(s==='sort'){
    const items=R.items||[];
    if(!items.length)return ritHero(2,'s')+sh('list','var(--brass-l)','Nothing to sort','The page was empty')+'<p class="rsay">An empty head or a very discreet one. Go back and write something, or carry on.</p>';
    return ritHero(5,'s')+sh('list','var(--brass-l)','Here is what I heard','Fix what I got wrong')+`<div class="scards">${items.map(sortCardHTML).join('')}</div>`;
  }
  if(s==='shape')return shapeHTML();
  return '';
}
function whyLine(it){
  const ks=Object.keys(it.why||{}).filter(k=>it.tags.includes(k));
  if(!ks.length)return '';
  return `<p class="swhy">${ks.map(k=>{const y=it.why[k];return `${tagDef(k).name}: ${y.l?'learned from':'you said'} “${esc(y.w)}”`;}).join(' · ')}</p>`;
}
function sortCardHTML(it){
  if(it.thought&&!it.asTask){
    return `<div class="scard thought"><p class="sorig">“${esc(it.orig)}”</p><div class="sacts"><span class="mono">KEPT IN THE NOTE</span><button type="button" class="mini" data-act="dTask" data-id="${it.k}">Make it a task</button></div></div>`;
  }
  const qs=S.quests.filter(q=>!q.done);
  const chips=TAGDEF.map(d=>`<button type="button" class="tchip ${it.tags.includes(d.id)?'on':''}" style="--tc:${d.col}" data-act="dTag" data-id="${it.k}" data-v="${d.id}" aria-pressed="${it.tags.includes(d.id)}">${ico(d.icon,15,'currentColor',1.7)}${d.name}</button>`).join('');
  return `<div class="scard ${it.fix?'fix':''}" data-k="${it.k}">
    <div class="srow"><input class="sinp" data-dk="${it.k}" value="${esc(it.title)}" aria-label="Task title"><button type="button" class="ib quiet" style="border:0;background:none;width:34px;height:34px" data-act="dDrop" data-id="${it.k}" aria-label="Drop this one">${ico('x',16,'currentColor',2)}</button></div>
    ${it.fix?'<p class="swhy warn">I was not sure about the name. Check it.</p>':''}
    ${it.sid?`<p class="swhy">Already on your list: “${esc(it.dupTitle)}”. I will tag that one.</p>`:''}
    <div class="tchips">${chips}</div>${whyLine(it)}
    <div class="smeta"><select class="ssel" data-dsel="cat" data-k="${it.k}" aria-label="Area">${S.cats.map(c=>`<option value="${c.id}" ${c.id===it.cat?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input type="date" class="ssel" data-dsel="date" data-k="${it.k}" value="${it.date||''}" aria-label="Date">
    ${qs.length?`<select class="ssel" data-dsel="q" data-k="${it.k}" aria-label="Campaign"><option value="">+ Add to campaign</option>${qs.map(q=>`<option value="${q.id}" ${q.id===it.q?'selected':''}>${esc(q.title)}</option>`).join('')}</select>`:''}</div>
  </div>`;
}
function orgRowsFor(id){
  const R=U.council.rit,open=S.tasks.filter(t=>!t.done);
  const tagged=open.filter(t=>hasTag(t,id));
  let sug=[];
  if(id==='cobweb')sug=open.filter(t=>!hasTag(t,id)&&((t.moves||0)>=2||(t.date&&t.date<today())));
  if(id==='nibble')sug=open.filter(t=>!hasTag(t,id)&&(t.dur||30)<=15&&!hasTag(t,'cobweb'));
  return {tagged,sug:sug.slice(0,6)};
}
function orgHTML(){
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  const row=(t,id,on)=>`<div class="orow ${on?'on':''}"><button type="button" class="otog" data-act="oTog" data-id="${t.id}" data-v="${id}" aria-pressed="${on}" aria-label="${on?'Remove from':'Add to'} ${tagDef(id).plural}">${on?ico('check',14,'currentColor',3.2):''}</button><span class="ot">${esc(t.title)}</span><small>${t.date<today()?'OVERDUE':t.moves>=2?'moved '+t.moves+'x':t.date===today()?'TODAY':shortDue(t.date)}</small></div>`;
  return ritHero(1,'s')+sh('list','var(--brass-l)','Place each thing','Tap to tag, or add new ones')+TAGDEF.map(d=>{
    const {tagged,sug}=orgRowsFor(d.id);
    return `<div class="osec" style="--tc:${d.col}"><div class="oh"><span class="tl2">${ico(d.icon,18,d.col,1.7)}</span><b>${d.plural}</b><i>${d.sub}</i></div>
    ${tagged.map(t=>row(t,d.id,true)).join('')}${sug.map(t=>row(t,d.id,false)).join('')}
    <div class="arow"><input id="oIn_${d.id}" class="inp" type="text" placeholder="${d.id==='sworn'?'Add one, e.g. send form fri':'Add one'}" autocomplete="off" enterkeyhint="done" aria-label="Add to ${d.plural}"><button type="button" class="go" data-act="oAdd" data-v="${d.id}" aria-label="Add">${ico('plus',22,'currentColor',2.6)}</button></div></div>`;
  }).join('');
}
function shapeHTML(){
  const C=U.council,R=C.rit;
  const rows=dayList(),by={};rows.forEach(r=>{(by[dayGroup(r)]=by[dayGroup(r)]||[]).push(r);});
  const sh=(ic,col,t,sub)=>`<div class="rh"><span class="tl">${ico(ic,22,col,1.7)}</span><h2>${t}</h2><p>${sub}</p></div>`;
  const rowHTML2=r=>{
    const camp=(r.item?r.item.q:(r.task&&r.task.q))||'';
    const later=r.date>today();
    const cob=r.task&&!hasTag(r.task,'cobweb')&&(r.task.moves||0)>=3&&!(r.item&&r.item.tags.includes('cobweb'));
    return `<div class="shrow"><div class="shn"><b>${esc(r.title)}</b>${(r.tags.length||camp||cob)?`<span class="shp">${TAGDEF.filter(d=>r.tags.includes(d.id)).map(d=>`<i style="--tc:${d.col}">${d.name.toUpperCase()}</i>`).join('')}${camp&&questOf(camp)?`<i class="cp">${esc(questOf(camp).title.toUpperCase())}</i>`:''}${cob?`<button type="button" class="cobq" data-act="dCob" data-id="${r.key}">+ COBWEB?</button>`:''}</span>`:''}</div><button type="button" class="mini" data-act="dLater" data-id="${r.key}">${later?'Today':'Later'}</button></div>`;
  };
  let body=DGROUPS.map(([g,label,ic])=>by[g]?`<div class="shg"><p class="shh">${ico(ic,15,'var(--brass-l)',1.8)}${label}</p>${by[g].map(rowHTML2).join('')}${g==='shadow'&&by[g].length>2?'<p class="rnote" style="margin:6px 0 0">That is a lot of weight for one day. Send one to later if you like.</p>':''}</div>`:'').join('');
  if(!body)body='<p class="rsay">Nothing on the plate. Enjoy it, my lord.</p>';
  const mood=`<div class="shg"><p class="shh">${ico('compass',15,'var(--brass-l)',1.8)}How shall we ride today?</p><div class="mchips">${MOODS.map(([k,n])=>`<button type="button" class="chip ${C.mood===k?'on':''}" data-act="mood" data-v="${k}">${n}</button>`).join('')}</div></div>`;
  return ritHero(2,'s')+sh('sun','var(--brass-l)','The day, in order','Heavy things first, small things in one sweep')+body+mood;
}

/* ---- actions ---- */
function orgAdd(tag,raw){
  const R=U.council.rit;let n=0;
  String(raw).split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>{
    const t=ritTask(x);if(!t)return;
    t.tags=[tag];if(tag==='nibble')t.dur=15;
    const q=campMatch(t.title);if(q){t.q=q.id;assignCol(t,'');}
    R.goals.push(t.id);n++;
  });
  if(n){save();render(true);}
  return n;
}
function dayItemOrTask(id){
  const R=U.council.rit,it=(R.items||[]).find(x=>x.k===id);
  if(it)return {it,t:it.sid?S.tasks.find(x=>x.id===it.sid):null};
  return {it:null,t:S.tasks.find(x=>x.id===id)};
}
function tagsAct(act,v,id){
  const C=U.council,R=C&&C.rit;
  switch(act){
    case 'rMode':{R.mode=v;R.steps=(v==='organise'?DSTEPS_ORG:DSTEPS_RAMBLE).slice();R.i=R.steps.indexOf('mode');ritNext();return true;}
    case 'dTag':{const it=(R.items||[]).find(x=>x.k===id);if(it){tagToggle(it.tags,v);const on=it.tags.includes(v);if(v==='nibble'&&on)it.dur=15;tagLearn(it,v,on);ritDraw();}return true;}
    case 'dTask':{const it=(R.items||[]).find(x=>x.k===id);if(!it)return true;
      const dt=dumpTitle(it.orig),p=parseQuick(dt.title,pctx());const title=(p.title||dt.title).trim();
      it.conv=true;Object.assign(it,{thought:false,asTask:true,title:title[0].toUpperCase()+title.slice(1),fix:true,cat:p.cat||S.last||S.cats[0].id,date:p.date||today(),time:p.time||'',dur:p.dur||30,q:'',sid:''});
      const g=tagGuess(it.orig);it.tags=g.ids;it.why=g.why;ritDraw();return true;}
    case 'dDrop':{const it=(R.items||[]).find(x=>x.k===id);if(it){it.drop=true;(R.dropped=R.dropped||[]).push({s:it.orig,g:it.g,drop:1});R.items=R.items.filter(x=>x!==it);ritDraw();}return true;}
    case 'oTog':{const t=S.tasks.find(x=>x.id===id);if(!t)return true;t.tags=t.tags||[];tagToggle(t.tags,v);if(!t.tags.length)delete t.tags;save();render(true);ritDraw();return true;}
    case 'oAdd':{const i=$('#oIn_'+v);if(i&&i.value.trim()){orgAdd(v,i.value);ritDraw();const x=$('#oIn_'+v);x&&x.focus();}return true;}
    case 'dLater':{
      const {it,t}=dayItemOrTask(id);const tgt=it||t;if(!tgt)return true;
      R.later=R.later||{};
      if(R.later[id]!==undefined){tgt.date=R.later[id];delete R.later[id];}
      else{R.later[id]=tgt.date;tgt.date=addDays(today(),1);}
      if(!it&&t)save();
      ritDraw();return true;}
    case 'dCob':{const {it,t}=dayItemOrTask(id);if(it){if(!it.tags.includes('cobweb'))it.tags.push('cobweb');}else if(t){t.tags=t.tags||[];if(!t.tags.includes('cobweb'))t.tags.push('cobweb');save();}ritDraw();return true;}
    case 'kwAdd':{const i=$('#kwIn');const q=questOf(id);if(q&&i&&i.value.trim()){q.kw=q.kw||[];i.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).forEach(w=>{if(!q.kw.includes(w))q.kw.push(w);q.kwOff=(q.kwOff||[]).filter(x=>x!==w);});save();renderOverlay();}return true;}
    case 'kwDel':{const q=questOf(id);if(q){q.kw=(q.kw||[]).filter(x=>x!==v);q.kwOff=q.kwOff||[];if(campWords(q).auto.includes(v)&&!q.kwOff.includes(v))q.kwOff.push(v);save();renderOverlay();}return true;}
  }
  return false;
}
document.addEventListener('input',e=>{
  const R=U.council&&U.council.rit;if(!R)return;
  if(e.target.id==='dumpTx'){R.text=e.target.value;return;}
  if(e.target.dataset&&e.target.dataset.dk){const it=(R.items||[]).find(x=>x.k===e.target.dataset.dk);if(it)it.title=e.target.value;}
});
document.addEventListener('change',e=>{
  const R=U.council&&U.council.rit;if(!R||!e.target.dataset||!e.target.dataset.dsel)return;
  const it=(R.items||[]).find(x=>x.k===e.target.dataset.k);if(!it)return;
  const w=e.target.dataset.dsel;
  if(w==='cat')it.cat=e.target.value;else if(w==='date')it.date=e.target.value||today();else if(w==='q'){it.q=e.target.value;const q=questOf(it.q);
    if(q){const have=campWords(q).all;const add=wordsOf(it.title).filter(x=>x.length>=5&&!TFILL.has(x)&&!have.includes(x)).slice(0,2);
      if(add.length){q.kw=(q.kw||[]).concat(add);q.kwOff=(q.kwOff||[]).filter(x=>!add.includes(x));save();}}}
  if(w==='q'||w==='date')ritDraw();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id&&e.target.id.startsWith('oIn_')){e.preventDefault();tagsAct('oAdd',e.target.id.slice(4));}
});

function dayFirst(){
  try{const rows=dayList();for(const [g] of DGROUPS){const r=rows.find(x=>dayGroup(x)===g&&g!=='later');if(r)return r.title;}}catch(e){}
  return '';
}

/* ----- learning from corrections ----- */
function tagLearn(it,tag,on){
  const guessed=it.g&&(it.g.tags||[]).includes(tag);
  S.tlearn=S.tlearn||{};S.tmute=S.tmute||{};
  if(on&&!guessed){
    const m=S.tlearn[tag]=S.tlearn[tag]||{};
    wordsOf(it.orig).forEach(w=>{if(!TFILL.has(w))m[w]=(m[w]||0)+1;});
  }
  if(!on&&guessed&&it.why&&it.why[tag]&&!it.why[tag].l){
    const m=S.tmute[tag]=S.tmute[tag]||{};const w=String(it.why[tag].w).toLowerCase();m[w]=(m[w]||0)+1;
  }
}
function sortingLogText(){
  const d=(S.dlog||[]).slice(-15);
  return JSON.stringify({note:'The Realm sorting log. s=sentence, g=what the app guessed, f=what you ended up with.',learned:S.tlearn||{},muted:S.tmute||{},dumps:d});
}
