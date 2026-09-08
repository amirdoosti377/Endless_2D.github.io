// Decorative layers stay deterministic and independent of gameplay RNG.
export function drawAtmosphere(c,w,h,p,time,reduced){
  const t=reduced?0:time;
  for(let layer=0;layer<2;layer++)for(let i=0;i<42;i++){
    const wrap=(v,size)=>((v%size)+size)%size;
    const x=wrap(i*173.73-p.x*(.12+layer*.13)+t*(2+layer),w);
    const y=wrap(i*i*37.21-p.y*(.12+layer*.13)+t*(1+layer),h);
    c.globalAlpha=.13+layer*.12+(reduced?0:Math.sin(t+i)*.06);c.fillStyle=layer?'#8ceedd':'#9aaaff';c.fillRect(x,y,layer?2:1,layer?2:1);
  }c.globalAlpha=1;
}
export function drawArenaEffects(c,world,time,reduced){
  const t=reduced?0:time;
  for(const h of world.hazards){
    c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);
    c.fillStyle=h.age<1.8?'#ffbd5a0c':h.age<2.7?'#ffbd5a45':'#ffbd5a0c';c.fill();
    c.strokeStyle='#ffbd5a';c.lineWidth=h.age<1.8?1:3;c.setLineDash(h.age<1.8?[6,6]:[]);c.stroke();c.setLineDash([]);
    if(h.age<1.8){c.beginPath();c.arc(h.x,h.y,h.radius+7,-Math.PI/2,-Math.PI/2+Math.PI*2*h.age/1.8);c.stroke();}
    c.fillStyle='#ffdc95';c.font='10px ui-monospace,monospace';c.textAlign='center';c.fillText(h.age<1.8?'SURGE INCOMING':h.age<2.7?'SURGE ACTIVE':'',h.x,h.y+4);
  }
  if(!reduced)for(const r of world.rings){c.globalAlpha=r.life/.45;c.strokeStyle=r.color;c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,r.radius+(1-r.life/.45)*44,0,Math.PI*2);c.stroke();}
  c.globalAlpha=1;
  if(!reduced)for(const s of world.trail){c.globalAlpha=s.life*.5;c.fillStyle='#5ef4d5';c.beginPath();c.arc(s.x,s.y,3+s.life*12,0,Math.PI*2);c.fill();}c.globalAlpha=1;
  // Each enemy has a locked, visible attack direction during its windup.
  for(const e of world.enemies)if(e.mode==='warn'){
    c.strokeStyle=e.color;c.globalAlpha=.6;c.lineWidth=e.type==='charger'?3:1;c.setLineDash([8,8]);c.lineDashOffset=-t*20;
    c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+e.dx*(e.type==='charger'?280:450),e.y+e.dy*(e.type==='charger'?280:450));c.stroke();c.setLineDash([]);c.lineDashOffset=0;c.globalAlpha=1;
    c.beginPath();c.arc(e.x,e.y,e.radius+7,0,Math.PI*2);c.stroke();
  }
  for(const b of world.hostile){c.strokeStyle='#ff84df';c.fillStyle='#ffe5f8';c.lineWidth=2;c.beginPath();c.arc(b.x,b.y,6,0,Math.PI*2);c.fill();c.stroke();}
}
