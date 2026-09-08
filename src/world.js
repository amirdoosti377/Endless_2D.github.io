import { CONFIG, ENEMIES } from './config.js';
import { distance, normalize, segmentHit } from './math.js';
export class World {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.player = { x: 0, y: 0, radius: CONFIG.playerRadius, hp: 100, invincible: 0, angle: -Math.PI / 2 };
    this.enemies = []; this.bullets = []; this.pickups = []; this.particles = []; this.events = [];
    this.time = 0; this.wave = 1; this.score = 0; this.kills = 0; this.level = 1; this.xp = 0; this.nextXP = 8;
    this.spawnTimer = .7; this.shotTimer = 0; this.dead = false; this.shake = 0;
  }
  burst(x, y, color, count = 10) {
    for (let i = 0; i < count && this.particles.length < CONFIG.maxParticles; i++) {
      const a = this.random() * Math.PI * 2, speed = 40 + this.random() * 150;
      this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .3 + this.random() * .4, color });
    }
  }
  spawn(view) {
    if (this.enemies.length >= CONFIG.maxEnemies) return;
    const roll = this.random();
    const type = this.wave > 2 && roll < .18 ? 'tank' : this.wave > 1 && roll < .45 ? 'runner' : 'scout';
    const spec = ENEMIES[type], a = this.random() * Math.PI * 2;
    const radius = Math.hypot(view.width / 2, view.height / 2) + 70;
    const hp = spec.hp + Math.floor((this.wave - 1) * .55);
    this.enemies.push({ ...spec, type, x: this.player.x + Math.cos(a) * radius, y: this.player.y + Math.sin(a) * radius, hp, maxHp: hp, hit: 0, seed: this.random() * 10 });
  }
  update(dt, movement, view = { width: 1200, height: 800 }) {
    if (this.dead) return;
    const p = this.player;
    this.time += dt;
    const wave = 1 + Math.floor(this.time / CONFIG.waveSeconds);
    if (wave !== this.wave) { this.wave = wave; this.events.push({ type: 'wave', value: wave }); }
    const vector = Math.hypot(movement.x, movement.y) > 1 ? normalize(movement.x, movement.y) : movement;
    p.x += vector.x * CONFIG.playerSpeed * dt; p.y += vector.y * CONFIG.playerSpeed * dt;
    p.invincible = Math.max(0, p.invincible - dt); this.shake = Math.max(0, this.shake - dt * 22);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) { this.spawn(view); this.spawnTimer = Math.max(.12, .85 - this.wave * .048); }
    this.shotTimer -= dt;
    let target = null, closest = CONFIG.weaponRange;
    for (const e of this.enemies) { const d = distance(p, e); if (d < closest && e.hp > 0) { closest = d; target = e; } }
    if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    else if (Math.hypot(vector.x, vector.y) > .1) p.angle = Math.atan2(vector.y, vector.x);
    if (target && this.shotTimer <= 0) {
      this.shotTimer = Math.max(.12, .40 - (this.level - 1) * .022);
      const count = Math.min(5, 1 + Math.floor((this.level - 1) / 3));
      for (let i = 0; i < count; i++) {
        const angle = p.angle + (i - (count - 1) / 2) * .14;
        this.bullets.push({ x: p.x + Math.cos(angle) * 21, y: p.y + Math.sin(angle) * 21, vx: Math.cos(angle) * 680, vy: Math.sin(angle) * 680, life: 1.05, damage: 1 + Math.floor((this.level - 1) / 2) });
      }
      this.events.push({ type: 'shoot' });
    }
    for (const b of this.bullets) {
      const ox = b.x, oy = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.life <= 0 || !segmentHit(ox, oy, b.x, b.y, e, e.radius + 4)) continue;
        e.hp -= b.damage; e.hit = .12; b.life = 0; this.burst(b.x, b.y, e.color, 4);
        if (e.hp <= 0) {
          this.score += e.score * this.wave; this.kills++; this.burst(e.x, e.y, e.color, 16);
          this.events.push({ type: 'kill' });
          this.pickups.push({ x: e.x, y: e.y, type: this.random() < .09 ? 'health' : 'xp', value: e.xp, life: 35 });
          if (this.pickups.length > CONFIG.maxPickups) this.pickups.shift();
        }
        break;
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      const direction = normalize(p.x - e.x, p.y - e.y), speed = e.speed * Math.min(1.8, 1 + this.wave * .025);
      e.x += direction.x * speed * dt; e.y += direction.y * speed * dt;
      if (distance(p, e) < p.radius + e.radius && p.invincible <= 0) {
        p.hp = Math.max(0, p.hp - e.damage); p.invincible = 1; this.shake = 7;
        e.x -= direction.x * 60; e.y -= direction.y * 60;
        this.burst(p.x, p.y, '#f5fbff', 18); this.events.push({ type: 'hurt' });
        if (!p.hp) { this.dead = true; this.events.push({ type: 'dead' }); break; }
      }
    }
    if (!this.dead) for (const item of this.pickups) {
      item.life -= dt; const d = distance(p, item);
      if (d < 145) { const n = normalize(p.x - item.x, p.y - item.y); item.x += n.x * 360 * dt; item.y += n.y * 360 * dt; }
      if (distance(p, item) < p.radius + 10) {
        item.life = 0;
        if (item.type === 'health') { p.hp = Math.min(100, p.hp + 18); this.events.push({ type: 'heal' }); }
        else { this.xp += item.value; if (this.xp >= this.nextXP) { this.xp -= this.nextXP; this.level++; this.nextXP = 8 + this.level * 4; p.hp = Math.min(100, p.hp + 8); this.events.push({ type: 'level', value: this.level }); this.burst(p.x, p.y, '#5ef4d5', 35); } }
      }
    }
    for (const s of this.particles) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.vx *= .96; s.vy *= .96; }
    this.bullets = this.bullets.filter(b => b.life > 0);
    this.enemies = this.enemies.filter(e => e.hp > 0 && distance(e, p) < Math.max(2000, Math.hypot(view.width, view.height) * 1.5));
    this.pickups = this.pickups.filter(i => i.life > 0);
    this.particles = this.particles.filter(s => s.life > 0);
  }
}
