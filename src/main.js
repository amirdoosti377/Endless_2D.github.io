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
$('best').textContent = best.toLocaleString();
const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
function notify(message) { $('notice').textContent = message; noticeUntil = performance.now() + 2400; }
function start() { $('ability-options').hidden=true; $('play').hidden=false; world.reset(); renderer.lastTime=undefined; state = 'playing'; accumulator = 0; input.clear(); $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game'); notify('WAVE 01 · KEEP MOVING'); }
function pause() {
  if (state !== 'playing' && state !== 'paused') return;
  if (state === 'paused') { state = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game'); accumulator = 0; return; }
  state = 'paused'; input.clear(); $('overlay').hidden = false; $('panel-tag').textContent = 'PROTOCOL ON HOLD'; $('panel-title').textContent = 'PAUSED.'; $('panel-copy').textContent = 'Take a breath. The arena can wait.'; $('results').hidden = true; $('play').textContent = 'RESUME →'; $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'Resume game');
}
function showChoices(){
  if(world.dead)return;
  state='upgrade';input.clear();accumulator=0;$('pause').disabled=true;$('overlay').hidden=false;$('play').hidden=true;$('results').hidden=true;
  $('panel-tag').textContent='LEVEL UP · CHOOSE ONE';$('panel-title').textContent='EVOLVE.';$('panel-copy').textContent='This ability lasts for the rest of this run. The arena is paused.';
  const options=$('ability-options');options.hidden=false;options.replaceChildren();
  world.offers.forEach((id,index)=>{
    const a=ABILITIES.find(a=>a.id===id),button=document.createElement('button');button.className='ability-card';
    const title=document.createElement('strong');title.textContent=`${index+1}. ${a.name}`;
    const description=document.createElement('span');description.textContent=a.description;
    const rank=document.createElement('small');rank.textContent=`OWNED: ${world.abilities[id]||0} · +1 RANK`;
    button.append(title,description,rank);button.addEventListener('click',()=>{
      if(state!=='upgrade'||!world.chooseAbility(id))return;
      if(world.pendingChoices){showChoices();return;}
      options.hidden=true;$('play').hidden=false;$('overlay').hidden=true;$('pause').disabled=false;input.clear();state='playing';accumulator=0;notify(a.name.toUpperCase()+' ACQUIRED');
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
$('sound').addEventListener('click', () => { const enabled = sound.toggle(); $('sound').textContent = enabled ? 'SOUND ON' : 'SOUND OFF'; $('sound').setAttribute('aria-pressed', String(enabled)); $('sound').setAttribute('aria-label', enabled ? 'Disable sound' : 'Enable sound'); });
window.addEventListener('blur', () => { if (state === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
function end() { $('ability-options').hidden=true;$('play').hidden=false;
  state = 'gameover'; input.clear(); best = Math.max(best, world.score);
  try { localStorage.setItem('endless2d.best', String(best)); } catch { /* Gameplay remains available without persistence. */ }
  $('best').textContent = best.toLocaleString(); $('overlay').hidden = false; $('pause').disabled = true;
  $('panel-tag').textContent = 'RUN COMPLETE'; $('panel-title').textContent = 'SIGNAL LOST.'; $('panel-copy').textContent = 'Every run is another chance to go further.';
  $('results').hidden = false; $('results').textContent = `${world.score.toLocaleString()} POINTS · ${formatTime(world.time)} · ${world.kills} ELIMINATED`;
  $('play').textContent = 'PLAY AGAIN →'; $('play').focus();
}
function hud() {
  const boss=world.enemies.find(e=>e.type==='boss'&&e.hp>0);$('boss-hud').hidden=!boss;
  if(boss){$('boss-name').textContent=`SENTINEL ${boss.tier} · ${boss.mode==='arrival'?'INCOMING':boss.hp<boss.maxHp*.5?'ENRAGED':'ACTIVE'}`;$('boss-bar').style.width=`${boss.hp/boss.maxHp*100}%`;}
  $('build-summary').textContent=Object.entries(world.abilities).map(([id,rank])=>`${ABILITIES.find(a=>a.id===id).name} ×${rank}`).join(' · ');

  $('score').textContent = String(world.score).padStart(6, '0'); $('time').textContent = formatTime(world.time); $('wave').textContent = String(world.wave).padStart(2, '0');
  $('health').textContent = `${world.player.hp} / ${world.stats.maxHp}`; $('health-bar').style.width = `${world.player.hp/world.stats.maxHp*100}%`; $('health-bar').style.background = world.player.hp < 30 ? '#ff627f' : '#5ef4d5';
  $('level').textContent = `PILOT LV. ${world.level}`; $('xp-bar').style.width = `${world.xp / world.nextXP * 100}%`;
}
// Fixed simulation step keeps combat consistent across refresh rates; hidden tabs pause.
function frame(now) {
  const dt = Math.min((now - last) / 1000, .1); last = now;
  if (state === 'playing') {
    accumulator += dt;
    while (accumulator >= CONFIG.step && state === 'playing') {
      world.update(CONFIG.step, input.vector(), renderer); accumulator -= CONFIG.step;
      for (const event of world.events.splice(0)) {
        sound.play(event.type);
        if (event.type === 'hazard') notify('ENERGY SURGE · AVOID THE AMBER ZONE');
        if (event.type === 'wave') notify(`WAVE ${String(event.value).padStart(2, '0')} · SWARM INTENSIFYING`);
        if (event.type === 'level' && state==='playing') showChoices();
        if(event.type==='boss')notify('SENTINEL INCOMING · WATCH ITS ATTACKS');
        if(event.type==='bossDefeated')notify('SENTINEL DEFEATED · COLLECT ITS ENERGY');
        if (event.type === 'dead') end();
      }
    }
  }
  if (now > noticeUntil) $('notice').textContent = '';
  renderer.draw(world, state === 'playing' ? world.time : state === 'menu' ? now / 1000 : world.time, state === 'playing' ? accumulator / CONFIG.step : 1, dt); hud(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
