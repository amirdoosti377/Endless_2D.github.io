import {obstacleTOI} from './physics.js';
export const TILE_SIZE=420;
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
// Shared deterministic geometry for rendering, movement and projectile occlusion.
export class Terrain {
 constructor(){this.cache=new Map();this.query=[];}
 tile(gx,gy){
  const key=`${gx},${gy}`;let tile=this.cache.get(key);if(tile)return tile;
  const seed=hash(gx,gy),x=gx*TILE_SIZE+90+hash(gx+18,gy)*210,y=gy*TILE_SIZE+80+hash(gx,gy+12)*230;
  const kind=seed<.3?'water':seed<.77?'trees':'car';const solids=[];
  if(kind==='trees')for(let i=0;i<3;i++)solids.push({kind:'tree',x:x+(i-1)*45,y:y+Math.sin(i+seed)*35,radius:24});
  if(kind==='car')solids.push({kind:'car',x,y,angle:seed*6,cos:Math.cos(seed*6),sin:Math.sin(seed*6),hw:21,hh:43});
  tile={gx,gy,seed,x,y,kind,solids};
  if(this.cache.size>=192)this.cache.delete(this.cache.keys().next().value);
  this.cache.set(key,tile);return tile;
 }
 colliders(left,top,right,bottom){
  const out=this.query;out.length=0;
  for(let gx=Math.floor((left-100)/TILE_SIZE);gx<=Math.floor((right+100)/TILE_SIZE);gx++)
   for(let gy=Math.floor((top-100)/TILE_SIZE);gy<=Math.floor((bottom+100)/TILE_SIZE);gy++){
    const tile=this.tile(gx,gy);
    for(const o of tile.solids){const r=o.radius||49;if(o.x+r>=left&&o.x-r<=right&&o.y+r>=top&&o.y-r<=bottom)out.push(o);}
   }
  return out;
 }
 hit(ax,ay,bx,by,padding=0){
  let first=Infinity;
  for(const o of this.colliders(Math.min(ax,bx)-padding,Math.min(ay,by)-padding,Math.max(ax,bx)+padding,Math.max(ay,by)+padding))first=Math.min(first,obstacleTOI(ax,ay,bx,by,o,padding));
  return first;
 }
}
