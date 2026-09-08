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
function start() { world.reset(); state = 'playing'; accumulator = 0; input.clear(); $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game'); notify('WAVE 01 · KEEP MOVING'); }
function pause() {
  if (state !== 'playing' && state !== 'paused') return;
  if (state === 'paused') { state = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pause game'); accumulator = 0; return; }
  state = 'paused'; input.clear(); $('overlay').hidden = false; $('panel-tag').textContent = 'PROTOCOL ON HOLD'; $('panel-title').textContent = 'PAUSED.'; $('panel-copy').textContent = 'Take a breath. The arena can wait.'; $('results').hidden = true; $('play').textContent = 'RESUME →'; $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', 'Resume game');
}
const input = new Input($('game'), pause);
$('play').addEventListener('click', () => state === 'paused' ? pause() : start());
$('pause').addEventListener('click', pause);
$('sound').addEventListener('click', () => { const enabled = sound.toggle(); $('sound').textContent = enabled ? 'SOUND ON' : 'SOUND OFF'; $('sound').setAttribute('aria-pressed', String(enabled)); $('sound').setAttribute('aria-label', enabled ? 'Disable sound' : 'Enable sound'); });
window.addEventListener('blur', () => { if (state === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
function end() {
  state = 'gameover'; input.clear(); best = Math.max(best, world.score);
  try { localStorage.setItem('endless2d.best', String(best)); } catch { /* Gameplay remains available without persistence. */ }
  $('best').textContent = best.toLocaleString(); $('overlay').hidden = false; $('pause').disabled = true;
  $('panel-tag').textContent = 'RUN COMPLETE'; $('panel-title').textContent = 'SIGNAL LOST.'; $('panel-copy').textContent = 'Every run is another chance to go further.';
  $('results').hidden = false; $('results').textContent = `${world.score.toLocaleString()} POINTS · ${formatTime(world.time)} · ${world.kills} ELIMINATED`;
  $('play').textContent = 'PLAY AGAIN →'; $('play').focus();
}
function hud() {
  $('score').textContent = String(world.score).padStart(6, '0'); $('time').textContent = formatTime(world.time); $('wave').textContent = String(world.wave).padStart(2, '0');
  $('health').textContent = `${world.player.hp} / 100`; $('health-bar').style.width = `${world.player.hp}%`; $('health-bar').style.background = world.player.hp < 30 ? '#ff627f' : '#5ef4d5';
  $('level').textContent = `WEAPON LV. ${world.level}`; $('xp-bar').style.width = `${world.xp / world.nextXP * 100}%`;
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
        if (event.type === 'wave') notify(`WAVE ${String(event.value).padStart(2, '0')} · SWARM INTENSIFYING`);
        if (event.type === 'level') notify(`WEAPON LEVEL ${event.value} · POWER INCREASED`);
        if (event.type === 'dead') end();
      }
    }
  }
  if (now > noticeUntil) $('notice').textContent = '';
  renderer.draw(world, now / 1000); hud(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
