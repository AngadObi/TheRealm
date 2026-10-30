const V='realm-1793353366';
const SHELL=['./','./index.html','./manifest.webmanifest','./sync.js','./firebase-config.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.concat(KN()))).then(()=>self.skipWaiting()));});
function KN(){const a=[];for(let i=1;i<=10;i++){a.push('./knight/n'+i+'.png','./knight/l'+i+'.png');}return a;}
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname.endsWith('firestore.googleapis.com')||u.hostname.includes('googleapis.com')&&u.pathname.includes('identitytoolkit')||u.hostname==='securetoken.googleapis.com')return;
  if(u.origin===location.origin&&!u.pathname.includes('/knight/')){
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res;}).catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));return;
  }
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&res.ok&&(u.origin===location.origin||u.hostname.includes('gstatic.com')||u.hostname.includes('googleapis.com')||u.hostname.includes('fonts'))){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res;}).catch(()=>hit);
    return hit||net;
  }));
});
