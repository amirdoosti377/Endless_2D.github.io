// Coordinate-derived scenery: stable across reloads, no saved terrain chunks.
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export function drawTerrain(c,left,top,w,h,time,player,reduced){
 const size=420,t=reduced?0:time;
 for(let gx=Math.floor((left-160)/size);gx<=Math.floor((left+w+160)/size);gx++)for(let gy=Math.floor((top-160)/size);gy<=Math.floor((top+h+160)/size);gy++){
  const seed=hash(gx,gy),x=gx*size+90+hash(gx+18,gy)*210,y=gy*size+80+hash(gx,gy+12)*230;
  c.save();c.translate(x,y);
  if(seed<.3){
   c.fillStyle='#113846';c.strokeStyle='#286573';c.lineWidth=3;c.beginPath();c.ellipse(0,0,125,68,.2,0,Math.PI*2);c.fill();c.stroke();
   c.save();c.clip();c.strokeStyle='#65c9d02b';c.lineWidth=1.5;
   for(let i=-3;i<4;i++){c.beginPath();for(let j=-140;j<=140;j+=8){const yy=i*19+Math.sin(j*.025+t*1.4+i)*4;c.lineTo(j,yy);}c.stroke();}c.restore();
  }else if(seed<.77){
   for(let i=0;i<3;i++){
    const tx=(i-1)*45,ty=Math.sin(i+seed)*35;
    c.fillStyle='#020b1390';c.beginPath();c.ellipse(tx+13,ty+20,29,15,-.3,0,Math.PI*2);c.fill();
    c.fillStyle='#675846';c.fillRect(tx-4,ty+5,8,27);
    const sway=Math.sin(t*1.3+seed*10+i)*2;c.fillStyle=i%2?'#23534a':'#1b433e';c.strokeStyle='#3e78614d';c.lineWidth=2;
    c.beginPath();c.arc(tx+sway,ty,24,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#35634d';c.beginPath();c.arc(tx-6+sway,ty-7,13,0,Math.PI*2);c.fill();
   }
  }else{
   c.rotate(seed*6);c.fillStyle='#030912aa';c.fillRect(-23,-44,53,97);
   c.fillStyle='#080b12';for(const xx of [-23,17]){c.fillRect(xx,-27,7,18);c.fillRect(xx,15,7,18);}
   c.fillStyle=seed>.9?'#744d44':'#344f66';c.beginPath();c.roundRect(-21,-43,42,86,8);c.fill();c.strokeStyle='#a3b3b333';c.stroke();
   c.fillStyle='#112735';c.fillRect(-16,-22,32,16);c.fillRect(-16,18,32,12);c.fillStyle='#ffffff28';c.fillRect(-15,-21,28,3);
   c.fillStyle='#b4d9bf';c.fillRect(-16,-42,10,4);c.fillRect(6,-42,10,4);c.fillStyle='#a84c55';c.fillRect(-16,38,8,3);c.fillRect(8,38,8,3);
  }
  c.restore();
 }
}
