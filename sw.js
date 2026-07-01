const CACHE_NAME='kunhua-ai-pro-v82-20260701-1';
const ASSETS=['./index.html?v=8.2.0','./style.css?v=8.2.0','./script.js?v=8.2.0','./manifest.webmanifest','./assets/kunhua.jpg?v=8.2','./assets/shiyun.jpg?v=8.2','./assets/qr-kunhua.jpg?v=8.2','./assets/qr-shiyun.jpg?v=8.2','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS).catch(()=>null)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(c=>c||caches.match('./index.html?v=8.2.0'))))});
