// The Riley Rag service worker: lets the home-screen app open quickly and receive new-issue alerts.
// Pages always come fresh from the network when there is one, so new uploads show up without bumping anything.
const V='rr-v6',ASSETS=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','emblem.png','masthead.png','favicon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;
 if(r.method!='GET'||new URL(r.url).origin!=location.origin)return;   // Supabase and other sites pass straight through
 e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r.mode=='navigate'?'./':r,y))}return x})
  .catch(()=>caches.match(r.mode=='navigate'?'./':r).then(m=>m||caches.match('index.html'))))});
// New-issue alerts
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};e.waitUntil(self.registration.showNotification(d.title||'The Riley Rag',{body:d.body||'A new issue is out.',icon:'icon-192.png',badge:'icon-192.png',data:d.url||'./'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l)if('focus' in c)return c.focus();return clients.openWindow(e.notification.data)}))});
