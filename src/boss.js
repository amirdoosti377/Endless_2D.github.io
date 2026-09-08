import { normalize, distance } from './math.js';
export function spawnBoss(world){
 const tier=++world.bossTier,hp=100+tier*65;
 world.enemies.push({type:'boss',x:world.player.x+430,y:world.player.y-240,radius:42,speed:58,hp,maxHp:hp,damage:26,score:700*tier,xp:22,color:'#ff9c62',sides:8,hit:0,seed:0,mode:'arrival',phase:2,cooldown:2,attack:0,tier});
 world.events.push({type:'boss'});
}
export function moveBoss(e,w,dt){
 const n=normalize(w.player.x-e.x,w.player.y-e.y),enraged=e.hp<e.maxHp*.5;
 if(e.mode==='arrival'){e.phase-=dt;if(e.phase<=0)e.mode='chase';return;}
 if(e.mode==='warn'){
  e.phase-=dt;if(e.phase>0)return;
  if(e.attack%2===0){
   const count=enraged?16:12;
   for(let i=0;i<count&&w.hostile.length<100;i++){const a=i*Math.PI*2/count;w.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*155,vy:Math.sin(a)*155,life:4,radius:6,damage:14});}
   e.mode='chase';e.cooldown=enraged?1.8:2.6;e.attack++;
  }else{e.mode='dash';e.phase=.8;}
 }else if(e.mode==='dash'){
  e.x+=e.dx*320*dt;e.y+=e.dy*320*dt;e.phase-=dt;if(e.phase<=0){e.mode='chase';e.cooldown=2.2;e.attack++;}
 }else{
  if(distance(e,w.player)>200){e.x+=n.x*e.speed*dt;e.y+=n.y*e.speed*dt;}
  e.cooldown-=dt;if(e.cooldown<=0){e.mode='warn';e.phase=enraged?.85:1.15;e.dx=n.x;e.dy=n.y;}
 }
}
