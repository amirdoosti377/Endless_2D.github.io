import {clamp} from './math.js';
// Exact swept segment/circle hit; return the first time of impact in [0,1].
export function circleTOI(ax,ay,bx,by,x,y,r){
 const dx=bx-ax,dy=by-ay,ox=ax-x,oy=ay-y,a=dx*dx+dy*dy,c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;if(!a)return Infinity;
 const b=ox*dx+oy*dy,disc=b*b-a*c;if(disc<0)return Infinity;
 const t=(-b-Math.sqrt(disc))/a;return t>=0&&t<=1?t:Infinity;
}
export function obstacleTOI(ax,ay,bx,by,o,padding=0){
 if(o.kind==='tree')return circleTOI(ax,ay,bx,by,o.x,o.y,o.radius+padding);
 const cs=o.cos,sn=o.sin;
 const x=(ax-o.x)*cs+(ay-o.y)*sn,y=-(ax-o.x)*sn+(ay-o.y)*cs;
 const dx=(bx-ax)*cs+(by-ay)*sn,dy=-(bx-ax)*sn+(by-ay)*cs;
 let lo=0,hi=1;
 for(const [pos,vel,half]of [[x,dx,o.hw+padding],[y,dy,o.hh+padding]]){
  if(Math.abs(vel)<1e-9){if(Math.abs(pos)>half)return Infinity;continue;}
  let a=(-half-pos)/vel,b=(half-pos)/vel;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;
 }
 return lo;
}
export function pushOut(e,o){
 if(o.kind==='tree'){
  const dx=e.x-o.x,dy=e.y-o.y,r=e.radius+o.radius,d2=dx*dx+dy*dy;
  if(d2>=r*r)return false;const d=Math.sqrt(d2),n=d||1;
  e.x+= (d?dx/n:1)*(r-d+.01);e.y+=(d?dy/n:0)*(r-d+.01);return true;
 }
 const cs=o.cos,sn=o.sin;
 let x=(e.x-o.x)*cs+(e.y-o.y)*sn,y=-(e.x-o.x)*sn+(e.y-o.y)*cs;
 const qx=clamp(x,-o.hw,o.hw),qy=clamp(y,-o.hh,o.hh),dx=x-qx,dy=y-qy,d=Math.hypot(dx,dy);
 if(d>=e.radius)return false;
 if(d){x+=dx/d*(e.radius-d+.01);y+=dy/d*(e.radius-d+.01);}
 else if(o.hw-Math.abs(x)<o.hh-Math.abs(y))x=(x>=0?1:-1)*(o.hw+e.radius+.01);
 else y=(y>=0?1:-1)*(o.hh+e.radius+.01);
 e.x=o.x+x*cs-y*sn;e.y=o.y+x*sn+y*cs;return true;
}
// Small substeps prevent even a charging enemy crossing thin scenery.
export function moveSolid(e,dx,dy,terrain){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));let hit=false;
 for(let i=0;i<steps;i++){
  e.x+=dx/steps;e.y+=dy/steps;
  const nearby=terrain.colliders(e.x-e.radius,e.y-e.radius,e.x+e.radius,e.y+e.radius);
  for(let pass=0;pass<4;pass++){let changed=false;for(const o of nearby)if(pushOut(e,o)){changed=true;hit=true;}if(!changed)break;}
 }
 return hit;
}
