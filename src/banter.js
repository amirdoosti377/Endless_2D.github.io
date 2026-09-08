const HITS=['خاک تو سرت','ریدی','نرینی !','اسکل، جاخالی بده!' ];
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
