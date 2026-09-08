import {TerrainPainter} from './terrain.js';
import {drawAtmosphere,drawArenaEffects} from './environment.js';
import {REALMS,realmIndex,realmAge} from './realms.js';
export const renderX=(e,a)=>(e.px??e.x)+(e.x-(e.px??e.x))*a;
export const renderY=(e,a)=>(e.py??e.y)+(e.y-(e.py??e.y))*a;
export class Renderer {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
  if(!this.ctx)throw new Error('Canvas 2D is unavailable in this browser.');
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.coarse=matchMedia('(pointer:coarse)').matches;
  this.low=false;this.frameAverage=1/60;this.slowTime=0;this.fastTime=0;
  this.scenery=new TerrainPainter();this.lights=new Map();this.camera={x:0,y:0};
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){
  this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
  this.dpr=Math.min(devicePixelRatio||1,this.low?1:this.coarse?1.5:2);
  this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.background=null;
 }
 measure(dt,playing){
  if(!playing)return;this.frameAverage+=(dt-this.frameAverage)*.035;
  this.slowTime=this.frameAverage>.025?this.slowTime+dt:0;
  this.fastTime=this.frameAverage<.019?this.fastTime+dt:0;
  if(!this.low&&this.slowTime>2){this.low=true;this.fastTime=0;this.resize();}
  else if(this.low&&this.fastTime>10){this.low=false;this.slowTime=0;this.resize();}
 }
 polygon(x,y,r,sides,angle,fill,stroke){
  const c=this.ctx;c.beginPath();
  for(let i=0;i<sides;i++){const a=angle+i*Math.PI*2/sides,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(!i)c.moveTo(px,py);else c.lineTo(px,py);}
  c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=1.6;c.stroke();
 }
 light(x,y,r,color,opacity=.4){
  let sprite=this.lights.get(color);
  if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=128;const c=sprite.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color+'77');g.addColorStop(.3,color+'28');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,128,128);if(this.lights.size>=16)this.lights.delete(this.lights.keys().next().value);this.lights.set(color,sprite);}
  const c=this.ctx;c.globalCompositeOperation='lighter';c.globalAlpha=opacity;c.drawImage(sprite,x-r,y-r,r*2,r*2);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 }
 draw(world,ambient=0,alpha=1,dt=1/60){
  const c=this.ctx,w=this.width,h=this.height,p=world.player,px=renderX(p,alpha),py=renderY(p,alpha);
  if(this.lastTime===undefined||world.time<this.lastTime){this.camera.x=px;this.camera.y=py;this.angle=p.angle;}
  this.lastTime=world.time;
  const ease=this.reduced?1:1-Math.exp(-12*dt);this.camera.x+=(px-this.camera.x)*ease;this.camera.y+=(py-this.camera.y)*ease;
  this.angle+=Math.atan2(Math.sin(p.angle-this.angle),Math.cos(p.angle-this.angle))*(1-Math.exp(-22*dt));
  const realm=realmIndex(world.time),palette=REALMS[realm],age=realmAge(world.time);
  const transition=world.time>=75&&age<1.2?1-age/1.2:0;
  const shake=this.reduced?0:Math.min(7,world.shake+transition*5);
  const cx=w/2-this.camera.x+Math.sin(ambient*41)*shake,cy=h/2-this.camera.y+Math.cos(ambient*47)*shake;
  const left=-cx,top=-cy,visible=(x,y,r=32)=>x+r>=left&&x-r<=left+w&&y+r>=top&&y-r<=top+h;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=1;c.shadowBlur=0;
  if(!this.background||this.backgroundRealm!==realm){const g=c.createRadialGradient(w/2,h/2,20,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,palette.sky);g.addColorStop(1,palette.edge);this.background=g;this.backgroundRealm=realm;}
  c.fillStyle=this.background;c.fillRect(0,0,w,h);
  drawAtmosphere(c,w,h,p,ambient,this.reduced,this.low);
  c.save();c.translate(cx,cy);
  this.scenery.draw(c,world.terrain,left,top,w,h,ambient,realm,palette,this.low,this.reduced);
  c.lineWidth=1;c.strokeStyle=palette.accent+'0c';c.beginPath();
  for(let x=Math.floor(left/80)*80;x<left+w;x+=80){c.moveTo(x,top);c.lineTo(x,top+h);}
  for(let y=Math.floor(top/80)*80;y<top+h;y+=80){c.moveTo(left,y);c.lineTo(left+w,y);}c.stroke();
  this.light(px,py,this.low?95:150,palette.accent,.65);
  // Limited explosion lights; sprite gradients are cached instead of per-entity blur.
  let lights=0;
  if(!this.low)for(let i=world.rings.length-1;i>=0&&lights<4;i--){const r=world.rings[i];if(visible(r.x,r.y,90)){this.light(r.x,r.y,r.pulse?150:80,r.color,r.life);lights++;}}
  drawArenaEffects(c,world,ambient,this.reduced,alpha,visible,this.low);
  for(const item of world.pickups){
   if(!visible(item.x,item.y,12))continue;
   const color=item.type==='health'?'#6cffaf':'#9d8aff';this.polygon(item.x,item.y,item.type==='health'?9:5,4,Math.PI/4,color,color);
   if(item.type==='health'){c.strokeStyle='#123325';c.lineWidth=2;c.beginPath();c.moveTo(item.x-4,item.y);c.lineTo(item.x+4,item.y);c.moveTo(item.x,item.y-4);c.lineTo(item.x,item.y+4);c.stroke();}
  }
  for(const e of world.enemies){
   const x=renderX(e,alpha),y=renderY(e,alpha);if(!visible(x,y,e.radius+30))continue;
   const angle=Math.atan2(py-y,px-x),color=e.type==='boss'?e.color:realm?palette.enemy:e.color;
   const sides=realm===1?Math.max(4,e.sides):realm===2?Math.max(4,e.sides-1):e.sides;
   this.polygon(x,y,e.radius,sides,angle,e.hit?'#ffffff':color+'26',color);
   this.polygon(x,y,e.radius*.35,e.sides,angle,color,color);
   c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle=color;c.lineWidth=2;
   if(e.type==='orbiter'){c.beginPath();c.ellipse(0,0,e.radius*1.4,e.radius*.6,this.reduced?0:ambient*1.5,0,Math.PI*2);c.stroke();}
   else if(e.type==='hunter'){for(const sign of [-1,1]){c.beginPath();c.moveTo(-18,sign*13);c.lineTo(8,sign*6);c.lineTo(-8,sign*3);c.stroke();}}
   else if(e.type==='bomber'){c.strokeRect(-12,-12,24,24);c.beginPath();c.arc(0,0,7+(this.reduced?0:Math.sin(ambient*5)*2),0,Math.PI*2);c.stroke();}
   else if(e.type==='tank'){c.fillStyle=color;c.fillRect(-15,-19,30,4);c.fillRect(-15,15,30,4);}
   else if(e.type==='gunner'){c.fillStyle=color;c.fillRect(3,-4,23,8);}
   else if(e.type==='weaver'){c.beginPath();c.moveTo(-18,-10);c.lineTo(-25,0);c.lineTo(-18,10);c.stroke();}
   c.restore();
   if(e.hp<e.maxHp){c.fillStyle='#ffffff20';c.fillRect(x-12,y-e.radius-8,24,2);c.fillStyle=color;c.fillRect(x-12,y-e.radius-8,24*e.hp/e.maxHp,2);}
  }
  c.lineCap='round';c.strokeStyle='#c8fff1';c.lineWidth=3;c.beginPath();
  for(const b of world.bullets){const x=renderX(b,alpha),y=renderY(b,alpha);if(!visible(x,y,16))continue;c.moveTo(x-b.vx*.012,y-b.vy*.012);c.lineTo(x,y);}c.stroke();
  if(!world.dead){
   c.strokeStyle=palette.accent+'25';c.lineWidth=1;c.setLineDash([3,12]);c.beginPath();c.arc(px,py,world.stats.range,0,Math.PI*2);c.stroke();c.setLineDash([]);
   c.save();c.translate(px,py);c.rotate(this.angle);c.globalAlpha=p.invincible>0?.7:1;
   this.polygon(0,0,18,3,0,'#173e43','#80ffe4');c.fillStyle='#e1fff7';c.fillRect(4,-3,19,6);c.fillStyle='#5ef4d5';c.fillRect(-10,-7,4,14);c.restore();
   const shield=world.stats.shield>0&&world.shieldTimer<=0;
   c.strokeStyle=shield?'#80cfff':p.invincible>0?'#ff899a99':'#5ef4d550';c.lineWidth=shield?2:1;c.beginPath();c.arc(px,py,29,0,Math.PI*2);c.stroke();
  }
  for(const s of world.particles){if(!visible(s.x,s.y,3))continue;c.globalAlpha=Math.min(1,s.life*2);c.fillStyle=s.color;c.fillRect(s.x-1.5,s.y-1.5,3,3);}c.globalAlpha=1;c.restore();
  if(transition&&!this.reduced){c.fillStyle=palette.accent;c.globalAlpha=transition*.07;c.fillRect(0,0,w,h);c.globalAlpha=1;}
  if(p.invincible>.75&&!this.reduced){c.fillStyle='#ff406010';c.fillRect(0,0,w,h);}
 }
}
