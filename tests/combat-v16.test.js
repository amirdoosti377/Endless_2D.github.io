import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {ENEMIES} from '../src/config.js';
import {moveSolid,obstacleTOI,pushOut} from '../src/physics.js';
import {Terrain} from '../src/terrain-data.js';
import {RunSave,snapshot,validate} from '../src/save.js';
import {REALMS,realmIndex} from '../src/realms.js';
const foe=(x,y)=>({...ENEMIES.scout,type:'scout',speed:0,x,y,hp:100,maxHp:100,hit:0,seed:0});
const quiet=()=>{const w=new World(()=>.6);w.spawnTimer=1e6;w.nextBoss=1e6;return w;};
const step=w=>w.update(1/60,{x:0,y:0},{width:390,height:844});
test('movement cannot tunnel through trees or rotated cars; sliding remains possible',()=>{
 for(const o of [{kind:'tree',x:0,y:0,radius:24},{kind:'car',x:0,y:0,hw:21,hh:43,cos:Math.cos(.7),sin:Math.sin(.7)}]){
  const terrain={colliders:()=>[o]},p={x:-110,y:0,radius:15};moveSolid(p,220,0,terrain);assert.ok(p.x<0||Math.abs(p.y)>43);assert.equal(pushOut({...p},o),false);
  const y=p.y;moveSolid(p,0,220,terrain);assert.ok(p.y>y+100);
  assert.ok(obstacleTOI(-110,0,110,0,o,3)<1);
 }
});
test('tree geometry is deterministic and solid terrain caches stay bounded',()=>{
 const a=new Terrain(),b=new Terrain();assert.deepEqual(a.tile(3,-5),b.tile(3,-5));
 for(let i=0;i<1000;i++)a.tile(i,i);assert.ok(a.cache.size<=192);
 let tile;for(let i=0;i<20;i++){const t=a.tile(i,0);if(t.kind==='trees'){tile=t;break;}}
 assert.ok(tile);const o=tile.solids[0],p={x:o.x,y:o.y,radius:15};moveSolid(p,0,0,a);assert.ok(Math.hypot(p.x-o.x,p.y-o.y)>=39);
});
test('base range is short; upgrades never target enemies beyond a mobile viewport',()=>{
 const w=quiet();w.enemies=[foe(220,0)];step(w);assert.equal(w.bullets.length,0);
 w.stats.range=435;step(w);assert.equal(w.bullets.length,0);
 w.enemies=[foe(150,0)];step(w);assert.ok(w.bullets.length>0);
 const z=quiet();z.enemies=[foe(0,-250)];step(z);assert.equal(z.bullets.length,0);
 z.stats.range=300;step(z);assert.ok(z.bullets.length>0);
 const camera=quiet();camera.enemies=[foe(150,0)];camera.update(1/60,{x:0,y:0},{width:390,height:844,camera:{x:-90,y:0}});assert.equal(camera.bullets.length,0);
});
test('bullets stop at range and hit the first entity independent of list order',()=>{
 const w=quiet();w.shotTimer=1e6;const far=foe(90,0),near=foe(45,0);w.enemies=[far,near];
 w.bullets=[{x:0,y:0,vx:680,vy:0,life:1,remaining:150,damage:1}];w.update(.2,{x:0,y:0});assert.equal(near.hp,99);assert.equal(far.hp,100);
 w.bullets=[{x:0,y:100,vx:680,vy:0,life:1,remaining:20,damage:1}];w.update(.1,{x:0,y:0});assert.equal(w.bullets.length,0);
});
test('cover blocks targeting, friendly fire and hostile projectiles',()=>{
 const w=quiet(),o={kind:'car',x:60,y:0,hw:10,hh:35,cos:1,sin:0};
 w.terrain={colliders:()=>[o],hit:(ax,ay,bx,by,pad)=>obstacleTOI(ax,ay,bx,by,o,pad)};
 w.enemies=[foe(120,0)];step(w);assert.equal(w.bullets.length,0);
 w.bullets=[{x:0,y:0,vx:680,vy:0,life:1,remaining:200,damage:5}];
 w.hostile=[{x:120,y:0,vx:-680,vy:0,life:1,radius:6,damage:20}];w.update(.2,{x:0,y:0});
 assert.equal(w.enemies[0].hp,100);assert.equal(w.player.hp,100);assert.equal(w.bullets.length,0);assert.equal(w.hostile.length,0);
});
test('shield absorbs one hit, recharges, and pulse awards each kill once',()=>{
 const w=quiet();w.stats.shield=1;w.damage(20);assert.equal(w.player.hp,100);assert.equal(w.shieldTimer,14);
 w.player.invincible=0;w.damage(20);assert.equal(w.player.hp,80);w.shieldTimer=.01;step(w);w.player.invincible=0;w.damage(20);assert.equal(w.player.hp,80);
 w.stats.pulse=1;w.pulseTimer=0;w.enemies=[{...foe(60,0),hp:2}];w.shotTimer=1e6;step(w);assert.equal(w.kills,1);step(w);assert.equal(w.kills,1);
});
test('realm transitions warn once, preserve collisions and pause at level selection',()=>{
 const w=quiet();w.time=71.99;step(w);assert.equal(w.events.filter(e=>e.type==='realmWarning').length,1);
 w.time=74.99;const tile=w.terrain.tile(2,2);step(w);assert.equal(realmIndex(w.time),1);assert.equal(w.events.filter(e=>e.type==='realm').length,1);assert.deepEqual(w.terrain.tile(2,2),tile);
 assert.equal(REALMS.length,3);w.gainXP(8);const time=w.time;step(w);assert.equal(w.time,time);
});
test('new timers and stats round-trip; legacy runs migrate and new runs reset abilities',()=>{
 const w=quiet();w.stats.range=300;w.stats.shield=2;w.stats.pulse=3;w.stats.crit=.2;w.shieldTimer=7;w.pulseTimer=2;w.time=160;
 const data=JSON.parse(JSON.stringify(snapshot(w)));assert.ok(validate(data));const save=new RunSave({}),b=new World();save.restore(b,data.world);assert.deepEqual(snapshot(b),snapshot(w));
 for(const k of ['range','crit','shield','pulse'])delete data.world.stats[k];for(const k of ['fxState','shieldTimer','pulseTimer'])delete data.world[k];assert.ok(validate(data));save.restore(b,data.world);assert.equal(b.stats.range,210);assert.equal(b.stats.pulse,0);assert.equal(realmIndex(b.time),2);
 b.reset();assert.equal(b.stats.range,210);assert.equal(b.stats.shield,0);
});
test('visual particle budget cannot change gameplay RNG, XP or scores',()=>{
 const a=quiet(),b=quiet();a.rngState=b.rngState=123;a.fxState=b.fxState=456;a.particleBudget=0;b.particleBudget=240;
 for(let i=0;i<10;i++){a.hitEnemy({...foe(100,0),hp:1},1);b.hitEnemy({...foe(100,0),hp:1},1);}
 assert.equal(a.rngState,b.rngState);assert.equal(a.score,b.score);assert.deepEqual(a.pickups,b.pickups);
});
test('spatial broad phase avoids distant enemies without changing hit results',()=>{
 const w=quiet();w.shotTimer=1e6;w.enemies=[foe(45,0)];for(let i=1;i<170;i++)w.enemies.push(foe(700+i,300));
 w.bullets=[{x:0,y:0,vx:680,vy:0,life:1,remaining:210,damage:1}];step(w);assert.ok(w.collisionChecks<10);
});
