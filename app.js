{
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return ds(d)};
const TODAY=ds(new Date()),TOM=addD(TODAY,1);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYF=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONH=['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const DAYH=['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const D=s=>new Date(s+'T00:00:00');
const fmtD=s=>{const d=D(s);return DAY[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]};
const rel=s=>s===TODAY?'Today':s===TOM?'Tomorrow':s===addD(TODAY,-1)?'Yesterday':fmtD(s);
const relFull=s=>(s===TODAY||s===TOM?rel(s)+', ':'')+fmtD(s);
const dateEn=s=>s===TODAY?'today ('+fmtD(s)+')':s===TOM?'tomorrow ('+fmtD(s)+')':'on '+fmtD(s);
const dateHi=s=>{const d=D(s);return (s===TODAY?'आज, ':s===TOM?'कल, ':'')+d.getDate()+' '+MONH[d.getMonth()]+' ('+DAYH[d.getDay()]+')'};
const relHi=s=>s===TODAY?'आज':s===TOM?'कल':dateHi(s);
const tm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m};
const mt=n=>pad(Math.floor(n/60))+':'+pad(n%60);
const hm=s=>{const[h,m]=s.split(':').map(Number);return (h%12||12)+':'+pad(m)};
const ap=s=>+s.split(':')[0]<12?'AM':'PM';
const t12=s=>hm(s)+' '+ap(s);
const tHi=s=>{const h=+s.split(':')[0];return (h<12?'सुबह':h<16?'दोपहर':'शाम')+' '+hm(s)};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=p=>{let d=String(p||'').replace(/\D/g,'');if(d.length===11&&d[0]==='0')d=d.slice(1);if(d.length===10)d='91'+d;return d};
const show=p=>{const d=String(p||'').replace(/\D/g,'').slice(-10);return d.slice(0,5)+' '+d.slice(5)};
const fill=(t,o)=>t.replace(/\{(\w+)\}/g,(m,k)=>o[k]??'');
const ago=ts=>{const m=Math.round((Date.now()-ts)/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+(h===1?' hour ago':' hours ago');const d=Math.round(h/24);return d+(d===1?' day ago':' days ago')};
const nowM=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const SRC={missed:'Missed call',call:'Call (talked)',ads:'Google Ads',whatsapp:'WhatsApp',ref:'Referral'};
const OUT={booked:'Booked',callback:'Call back',enquiry:'Enquiry only',other:'Other'};
const KINDS=['patients','appts','fus','leads','calls'];
const LST={new:'New',callback:'Call back',booked:'Booked',lost:'Not interested'};
const RULES=[['Checkup','चेकअप',180],['Scaling / cleaning','दाँतों की सफ़ाई',180],['Filling','फिलिंग',180],['RCT sitting','RCT सिटिंग',7],['Cap after RCT','RCT के बाद कैप',14],['Extraction','दाँत निकालना',7],['Crown fitting','क्राउन फिटिंग',7],['Braces adjustment','ब्रेसेस एडजस्टमेंट',30],['Pain / emergency','दर्द का इलाज',3]];
const TPL={
missed:'नमस्ते! आपने {clinic} ({address_hi}) में कॉल किया था। उस समय डॉक्टर मरीज़ देख रही थीं, इसलिए कॉल नहीं उठ पाया।\nअपॉइंटमेंट के लिए खाली समय:\n{slots_hi}\nजो समय ठीक लगे, इसी नंबर पर अपने नाम के साथ जवाब दें।\n\nHello! You called {clinic}, {address}. The doctor was with a patient, so we could not take your call.\nAvailable slots:\n{slots}\nJust reply here with your name and the time that suits you.\n\n– {doctor}',
remind:'नमस्ते {name} जी,\n{date_hi} को {time_hi} बजे {clinic} ({address_hi}) में आपका अपॉइंटमेंट है ({treatment_hi})। न आ पाएँ तो इसी नंबर पर बता दें।\n\nHello {name},\nYour appointment at {clinic}, {address} is {date} at {time} ({treatment}). If you cannot come, please reply here.\n\n– {doctor}',
follow:'नमस्ते {name} जी,\n{clinic} से याद दिला रहे हैं: आपके {treatment_hi} का समय हो गया है। कब आना ठीक रहेगा? इसी नंबर पर जवाब दें।\n\nHello {name},\nA reminder from {clinic}: your {treatment} is due. When would you like to come? Just reply here.\n\n– {doctor}',
noshow:'नमस्ते {name} जी,\nआज {time_hi} बजे आपका अपॉइंटमेंट था, आप नहीं आ पाए। कोई बात नहीं, नया समय चाहिए तो इसी नंबर पर बता दें।\n\nHello {name},\nWe missed you at your {time} appointment today. No problem, reply here if you would like a new time.\n\n– {doctor}'};
const PREV_TPL={
missed:'नमस्ते! आपने {clinic} ({address_hi}) में कॉल किया था। उस समय डॉक्टर मरीज़ देख रही थीं, इसलिए कॉल नहीं उठ पाया।\nअपॉइंटमेंट के लिए खाली समय:\n{slots_hi}\nजो समय ठीक लगे, इसी नंबर पर जवाब दें।\n\nHello! You called {clinic}, {address}. The doctor was with a patient, so we could not take your call.\nAvailable slots:\n{slots}\nJust reply here with the time that suits you.\n\n– {doctor}',
remind:'नमस्ते {name} जी,\n{date_hi} को {time_hi} बजे {clinic} ({address_hi}) में आपका अपॉइंटमेंट है ({treatment_hi})। न आ पाएँ तो इसी नंबर पर बता दें।\n\nHello {name},\nYour appointment at {clinic}, {address} is {date} at {time} ({treatment}). If you cannot come, please reply here.\n\n– {doctor}',
follow:'नमस्ते {name} जी,\n{clinic} से याद दिला रहे हैं: आपके {treatment_hi} का समय हो गया है। कब आना ठीक रहेगा? इसी नंबर पर जवाब दें।\n\nHello {name},\nA reminder from {clinic}: your {treatment} is due. When would you like to come? Just reply here.\n\n– {doctor}',
noshow:'नमस्ते {name} जी,\nआज {time_hi} बजे आपका अपॉइंटमेंट था, आप नहीं आ पाए। कोई बात नहीं, नया समय चाहिए तो इसी नंबर पर बता दें।\n\nHello {name},\nWe missed you at your {time} appointment today. No problem, reply here if you would like a new time.\n\n– {doctor}'};
const OLD_TPL={
missed:'नमस्ते! आपने {clinic} में कॉल किया था। उस समय डॉक्टर मरीज़ देख रही थीं, इसलिए कॉल नहीं उठ पाया।\nअपॉइंटमेंट के लिए खाली समय:\n{slots_hi}\nजो समय ठीक लगे, इसी नंबर पर जवाब दें।\n\nHello! You called {clinic}. The doctor was with a patient, so we could not take your call.\nAvailable slots:\n{slots}\nJust reply here with the time that suits you.\n\n– {doctor}',
remind:'नमस्ते {name} जी,\n{date_hi} को {time_hi} बजे {clinic} में आपका अपॉइंटमेंट है ({treatment_hi})। न आ पाएँ तो इसी नंबर पर बता दें।\n\nHello {name},\nYour appointment at {clinic} is {date} at {time} ({treatment}). If you cannot come, please reply here.\n\n– {doctor}',
follow:'नमस्ते {name} जी,\n{clinic} से याद दिला रहे हैं: आपके {treatment_hi} का समय हो गया है। कब आना ठीक रहेगा? इसी नंबर पर जवाब दें।\n\nHello {name},\nA reminder from {clinic}: your {treatment} is due. When would you like to come? Just reply here.\n\n– {doctor}',
noshow:'नमस्ते {name} जी,\nआज {time_hi} बजे आपका अपॉइंटमेंट था, आप नहीं आ पाए। कोई बात नहीं, नया समय चाहिए तो इसी नंबर पर बता दें।\n\nHello {name},\nWe missed you at your {time} appointment today. No problem, reply here if you would like a new time.\n\n– {doctor}'};
const TPLN={missed:'Reply to a missed call',remind:'Appointment reminder',follow:'Follow-up due',noshow:'Did not come'};

function seed(){
  const P=[['Sunita Devi','9000000101'],['Ramesh Yadav','9000000102'],['Anjali Kumari','9000000103'],['Mohammad Arif','9000000104'],['Priya Singh','9000000105'],['Vikas Jha','9000000106'],['Geeta Mandal','9000000107'],['Rahul Sah','9000000108']].map(([name,phone])=>({id:uid(),name,phone}));
  const A=(i,date,time,tr,status='booked')=>({id:uid(),pid:P[i].id,date,time,tr,status});
  const F=(i,due,tr)=>({id:uid(),pid:P[i].id,due,tr,done:false});
  const n=Date.now();
  return {demo:true,at:0,
    set:{clinic:'Gupta Dental Care & Hospital',addr:'Mangal Bazar, Katihar',addr_hi:'मंगल बाज़ार, कटिहार',doctor:'Dr. Saloni Kumari',open:'10:00',close:'19:00',ls:'14:00',le:'16:00',slot:30,off:'0'},
    rules:RULES.map(r=>({n:r[0],hi:r[1],d:r[2]})),tpl:{...TPL},patients:P,
    appts:[A(0,TODAY,'10:00','RCT sitting','done'),A(1,TODAY,'11:00','Checkup'),A(4,TODAY,'12:30','Cap after RCT'),A(5,TODAY,'17:00','Braces adjustment'),A(6,TODAY,'18:00','Scaling / cleaning'),
      A(2,TOM,'10:30','RCT sitting'),A(3,TOM,'11:30','Filling'),A(7,TOM,'17:30','Scaling / cleaning'),A(0,addD(TODAY,7),'10:00','RCT sitting')],
    fus:[F(6,TOM,'Scaling / cleaning'),F(5,addD(TODAY,-1),'Braces adjustment'),F(4,TOM,'Cap after RCT')],
    calls:[{id:'dc1',phone:'9000000102',pid:P[1].id,at:n-40*6e4,status:'answered',dur:185,outcome:null},{id:'dc2',phone:'9000000209',at:n-95*6e4,status:'answered',dur:72,outcome:null},
      {id:'dc3',phone:'9000000201',at:n-25*6e4,status:'missed',dur:0,outcome:null},{id:'dc4',phone:'9000000204',at:n-50*36e5,status:'answered',dur:240,outcome:'booked'}],
    leads:[{id:uid(),phone:'9000000201',name:'',src:'missed',at:n-25*6e4,status:'new',tries:0,note:''},
      {id:uid(),phone:'9000000202',name:'',src:'ads',at:n-2*36e5,status:'new',tries:0,note:''},
      {id:uid(),phone:'9000000203',name:'Sanjay',src:'whatsapp',at:n-26*36e5,status:'callback',tries:1,note:'Toothache, call in the evening'},
      {id:uid(),phone:'9000000204',name:'Pooja',src:'missed',at:n-50*36e5,status:'booked',tries:0,note:''}]};
}
function blank(){const s=seed();return {...s,demo:false,patients:[],appts:[],fus:[],leads:[],calls:[]}}

const KEY='clinic-diary-v2';
let S=null;
try{const r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}
if(!S)S=seed();
for(const k of KINDS)if(!Array.isArray(S[k]))S[k]=[];
if(!S.set.remindAt)S.set.remindAt='18:00';
if(!S.set.addr){S.set.addr='Mangal Bazar, Katihar';S.set.addr_hi='मंगल बाज़ार, कटिहार'}
if(S.demo||/^(Smile Dental Clinic|My Dental Clinic)$/.test(S.set.clinic)){S.set.clinic='Gupta Dental Care & Hospital';}
if(/^Dr\. (Neha|Gupta)?$/.test((S.set.doctor||'').trim()))S.set.doctor='Dr. Saloni Kumari';
for(const k of Object.keys(TPL))if(!S.tpl[k]||S.tpl[k]===OLD_TPL[k]||S.tpl[k]===PREV_TPL[k])S.tpl[k]=TPL[k];
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function save(){S.at=Date.now();saveLocal();schedulePush()}

/* ---------- Cloud: login, sync, live updates, notifications ---------- */
const CFG=window.CLINIC_CFG||{};
let sb=null,user=null,cid=null,clinicRow=null,snap={},setSnap='',pushT=0,chan=null,cloudMsg='',syncState='',pushOn=false;
const cloudReady=()=>!!(CFG.url&&CFG.anon&&window.supabase&&window.supabase.createClient);
const settingsJSON=()=>JSON.stringify({set:S.set,rules:S.rules,tpl:S.tpl});
const SEP='\u0001';
function snapAll(){snap={};for(const k of KINDS)for(const o of S[k])snap[k+SEP+o.id]=JSON.stringify(o);setSnap=settingsJSON()}
function schedulePush(){if(!sb||!cid)return;clearTimeout(pushT);pushT=setTimeout(pushNow,600)}
async function pushNow(){
  if(!sb||!cid)return;
  const up=[],del={},seen=new Set();
  for(const k of KINDS)for(const o of S[k]){const key=k+SEP+o.id;seen.add(key);const j=JSON.stringify(o);if(snap[key]!==j){up.push({clinic_id:cid,kind:k,id:String(o.id),data:o});snap[key]=j}}
  for(const key of Object.keys(snap))if(!seen.has(key)){const[k,id]=key.split(SEP);(del[k]=del[k]||[]).push(id);delete snap[key]}
  const sj=settingsJSON();
  try{
    for(let i=0;i<up.length;i+=400){const{error}=await sb.from('records').upsert(up.slice(i,i+400),{onConflict:'clinic_id,kind,id'});if(error)throw error}
    for(const k of Object.keys(del)){const{error}=await sb.from('records').delete().eq('clinic_id',cid).eq('kind',k).in('id',del[k]);if(error)throw error}
    if(sj!==setSnap){const{error}=await sb.from('clinics').update({name:S.set.clinic,settings:JSON.parse(sj)}).eq('id',cid);if(error)throw error;setSnap=sj}
    if(syncState!=='ok'){syncState='ok';header()}
  }catch(e){
    for(const r of up)delete snap[r.kind+SEP+r.id];
    for(const k of Object.keys(del))for(const id of del[k])snap[k+SEP+id]='pending-delete';
    syncState='offline';header();clearTimeout(pushT);pushT=setTimeout(pushNow,15000);
  }
}
async function pullAll(){
  const rows=[];
  for(let from=0;;from+=1000){const{data,error}=await sb.from('records').select('kind,id,data').eq('clinic_id',cid).range(from,from+999);if(error)throw error;rows.push(...data);if(data.length<1000)break}
  return rows;
}
function applyRemote(rows,cl){
  for(const k of KINDS)S[k]=[];
  for(const r of rows)if(S[r.kind])S[r.kind].push(r.data);
  if(cl&&cl.settings&&cl.settings.set){S.set=cl.settings.set;if(cl.settings.rules)S.rules=cl.settings.rules;S.tpl={...TPL,...(cl.settings.tpl||{})}}
  S.demo=false;snapAll();saveLocal();
}
async function connect(){
  try{
    cloudMsg='Connecting…';render();
    const{data:id,error}=await sb.rpc('create_clinic',{clinic_name:S.set.clinic});if(error)throw error;
    cid=id;
    const{data:cl,error:e2}=await sb.from('clinics').select('*').eq('id',cid).single();if(e2)throw e2;
    clinicRow=cl;
    const rows=await pullAll();
    if(rows.length||(cl.settings&&cl.settings.set)){applyRemote(rows,cl)}
    else{ // brand-new clinic: upload what is on this phone (sample data is dropped)
      if(S.demo){const keep={rules:S.rules,tpl:S.tpl};S={...blank(),...keep,set:{...S.set}}}
      snap={};setSnap='';saveLocal();await pushNow();
    }
    listen();cloudMsg='';syncState='ok';
    try{const reg=await navigator.serviceWorker?.ready;pushOn=!!(reg&&await reg.pushManager?.getSubscription())}catch(_){}
    render();routeHash();
  }catch(e){cloudMsg='Could not connect: '+(e.message||e);syncState='offline';render()}
}
function listen(){
  if(chan)sb.removeChannel(chan);
  chan=sb.channel('clinic-'+cid).on('postgres_changes',{event:'*',schema:'public',table:'records',filter:'clinic_id=eq.'+cid},p=>{
    const r=(p.new&&p.new.kind)?p.new:p.old;if(!r||!S[r.kind])return;
    const key=r.kind+SEP+r.id;
    if(p.eventType==='DELETE'){S[r.kind]=S[r.kind].filter(o=>String(o.id)!==String(r.id));delete snap[key]}
    else{const j=JSON.stringify(p.new.data);if(snap[key]===j)return;const arr=S[r.kind],i=arr.findIndex(o=>String(o.id)===String(r.id));if(i>=0)arr[i]=p.new.data;else arr.push(p.new.data);snap[key]=j}
    saveLocal();if($('#sheet').classList.contains('on'))header();else render();
  }).subscribe();
}
async function refresh(){if(!sb||!cid)return;try{await pushNow();const rows=await pullAll();applyRemote(rows,null);if(!$('#sheet').classList.contains('on'))render()}catch(_){}}
function initCloud(){
  if(!cloudReady())return;
  sb=window.supabase.createClient(CFG.url,CFG.anon,{auth:{persistSession:true,storageKey:'clinic-diary-auth',detectSessionInUrl:true}});
  sb.auth.onAuthStateChange((ev,ses)=>{const u=ses&&ses.user||null;
    if(u&&(!user||u.id!==user.id)){user=u;setTimeout(connect,0)}
    else if(!u&&user){user=null;cid=null;clinicRow=null;if(chan){sb.removeChannel(chan);chan=null}render()}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
}
const b64u=s=>{const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent),standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
async function enablePush(){
  if(isIOS&&!standalone)return toast('First add the app to your Home Screen, then open it from the icon');
  if(!('serviceWorker' in navigator)||!('PushManager' in window))return toast('This browser cannot show notifications');
  try{
    const perm=await Notification.requestPermission();if(perm!=='granted')return toast('Notifications were not allowed');
    const reg=await navigator.serviceWorker.ready;
    const r=await fetch(CFG.url+'/functions/v1/push-key',{headers:{apikey:CFG.anon,authorization:'Bearer '+CFG.anon}});const{publicKey}=await r.json();
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(publicKey)});
    const j=sub.toJSON();const{error}=await sb.from('push_subs').upsert({endpoint:j.endpoint,clinic_id:cid,user_id:user.id,sub:j});if(error)throw error;
    pushOn=true;toast('Notifications are on');render();
  }catch(e){toast('Could not turn on notifications: '+(e.message||e))}
}

let tab='today',vDate=TODAY,lDate=TOM,lf='booked',q='',ctx={};
const pt=id=>S.patients.find(p=>p.id===id)||{name:'?',phone:''};
function nameFor(phone){const n=norm(phone);const p=S.patients.find(x=>norm(x.phone)===n);if(p&&p.name)return p.name;
  const named=[...S.leads,...S.calls].filter(x=>x.name&&norm(x.phone)===n).sort((a,b)=>(b.at||0)-(a.at||0))[0];return named?named.name:''}
const nameBtn=(phone,has)=>`<button class="b sm ghost" data-a="setname" data-id="${esc(phone)}">${has?'Edit name':'+ Add name'}</button>`;
const rule=n=>S.rules.find(r=>r.n===n);
const ruleD=n=>{const r=rule(n);return r?+r.d:180};
const trHi=n=>{const r=rule(n);return r&&r.hi?r.hi:n};
function slots(date){const s=S.set;if(String(D(date).getDay())===String(s.off))return[];const o=[];const st=Math.max(10,+s.slot||30);
  for(let t=tm(s.open);t+st<=tm(s.close);t+=st){if(s.ls&&s.le&&t>=tm(s.ls)&&t<tm(s.le))continue;o.push(mt(t))}return o}
const busy=(d,t)=>S.appts.find(a=>a.date===d&&a.time===t&&a.status!=='cancel');
const freeSlots=d=>slots(d).filter(t=>!busy(d,t)&&(d!==TODAY||tm(t)>nowM()+20));
function nextFree(n){const o=[];for(let i=0;i<14&&o.length<n;i++){const d=addD(TODAY,i);for(const t of freeSlots(d)){o.push([d,t]);if(o.length>=n)break}}return o}
const base=()=>({clinic:S.set.clinic,doctor:S.set.doctor,address:S.set.addr||'',address_hi:S.set.addr_hi||S.set.addr||''});
const apptVars=a=>{const p=pt(a.pid);return {...base(),name:p.name,date:dateEn(a.date),date_hi:dateHi(a.date),time:t12(a.time),time_hi:tHi(a.time),treatment:a.tr,treatment_hi:trHi(a.tr)}};
const wa=(ph,txt)=>'https://wa.me/'+norm(ph)+'?text='+encodeURIComponent(txt);
const msgRemind=a=>fill(S.tpl.remind,apptVars(a));
const msgNoshow=a=>fill(S.tpl.noshow,apptVars(a));
const msgFollow=f=>fill(S.tpl.follow,{...base(),name:pt(f.pid).name,treatment:f.tr,treatment_hi:trHi(f.tr)});
const msgMissed=()=>{const f=nextFree(3);return fill(S.tpl.missed,{...base(),slots:f.length?f.map(([d,t])=>'• '+(d===TODAY?'Today':d===TOM?'Tomorrow':fmtD(d))+', '+t12(t)).join('\n'):'• Soon',slots_hi:f.length?f.map(([d,t])=>'• '+relHi(d)+', '+tHi(t)).join('\n'):'• जल्द ही'})};
const waBtn=(ph,txt,act,id,label)=>`<a class="b wa sm" href="${esc(wa(ph,txt))}" target="_blank" rel="noopener" data-a="${act||''}" data-id="${id||''}">${label||'WhatsApp'}</a>`;
const smsHref=(ph,txt)=>'sms:+'+norm(ph)+'&body='+encodeURIComponent(txt);
const BY={whatsapp:'WhatsApp',sms:'SMS',call:'call'};
const remindBtns=a=>{const p=pt(a.pid),t=msgRemind(a);return `<a class="b wa sm" href="${esc(wa(p.phone,t))}" target="_blank" rel="noopener" data-a="rem" data-by="whatsapp" data-id="${a.id}">WhatsApp</a><a class="b sm" href="${esc(smsHref(p.phone,t))}" data-a="rem" data-by="sms" data-id="${a.id}">SMS</a><a class="b sm" href="tel:+${norm(p.phone)}" data-a="rem" data-by="call" data-id="${a.id}">Call</a>`};
const remTag=a=>a.rem?`<span class="tag">Reminded${a.remBy?' by '+BY[a.remBy]:''}</span>`:'';
const callBtn=(ph,act,id)=>`<a class="b sm" href="tel:+${norm(ph)}" data-a="${act||''}" data-id="${id||''}">Call</a>`;
const kalItems=d=>{const r=S.appts.filter(a=>a.date===d&&a.status==='booked');const f=S.fus.filter(f=>!f.done&&f.due<=d);const l=S.leads.filter(l=>l.status==='new'||l.status==='callback');return{r,f,l,left:r.filter(a=>!a.rem).length+f.length+l.length}};

function header(){
  $('#clinicName').textContent=S.set.clinic||'Clinic Diary';$('#today').textContent=fmtD(TODAY);
  const nl=S.leads.filter(l=>l.status==='new'||l.status==='callback').length+unlabelled().length,ta=S.appts.filter(a=>a.date===TODAY&&a.status==='booked').length,k=kalItems(TOM).left;
  $('#counts').innerHTML=`<button class="cnt ${nl?'hot':''}" data-a="tab" data-id="calls"><b>${nl}</b><span>Calls to handle</span></button><button class="cnt" data-a="tab" data-id="today"><b>${ta}</b><span>Patients left today</span></button><button class="cnt" data-a="tab" data-id="list"><b>${k}</b><span>Tasks for tomorrow</span></button>`;
  const T=[['today','Today',0],['calls','Calls',nl],['list','To-do',k],['patients','Patients',0]];
  $('#tabs').innerHTML=T.map(([k2,n,c])=>`<button class="${tab===k2?'on':''}" data-a="tab" data-id="${k2}">${n}${c?`<sup>${c}</sup>`:''}</button>`).join('');
}
const unlabelled=()=>S.calls.filter(c=>c.status==='answered'&&!c.outcome).sort((a,b)=>b.at-a.at);
const demoNote=()=>S.demo?`<div class="demo">This is sample data so you can see how the app works. To start with your own, tap "Clear everything" in Settings.</div>`:'';

function apptActs(a,big){
  const p=pt(a.pid),k=big?'b':'b sm';
  return a.status==='booked'?`<button class="${k} pri" data-a="done" data-id="${a.id}">Came</button><button class="${k} hot" data-a="noshow" data-id="${a.id}">No-show</button>${callBtn(p.phone).replace('b sm',k)}${waBtn(p.phone,msgRemind(a),'rem',a.id,a.rem?'Remind again':'Remind').replace('b wa sm','b wa'+(big?'':' sm'))}`
    :a.status==='noshow'?`${waBtn(p.phone,msgNoshow(a),'',a.id,'Offer new time')}<button class="b sm ghost" data-a="undo" data-id="${a.id}">Undo</button>`
    :`<button class="b sm ghost" data-a="pat" data-id="${a.pid}">View patient</button><button class="b sm ghost" data-a="undo" data-id="${a.id}">Undo</button>`;
}
function remindBanner(){
  if(vDate!==TODAY||nowM()<14*60)return '';
  const n=S.appts.filter(a=>a.date===TOM&&a.status==='booked'&&!a.rem).length;
  return n?`<button class="alert remind" data-a="remtom"><span>Tomorrow: ${n} ${n===1?'patient':'patients'} not reminded yet</span><span>Remind ›</span></button>`:'';
}
function nextUp(){
  if(vDate!==TODAY)return '';
  const now=nowM(),slot=+S.set.slot||30;
  const a=S.appts.filter(x=>x.date===TODAY&&x.status==='booked'&&tm(x.time)+slot>=now).sort((x,y)=>x.time<y.time?-1:1)[0];
  if(!a)return '';
  const p=pt(a.pid),d=tm(a.time)-now;
  const when=d<=0?'Now':d<60?'In '+d+' min':'At '+t12(a.time);
  return `<div class="card next"><div class="mut">Next patient · <b>${when}</b></div><div class="nm" style="font-size:24px;margin-top:2px" data-a="pat" data-id="${a.pid}">${esc(p.name)}</div>
  <div class="tr">${t12(a.time)} · ${esc(a.tr)} · <span class="ph">${show(p.phone)}</span></div><div class="acts">${apptActs(a,true)}</div></div>`;
}
function vToday(){
  const nl=S.leads.filter(l=>l.status==='new'||l.status==='callback').length+unlabelled().length,sl=slots(vDate),slot=+S.set.slot||30;
  const list=[...new Set([...sl,...S.appts.filter(a=>a.date===vDate&&a.status!=='cancel').map(a=>a.time)])].sort();
  const isPast=t=>vDate<TODAY||(vDate===TODAY&&tm(t)+slot<nowM());
  const rows=[];let brk=false,free=[];
  const flush=()=>{if(!free.length)return;const f=free[0],l=free[free.length-1];
    rows.push(`<div class="slot freeband"><div class="t"><b>${hm(f)}</b><i>${ap(f)}</i></div><div class="c"><div class="free"><span>Free${free.length>1?` until ${t12(mt(tm(l)+slot))}`:''}</span><button class="b sm" data-a="book" data-d="${vDate}" data-t="${f}">+ Book</button></div></div></div>`);free=[]};
  for(const t of list){
    if(S.set.ls&&S.set.le&&!brk&&sl.length&&tm(t)>=tm(S.set.le)&&tm(S.set.ls)<tm(S.set.le)){flush();brk=true;rows.push(`<div class="slot brk"><div class="t"><b>${hm(S.set.ls)}</b><i>${ap(S.set.ls)}</i></div><div class="c">Break until ${t12(S.set.le)}</div></div>`)}
    const a=busy(vDate,t),past=isPast(t);
    if(!a){if(!past)free.push(t);continue}
    flush();
    const p=pt(a.pid);const st=a.status==='done'?'<span class="tag done">Came</span>':a.status==='noshow'?'<span class="tag hot">No-show</span>':a.rem?'<span class="tag">Reminder sent</span>':'';
    rows.push(`<div class="slot ${past?'past':''}"><div class="t"><b>${hm(t)}</b><i>${ap(t)}</i></div><div class="c"><div class="nm" data-a="pat" data-id="${a.pid}">${esc(p.name)}${st}</div><div class="tr">${esc(a.tr)} · <span class="ph">${show(p.phone)}</span></div><div class="acts">${apptActs(a,false)}</div></div></div>`);
  }
  flush();
  const closed=!list.length,allPast=!closed&&!rows.length;
  return `${demoNote()}${nl&&vDate===TODAY?`<button class="alert" data-a="tab" data-id="calls"><span>${nl} ${nl===1?'call needs':'calls need'} your attention</span><span>View ›</span></button>`:''}
  ${remindBanner()}${nextUp()}
  <div class="datebar"><button class="b sm" data-a="dprev" aria-label="Previous day">‹</button><strong>${relFull(vDate)}</strong><button class="b sm" data-a="dnext" aria-label="Next day">›</button></div>
  ${vDate!==TODAY?`<div class="row" style="justify-content:center;margin-bottom:8px"><button class="b sm ghost" data-a="dtoday">Back to today</button></div>`:''}
  ${closed?`<div class="empty">The clinic is closed on this day. You can change the weekly off day in Settings.</div>`:allPast?`<div class="empty">Day is over. See tomorrow with ›</div>`:`<div class="reg">${rows.join('')}</div>`}`;
}

function leadCard(l,full){
  const open=l.status==='new'||l.status==='callback',nm=nameFor(l.phone);
  return `<div class="card ${l.status==='lost'?'done':''}"><div class="hd"><div><div class="big">${nm?esc(nm):show(l.phone)}</div><div class="tr">${nm?show(l.phone)+' · ':''}${SRC[l.src]} · ${ago(l.at)}${full&&l.tries?` · tried ${l.tries}×`:''}</div></div><span class="tag ${l.status==='new'?'hot':l.status==='booked'?'':'done'}">${LST[l.status]}</span></div>
  ${full&&l.note?`<div class="hist">${esc(l.note)}</div>`:''}
  ${open?`<div class="acts">${waBtn(l.phone,msgMissed(),'lwa',l.id,'Send free slots')}${callBtn(l.phone,'lcall',l.id)}<button class="b sm pri" data-a="lbook" data-id="${l.id}">Book</button>${full?`<button class="b sm" data-a="lnoans" data-id="${l.id}">No answer</button><button class="b sm ghost" data-a="llost" data-id="${l.id}">Not interested</button>${nameBtn(l.phone,!!nm)}`:''}</div>`:full&&l.status==='lost'?`<div class="acts"><button class="b sm ghost" data-a="lopen" data-id="${l.id}">Reopen</button></div>`:''}</div>`;
}
function callCard(c,full){
  const p=c.pid?pt(c.pid):S.patients.find(x=>norm(x.phone)===norm(c.phone));
  const nm=nameFor(c.phone),who=nm?esc(nm):show(c.phone);
  const mins=Math.max(1,Math.round((c.dur||0)/60));
  const st=c.status==='missed'?'<span class="tag hot">Missed</span>':c.status==='ringing'?'<span class="tag">Ringing</span>':`<span class="tag">${c.manual?'Logged':'Talked '+mins+' min'}</span>`;
  const out=c.outcome?`<span class="tag done">${OUT[c.outcome]}</span>`:'';
  const need=c.status==='answered'&&!c.outcome;
  return `<div class="card"><div class="hd"><div><div class="nm">${who}</div><div class="tr">${nm?show(c.phone)+' · ':''}${ago(c.at)}${c.note?' · '+esc(c.note):''}</div></div><div style="text-align:right">${st}${out}</div></div>
  ${need?`<div class="mut" style="margin-top:6px">What happened on this call?</div><div class="acts">${outBtns(c.id)}${p?'':nameBtn(c.phone,!!nm)}</div>`:''}
  ${full&&!need?`<div class="acts">${callBtn(c.phone)}${c.rec?`<a class="b sm" href="${esc(c.rec)}" target="_blank" rel="noopener">Recording</a>`:''}${c.outcome?`<button class="b sm ghost" data-a="cundo" data-id="${c.id}">Change label</button>`:''}${p?'':nameBtn(c.phone,!!nm)}</div>`:''}</div>`;
}
const outBtns=id=>`<button class="b sm pri" data-a="cbook" data-id="${id}">Booked</button><button class="b sm" data-a="cback" data-id="${id}">Call back</button><button class="b sm" data-a="cenq" data-id="${id}">Enquiry only</button><button class="b sm ghost" data-a="coth" data-id="${id}">Other</button>`;
function vCalls(){
  const U=unlabelled().map(c=>({at:c.at,h:callCard(c,false)}));
  const L=S.leads.filter(l=>l.status==='new'||l.status==='callback').map(l=>({at:l.at,h:leadCard(l,true)}));
  const todo=[...U,...L].sort((a,b)=>b.at-a.at);
  const done=S.leads.filter(l=>lf==='all'||l.status===lf).filter(l=>lf==='all'||l.status!=='new'&&l.status!=='callback').sort((a,b)=>b.at-a.at);
  const C=[['booked','Booked'],['lost','Not interested'],['all','All leads']];
  const log=[...S.calls].sort((a,b)=>b.at-a.at).filter(c=>!(c.status==='answered'&&!c.outcome)).slice(0,25);
  const live=!!cid;
  return `${demoNote()}<h2 style="margin-top:4px">Needs your attention (${todo.length})</h2>
  <p class="mut" style="margin:0 0 10px">${live?'Clinic line connected: calls appear here by themselves.':'Add calls here with the + button until the clinic line is connected.'}</p>
  ${todo.length?todo.map(x=>x.h).join(''):`<div class="empty">All done. Every call has been handled.</div>`}
  <details class="hist-box"${lf!=='booked'?' open':''}><summary><h2 style="display:inline">History</h2></summary>
  <div class="chips">${C.map(([k,n])=>`<button class="chip ${lf===k?'on':''}" data-a="lf" data-id="${k}">${n}</button>`).join('')}</div>
  ${done.length?done.map(l=>leadCard(l,true)).join(''):`<div class="empty">Nothing here yet.</div>`}
  <h2>Recent calls</h2>${log.length?log.map(c=>callCard(c,true)).join(''):`<div class="empty">No calls yet.</div>`}</details>`;
}
function openCall(id){
  const c=S.calls.find(x=>String(x.id)===String(id));if(!c)return;
  const p=c.pid?pt(c.pid):S.patients.find(x=>norm(x.phone)===norm(c.phone));
  sheet(`<h3>${nameFor(c.phone)?esc(nameFor(c.phone)):show(c.phone)}</h3><div class="mut">${nameFor(c.phone)?show(c.phone)+' · ':''}${c.status==='answered'?'Talked '+Math.max(1,Math.round((c.dur||0)/60))+' min':'Missed call'} · ${ago(c.at)}</div>
  ${c.status==='answered'?`<label for="cNote">Note (optional)</label><input id="cNote" placeholder="e.g. asked RCT price" value="${esc(c.note||'')}"><div class="acts" style="margin-top:12px">${outBtns(c.id)}</div>`:`<div class="acts" style="margin-top:12px">${waBtn(c.phone,msgMissed(),'',c.id,'Send free slots')}${callBtn(c.phone)}</div>`}
  <div class="foot"><button class="b" data-a="close">Close</button></div>`);
}
function openLog(){
  sheet(`<h3>Add a call or message</h3><form id="logF"><label for="gPh">Phone number</label><input id="gPh" type="tel" inputmode="numeric" required placeholder="98xxxxxxxx">
  <label for="gNm">Name (optional)</label><input id="gNm" autocomplete="off" placeholder="e.g. Sanjay Kumar">
  <label>What happened?</label>
  <div class="pick"><button class="b" type="submit" data-k="missed">Missed call</button><button class="b" type="submit" data-k="talked">Talked on phone</button><button class="b" type="submit" data-k="whatsapp">WhatsApp message</button></div>
  <div class="foot"><button type="button" class="b" data-a="close">Cancel</button></div></form>`);
  setTimeout(()=>{const i=$('#gPh');if(i)i.focus()},50);
}
function openName(phone){
  ctx={phone};const nm=nameFor(phone);
  sheet(`<h3>${nm?'Edit name':'Add name'}</h3><div class="mut">${show(phone)}</div><form id="nameF"><label for="nNm">Name</label><input id="nNm" value="${esc(nm)}" placeholder="e.g. Ramesh Yadav" autocomplete="off" required>
  <p class="mut" style="margin:8px 0 0">Saved for this number. Future calls from it will show this name.</p>
  <div class="foot"><button type="button" class="b" data-a="close">Cancel</button><button class="b pri" type="submit">Save</button></div></form>`);
  setTimeout(()=>{const i=$('#nNm');if(i){i.focus();i.select()}},50);
}
function setOutcome(id,out){
  const c=S.calls.find(x=>String(x.id)===String(id));if(!c)return;
  const n=$('#cNote');if(n&&n.value.trim())c.note=n.value.trim();
  c.outcome=out;
  const p=c.pid?pt(c.pid):S.patients.find(x=>norm(x.phone)===norm(c.phone));
  if(out==='callback'){
    const l=S.leads.find(x=>norm(x.phone)===norm(c.phone)&&(x.status==='new'||x.status==='callback'));
    if(l){l.status='callback';if(c.note)l.note=c.note}
    else S.leads.push({id:'L'+c.id,phone:c.phone,name:nameFor(c.phone),src:'call',at:Date.now(),status:'callback',tries:0,note:c.note||'Talked, call back'});
    toast('Added to the call-back list');
  }
  save();close();render();
}

function vList(){
  const k=kalItems(lDate),sent=k.r.filter(a=>a.rem).length;
  return `${demoNote()}<div class="chips">${[[TODAY,'Today'],[TOM,'Tomorrow']].map(([d,n])=>`<button class="chip ${lDate===d?'on':''}" data-a="ld" data-id="${d}">${n}'s list</button>`).join('')}</div>
  <h2>1. Remind patients (${fmtD(lDate)})</h2>
  ${k.r.length?`<div class="mut">${sent} of ${k.r.length} reminded · send by WhatsApp, SMS or a call</div><div class="prog"><i style="width:${sent/k.r.length*100}%"></i></div>`+k.r.sort((a,b)=>a.time<b.time?-1:1).map(a=>{const p=pt(a.pid);return `<div class="card ${a.rem?'done':''}"><div class="hd"><div><div class="nm" data-a="pat" data-id="${a.pid}">${esc(p.name)}</div><div class="tr">${t12(a.time)} · ${esc(a.tr)} · <span class="ph">${show(p.phone)}</span></div></div>${remTag(a)}</div><div class="acts">${remindBtns(a)}</div></div>`}).join(''):`<div class="empty">No appointments on this day.</div>`}
  <h2>2. Follow-up calls</h2>
  ${k.f.length?k.f.sort((a,b)=>a.due<b.due?-1:1).map(f=>{const p=pt(f.pid);const od=f.due<TODAY;return `<div class="card"><div class="hd"><div><div class="nm" data-a="pat" data-id="${f.pid}">${esc(p.name)}</div><div class="tr">${esc(f.tr)} · <span class="ph">${show(p.phone)}</span></div></div><span class="tag ${od?'hot':''}">${od?'Overdue':rel(f.due)}</span></div><div class="acts">${callBtn(p.phone)}${waBtn(p.phone,msgFollow(f))}<button class="b sm pri" data-a="fbook" data-id="${f.id}">Book</button><button class="b sm" data-a="fsnz" data-id="${f.id}">In 3 days</button><button class="b sm ghost" data-a="fdone" data-id="${f.id}">Done</button></div></div>`}).join(''):`<div class="empty">No follow-ups due.</div>`}
  <h2>3. Leads waiting for a reply</h2>
  ${k.l.length?k.l.map(l=>leadCard(l,false)).join(''):`<div class="empty">No leads waiting.</div>`}`;
}

function vPatients(){
  const qq=q.toLowerCase(),qd=q.replace(/\D/g,'');
  const P=S.patients.filter(p=>!q||p.name.toLowerCase().includes(qq)||(qd&&p.phone.includes(qd)));
  return `<h2>Patients (${S.patients.length})</h2><label for="q">Search by name or number</label><input id="q" type="search" value="${esc(q)}" placeholder="e.g. Sunita or 98..." style="margin-bottom:12px">
  ${P.length?P.map(p=>{const nx=S.appts.filter(a=>a.pid===p.id&&a.status==='booked'&&a.date>=TODAY).sort((a,b)=>(a.date+a.time)<(b.date+b.time)?-1:1)[0];const fu=S.fus.filter(f=>f.pid===p.id&&!f.done).sort((a,b)=>a.due<b.due?-1:1)[0];
  return `<div class="card" data-a="pat" data-id="${p.id}" style="cursor:pointer"><div class="hd"><div><div class="nm">${esc(p.name)}</div><div class="ph">${show(p.phone)}</div></div><span class="mut">›</span></div><div class="tr">${nx?`Next appointment: ${rel(nx.date)}, ${t12(nx.time)}`:fu?`Follow-up: ${rel(fu.due)} (${esc(fu.tr)})`:'Nothing scheduled'}</div></div>`}).join(''):`<div class="empty">${S.patients.length?'No match found.':'No patients yet. A patient is added automatically when you book their first appointment.'}</div>`}`;
}

function vSettings(){
  const s=S.set,F=(k,l,t='text')=>`<div><label for="s_${k}">${l}</label><input id="s_${k}" type="${t}" data-set="${k}" value="${esc(s[k])}"></div>`;
  return `<h2>Clinic</h2><div class="two">${F('clinic','Clinic name')}${F('doctor','Doctor name')}${F('addr','Address (English)')}${F('addr_hi','Address (Hindi)')}${F('open','Opens at','time')}${F('close','Closes at','time')}${F('ls','Break starts','time')}${F('le','Break ends','time')}${F('remindAt','Evening to-do notification','time')}
  <div><label for="s_slot">Slot length (minutes)</label><select id="s_slot" data-set="slot">${[15,20,30,45,60].map(n=>`<option ${+s.slot===n?'selected':''}>${n}</option>`).join('')}</select></div>
  <div><label for="s_off">Weekly off</label><select id="s_off" data-set="off"><option value="-1">None</option>${DAYF.map((d,i)=>`<option value="${i}" ${String(s.off)===String(i)?'selected':''}>${d}</option>`).join('')}</select></div></div>
  <h2>Treatments and follow-ups</h2><p class="mut" style="margin:0 0 8px">When you tap "Came", the next follow-up is created this many days later. These are starting guesses, so change them to match your practice. The Hindi name is used in patient messages.</p>
  <div class="rule mut" style="font-size:14px"><span>Treatment / Hindi name</span><span>Days</span><span></span></div>
  ${S.rules.map((r,i)=>`<div class="rule"><div style="display:grid;gap:4px"><input aria-label="Treatment" data-rule="${i}" data-k="n" value="${esc(r.n)}"><input aria-label="Hindi name" data-rule="${i}" data-k="hi" value="${esc(r.hi||'')}" placeholder="Hindi name"></div><input aria-label="Days" type="number" inputmode="numeric" data-rule="${i}" data-k="d" value="${r.d}"><button class="b sm ghost" data-a="rdel" data-id="${i}" aria-label="Remove">✕</button></div>`).join('')}
  <button class="b sm" data-a="radd">+ Add treatment</button>
  <h2>WhatsApp messages (Hindi + English)</h2><p class="mut" style="margin:0">These words are replaced with real details: {name} {date} {date_hi} {time} {time_hi} {treatment} {treatment_hi} {slots} {slots_hi} {clinic} {address} {address_hi} {doctor}</p>
  ${Object.keys(TPL).map(k=>`<label for="t_${k}">${TPLN[k]}</label><textarea id="t_${k}" data-tpl="${k}" style="min-height:220px">${esc(S.tpl[k])}</textarea><button class="b sm ghost" data-a="treset" data-id="${k}">Reset to default</button>`).join('')}
  ${vCloud()}
  <h2>Backup</h2><p class="mut" style="margin:0 0 8px">${cid?'Everything is saved to the cloud as you work.':'Saved on this phone only. Copy a backup every week.'}</p>
  <div class="row"><button class="b" data-a="copy">Copy backup</button><button class="b hot" data-a="wipe">Clear everything</button></div>`;
}

function vCloud(){
  if(!cloudReady())return `<h2>Cloud and clinic line</h2><p class="mut" style="margin:0">Not set up yet. Once it is, you can sign in here to save everything online and get calls in the app by themselves.</p>`;
  if(!user)return `<h2>Cloud and clinic line</h2><p class="mut" style="margin:0 0 4px">Sign in to save everything online and receive clinic calls in the app.</p>
    <form id="authF"><label for="aEmail">Email</label><input id="aEmail" type="email" autocomplete="username" required>
    <label for="aPass">Password (at least 8 characters)</label><input id="aPass" type="password" autocomplete="current-password" minlength="8" required>
    <div class="row" style="margin-top:10px"><button class="b pri" type="submit" data-mode="in">Sign in</button><button class="b" type="submit" data-mode="up">Create account</button></div></form>
    ${cloudMsg?`<p class="mut">${esc(cloudMsg)}</p>`:''}`;
  const tok=clinicRow?clinicRow.webhook_token:'',base=CFG.url+'/functions/v1/call-webhook?t='+tok;
  return `<h2>Cloud and clinic line</h2><p style="margin:0">Signed in as <b>${esc(user.email||'')}</b>. ${syncState==='offline'?'<span class="tag hot">Offline, will retry</span>':'<span class="tag">Synced</span>'}</p>
  ${cloudMsg?`<p class="mut">${esc(cloudMsg)}</p>`:''}
  <label>Notifications</label>${pushOn?'<p class="mut" style="margin:0">On for this phone.</p>':`<button class="b pri" data-a="push">Turn on notifications</button>${isIOS&&!standalone?'<p class="mut">Add the app to your Home Screen first, then open it from the icon.</p>':''}`}
  ${clinicRow?`<label for="cTo">Clinic line rings this number</label><div class="row"><input id="cTo" type="tel" inputmode="numeric" value="${esc(clinicRow.connect_to||'')}" placeholder="Your personal number" style="flex:1"><button class="b" data-a="saveto">Save</button></div>
  <details style="margin-top:12px"><summary class="mut" style="cursor:pointer">Call provider settings (for whoever sets up the line)</summary>
  <p class="mut" style="margin:8px 0 0">Edesy: Webhooks → Add endpoint → paste this URL, all call events. Keep it private: it works like a password.</p><label>Webhook URL</label><div class="row"><code style="flex:1;font-size:13px;overflow-wrap:anywhere">${esc(base)}</code><button class="b sm" data-a="copytxt" data-id="${esc(base)}">Copy</button></div>
  <p class="mut" style="margin:14px 0 0">Exotel: use two Passthru applets.</p><label>When a call starts</label><div class="row"><code style="flex:1;font-size:13px;overflow-wrap:anywhere">${esc(base+'&event=start')}</code><button class="b sm" data-a="copytxt" data-id="${esc(base+'&event=start')}">Copy</button></div><label>When a call ends</label><div class="row"><code style="flex:1;font-size:13px;overflow-wrap:anywhere">${esc(base+'&event=end')}</code><button class="b sm" data-a="copytxt" data-id="${esc(base+'&event=end')}">Copy</button></div></details>`:''}
  <div class="row" style="margin-top:12px"><button class="b ghost" data-a="signout">Sign out</button></div>`;
}
function fab(){const f={today:['book','+ Book'],patients:['book','+ Book'],calls:['logcall','+ Add']}[tab];
  return f?`<button class="fab" data-a="${f[0]}" ${f[0]==='book'?`data-d="${tab==='today'?vDate:''}"`:''}>${f[1]}</button>`:''}
function render(){header();$('#view').innerHTML=({today:vToday,calls:vCalls,list:vList,patients:vPatients,settings:vSettings}[tab]||vToday)()+fab()}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2200)}
function sheet(h){$('#pane').innerHTML=h;$('#sheet').classList.add('on')}
function close(){$('#sheet').classList.remove('on')}
const trOpts=sel=>S.rules.map(r=>`<option ${r.n===sel?'selected':''}>${esc(r.n)}</option>`).join('');

function openBook(o){
  ctx=o;let d=o.d;if(!d){d=TODAY;for(let i=0;i<14;i++){if(freeSlots(addD(TODAY,i)).length){d=addD(TODAY,i);break}}}
  const p=o.pid?pt(o.pid):(o.phone?S.patients.find(x=>norm(x.phone)===norm(o.phone)):null);const l=o.lid?S.leads.find(x=>x.id===o.lid):null;
  sheet(`<h3>New appointment</h3><div class="mut">${l?'Booking from a lead':'Pick a free slot'}</div>
  <form id="bookF"><div class="two"><div><label for="bPh">Phone</label><input id="bPh" type="tel" inputmode="numeric" required value="${esc(p?p.phone:l?l.phone:o.phone||'')}"></div><div><label for="bNm">Name</label><input id="bNm" required value="${esc(p?p.name:l&&l.name?l.name:o.name||nameFor(o.phone||(l&&l.phone)||''))}"></div></div>
  <div class="mut" id="bOld"></div>
  <label>Day</label><div class="pick" id="bDays"></div>
  <div class="row" style="margin-top:6px"><label for="bD" class="mut" style="margin:0;font-weight:400">Other date</label><input id="bD" type="date" min="${TODAY}" value="${d}" style="flex:1;min-height:40px"></div>
  <label>Time</label><div class="pick times" id="bTimes"></div><input type="hidden" id="bT">
  <label for="bTr">Treatment</label><select id="bTr">${trOpts(o.tr||'Checkup')}</select>
  <div class="foot"><button type="button" class="b" data-a="close">Cancel</button><button class="b pri" type="submit">Book</button></div></form>`);
  fillTimes(o.t);oldCheck();
}
function fillTimes(pre,px='b'){
  const d=$('#'+px+'D').value,fs=freeSlots(d);if(pre&&!fs.includes(pre))fs.unshift(pre);
  const days=[];if(px==='d')days.push(d);for(let i=0;i<14&&days.length<4;i++){const x=px==='d'?addD(d,i+1):addD(TODAY,i);if(slots(x).length&&!days.includes(x))days.push(x)}
  if(!days.includes(d))days.unshift(d);
  $('#'+px+'Days').innerHTML=days.sort().map(x=>`<button type="button" class="chip ${x===d?'on':''}" data-a="bday" data-p="${px}" data-id="${x}">${x===TODAY?'Today':x===TOM?'Tomorrow':fmtD(x)}</button>`).join('');
  const sel=pre&&fs.includes(pre)?pre:fs[0]||'';$('#'+px+'T').value=sel;
  $('#'+px+'Times').innerHTML=fs.length?fs.map(t=>`<button type="button" class="chip ${t===sel?'on':''}" data-a="btime" data-p="${px}" data-id="${t}">${t12(t)}</button>`).join(''):'<div class="mut">No free time on this day. Pick another day.</div>';
}

function oldCheck(){const ph=norm($('#bPh').value);const p=ph.length>=12&&S.patients.find(x=>norm(x.phone)===ph);$('#bOld').textContent=p?'Existing patient: '+p.name:'';if(p&&!$('#bNm').value)$('#bNm').value=p.name}
function doBook(){
  const ph=$('#bPh').value.trim(),nm=$('#bNm').value.trim(),d=$('#bD').value,t=$('#bT').value,tr=$('#bTr').value;
  if(norm(ph).length!==12)return toast('Enter a 10-digit mobile number');if(!t)return toast('No free slot, pick another date');
  let p=S.patients.find(x=>norm(x.phone)===norm(ph));if(!p){p={id:uid(),name:nm,phone:ph};S.patients.push(p)}else if(nm)p.name=nm;
  const a={id:uid(),pid:p.id,date:d,time:t,tr,status:'booked'};S.appts.push(a);
  if(ctx.lid){const l=S.leads.find(x=>x.id===ctx.lid);if(l){l.status='booked';l.name=p.name}}
  if(ctx.fid){const f=S.fus.find(x=>x.id===ctx.fid);if(f)f.done=true}
  if(ctx.cid){const c=S.calls.find(x=>String(x.id)===String(ctx.cid));if(c){c.outcome='booked';c.pid=p.id}}
  for(const l of S.leads)if(norm(l.phone)===norm(p.phone)&&(l.status==='new'||l.status==='callback')){l.status='booked';l.name=p.name}
  save();render();
  sheet(`<h3>Booked</h3><p>${esc(p.name)} · ${relFull(d)} · ${t12(t)}</p><p class="mut">Send the patient a confirmation in one tap.</p><div class="foot"><button class="b" data-a="close">Close</button>${waBtn(p.phone,msgRemind(a),'remc',a.id,'Send confirmation').replace('b wa sm','b wa')}</div>`);
}
function openDone(a){
  const p=pt(a.pid),days=ruleD(a.tr);
  ctx={aid:a.id,mode:days<=45?'book':'call'};
  let nd=addD(TODAY,days);for(let i=0;i<7&&!slots(nd).length;i++)nd=addD(nd,1);
  sheet(`<h3>${esc(p.name)} came</h3><div class="mut">${t12(a.time)} · ${show(p.phone)}</div><form id="doneF">
  <label for="dTr">Treatment done today</label><select id="dTr">${trOpts(a.tr)}</select>
  <label>Next visit</label><div class="chips" id="dModes" style="margin:0">${[['book','Book appointment'],['call','Remind me to call'],['none','Not needed']].map(([k,n])=>`<button type="button" class="chip ${ctx.mode===k?'on':''}" data-a="dmode" data-id="${k}">${n}</button>`).join('')}</div>
  <div id="dm-book" ${ctx.mode==='book'?'':'hidden'}><label>Day</label><div class="pick" id="dDays"></div>
    <div class="row" style="margin-top:6px"><label for="dD" class="mut" style="margin:0;font-weight:400">Other date</label><input id="dD" type="date" min="${TODAY}" value="${nd}" style="flex:1;min-height:40px"></div>
    <label>Time</label><div class="pick times" id="dTimes"></div><input type="hidden" id="dT">
    <p class="mut" style="margin:8px 0 0">The day before, this patient shows up in To-do to remind by WhatsApp, SMS or call.</p></div>
  <div id="dm-call" ${ctx.mode==='call'?'':'hidden'}><label for="dNx">Call them on</label><input id="dNx" type="date" min="${TODAY}" value="${addD(TODAY,days)}"></div>
  <div class="foot"><button type="button" class="b" data-a="close">Cancel</button><button class="b pri" type="submit">Save</button></div></form>`);
  fillTimes(null,'d');
}
function openPat(id){
  const p=pt(id);const A=S.appts.filter(a=>a.pid===id).sort((a,b)=>(b.date+b.time)<(a.date+a.time)?-1:1);const F=S.fus.filter(f=>f.pid===id&&!f.done);
  const st={booked:'Scheduled',done:'Came',noshow:'No-show',cancel:'Cancelled'};
  sheet(`<h3>${esc(p.name)}</h3><div class="ph">${show(p.phone)}</div><div class="acts">${callBtn(p.phone)}<a class="b wa sm" href="${esc('https://wa.me/'+norm(p.phone))}" target="_blank" rel="noopener">WhatsApp</a><button class="b sm pri" data-a="pbook" data-id="${id}">New appointment</button></div>
  ${(()=>{const nx=S.appts.filter(a=>a.pid===id&&a.status==='booked'&&a.date>=TODAY).sort((a,b)=>(a.date+a.time)<(b.date+b.time)?-1:1)[0];return nx?`<h2>Next appointment</h2><div class="card next"><div class="nm">${relFull(nx.date)} · ${t12(nx.time)}</div><div class="tr">${esc(nx.tr)} ${remTag(nx)}</div><div class="acts">${remindBtns(nx)}</div></div>`:''})()}
  ${F.length?`<h2>Pending follow-ups</h2>`+F.map(f=>`<div class="hist">${rel(f.due)} · ${esc(f.tr)}</div>`).join(''):''}
  <h2>History</h2>${A.length?A.map(a=>`<div class="hist">${relFull(a.date)}, ${t12(a.time)} · ${esc(a.tr)} · <b>${st[a.status]}</b></div>`).join(''):'<div class="mut">Nothing yet.</div>'}
  <div class="foot"><button class="b" data-a="close">Close</button></div>`);
}

document.addEventListener('click',e=>{
  if(e.target.id==='sheet')return close();
  const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a,id=el.dataset.id;if(!a)return;
  const apt=()=>S.appts.find(x=>x.id===id),ld=()=>S.leads.find(x=>x.id===id),fu=()=>S.fus.find(x=>x.id===id);
  switch(a){
    case 'tab':tab=id;if(id==='today')vDate=TODAY;render();scrollTo(0,0);break;
    case 'cbook':{const c=S.calls.find(x=>String(x.id)===String(id));const n=$('#cNote');if(n&&n.value.trim())c.note=n.value.trim();openBook({phone:c.phone,pid:c.pid,cid:c.id,name:nameFor(c.phone)});break}
    case 'cback':setOutcome(id,'callback');break;
    case 'cenq':setOutcome(id,'enquiry');break;
    case 'coth':setOutcome(id,'other');break;
    case 'cundo':{const c=S.calls.find(x=>String(x.id)===String(id));c.outcome=null;save();render();break}
    case 'logcall':openLog();break;
    case 'setname':openName(id);break;
    case 'remtom':tab='list';lDate=TOM;render();scrollTo(0,0);break;
    case 'dmode':ctx.mode=id;for(const c of document.querySelectorAll('#dModes .chip'))c.classList.toggle('on',c.dataset.id===id);for(const x of ['book','call'])$('#dm-'+x).hidden=x!==id;break;
    case 'bday':{const px=el.dataset.p||'b';$('#'+px+'D').value=id;fillTimes(null,px);break}
    case 'btime':{const px=el.dataset.p||'b';$('#'+px+'T').value=id;for(const c of document.querySelectorAll('#'+px+'Times .chip'))c.classList.toggle('on',c.dataset.id===id);break}
    case 'push':enablePush();break;
    case 'signout':sb.auth.signOut();break;
    case 'saveto':{const v=$('#cTo').value.trim();sb.from('clinics').update({connect_to:v}).eq('id',cid).then(({error})=>{if(error)toast('Could not save');else{clinicRow.connect_to=v;toast('Saved')}});break}
    case 'copytxt':navigator.clipboard?.writeText(id).then(()=>toast('Copied'),()=>toast('Could not copy'));break;
    case 'dprev':vDate=addD(vDate,-1);render();break;
    case 'dnext':vDate=addD(vDate,1);render();break;
    case 'dtoday':vDate=TODAY;render();break;
    case 'book':openBook({d:el.dataset.d,t:el.dataset.t});break;
    case 'done':openDone(apt());break;
    case 'noshow':{const x=apt();x.status='noshow';S.fus.push({id:uid(),pid:x.pid,due:TODAY,tr:x.tr,done:false});save();render();toast('Added to today\'s call list');break}
    case 'undo':{const x=apt();x.status='booked';save();render();break}
    case 'rem':case 'remc':{const x=apt();if(x){x.rem=true;if(el.dataset.by)x.remBy=el.dataset.by;save();setTimeout(render,300)}if(a==='remc')close();break}
    case 'lf':lf=id;render();break;
    case 'ld':lDate=id;render();break;
    case 'lwa':case 'lcall':{const l=ld();if(l&&l.status==='new'){l.status='callback';l.tries=(l.tries||0)+1;save();setTimeout(render,300)}break}
    case 'lnoans':{const l=ld();l.status='callback';l.tries=(l.tries||0)+1;save();render();toast('Kept in the call-back list');break}
    case 'llost':{const l=ld();l.status='lost';save();render();break}
    case 'lopen':{const l=ld();l.status='callback';save();render();break}
    case 'lbook':openBook({lid:id});break;
    case 'fbook':{const f=fu();openBook({fid:id,pid:f.pid,tr:rule(f.tr)?f.tr:'Checkup'});break}
    case 'fsnz':{const f=fu();f.due=addD(TODAY,3);save();render();toast('Will show again in 3 days');break}
    case 'fdone':{const f=fu();f.done=true;save();render();break}
    case 'pat':openPat(id);break;
    case 'pbook':openBook({pid:id});break;
    case 'close':close();break;
    case 'radd':S.rules.push({n:'New treatment',hi:'',d:30});save();render();break;
    case 'rdel':S.rules.splice(+id,1);save();render();break;
    case 'treset':S.tpl[id]=TPL[id];save();render();toast('Message reset');break;
    case 'copy':navigator.clipboard?.writeText(JSON.stringify(S)).then(()=>toast('Backup copied'),()=>toast('Could not copy'));break;
    case 'wipe':if(el.dataset.sure){const keep={rules:S.rules,tpl:S.tpl};S={...blank(),...keep,set:S.set};save();tab='settings';render();toast('All clear. Now add your clinic name and timings')}else{el.dataset.sure=1;el.textContent='Sure? Tap again';setTimeout(()=>{if(el.isConnected){delete el.dataset.sure;el.textContent='Clear everything'}},4000)}break;
  }
});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;
  if(f.id==='bookF')doBook();
  if(f.id==='nameF'){const v=$('#nNm').value.trim(),n=norm(ctx.phone);if(!v)return;
    for(const x of [...S.calls,...S.leads])if(norm(x.phone)===n)x.name=v;
    const p=S.patients.find(x=>norm(x.phone)===n);if(p)p.name=v;
    save();close();render();toast('Name saved')}
  if(f.id==='logF'){const ph=$('#gPh').value,nm=$('#gNm').value.trim(),k=(e.submitter&&e.submitter.dataset.k)||'talked';if(norm(ph).length!==12)return toast('Enter a 10-digit mobile number');
    const phone=String(ph).replace(/\D/g,'').slice(-10),ex=S.patients.find(p=>norm(p.phone)===norm(phone));
    if(nm){for(const x of [...S.calls,...S.leads])if(norm(x.phone)===norm(phone))x.name=nm;if(ex)ex.name=nm}
    if(k==='talked'){const c={id:uid(),phone,at:Date.now(),status:'answered',dur:0,outcome:null,manual:true,note:'',name:nm||undefined};S.calls.push(c);save();tab='calls';render();openCall(c.id)}
    else{const open=S.leads.find(l=>norm(l.phone)===norm(phone)&&(l.status==='new'||l.status==='callback'));
      if(open){open.at=Date.now();if(nm)open.name=nm}else S.leads.push({id:uid(),phone,name:nm||(ex?ex.name:''),src:k==='missed'?'missed':'whatsapp',at:Date.now(),status:'new',tries:0,note:ex?'Existing patient':''});
      save();close();tab='calls';render();toast('Added. Reply from the list.')}}
  if(f.id==='authF'){const mode=(e.submitter&&e.submitter.dataset.mode)||'in',em=$('#aEmail').value.trim(),pw=$('#aPass').value;
    cloudMsg=mode==='up'?'Creating account…':'Signing in…';render();
    (mode==='up'?sb.auth.signUp({email:em,password:pw}):sb.auth.signInWithPassword({email:em,password:pw})).then(({data,error})=>{
      if(error)cloudMsg=error.message==='Invalid login credentials'?'Wrong email or password. New here? Tap Create account.':error.message;
      else if(!data.session)cloudMsg='Account created. Please sign in.';
      else cloudMsg='';
      render()})}
  if(f.id==='doneF'){const x=S.appts.find(a=>a.id===ctx.aid);x.status='done';x.tr=$('#dTr').value;const m=ctx.mode;
    if(m==='book'){const d=$('#dD').value,t=$('#dT').value;if(!t)return toast('No free time that day, pick another day');
      const n={id:uid(),pid:x.pid,date:d,time:t,tr:x.tr,status:'booked'};S.appts.push(n);save();render();
      const p=pt(x.pid);sheet(`<h3>Next visit booked</h3><p>${esc(p.name)} · ${relFull(d)} · ${t12(t)}</p><p class="mut">A reminder will be due the day before. Send the date now too?</p><div class="foot"><button class="b" data-a="close">Close</button>${waBtn(p.phone,msgRemind(n),'',n.id,'Send on WhatsApp').replace('b wa sm','b wa')}</div>`);return}
    if(m==='call')S.fus.push({id:uid(),pid:x.pid,due:$('#dNx').value,tr:x.tr,done:false});
    save();close();render();toast(m==='call'?'Call reminder set: '+rel($('#dNx').value):'Saved')}
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='bD')fillTimes();
  if(t.id==='dD')fillTimes(null,'d');
  if(t.id==='dTr')$('#dNx').value=addD(TODAY,ruleD(t.value));
  if(t.dataset.set){S.set[t.dataset.set]=t.value;save();header()}
  if(t.dataset.rule){const r=S.rules[+t.dataset.rule];r[t.dataset.k]=t.dataset.k==='d'?Math.max(0,+t.value||0):t.value;save()}
  if(t.dataset.tpl){S.tpl[t.dataset.tpl]=t.value;save()}
});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='bPh')oldCheck();if(t.id==='q'){q=t.value.trim();const pos=t.selectionStart;render();const n=$('#q');n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

render();
setInterval(()=>{if(!$('#sheet').classList.contains('on')&&tab==='today')render()},60000);

function routeHash(){
  const h=location.hash.slice(1);if(!h)return;
  if(h.startsWith('call-')){tab='calls';render();openCall(h.slice(5))}
  else if(['calls','leads'].includes(h)){tab='calls';render()}
  else if(['today','list','patients','settings'].includes(h)){tab=h;render()}
  try{history.replaceState(null,'',location.pathname)}catch(_){}
}
addEventListener('hashchange',routeHash);
navigator.serviceWorker?.addEventListener('message',e=>{if(e.data&&e.data.url){location.hash=e.data.url.replace(/^.*#/,'')}});
initCloud();
routeHash();
}

