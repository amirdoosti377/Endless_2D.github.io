import { normalize, distance } from './math.js';
// Behavior strategies modify only their entity and emit bounded projectiles.
export function moveEnemy(e, world, dt) {
  const p = world.player, n = normalize(p.x-e.x,p.y-e.y), d = distance(p,e);
  let vx=n.x, vy=n.y, speed=e.speed*Math.min(1.65,1+world.wave*.025);
  e.cooldown = (e.cooldown ?? 1.8) - dt;
  if(e.type==='weaver') { const side=Math.sin(world.time*4+e.seed)*.8; const v=normalize(n.x-n.y*side,n.y+n.x*side); vx=v.x;vy=v.y; }
  if(e.type==='charger') {
    if(e.mode==='dash') { vx=e.dx;vy=e.dy;speed=390;e.phase-=dt;if(e.phase<=0){e.mode='chase';e.cooldown=2.8;} }
    else if(e.mode==='warn') { speed=0;e.phase-=dt;if(e.phase<=0){e.mode='dash';e.phase=.7;} }
    else if(e.cooldown<=0&&d<420&&d>90) {e.mode='warn';e.phase=.8;e.dx=n.x;e.dy=n.y;speed=0;}
  }
  if(e.type==='gunner') {
    const direction=d<220?-1:d>330?1:0;vx=n.x*direction-n.y*.3;vy=n.y*direction+n.x*.3;
    if(e.mode==='warn') {
      e.phase-=dt;
      if(e.phase<=0){
        if(world.hostile.length<100) world.hostile.push({x:e.x,y:e.y,vx:e.dx*205,vy:e.dy*205,life:3.5,radius:6,damage:10});
        e.mode='chase';e.cooldown=2.6;
      }
    } else if(e.cooldown<=0&&d<470){e.mode='warn';e.phase=.85;e.dx=n.x;e.dy=n.y;}
  }
  e.x+=vx*speed*dt;e.y+=vy*speed*dt;
}
