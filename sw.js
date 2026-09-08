const VERSION="1.6.0";
const ASSETS=["./src/spatial.js", "./src/physics.js", "./src/terrain-data.js", "./src/realms.js", "./", "./index.html", "./style.css", "./manifest.webmanifest", "./src/save.js", "./src/terrain.js", "./src/abilities.js", "./src/audio.js", "./src/banter.js", "./src/behaviors.js", "./src/boss.js", "./src/config.js", "./src/environment.js", "./src/input.js", "./src/main.js", "./src/math.js", "./src/pwa.js", "./src/renderer.js", "./src/world.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];

const PREFIX='endless2d:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const absolute=path=>new URL(path,self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(ASSETS.map(path=>new Request(absolute(path),{cache:'reload'})));}
 catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 // Do not claim a page running an older uncached build.
})()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='ACTIVATE_WHEN_ALONE')return;
 event.waitUntil((async()=>{
  const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const ours=tabs.filter(tab=>tab.url.startsWith(self.registration.scope));
  if(ours.length>1){event.ports[0]?.postMessage('BUSY');return;}
  await self.skipWaiting();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||!url.href.startsWith(self.registration.scope))return;
 const path=url.origin+url.pathname;
 if(!ASSETS.some(asset=>absolute(asset)===path))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  return await cache.match(path)||fetch(request);
 })());
});
