const HITS=['خاک تو سرت','ریدی','نرینی !','اسکل، جاخالی بده!','آب قطعه داداش','زاارت!','سیشتیر!','شومبول! جاخالی بده!','فرمون دست کیه؟','اومدی کتک بخوری؟' ];
export const LEVEL_LINES=['زنده موندی هنر کردی؟','تهش که میمیری','فعلاً قسر در رفتی!','یه چیزی بردار، زرنگ!','این همه دویدی واسه همین؟','لول گرفتی، جوگیر نشو!','دشمنا منتظرتن داداش!'];
export function levelLine(previous,random=Math.random){const pool=LEVEL_LINES.filter(x=>x!==previous);return pool[Math.floor(random()*pool.length)];}
export class Banter {
 constructor(){this.layer=document.createElement('div');this.layer.id='banter';this.layer.setAttribute('aria-hidden','true');document.getElementById('arena').append(this.layer);this.enabled=true;}
 clear(){this.layer.replaceChildren();}
 show(kind){
  if(!this.enabled)return;
  const text=kind==='dead'?'واقعا ریدی !':kind==='win'?'باشه بابا اصن تو بردی':HITS[Math.floor(Math.random()*HITS.length)];
  const el=document.createElement('span');el.className='banter-pop '+kind;el.dir='rtl';el.lang='fa';el.textContent=text;
  // Keep feedback in side bands, away from the pilot and top HUD.
  const left=Math.random()<.5;el.style.left=`${left?8+Math.random()*16:65+Math.random()*10}%`;el.style.top=`${37+Math.random()*34}%`;
  el.style.setProperty('--tilt',`${Math.random()*14-7}deg`);
  if(this.layer.children.length>=3)this.layer.firstElementChild.remove();this.layer.append(el);
  setTimeout(()=>el.remove(),1800);
 }
}
