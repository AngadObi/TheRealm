/* The Realm: sync through Firebase (Google sign-in, Firestore). The app talks to a small db shim, so it works the same as inside the artifact. */
(function(){
  var cfg=window.REALM_FIREBASE;
  var user=null,resolve,ready=new Promise(function(r){resolve=r;});
  window.claude={use:function(n){return n==='db'?ready:Promise.resolve(null);}};
  if(!cfg||!cfg.apiKey){window.realmSync={status:function(){return 'not set up';},user:function(){return null;},signIn:function(){},signOut:function(){}};return;}
  var base='https://www.gstatic.com/firebasejs/10.12.2/';
  function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=base+src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
  var fs=null,st='loading';
  function wrap(uid){return {collection:function(p){return fs.collection('users/'+uid+'/'+p);},doc:function(p){return fs.doc('users/'+uid+'/'+p);}};}
  window.realmSync={
    status:function(){return user?('on, '+(user.email||'signed in')):st==='loading'?'loading':st==='offline'?'unavailable offline':'tap to sign in with Google';},
    user:function(){return user;},
    signIn:function(){if(!window.firebase)return;var p=new firebase.auth.GoogleAuthProvider();firebase.auth().signInWithPopup(p).catch(function(e){if(e&&e.code!=='auth/popup-closed-by-user')firebase.auth().signInWithRedirect(p);});},
    signOut:function(){firebase.auth().signOut().then(function(){location.reload();});}
  };
  Promise.all([load('firebase-app-compat.js')]).then(function(){return Promise.all([load('firebase-auth-compat.js'),load('firebase-firestore-compat.js')]);}).then(function(){
    firebase.initializeApp(cfg);fs=firebase.firestore();
    try{fs.enablePersistence({synchronizeTabs:true}).catch(function(){});}catch(e){}
    firebase.auth().onAuthStateChanged(function(u){user=u;st=u?'in':'out';if(u)resolve(wrap(u.uid));});
    firebase.auth().getRedirectResult().catch(function(){});
  }).catch(function(){st='offline';});
})();
