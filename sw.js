const CACHE='kunhua-ai-pro-v7-20260701-001';
const ASSETS=['./index.html?v=7.0.1','./style.css?v=7.0.1','./script.js?v=7.0.1','./manifest.webmanifest','./assets/kunhua.jpg','./assets/shiyun.jpg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html?v=7.0.1'))))});
