/* ---------- campaign notes: many notes, your own categories, links, tick boxes ---------- */
function notesOf(q){
  if(!q.notes)q.notes=[];
  if(q.note!==undefined){
    if(String(q.note).trim())q.notes.push({id:uid(),title:'Notes',body:q.note,cat:'',pin:false,created:q.created||Date.now(),at:Date.now()});
    delete q.note;save();
  }
  return q.notes;
}
const ncatsOf=q=>q.ncats=q.ncats||[];
function agoStr(ms){
  const m=Math.floor((Date.now()-ms)/6e4);
  if(m<1)return 'just now';if(m<60)return m+'m ago';
  const h=Math.floor(m/60);if(h<24)return h+'h ago';
  const d=Math.floor(h/24);if(d<7)return d+'d ago';
  const x=new Date(ms);return x.getDate()+' '+MON[x.getMonth()];
}
function noteTitle(n){
  if((n.title||'').trim())return n.title.trim();
  const l=(n.body||'').split('\n').map(s=>s.trim()).find(Boolean);
  return l?l.replace(/^[-*#\s]+|^\[[ xX>]\]\s*/g,'').slice(0,60)||'Untitled':'Untitled';
}
function noteSnip(n){
  const ls=(n.body||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const t=(n.title||'').trim();
  const body=(t?ls:ls.slice(1)).map(s=>s.replace(/^#{1,3}\s+/,'').replace(/^[-*]\s+/,'').replace(/^\[( |x|X|>)\]\s*/,(m,c)=>c.toLowerCase()==='x'?'✓ ':'□ ')).join('  ');
  return body.slice(0,110);
}
function linkCard(u){
  const href=u.startsWith('www.')?'https://'+u:u;let host='',path='';
  try{const x=new URL(href);host=x.hostname.replace(/^www\./,'');path=x.pathname+(x.search?'':'');}catch(e){return linkify(u);}
  let seg='';
  try{seg=decodeURIComponent(path).split('/').filter(s=>s&&!/^\d+$/.test(s)&&!/^[0-9a-f-]{16,}$/i.test(s)&&!/^(view|jobs|in|p|watch|wiki|pub|company|www|index|home)$/i.test(s)).pop()||'';}catch(e){}
  seg=seg.replace(/\.[a-z0-9]{2,4}$/i,'').replace(/[-_+]+/g,' ').trim();
  const title=seg?seg[0].toUpperCase()+seg.slice(1):host;
  const shown=host+(path.length>1?(path.length>34?path.slice(0,34)+'...':path):'');
  return `<a class="lk lcard" href="${esc(href)}" target="_blank" rel="noopener"><span class="lk0">${esc((host[0]||'?').toUpperCase())}</span><span class="lk1"><b>${esc(title)}</b><small>${esc(shown)}</small></span>${ico('chevr',16,'var(--dim)',2)}</a>`;
}
function nBodyHTML(n){
  const out=[];
  (n.body||'').split('\n').forEach((ln,i)=>{
    const t=ln.trim();let m;
    if(!t){out.push('<div class="nsp"></div>');return;}
    if((m=t.match(/^(?:[-*]\s+)?\[( |x|X|>)\]\s*(.*)$/))){
      const st=m[1]===' '?' ':m[1].toLowerCase();
      out.push(`<div class="nt ${st==='x'?'dn':''}"><button type="button" class="cb" data-act="nTick" data-id="${n.id}" data-v="${i}" aria-label="Toggle"><i class="${st==='x'?'on':''}">${st==='x'?ico('check',14,'currentColor',3.2):st==='>'?ico('chevr',14,'currentColor',3):''}</i></button><span>${linkify(m[2])}</span>${st===' '?`<button type="button" class="mini" data-act="nBoard" data-id="${n.id}" data-v="${i}">to board</button>`:st==='>'?'<em>on board</em>':''}</div>`);
    }else if((m=t.match(/^#{1,3}\s+(.*)$/)))out.push(`<h3>${linkify(m[1])}</h3>`);
    else if((m=t.match(/^[-*]\s+(.*)$/)))out.push(`<div class="nb"><span>•</span><p>${linkify(m[1])}</p></div>`);
    else if(/^(https?:\/\/|www\.)\S+$/i.test(t))out.push(linkCard(t));
    else out.push(`<p>${linkify(ln)}</p>`);
  });
  return out.join('')||'<p class="nhint">Empty. Tap to write.</p>';
}
function nListInner(q){
  const C=U.camp,s=(C.ns||'').trim().toLowerCase(),f=C.nf||'',cats=ncatsOf(q);
  let ns=notesOf(q).filter(n=>(!f||n.cat===f)&&(!s||((n.title||'')+' '+(n.body||'')).toLowerCase().includes(s)));
  ns=ns.slice().sort((a,b)=>(b.pin?1:0)-(a.pin?1:0)||b.at-a.at);
  if(!ns.length)return `<p class="note" style="margin:6px 0">${notesOf(q).length?'Nothing matches.':'No notes yet. Tap + to write the first one.'}</p>`;
  return ns.map(n=>{const c=cats.find(x=>x.id===n.cat);return `<div class="ncard" data-act="nOpen" data-id="${n.id}"><div class="nh"><b>${esc(noteTitle(n))}</b>${n.pin?ico('flag',14,'var(--glow)',2):''}</div>${noteSnip(n)?`<p>${esc(noteSnip(n))}</p>`:''}<div class="nm">${c?`<span class="ncc">${esc(c.name)}</span>`:''}<em>${agoStr(n.at)}</em></div></div>`;}).join('');
}
function notesTabHTML(q){
  const C=U.camp;
  if(C.note)return noteEditorHTML(q);
  const cats=ncatsOf(q),all=notesOf(q);
  const chip=(id,l,n)=>`<button type="button" class="chip ${(C.nf||'')===id?'on':''}" data-act="nFilter" data-v="${id}">${esc(l)}${n!==undefined?` <small>${n}</small>`:''}</button>`;
  return `<div class="nwrap"><div class="arow"><input id="nSearch" class="inp" type="search" value="${esc(C.ns||'')}" placeholder="Search notes" autocomplete="off" aria-label="Search notes"><button type="button" class="go" data-act="nNew" aria-label="New note">${ico('plus',22,'currentColor',2.6)}</button></div>
  <div class="chips sm" style="margin:10px 0 4px">${chip('','All',all.length)}${cats.map(c=>chip(c.id,c.name,all.filter(n=>n.cat===c.id).length)).join('')}<button type="button" class="chip" data-act="nCatNew" aria-label="New category">${ico('plus',14,'currentColor',2.4)} Category</button>${cats.length?`<button type="button" class="chip" data-act="nCatSheet">Edit</button>`:''}</div>
  ${C.ncNew?`<div class="arow" style="margin-bottom:8px"><input id="nCatIn" class="inp" type="text" placeholder="New category, e.g. Contacts" autocomplete="off" aria-label="New category name"><button type="button" class="go" data-act="nCatAdd" aria-label="Add category">${ico('check',22,'currentColor',2.6)}</button></div>`:''}
  <div id="nList">${nListInner(q)}</div></div>`;
}
function noteEditorHTML(q){
  const C=U.camp,n=notesOf(q).find(x=>x.id===C.note);if(!n){C.note=null;return notesTabHTML(q);}
  const cats=ncatsOf(q),ed=C.nedit;
  const cchips=`<button type="button" class="chip ${!n.cat?'on':''}" data-act="nCat" data-v="">None</button>${cats.map(c=>`<button type="button" class="chip ${n.cat===c.id?'on':''}" data-act="nCat" data-v="${c.id}">${esc(c.name)}</button>`).join('')}<button type="button" class="chip" data-act="nCatNew2">${ico('plus',14,'currentColor',2.4)} New</button>`;
  return `<div class="nwrap"><div class="ned"><button type="button" class="cbk" style="width:40px;height:40px" data-act="nBack" aria-label="Back to notes">${ico('chevr',22,'var(--bone)',2)}</button><span class="mono">${agoStr(n.at).toUpperCase()}</span><button type="button" class="cbk" style="width:40px;height:40px" data-act="nPin" aria-label="${n.pin?'Unpin':'Pin'}">${ico('flag',20,n.pin?'var(--glow)':'var(--dim)',1.8)}</button><button type="button" class="cbk" style="width:40px;height:40px" data-act="nEdit" aria-label="${ed?'Done':'Edit'}">${ico(ed?'check':'pen',20,'var(--brass-l)',1.8)}</button></div>
  ${ed?`<input id="nTitle" class="inp ntitle" type="text" value="${esc(n.title||'')}" placeholder="Title" autocomplete="off" aria-label="Note title">`:`<h2 class="ntt" data-act="nEdit">${esc(noteTitle(n))}</h2>`}
  <div class="chips sm" style="margin:8px 0 10px">${cchips}</div>
  ${C.ncNew2?`<div class="arow" style="margin-bottom:10px"><input id="nCatIn" class="inp" type="text" placeholder="New category" autocomplete="off" aria-label="New category name"><button type="button" class="go" data-act="nCatAdd2" aria-label="Add category">${ico('check',22,'currentColor',2.6)}</button></div>`:''}
  ${ed?`<textarea id="nBody" class="tb nbody" placeholder="Write freely.&#10;- bullet&#10;[ ] tick box&#10;https://a-link-on-its-own-line" aria-label="Note body">${esc(n.body||'')}</textarea><p class="nhint">Lines starting with - are bullets, [ ] are tick boxes, # is a heading. A link on its own line becomes a card.</p>`:`<div class="nview" data-act="nEdit">${nBodyHTML(n)}</div>`}
  ${C.ndel===n.id?`<button type="button" class="lnk" data-act="nDel" data-id="${n.id}">Tap again to delete this note</button>`:`<button type="button" class="lnk" data-act="nDel" data-id="${n.id}">Delete note</button>`}</div>`;
}
function ncatsSheetHTML(){
  const q=questOf(U.camp.id);if(!q)return '';const cats=ncatsOf(q);
  return `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-label="Note categories"><h2>Note categories</h2>${cats.map((c,i)=>`<div class="st"><input class="stin ncin" data-i="${i}" value="${esc(c.name)}" aria-label="Category name" autocomplete="off"><button type="button" class="stx" data-act="nCatDel" data-i="${i}" aria-label="Delete category">${ico('x',16,'currentColor',2)}</button></div>`).join('')||'<p class="note" style="margin:0">No categories yet.</p>'}<p class="note" style="margin:10px 0 0;border:0;background:none;padding:0">Deleting a category keeps its notes. They become uncategorised.</p></div>`;
}
function nOpenNote(id,edit){const C=U.camp;C.note=id;C.nedit=!!edit;C.ndel=null;C.ncNew2=false;renderOverlay();}
function nBack(){
  const C=U.camp,q=questOf(C.id);if(!q)return;
  const n=notesOf(q).find(x=>x.id===C.note);
  if(n&&!(n.title||'').trim()&&!(n.body||'').trim())q.notes=q.notes.filter(x=>x!==n);
  C.note=null;C.nedit=false;C.ndel=null;save();renderOverlay();
}
function nLine(n,i,fn){const ls=(n.body||'').split('\n');ls[i]=fn(ls[i]);n.body=ls.join('\n');n.at=Date.now();}
function notesAct(act,v,id){
  const C=U.camp,q=C?questOf(C.id):null;
  if(!q||!act.startsWith('n')||act==='noteEdit')return false;
  const note=()=>notesOf(q).find(x=>x.id===(id||C.note));
  switch(act){
    case 'nNew':{const n={id:uid(),title:'',body:'',cat:C.nf||'',pin:false,created:Date.now(),at:Date.now()};notesOf(q).push(n);save();nOpenNote(n.id,true);setTimeout(()=>{const x=$('#nTitle');x&&x.focus();},60);return true;}
    case 'nOpen':nOpenNote(id,false);return true;
    case 'nBack':nBack();return true;
    case 'nEdit':{const n=note();if(!n)return true;if(C.nedit){n.title=(n.title||'').trim();n.body=(n.body||'').replace(/\s+$/,'');save();}C.nedit=!C.nedit;renderOverlay();if(C.nedit)setTimeout(()=>{const x=$('#nBody');x&&x.focus();},60);return true;}
    case 'nPin':{const n=note();if(n){n.pin=!n.pin;save();renderOverlay();}return true;}
    case 'nDel':{const n=note();if(!n)return true;if(C.ndel===n.id){q.notes=q.notes.filter(x=>x!==n);C.note=null;C.nedit=false;C.ndel=null;save();renderOverlay();}else{C.ndel=n.id;renderOverlay();}return true;}
    case 'nFilter':C.nf=v;renderOverlay();return true;
    case 'nCat':{const n=note();if(n){n.cat=v;save();renderOverlay();}return true;}
    case 'nCatNew':C.ncNew=!C.ncNew;renderOverlay();setTimeout(()=>{const x=$('#nCatIn');x&&x.focus();},60);return true;
    case 'nCatNew2':C.ncNew2=!C.ncNew2;renderOverlay();setTimeout(()=>{const x=$('#nCatIn');x&&x.focus();},60);return true;
    case 'nCatAdd':case 'nCatAdd2':{
      const x=$('#nCatIn'),name=x?x.value.trim():'';if(!name)return true;
      let c=ncatsOf(q).find(k=>k.name.toLowerCase()===name.toLowerCase());
      if(!c){c={id:uid(),name};q.ncats.push(c);}
      if(act==='nCatAdd2'){const n=note();if(n)n.cat=c.id;C.ncNew2=false;}else{C.ncNew=false;C.nf=c.id;}
      save();renderOverlay();return true;}
    case 'nCatSheet':U.sheet='ncats';renderOverlay();return true;
    case 'nCatDel':return true;
    case 'nTick':{const n=note();if(!n)return true;nLine(n,+v,l=>l.replace(/\[( |x|X)\]/,(m,c)=>c===' '?'[x]':'[ ]'));save();renderOverlay();return true;}
    case 'nBoard':{
      const n=note();if(!n)return true;const i=+v,ls=(n.body||'').split('\n'),m=(ls[i]||'').trim().match(/^(?:[-*]\s+)?\[ \]\s*(.*)$/);if(!m||!m[1].trim())return true;
      const col=startCol(q),title=m[1].trim().replace(/^(.)/,s=>s.toUpperCase());
      const t={id:uid(),title,cat:S.last||S.cats[0].id,date:'',time:'',dur:30,done:false,moves:0,createdAt:Date.now(),rep:'',q:q.id,col,ord:endOrd(q,col)};
      S.tasks.push(t);assignCol(t,col);const old=ls[i];nLine(n,i,l=>l.replace('[ ]','[>]'));save();logEv('added',t,{raw:title,catManual:false,suggested:'',batch:false,viaNote:true});
      const cn=(colsOf(q).find(c=>c.id===col)||{}).name||'the board';
      renderOverlay();renderMain();
      toast({face:5,text:'Sent to '+cn+'.'},()=>{S.tasks=S.tasks.filter(x=>x.id!==t.id);const nn=notesOf(q).find(x=>x.id===n.id);if(nn)nLine(nn,i,()=>old);save();renderOverlay();renderMain();});
      return true;}
  }
  return false;
}
/* category delete reads data-i from the clicked element */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act="nCatDel"]');if(!b||!U.camp)return;
  const q=questOf(U.camp.id);if(!q)return;const i=+b.dataset.i,c=ncatsOf(q)[i];if(!c)return;
  notesOf(q).forEach(n=>{if(n.cat===c.id)n.cat='';});q.ncats.splice(i,1);if(U.camp.nf===c.id)U.camp.nf='';save();renderOverlay();
});
document.addEventListener('input',e=>{
  const t=e.target,C=U.camp;if(!C)return;const q=questOf(C.id);if(!q)return;
  if(t.id==='nSearch'){C.ns=t.value;const l=$('#nList');if(l)l.innerHTML=nListInner(q);}
  else if(t.id==='nTitle'){const n=notesOf(q).find(x=>x.id===C.note);if(n){n.title=t.value;n.at=Date.now();save();}}
  else if(t.id==='nBody'){const n=notesOf(q).find(x=>x.id===C.note);if(n){n.body=t.value;n.at=Date.now();save();}}
  else if(t.classList&&t.classList.contains('ncin')){const c=ncatsOf(q)[+t.dataset.i];if(c){c.name=t.value;save();}}
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||!U.camp)return;
  if(e.target.id==='nCatIn'){e.preventDefault();const b=document.querySelector('[data-act=nCatAdd],[data-act=nCatAdd2]');b&&b.click();}
  else if(e.target.id==='nTitle'){e.preventDefault();const x=$('#nBody');x&&x.focus();}
});
