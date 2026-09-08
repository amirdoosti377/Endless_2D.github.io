import { REALMS, realmIndex } from './realms.js';
import { RunSave } from './save.js';
import { Banter, levelLine } from './banter.js';
import { setupPWA } from './pwa.js';
import { ABILITIES } from './abilities.js';
import { World } from './world.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { AudioFX } from './audio.js';
import { CONFIG } from './config.js';
const $ = id => document.getElementById(id);
const world = new World(), renderer = new Renderer($('game')), sound = new AudioFX();
let state = 'menu', accumulator = 0, last = performance.now(), noticeUntil = 0, best = 0;
try { best = Number(localStorage.getItem('endless2d.best')) || 0; } catch { /* Private browsing can disable storage. */ }
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error();}};}
const saves=new RunSave(storage,kind=>{$('save-status').textContent=kind==='invalid'?'ذخیرهٔ قبلی قابل خوندن نیست؛ یه دور تازه بزن.':'ذخیره نشد؛ فضای مرورگر رو بررسی کن.';});
let savedRun=saves.read(),lastSave=0,saveScheduled=false;
if(savedRun){$('play').textContent='ادامه بده، هنوز زنده‌ای!';$('panel-copy').textContent='دورت ذخیره شده؛ هر وقت آماده‌ای برگرد تو میدون.';}
function saveRun(){if(['playing','paused','upgrade'].includes(state)&&saves.owns())saves.write(world);}
const banter=new Banter();
const refreshPWA=setupPWA(()=>state==='menu'||state==='gameover');
try{banter.enabled=localStorage.getItem('endless2d.fun')!=='off';}catch{}
$('fun-mode').checked=banter.enabled;$('fun-mode').addEventListener('change',e=>{banter.enabled=e.target.checked;banter.clear();try{localStorage.setItem('endless2d.fun',banter.enabled?'on':'off');}catch{}});
$('best').textContent = best.toLocaleString('fa-IR');
const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
function notify(message) { $('notice').textContent = message; noticeUntil = performance.now() + 2400; }
function start() { sound.resume();banter.clear(); $('ability-options').hidden=true; $('play').hidden=false; savedRun=saves.read();saves.claim(); if(savedRun){saves.restore(world,savedRun);savedRun=null;}else world.reset(); renderer.lastTime=undefined; state = 'playing'; accumulator = 0; input.clear(); $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'توقف بازی'); notify('برگشتی تو میدون؛ وای نستا!');if(world.pendingChoices)showChoices();saveRun(); }
function pause() {
  if (state !== 'playing' && state !== 'paused') return;
  if (state === 'paused') { sound.resume();state = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'توقف بازی'); accumulator = 0; return; }
  state = 'paused'; input.clear();saveRun(); $('overlay').hidden = false; $('panel-tag').textContent = 'یه نفس بگیر'; $('panel-title').textContent = 'وایسا ببینم!'; $('panel-copy').textContent = 'عجله نکن؛ همه همون‌جا منتظرتن.'; $('results').hidden = true; $('play').textContent = 'بزن بریم، ادامه بده'; $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'ادامهٔ بازی');
}
let lastLevelLine='';
function showChoices(){
  if(world.dead)return;
  state='upgrade';banter.clear();input.clear();saveRun();accumulator=0;$('pause').disabled=true;$('overlay').hidden=false;$('play').hidden=true;$('results').hidden=true;
  $('panel-tag').textContent='لول رفت بالا · یکی رو بردار';lastLevelLine=levelLine(lastLevelLine);$('panel-title').textContent=banter.enabled?lastLevelLine:'چی برمی‌داری؟';$('panel-copy').textContent='یکی رو بردار؛ تا آخر این دور مال خودته. فعلاً بازی وایساده.';
  const options=$('ability-options');options.hidden=false;options.replaceChildren();
  world.offers.forEach((id,index)=>{
    const a=ABILITIES.find(a=>a.id===id),button=document.createElement('button');button.className='ability-card';
    const title=document.createElement('strong');title.textContent=`${index+1}. ${a.name}`;
    const description=document.createElement('span');description.textContent=a.description;
    const rank=document.createElement('small');rank.textContent=`تا الان: ${world.abilities[id]||0} · یه رتبه بیشتر`;
    button.append(title,description,rank);button.addEventListener('click',()=>{
      if(state!=='upgrade'||!world.chooseAbility(id))return;
      sound.resume();sound.play('upgrade');saveRun();if(world.pendingChoices){showChoices();return;}
      options.hidden=true;$('play').hidden=false;$('overlay').hidden=true;$('pause').disabled=false;input.clear();state='playing';accumulator=0;notify(a.name.toUpperCase()+' رو گرفتی!');
    });options.append(button);
  });options.firstElementChild?.focus();
}
window.addEventListener('keydown',e=>{
  if(state!=='upgrade')return;
  if(e.key==='Tab'){const buttons=[...$('ability-options').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
  if(!e.repeat&&['1','2','3'].includes(e.key)){$('ability-options').children[Number(e.key)-1]?.click();}
});
const input = new Input($('game'), pause);
$('play').addEventListener('click', () => state === 'paused' ? pause() : start());
$('pause').addEventListener('click', pause);
$('sound').addEventListener('click', () => { const enabled = sound.toggle(); $('sound').textContent = enabled ? 'صدا روشن' : 'صدا خاموش'; $('sound').setAttribute('aria-pressed', String(enabled)); $('sound').setAttribute('aria-label', enabled ? 'صدا رو ببند' : 'صدا رو روشن کن'); });
window.addEventListener('blur', () => { if (state === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if(document.hidden){if(state==='playing')pause();saveRun();} });
window.addEventListener('pagehide',saveRun);
window.addEventListener('storage',()=>{if(saves.claimed&&!saves.owns()&&['playing','paused','upgrade'].includes(state)){state='menu';input.clear();$('overlay').hidden=false;$('ability-options').hidden=true;$('play').hidden=false;$('play').textContent='ادامه تو همین صفحه';savedRun=saves.read();$('panel-copy').textContent='بازی تو یه تب دیگه باز شد؛ اینجا نگهش داشتیم.';}});
function end() { $('ability-options').hidden=true;$('play').hidden=false;
  saves.write(world);savedRun=null;state = 'gameover'; input.clear(); best = Math.max(best, world.score);
  try { localStorage.setItem('endless2d.best', String(best)); } catch { /* Gameplay remains available without persistence. */ }
  $('best').textContent = best.toLocaleString('fa-IR'); $('overlay').hidden = false; $('pause').disabled = true;
  $('panel-tag').textContent = 'این دور تموم شد'; $('panel-title').textContent = 'ای بابا، باختی!'; $('panel-copy').textContent = banter.enabled?'واقعا ریدی !':'یه بار دیگه بزن؛ این دفعه شاید ترکوندی!';
  $('results').hidden = false; $('results').textContent = `${world.score.toLocaleString('fa-IR')} امتیاز · ${formatTime(world.time)} · ${world.kills} تا دشمن جمع شد`;
  $('play').textContent = 'یه دست دیگه بزن'; $('play').focus();
}
function hud() {
  const boss=world.enemies.find(e=>e.type==='boss'&&e.hp>0);$('boss-hud').hidden=!boss;
  if(boss){$('boss-name').textContent=`نگهبان ${boss.tier} · ${boss.mode==='arrival'?'داره میاد':boss.hp<boss.maxHp*.5?'عصبانی شده':'تو میدونه'}`;$('boss-bar').style.width=`${boss.hp/boss.maxHp*100}%`;}
  if(hud.lastBuild!==world.level||hud.lastBuildCount!==world.pendingChoices){
    hud.lastBuild=world.level;hud.lastBuildCount=world.pendingChoices;
    $('build-summary').textContent=Object.entries(world.abilities).map(([id,rank])=>`${ABILITIES.find(a=>a.id===id).name} ×${rank}`).join(' · ');
  }
  $('combat-status').textContent=`برد ${world.stats.range} · ${REALMS[realmIndex(world.time)].name}`+(world.stats.shield?world.shieldTimer<=0?' · سپر آماده':` · سپر ${Math.ceil(world.shieldTimer)}ث`:'');

  $('score').textContent = String(world.score).padStart(6, '0'); $('time').textContent = formatTime(world.time); $('wave').textContent = String(world.wave).padStart(2, '0');
  $('health').textContent = `${world.player.hp} / ${world.stats.maxHp}`; $('health-bar').style.width = `${world.player.hp/world.stats.maxHp*100}%`; $('health-bar').style.background = world.player.hp < 30 ? '#ff627f' : '#5ef4d5';
  $('level').textContent = `لول ${world.level}`; $('xp-bar').style.width = `${world.xp / world.nextXP * 100}%`;
}
// Fixed simulation step keeps combat consistent across refresh rates; hidden tabs pause.
function frame(now) {
  const dt = Math.min((now - last) / 1000, .1); last = now;
  renderer.measure(dt,state==='playing');world.particleBudget=renderer.low?90:240;
  if (state === 'playing') {
    accumulator += dt;
    while (accumulator >= CONFIG.step && state === 'playing') {
      world.update(CONFIG.step, input.vector(), renderer); accumulator -= CONFIG.step;
      for (const event of world.events.splice(0)) {
        sound.play(event.type,event.size);
        if(event.type==='realmWarning')notify('زمین داره عوض می‌شه؛ آماده باش!');
        if(event.type==='realm')notify(REALMS[realmIndex(world.time)].name+'؛ اینجا کجاست دیگه؟');
        if (event.type === 'hazard') notify('اون جای زرده خطرناکه؛ برو کنار!');
        if (event.type === 'wave') notify(`موج ${String(event.value).padStart(2, '0')} · شلوغ شد، حواست باشه!`);
        if (event.type === 'level' && state==='playing') showChoices();
        if(event.type==='boss')notify('گنده‌شون اومد! حواست به حمله‌هاش باشه');
        if(event.type==='bossDefeated'){notify('باس رو جمع کردی؛ انرژیش رو بردار');banter.show('win');}
        if(event.type==='hurt'&&!world.dead)banter.show('hit');
        if (event.type === 'dead'){end();banter.show('dead');}
      }
    }
  }
  if(now-lastSave>1000&&!saveScheduled){
    lastSave=now;saveScheduled=true;
    const task=()=>{saveScheduled=false;saveRun();};
    if(window.requestIdleCallback)requestIdleCallback(task,{timeout:500});else setTimeout(task,0);
  }
  if (now > noticeUntil) $('notice').textContent = '';
  renderer.draw(world, state === 'playing' ? world.time : state === 'menu' ? now / 1000 : world.time, state === 'playing' ? accumulator / CONFIG.step : 1, dt); if(now-(frame.lastHUD||0)>80){hud();refreshPWA();frame.lastHUD=now;} requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
