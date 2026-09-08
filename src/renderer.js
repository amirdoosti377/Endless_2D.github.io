import { drawTerrain } from './terrain.js';
import { drawAtmosphere, drawArenaEffects } from './environment.js';
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D is unavailable in this browser.');
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() { this.width = this.canvas.clientWidth; this.height = this.canvas.clientHeight; this.dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr); }
  polygon(x, y, radius, sides, angle, fill, stroke) {
    const c = this.ctx; c.beginPath();
    for (let i = 0; i < sides; i++) { const a = angle + i * Math.PI * 2 / sides; const px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius; if (!i) c.moveTo(px, py); else c.lineTo(px, py); }
    c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = stroke; c.lineWidth = 1.6; c.stroke();
  }
  draw(source, ambient = 0, alpha = 1, dt = 1/60) {
    const interpolate=e=>({...e,x:(e.px??e.x)+(e.x-(e.px??e.x))*alpha,y:(e.py??e.y)+(e.y-(e.py??e.y))*alpha});
    const world={...source,player:interpolate(source.player),enemies:source.enemies.map(interpolate),bullets:source.bullets.map(interpolate),hostile:source.hostile.map(interpolate)};
    if(this.lastTime===undefined||source.time<this.lastTime){this.camera={x:world.player.x,y:world.player.y};this.angle=world.player.angle;}
    this.lastTime=source.time;
    const ease=this.reduced?1:1-Math.exp(-12*dt);
    this.camera.x+=(world.player.x-this.camera.x)*ease;this.camera.y+=(world.player.y-this.camera.y)*ease;
    const angleDelta=Math.atan2(Math.sin(world.player.angle-this.angle),Math.cos(world.player.angle-this.angle));this.angle+=angleDelta*(1-Math.exp(-22*dt));
    const c = this.ctx, w = this.width, h = this.height, p = world.player;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.globalAlpha = 1; c.shadowBlur = 0;
    c.fillStyle = '#080d18'; c.fillRect(0, 0, w, h);
    const gradient = c.createRadialGradient(w * .5, h * .5, 20, w * .5, h * .5, Math.max(w, h) * .7);
    gradient.addColorStop(0, '#122b35'); gradient.addColorStop(.55, '#0e1729'); gradient.addColorStop(1, '#080d18'); c.fillStyle = gradient; c.fillRect(0, 0, w, h);
    drawAtmosphere(c,w,h,p,ambient,this.reduced);
    const shake = this.reduced ? 0 : world.shake;
    const cx = w / 2 - this.camera.x + Math.sin(ambient * 71) * shake, cy = h / 2 - this.camera.y + Math.cos(ambient * 83) * shake;
    c.save(); c.translate(cx, cy);
    const left = -cx, top = -cy;
    drawTerrain(c,left,top,w,h,ambient,p,this.reduced);
    c.lineWidth = 1; c.strokeStyle = '#78b5d10c'; c.beginPath();
    for (let x = Math.floor(left / 60) * 60; x < left + w; x += 60) { c.moveTo(x, top); c.lineTo(x, top + h); }
    for (let y = Math.floor(top / 60) * 60; y < top + h; y += 60) { c.moveTo(left, y); c.lineTo(left + w, y); } c.stroke();
    // Repeating arena beacons give the infinite world a stable spatial reference.
    for (let x = Math.floor(left / 360) * 360; x < left + w + 30; x += 360) for (let y = Math.floor(top / 360) * 360; y < top + h + 30; y += 360) {
      c.strokeStyle = '#73c2d127'; c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(x,y,27,this.reduced?0:ambient*.3,(this.reduced?0:ambient*.3)+Math.PI*.8); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.stroke();
    }
    drawArenaEffects(c,world,ambient,this.reduced);
    for (const item of world.pickups) {
      const color = item.type === 'health' ? '#6cffaf' : '#9d8aff';
      c.shadowColor = color; c.shadowBlur = 12;
      this.polygon(item.x, item.y, item.type === 'health' ? 9 : 5, 4, Math.PI / 4, color, color);
      c.shadowBlur = 0;
      if (item.type === 'health') { c.strokeStyle = '#123325'; c.lineWidth = 2; c.beginPath(); c.moveTo(item.x - 4, item.y); c.lineTo(item.x + 4, item.y); c.moveTo(item.x, item.y - 4); c.lineTo(item.x, item.y + 4); c.stroke(); }
    }
    for (const e of world.enemies) {
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      c.shadowColor = e.color; c.shadowBlur = 10;
      this.polygon(e.x, e.y, e.radius, e.sides, angle, e.hit ? '#ffffff' : e.color + '26', e.color);
      c.shadowBlur = 0; this.polygon(e.x, e.y, e.radius * .35, e.sides, angle, e.color, e.color);
      c.save();c.translate(e.x,e.y);c.rotate(angle);c.strokeStyle=e.color;c.lineWidth=2;
      if(e.type==='orbiter'){c.beginPath();c.ellipse(0,0,e.radius*1.4,e.radius*.6,ambient*1.5,0,Math.PI*2);c.stroke();}
      else if(e.type==='hunter'){for(const sign of [-1,1]){c.beginPath();c.moveTo(-18,sign*13);c.lineTo(8,sign*6);c.lineTo(-8,sign*3);c.stroke();}}
      else if(e.type==='bomber'){c.strokeRect(-12,-12,24,24);c.beginPath();c.arc(0,0,7+Math.sin(ambient*5)*2,0,Math.PI*2);c.stroke();}
      else if(e.type==='tank'){c.fillStyle=e.color;for(const y of [-19,15])c.fillRect(-15,y,30,4);}
      else if(e.type==='gunner'){c.fillStyle=e.color;c.fillRect(3,-4,23,8);}
      else if(e.type==='weaver'){c.beginPath();c.moveTo(-18,-10);c.lineTo(-25,0);c.lineTo(-18,10);c.stroke();}
      c.restore();
      if (e.hp < e.maxHp) { c.fillStyle = '#ffffff20'; c.fillRect(e.x - 12, e.y - e.radius - 8, 24, 2); c.fillStyle = e.color; c.fillRect(e.x - 12, e.y - e.radius - 8, 24 * e.hp / e.maxHp, 2); }
    }
    c.lineCap = 'round';
    for (const b of world.bullets) { c.strokeStyle = '#c8fff1'; c.lineWidth = 3; c.shadowColor = '#5ef4d5'; c.shadowBlur = 14; c.beginPath(); c.moveTo(b.x - b.vx * .016, b.y - b.vy * .016); c.lineTo(b.x, b.y); c.stroke(); }
    c.shadowBlur = 0;
    if (!world.dead) {
      c.save(); c.translate(p.x, p.y); c.rotate(this.angle);
      c.globalAlpha = p.invincible > 0 ? .7 : 1;
      c.shadowColor = '#5ef4d5'; c.shadowBlur = 22;
      this.polygon(0, 0, 18, 3, 0, '#173e43', '#80ffe4');
      c.fillStyle = '#e1fff7'; c.fillRect(4, -3, 19, 6);
      c.shadowBlur = 0; c.fillStyle = '#5ef4d5'; c.fillRect(-10, -7, 4, 14);
      c.restore(); c.strokeStyle = p.invincible > 0 ? '#ff899a99' : '#5ef4d530'; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, 29 + (this.reduced?0:Math.sin(ambient * 2) * 2), 0, Math.PI * 2); c.stroke();
    }
    for (const s of world.particles) { c.globalAlpha = Math.min(1, s.life * 2); c.fillStyle = s.color; c.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); } c.globalAlpha = 1;
    c.restore();
    if (p.invincible > .75 && !this.reduced) { c.fillStyle = '#ff406010'; c.fillRect(0, 0, w, h); }
  }
}
