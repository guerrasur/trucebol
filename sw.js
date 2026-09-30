const CACHE='trucebol-0.1.0';
const FILES=['./','./index.html','./style.css','./icon.svg','./src/app.js','./src/engine.js','./src/storage.js','./version.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trucebol-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='activate')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(event.request.url.endsWith('/version.json')){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));return;}
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
