import {TILE_SIZE} from './terrain-data.js';
// Static scenery is painted once to bounded, low-resolution reusable sprites.
export class TerrainPainter {
 constructor(){this.sprites=new Map();}
 sprite(tile,realm,palette){
  const key=`${tile.gx},${tile.gy}:${realm}`;let image=this.sprites.get(key);if(image)return image;
  image=document.createElement('canvas');image.width=300;image.height=220;
  const c=image.getContext('2d');c.translate(150,110);const seed=tile.seed;
  if(tile.kind==='water'){
   c.fillStyle=palette.water;c.strokeStyle=palette.accent+'55';c.lineWidth=3;c.beginPath();c.ellipse(0,0,125,68,.2,0,Math.PI*2);c.fill();c.stroke();
   if(realm===2){c.strokeStyle='#ff9b6333';for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,100-i*22,48-i*10,.2,0,Math.PI*2);c.stroke();}}
  }else if(tile.kind==='trees'){
   for(const o of tile.solids){const x=o.x-tile.x,y=o.y-tile.y;
    c.fillStyle='#020b1366';c.beginPath();c.ellipse(x+10,y+19,28,15,-.3,0,Math.PI*2);c.fill();
    c.fillStyle=palette.tree;c.strokeStyle=palette.accent+'70';c.lineWidth=1.5;
    if(realm===0){c.beginPath();c.arc(x,y,24,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#36755b';c.beginPath();c.arc(x-6,y-7,12,0,Math.PI*2);c.fill();}
    else if(realm===1){c.beginPath();c.moveTo(x,y-24);c.lineTo(x+23,y-5);c.lineTo(x+14,y+21);c.lineTo(x-14,y+21);c.lineTo(x-23,y-5);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(x,y-24);c.lineTo(x+5,y+9);c.lineTo(x-14,y+21);c.stroke();}
    else{c.beginPath();c.arc(x,y,24,0,Math.PI*2);c.fill();c.stroke();c.strokeRect(x-12,y-12,24,24);c.fillStyle='#eeb679';c.fillRect(x-4,y-17,8,34);}
   }
  }else{
   c.rotate(seed*6);c.fillStyle='#03091288';c.fillRect(-24,-42,51,90);
   c.fillStyle=palette.car;c.strokeStyle=palette.accent+'66';c.lineWidth=2;c.beginPath();c.roundRect(-21,-43,42,86,6);c.fill();c.stroke();
   if(realm===0){c.fillStyle='#102533';c.fillRect(-16,-22,32,16);c.fillRect(-16,18,32,12);c.fillStyle='#b4d9bf';c.fillRect(-16,-42,10,4);c.fillRect(6,-42,10,4);c.fillStyle='#e9747c';c.fillRect(-16,38,8,3);c.fillRect(8,38,8,3);}
   else if(realm===1){c.beginPath();c.moveTo(0,-34);c.lineTo(15,0);c.lineTo(0,34);c.lineTo(-15,0);c.closePath();c.stroke();c.fillStyle=palette.accent;c.fillRect(-4,-18,8,36);}
   else{for(let y=-30;y<40;y+=14){c.beginPath();c.moveTo(-17,y);c.lineTo(17,y);c.stroke();}c.fillStyle='#ffcb7f';c.fillRect(-14,-37,28,6);}
  }
  if(this.sprites.size>=24)this.sprites.delete(this.sprites.keys().next().value);
  this.sprites.set(key,image);return image;
 }
 draw(c,terrain,left,top,w,h,time,realm,palette,low,reduced){
  for(let gx=Math.floor((left-160)/TILE_SIZE);gx<=Math.floor((left+w+160)/TILE_SIZE);gx++)
   for(let gy=Math.floor((top-160)/TILE_SIZE);gy<=Math.floor((top+h+160)/TILE_SIZE);gy++){
    const tile=terrain.tile(gx,gy);
    if(tile.x+150<left||tile.x-150>left+w||tile.y+110<top||tile.y-110>top+h)continue;
    c.drawImage(this.sprite(tile,realm,palette),tile.x-150,tile.y-110);
    if(tile.kind==='water'&&!low&&!reduced){
     c.strokeStyle=palette.accent+'35';c.lineWidth=1;
     for(let i=-1;i<=1;i++){c.beginPath();for(let x=-80;x<=80;x+=16)c.lineTo(tile.x+x,tile.y+i*24+Math.sin(x*.03+time*1.3+i)*3);c.stroke();}
    }
   }
 }
}
