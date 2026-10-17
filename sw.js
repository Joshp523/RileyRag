// Bump V whenever you deploy a new version so phones refresh their cache.
const V='rr-v5',ASSETS=["./", "./apple-touch-icon.png", "./config.js", "./fonts/alegreya-sans-latin-400-normal.woff2", "./fonts/alegreya-sans-latin-500-normal.woff2", "./fonts/alegreya-sans-latin-700-normal.woff2", "./fonts/alegreya-sc-latin-500-normal.woff2", "./fonts/alegreya-sc-latin-700-normal.woff2", "./icon-192.png", "./icon-512.png", "./index.html", "./manifest.webmanifest", "./vendor/pdf.min.js", "./vendor/pdf.worker.min.js", "./vendor/supabase.js"];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;
 if(r.method!='GET'||new URL(r.url).origin!=location.origin)return; // Supabase requests pass straight through
 if(r.mode=='navigate'){e.respondWith(caches.match('./index.html').then(m=>{const n=fetch(r).then(x=>{if(x.ok)caches.open(V).then(c=>c.put('./index.html',x.clone()));return x}).catch(()=>m);return m||n}));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok)caches.open(V).then(c=>c.put(r,x.clone()));return x})))});
