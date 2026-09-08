export const ABILITIES = [
 {id:'power',name:'تیر پرزور',description:'قدرت هر تیرت یکی بیشتر می‌شه.',apply:w=>w.stats.damage++},
 {id:'rapid',name:'تندتند بزن',description:'۱۲٪ زودتر شلیک می‌کنی؛ کفش یه تیر تو ۰٫۱ ثانیه‌ست.',apply:w=>w.stats.interval=Math.max(.1,w.stats.interval*.88)},
 {id:'multi',name:'تیر پخش‌کن',description:'هر بار یه تیر بیشتر؛ تا سقف ۵ تا.',eligible:w=>w.stats.projectiles<5,apply:w=>w.stats.projectiles++},
 {id:'hull',name:'جون اضافه',description:'سقف جونت ۲۰ تا بیشتر می‌شه؛ ۲۰ تا جون هم می‌گیری.',apply:w=>{w.stats.maxHp+=20;w.player.hp+=20;}},
 {id:'armor',name:'پوست‌کلفت',description:'هر ضربه ۲ تا کمتر جون می‌بره؛ حداقلش ۳ تاست.',eligible:w=>w.stats.armor<12,apply:w=>w.stats.armor+=2},
 {id:'speed',name:'گازشو بگیر',description:'۸٪ تندتر می‌ری؛ تا سقف ۴۰٪.',eligible:w=>w.stats.speed<1.39,apply:w=>w.stats.speed=Math.min(1.4,w.stats.speed+.08)},
 {id:'magnet',name:'بکش سمت خودت',description:'انرژی‌ها رو از ۴۵ واحد دورتر جذب می‌کنی.',eligible:w=>w.stats.magnet<325,apply:w=>w.stats.magnet+=45},
 {id:'repair',name:'خودتو جمع کن',description:'هر ۵ ثانیه یه جون برمی‌گرده؛ دوباره برداری بیشتر می‌شه.',apply:w=>w.stats.regen++},
];
export function offerAbilities(world){
 const pool=ABILITIES.filter(a=>!a.eligible||a.eligible(world));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(world.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,3).map(a=>a.id);
}
