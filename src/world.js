import { ABILITIES, offerAbilities } from './abilities.js';
import { spawnBoss, moveBoss } from './boss.js';
import { moveEnemy } from './behaviors.js';
import { CONFIG, ENEMIES } from './config.js';
import { distance, normalize, segmentHit } from './math.js';
export class World {
  constructor(random = null) { this.random = random || (()=>{this.rngState=(Math.imul(this.rngState,1664525)+1013904223)>>>0;return this.rngState/4294967296;}); this.reset(); }
  reset() {
    this.rngState=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
    this.stats={damage:1,interval:.4,projectiles:1,maxHp:100,armor:0,speed:1,magnet:145,regen:0};this.abilities={};this.pendingChoices=0;this.offers=[];this.bossTier=0;this.nextBoss=90;this.regenTimer=0;this.reliefUntil=0;
    this.player = { x: 0, y: 0, radius: CONFIG.playerRadius, hp: 100, invincible: 0, angle: -Math.PI / 2 };
    this.hostile = []; this.rings = []; this.trail = []; this.hazards = []; this.hazardTimer = 14; this.enemies = []; this.bullets = []; this.pickups = []; this.particles = []; this.events = [];
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
    const pool = this.wave >= 4 ? ['scout','runner','weaver','charger','gunner','tank'] : this.wave >= 3 ? ['scout','runner','weaver','charger','tank'] : this.wave >= 2 ? ['scout','runner','weaver'] : ['scout','scout','runner'];
    const type = pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
    const spec = ENEMIES[type], a = this.random() * Math.PI * 2;
    const radius = Math.hypot(view.width / 2, view.height / 2) + 70;
    const elite=this.wave>=5&&this.random()<.14;
    const hp = (spec.hp + Math.floor((this.wave - 1) * .65))*(elite?2:1);
    this.enemies.push({ ...spec, elite, damage:spec.damage+(elite?5:0), score:spec.score*(elite?2:1), type, x: this.player.x + Math.cos(a) * radius, y: this.player.y + Math.sin(a) * radius, hp, maxHp: hp, hit: 0, seed: this.random() * 10 });
  }
  gainXP(amount){
    this.xp+=amount;
    while(this.xp>=this.nextXP){this.xp-=this.nextXP;this.level++;this.nextXP=8+this.level*4;this.pendingChoices++;this.events.push({type:'level',value:this.level});}
    if(this.pendingChoices&&!this.offers.length)this.offers=offerAbilities(this);
  }
  chooseAbility(id){
    if(this.dead||!this.pendingChoices||!this.offers.includes(id))return false;
    ABILITIES.find(a=>a.id===id).apply(this);this.abilities[id]=(this.abilities[id]||0)+1;this.pendingChoices--;
    this.offers=this.pendingChoices?offerAbilities(this):[];this.player.invincible=Math.max(this.player.invincible,.6);return true;
  }
  damage(amount) {
    const p=this.player;if(this.dead||p.invincible>0)return;
    p.hp=Math.max(0,p.hp-Math.max(3,amount-this.stats.armor));p.invincible=.9;this.shake=5;this.burst(p.x,p.y,'#f5fbff',18);this.events.push({type:'hurt'});
    if(!p.hp){this.dead=true;this.events.push({type:'dead'});}
  }
  update(dt, movement, view = { width: 1200, height: 800 }) {
    if (this.dead || this.pendingChoices) return;
    const p = this.player;
    for(const e of [p,...this.enemies,...this.bullets,...this.hostile]) {e.px=e.x;e.py=e.y;}
    this.time += dt;
    if(this.time>=this.nextBoss&&!this.enemies.some(e=>e.type==='boss')){spawnBoss(this);this.nextBoss=this.time+100;}
    this.regenTimer+=dt;if(this.regenTimer>=5){this.regenTimer-=5;p.hp=Math.min(this.stats.maxHp,p.hp+this.stats.regen);}
    const wave = 1 + Math.floor(this.time / CONFIG.waveSeconds);
    if (wave !== this.wave) { this.wave = wave; this.events.push({ type: 'wave', value: wave }); }
    const vector = Math.hypot(movement.x, movement.y) > 1 ? normalize(movement.x, movement.y) : movement;
    p.x += vector.x * CONFIG.playerSpeed * this.stats.speed * dt; p.y += vector.y * CONFIG.playerSpeed * this.stats.speed * dt;
    p.invincible = Math.max(0, p.invincible - dt); this.shake = Math.max(0, this.shake - dt * 22);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) { this.spawn(view); this.spawnTimer = Math.max(.16, .64 - this.wave * .037)*(this.time<this.reliefUntil?2:this.enemies.some(e=>e.type==='boss')?1.5:1);
      if(this.wave>=3&&this.wave%3===0&&this.random()<.22&&this.time>=this.reliefUntil&&!this.enemies.some(e=>e.type==='boss'))this.spawn(view); }
    this.shotTimer -= dt;
    let target = null, closest = CONFIG.weaponRange;
    for (const e of this.enemies) { const d = distance(p, e); if (d < closest && e.hp > 0) { closest = d; target = e; } }
    if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    else if (Math.hypot(vector.x, vector.y) > .1) p.angle = Math.atan2(vector.y, vector.x);
    if (target && this.shotTimer <= 0) {
      this.shotTimer = this.stats.interval;
      const count = this.stats.projectiles;
      for (let i = 0; i < count; i++) {
        const angle = p.angle + (i - (count - 1) / 2) * .14;
        this.bullets.push({ x: p.x + Math.cos(angle) * 21, y: p.y + Math.sin(angle) * 21, vx: Math.cos(angle) * 680, vy: Math.sin(angle) * 680, life: 1.05, damage: this.stats.damage });
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
          if(e.type==='boss'){this.events.push({type:'bossDefeated'});this.reliefUntil=this.time+8;this.hostile=[];this.nextBoss=this.time+100;}
          this.rings.push({x:e.x,y:e.y,radius:e.radius,color:e.color,life:.45});if(this.rings.length>45)this.rings.shift();
          this.pickups.push({ x: e.x, y: e.y, type: e.type!=='boss' && this.random() < .09 ? 'health' : 'xp', value: e.xp, life: 35 });
          if (this.pickups.length > CONFIG.maxPickups) this.pickups.shift();
        }
        break;
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      if(e.type==='boss')moveBoss(e,this,dt);else moveEnemy(e,this,dt);
      if(distance(p,e)<p.radius+e.radius&&p.invincible<=0){
        this.damage(e.damage);const n=normalize(p.x-e.x,p.y-e.y);e.x-=n.x*45;e.y-=n.y*45;
        if(this.dead)break;
      }
    }
    for(const b of this.hostile){
      const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(segmentHit(ox,oy,b.x,b.y,p,p.radius+b.radius)){this.damage(b.damage);b.life=0;}
    }
    this.hostile=this.hostile.filter(b=>b.life>0);
    this.hazardTimer-=dt;
    if(this.wave>=3&&this.hazardTimer<=0){
      const a=this.random()*Math.PI*2,r=100+this.random()*160;
      this.hazards.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,radius:66,age:0});this.hazardTimer=13;
      this.events.push({type:'hazard'});
    }
    for(const h of this.hazards){h.age+=dt;if(h.age>=1.8&&h.age<2.7&&distance(p,h)<h.radius+p.radius)this.damage(14);}
    this.hazards=this.hazards.filter(h=>h.age<3.2);
    this.trail.push({x:p.x,y:p.y,life:.28});this.trail=this.trail.filter(t=>(t.life-=dt)>0);
    this.rings=this.rings.filter(r=>(r.life-=dt)>0);
    if (!this.dead) for (const item of this.pickups) {
      item.life -= dt; const d = distance(p, item);
      if (d < this.stats.magnet) { const n = normalize(p.x - item.x, p.y - item.y); item.x += n.x * 360 * dt; item.y += n.y * 360 * dt; }
      if (distance(p, item) < p.radius + 10) {
        item.life = 0;
        if (item.type === 'health') { p.hp = Math.min(this.stats.maxHp, p.hp + 18); this.events.push({ type: 'heal' }); }
        else { this.gainXP(item.value); }
      }
    }
    for (const s of this.particles) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.vx *= .96; s.vy *= .96; }
    this.bullets = this.bullets.filter(b => b.life > 0);
    this.enemies = this.enemies.filter(e => e.hp > 0 && (e.type==='boss' || distance(e, p) < Math.max(2000, Math.hypot(view.width, view.height) * 1.5)));
    this.pickups = this.pickups.filter(i => i.life > 0);
    this.particles = this.particles.filter(s => s.life > 0);
  }
}
