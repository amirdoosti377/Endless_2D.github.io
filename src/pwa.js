export function setupPWA(isSafe){
 const install=document.getElementById('install'),update=document.getElementById('update-app'),status=document.getElementById('pwa-status');
 let promptEvent=null,registration=null;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;install.hidden=false;});
 install.addEventListener('click',async()=>{if(!promptEvent)return;try{await promptEvent.prompt();await promptEvent.userChoice;}catch{status.textContent="از منوی مرورگرت نصبش کن.";}finally{promptEvent=null;install.hidden=true;}});
 window.addEventListener('appinstalled',()=>{install.hidden=true;status.textContent='نصب شد؛ بزن بریم!';});
 const refresh=()=>{
  update.hidden=!registration?.waiting;update.disabled=!isSafe();
  update.textContent=isSafe()?'نسخهٔ جدید رو بگیر':'به‌روزرسانی بعد از این دور';
 };
 update.addEventListener('click',async()=>{
  if(!isSafe()||!registration?.waiting)return;
  // Other game tabs may still have an active run: let the worker wait naturally.
  const worker=registration.waiting,channel=new MessageChannel();
  channel.port1.onmessage=e=>{if(e.data==='BUSY')status.textContent='اول تب‌های دیگهٔ بازی رو ببند.';};
  worker.postMessage({type:'ACTIVATE_WHEN_ALONE'},[channel.port2]);
 });
 let reloading=false;navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;location.reload();}});
 if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname,updateViaCache:'none'}).then(reg=>{
   registration=reg;refresh();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{refresh();}));
   navigator.serviceWorker.ready.then(()=>{status.textContent='فایل‌های آفلاین آماده‌ان';});
  }).catch(()=>{status.textContent='آفلاین آماده نشد؛ فعلاً آنلاین بازی کن.';});
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration?.update().catch(()=>{});});
 return refresh;
}
