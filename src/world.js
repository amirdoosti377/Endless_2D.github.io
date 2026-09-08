import { Terrain } from './terrain-data.js';
import { moveSolid, circleTOI } from './physics.js';
import { SpatialGrid, compact } from './spatial.js';
import { REALM_SECONDS } from './realms.js';
import { ABILITIES, offerAbilities } from './abilities.js';
import { spawnBoss, moveBoss } from './boss.js';
import { moveEnemy } from './behaviors.js';
import { CONFIG, ENEMIES } from './config.js';
import { distance, normalize } from './math.js';
export class World {
  constructor(random = null) { this.random = random || (()=>{this.rngState=(Math.imul(this.rngState,1664525)+1013904223)>>>0;return this.rngState/4294967296;}); this.reset(); }
  reset() {
    this.rngState=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
    this.terrain=new Terrain();this.grid=new SpatialGrid();this.collisionChecks=0;this.particleBudget=240;this.fxState=this.rngState;this.shieldTimer=0;this.pulseTimer=6;
    this.stats={range:CONFIG.weaponRange,crit:0,shield:0,pulse:0,damage:1,interval:.4,projectiles:1,maxHp:100,armor:0,speed:1,magnet:145,regen:0};this.abilities={};this.pendingChoices=0;this.offers=[];this.bossTier=0;this.nextBoss=90;this.regenTimer=0;this.reliefUntil=0;
    this.player = { x: 0, y: 0, radius: CONFIG.playerRadius, hp: 100, invincible: 0, angle: -Math.PI / 2 };
    this.hostile = []; this.rings = []; this.trail = []; this.hazards = []; this.hazardTimer = 14; this.enemies = []; this.bullets = []; this.pickups = []; this.particles = []; this.events = [];
    this.time = 0; this.wave = 1; this.score = 0; this.kills = 0; this.level = 1; this.xp = 0; this.nextXP = 8;
    this.spawnSectors=[]; this.spawnTimer = .7; this.shotTimer = 0; this.dead = false; this.shake = 0;
  }
  fxRandom(){this.fxState=(Math.imul(this.fxState,1664525)+1013904223)>>>0;return this.fxState/4294967296;}
  burst(x, y, color, count = 10) {
    for (let i = 0; i < count && this.particles.length < this.particleBudget; i++) {
      const a = this.fxRandom() * Math.PI * 2, speed = 40 + this.fxRandom() * 150;
      this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .3 + this.fxRandom() * .4, color });
    }
  }
  spawn(view) {
    if (this.enemies.length >= CONFIG.maxEnemies) return;
    const roll = this.random();
    const pool = this.wave >= 5 ? ['scout','runner','weaver','charger','gunner','tank','orbiter','hunter','bomber'] : this.wave >= 4 ? ['scout','runner','weaver','charger','gunner','tank'] : this.wave >= 3 ? ['scout','runner','weaver','charger','tank'] : this.wave >= 2 ? ['scout','runner','weaver'] : ['scout','scout','runner'];
    const type = pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
    const spec = ENEMIES[type];
    // Sixteen perimeter sectors, shuffled into cycles; keep arrivals offscreen.
    this.spawnSectors ??= [];
    if(!this.spawnSectors.length){
      this.spawnSectors=Array.from({length:16},(_,i)=>i);
      for(let i=15;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.spawnSectors[i],this.spawnSectors[j]]=[this.spawnSectors[j],this.spawnSectors[i]];}
    }
    const sector=this.spawnSectors.pop(),side=Math.floor(sector/4),t=((sector%4)+this.random())/4;
    const hw=view.width/2+100,hh=view.height/2+100;
    const sx=side===1?hw:side===3?-hw:(t*2-1)*hw;
    const sy=side===0?-hh:side===2?hh:(t*2-1)*hh;
    const elite=this.wave>=5&&this.random()<.14;
    const hp = (spec.hp + Math.floor((this.wave - 1) * .65))*(elite?2:1);
    const enemy={ ...spec, spawnSector:sector, elite, damage:spec.damage+(elite?5:0), score:spec.score*(elite?2:1), type, x: this.player.x + sx, y: this.player.y + sy, hp, maxHp: hp, hit: 0, seed: this.random() * 10 };
    moveSolid(enemy,0,0,this.terrain);this.enemies.push(enemy);
  }
  hitEnemy(e,amount){
    if(e.hp<=0)return;
    e.hp-=amount;e.hit=.12;this.burst(e.x,e.y,e.color,3);
    if(e.hp>0)return;
    this.score+=e.score*this.wave;this.kills++;this.burst(e.x,e.y,e.color,12);
    this.events.push({type:'kill',size:e.radius});
    if(e.type==='boss'){this.events.push({type:'bossDefeated'});this.reliefUntil=this.time+8;this.hostile.length=0;this.nextBoss=this.time+100;}
    this.rings.push({x:e.x,y:e.y,radius:e.radius,color:e.color,life:.45});if(this.rings.length>45)this.rings.shift();
    this.pickups.push({x:e.x,y:e.y,type:e.type!=='boss'&&this.random()<.09?'health':'xp',value:e.xp,life:35});
    if(this.pickups.length>CONFIG.maxPickups)this.pickups.shift();
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
    if(this.stats.shield>0&&this.shieldTimer<=0){this.shieldTimer=Math.max(6,16-this.stats.shield*2);p.invincible=.45;this.events.push({type:'shield'});this.rings.push({x:p.x,y:p.y,radius:28,color:'#80cfff',life:.45});if(this.rings.length>45)this.rings.shift();return;}
    p.hp=Math.max(0,p.hp-Math.max(3,amount-this.stats.armor));p.invincible=.9;this.shake=5;this.burst(p.x,p.y,'#f5fbff',18);this.events.push({type:'hurt'});
    if(!p.hp){this.dead=true;this.events.push({type:'dead'});}
  }
  update(dt, movement, view = { width: 1200, height: 800 }) {
    if (this.dead || this.pendingChoices) return;
    const p = this.player;
    p.px=p.x;p.py=p.y;
    for(const list of [this.enemies,this.bullets,this.hostile])for(const e of list){e.px=e.x;e.py=e.y;}
    const previousTime=this.time;this.time+=dt;this.collisionChecks=0;
    this.shieldTimer=Math.max(0,this.shieldTimer-dt);
    if(Math.floor((previousTime+3)/REALM_SECONDS)!==Math.floor((this.time+3)/REALM_SECONDS))this.events.push({type:'realmWarning'});
    if(Math.floor(previousTime/REALM_SECONDS)!==Math.floor(this.time/REALM_SECONDS))this.events.push({type:'realm'});
    if(this.time>=this.nextBoss&&!this.enemies.some(e=>e.type==='boss')){spawnBoss(this);this.nextBoss=this.time+100;}
    this.regenTimer+=dt;if(this.regenTimer>=5){this.regenTimer-=5;p.hp=Math.min(this.stats.maxHp,p.hp+this.stats.regen);}
    const wave = 1 + Math.floor(this.time / CONFIG.waveSeconds);
    if (wave !== this.wave) { this.wave = wave; this.events.push({ type: 'wave', value: wave }); }
    const vector = Math.hypot(movement.x, movement.y) > 1 ? normalize(movement.x, movement.y) : movement;
    moveSolid(p,vector.x*CONFIG.playerSpeed*this.stats.speed*dt,vector.y*CONFIG.playerSpeed*this.stats.speed*dt,this.terrain);
    p.invincible = Math.max(0, p.invincible - dt); this.shake = Math.max(0, this.shake - dt * 22);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) { this.spawn(view); this.spawnTimer = Math.max(.16, .64 - this.wave * .037)*(this.time<this.reliefUntil?2:this.enemies.some(e=>e.type==='boss')?1.5:1);
      if(this.wave>=3&&this.wave%3===0&&this.random()<.22&&this.time>=this.reliefUntil&&!this.enemies.some(e=>e.type==='boss'))this.spawn(view); }
    this.shotTimer -= dt;
    this.grid.rebuild(this.enemies);
    let target=null,closest=this.stats.range*this.stats.range;
    const camera=view.camera||p,halfW=view.width/2,halfH=view.height/2;
    const candidates=this.grid.query(p.x-this.stats.range,p.y-this.stats.range,p.x+this.stats.range,p.y+this.stats.range);
    // Target only fully visible enemies, even after a range upgrade on a phone.
    for(const e of candidates){
      const dx=e.x-p.x,dy=e.y-p.y,d2=dx*dx+dy*dy;
      if(d2<closest&&e.hp>0&&Math.abs(e.x-camera.x)+e.radius<halfW-10&&Math.abs(e.y-camera.y)+e.radius<halfH-10&&this.terrain.hit(p.x,p.y,e.x,e.y,3)===Infinity){closest=d2;target=e;}
    }
    if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    else if (Math.hypot(vector.x, vector.y) > .1) p.angle = Math.atan2(vector.y, vector.x);
    if (target && this.shotTimer <= 0) {
      this.shotTimer = this.stats.interval;
      const count = this.stats.projectiles;
      for (let i = 0; i < count; i++) {
        const angle = p.angle + (i - (count - 1) / 2) * .14;
        this.bullets.push({ x: p.x + Math.cos(angle) * 21, y: p.y + Math.sin(angle) * 21, vx: Math.cos(angle) * 680, vy: Math.sin(angle) * 680, life: Math.max(.02,(this.stats.range-21)/680), remaining:this.stats.range-21, damage: this.stats.damage*(this.stats.crit>0&&this.random()<this.stats.crit?2:1) });
      }
      this.events.push({ type: 'shoot' });
    }
    for(const b of this.bullets){
      const ox=b.x,oy=b.y,speed=Math.hypot(b.vx,b.vy);
      const travel=Math.min(speed*dt,b.remaining??speed*Math.max(0,b.life));
      if(travel<=0){b.life=0;continue;}
      b.x+=b.vx/speed*travel;b.y+=b.vy/speed*travel;b.life-=dt;
      if(b.remaining!==undefined)b.remaining-=travel;
      let first=this.terrain.hit(ox,oy,b.x,b.y,3),victim=null;
      // All entity radii are <= 60, including every boss tier.
      const nearby=this.grid.query(Math.min(ox,b.x)-64,Math.min(oy,b.y)-64,Math.max(ox,b.x)+64,Math.max(oy,b.y)+64);
      for(const e of nearby){
        if(e.hp<=0)continue;this.collisionChecks++;
        const hit=circleTOI(ox,oy,b.x,b.y,e.x,e.y,e.radius+4);
        if(hit<first){first=hit;victim=e;}
      }
      if(first!==Infinity){b.x=ox+(b.x-ox)*first;b.y=oy+(b.y-oy)*first;b.life=0;
        if(victim)this.hitEnemy(victim,b.damage);else this.events.push({type:'impact'});
      }
    }
    this.pulseTimer-=dt;
    if(this.stats.pulse>0&&this.pulseTimer<=0){
      this.pulseTimer=6;this.events.push({type:'pulse'});
      this.rings.push({x:p.x,y:p.y,radius:30,color:'#8affdf',life:.45,pulse:true});if(this.rings.length>45)this.rings.shift();
      for(const e of this.grid.query(p.x-130,p.y-130,p.x+130,p.y+130))if(e.hp>0&&distance(p,e)<130&&this.terrain.hit(p.x,p.y,e.x,e.y)===Infinity)this.hitEnemy(e,2*this.stats.pulse);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      const ox=e.x,oy=e.y;
      if(e.avoidTime>0&&(!e.mode||e.mode==='chase')){
        e.avoidTime-=dt;e.x+=Math.cos(e.avoidAngle)*e.speed*dt;e.y+=Math.sin(e.avoidAngle)*e.speed*dt;
      }else if(e.type==='boss')moveBoss(e,this,dt);else moveEnemy(e,this,dt);
      const dx=e.x-ox,dy=e.y-oy;e.x=ox;e.y=oy;
      if(moveSolid(e,dx,dy,this.terrain)&&!(e.avoidTime>0)){
        e.avoidTime=.65;e.avoidAngle=Math.atan2(p.y-e.y,p.x-e.x)+(e.seed%2<1?1:-1)*Math.PI/2;
      }
      if(distance(p,e)<p.radius+e.radius&&p.invincible<=0){
        this.damage(e.damage);const n=normalize(p.x-e.x,p.y-e.y);moveSolid(e,-n.x*45,-n.y*45,this.terrain);
        if(this.dead)break;
      }
    }
    for(const b of this.hostile){
      const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      const wall=this.terrain.hit(ox,oy,b.x,b.y,b.radius),hit=circleTOI(ox,oy,b.x,b.y,p.x,p.y,p.radius+b.radius);
      if(hit<wall&&hit!==Infinity){this.damage(b.damage);b.life=0;}else if(wall!==Infinity)b.life=0;
    }
    compact(this.hostile,b=>b.life>0);
    this.hazardTimer-=dt;
    if(this.wave>=3&&this.hazardTimer<=0){
      const a=this.random()*Math.PI*2,r=100+this.random()*160;
      this.hazards.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,radius:66,age:0});this.hazardTimer=13;
      this.events.push({type:'hazard'});
    }
    for(const h of this.hazards){h.age+=dt;if(h.age>=1.8&&h.age<2.7&&distance(p,h)<h.radius+p.radius)this.damage(14);}
    compact(this.hazards,h=>h.age<3.2);
    this.trail.push({x:p.x,y:p.y,life:.28});compact(this.trail,t=>(t.life-=dt)>0);
    compact(this.rings,r=>(r.life-=dt)>0);
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
    compact(this.bullets,b=>b.life>0&&(b.remaining===undefined||b.remaining>0));
    const despawnDistance=Math.max(2000,Math.hypot(view.width,view.height)*1.5);
    compact(this.enemies,e=>e.hp>0&&(e.type==='boss'||(e.x-p.x)**2+(e.y-p.y)**2<despawnDistance**2));
    compact(this.pickups,i=>i.life>0);
    compact(this.particles,s=>s.life>0);
  }
}
