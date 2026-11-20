const C='rus-v7',A=['./','index.html','data.js','asp.js','lex.js','concrete.jpg','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
// Books and their word list live in their own cache, so app updates don't download them again. Change BC only if a book file changes.
const BC='rusbooks-2',BKS=['books/dict.json','books/bible-nt.json','books/bible-ot.json','books/uchenie.json','books/dama.json','books/karamazov.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))
 .then(()=>caches.open(BC)).then(c=>Promise.all(BKS.map(u=>c.match(u).then(m=>m||c.add(u).catch(()=>{})))))
 .then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>(x.startsWith('rus-')&&x!==C)||(x.startsWith('rusbooks-')&&x!==BC)).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).hostname.endsWith('supabase.co'))return;
 if(new URL(e.request.url).pathname.includes('/books/')){e.respondWith(caches.open(BC).then(c=>c.match(e.request,{ignoreSearch:true}).then(m=>m||fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}))));return}e.respondWith(caches.match(e.request).then(r=>{const f=fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res}).catch(()=>r);return r||f}))});
// Daily reminder
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};e.waitUntil(self.registration.showNotification(d.title||'Глаголы ★',{body:d.body||'Пора на смену.',icon:'icon-192.png',badge:'icon-192.png',data:d.url||'./'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l)if('focus' in c)return c.focus();return clients.openWindow(e.notification.data)}))});
