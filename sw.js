const C='clinic-diary-v3';
const FILES=['./','index.html','app.js','config.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
  if(u.origin!==location.origin&&!u.hostname.endsWith('jsdelivr.net')&&!u.hostname.endsWith('googleapis.com')&&!u.hostname.endsWith('gstatic.com'))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))))});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Clinic Diary',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Clinic Diary',{body:d.body||'',tag:d.tag,renotify:!!d.tag,icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||''}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){c.postMessage({url});return c.focus()}
    return self.clients.openWindow(self.registration.scope+url);
  }))});
