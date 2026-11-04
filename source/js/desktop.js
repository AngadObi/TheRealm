/* ---------- laptop layout: sidebar nav (shown by desktop.css on wide screens only) ---------- */
const SIDE=[['list','Today','list','T'],['road','Road','road','R'],['cal','Calendar','week',''],['main','Campaigns','flag','Q'],['side','Side Quests','path','S'],['dragons','The Dragons','flame','D']];
let _sh='';
function renderSide(){
  const el=$('#sidenav');if(!el)return;
  const on=U.camp||U.council||U.pg||U.menu?'':U.view;
  const h=SIDE.map(([v,n,ic,k])=>`<button type="button" class="sn ${on===v?'on':''}" data-act="goto" data-v="${v}">${ico(ic,20,'currentColor',1.7)}<span>${n}</span>${k?`<kbd>${k}</kbd>`:''}</button>`).join('')
   +`<div class="snsep"></div><button type="button" class="sn ${U.council?'on':''}" data-act="council">${ico('crown',20,'currentColor',1.7)}<span>The Council</span><kbd>C</kbd></button><button type="button" class="sn ${U.menu?'on':''}" data-act="menu">${ico('menu',20,'currentColor',1.8)}<span>Menu</span><kbd>M</kbd></button>`;
  if(h===_sh)return;_sh=h;el.innerHTML=h;
}
