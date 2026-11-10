// Rag Press service worker: keeps the editor, fonts and exporter on the phone so it works offline.
const V='press-v11',ASSETS=['./','index.html','manifest.webmanifest','masthead.png','emblem.png','fonts/ibm-plex-mono-latin-400-normal.woff2','fonts/ibm-plex-mono-latin-500-normal.woff2','fonts/ibm-plex-mono-latin-600-normal.woff2','fonts/ibm-plex-sans-latin-400-normal.woff2','fonts/ibm-plex-sans-latin-500-normal.woff2','fonts/ibm-plex-sans-latin-600-normal.woff2','icon-180.png','icon-192.png',
 'lib/supabase.js','lib/pdf.min.js','lib/pdf.worker.min.js','emblem.png','fonts/ibm-plex-mono-latin-400-normal.woff2','fonts/ibm-plex-mono-latin-500-normal.woff2','fonts/ibm-plex-mono-latin-600-normal.woff2','fonts/ibm-plex-sans-latin-400-normal.woff2','fonts/ibm-plex-sans-latin-500-normal.woff2','fonts/ibm-plex-sans-latin-600-normal.woff2','lib/html2canvas.min.js','lib/jspdf.umd.min.js',
 'fonts/anton-latin-400-normal.woff2','fonts/anton-latin-ext-400-normal.woff2','fonts/tinos-latin-400-normal.woff2','fonts/tinos-latin-700-normal.woff2','fonts/tinos-latin-400-italic.woff2','fonts/tinos-latin-700-italic.woff2',
 'fonts/tinos-latin-ext-400-normal.woff2','fonts/tinos-latin-ext-700-normal.woff2','fonts/tinos-latin-ext-400-italic.woff2','fonts/tinos-latin-ext-700-italic.woff2'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('press-')&&k!=V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!='GET'||u.origin!=location.origin)return;                 // Supabase passes straight through
 const page=r.mode=='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/config.js');
 if(page){e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r.mode=='navigate'?'./':r,y))}return x}).catch(()=>caches.match(r.mode=='navigate'?'./':r)));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x})))});
