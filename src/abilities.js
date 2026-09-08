export const ABILITIES = [
 {id:'power',name:'Overcharged pulse',description:'+1 projectile damage.',apply:w=>w.stats.damage++},
 {id:'rapid',name:'Rapid capacitor',description:'12% shorter firing interval. Minimum 0.10s.',apply:w=>w.stats.interval=Math.max(.1,w.stats.interval*.88)},
 {id:'multi',name:'Split stream',description:'+1 projectile per shot. Up to 5.',eligible:w=>w.stats.projectiles<5,apply:w=>w.stats.projectiles++},
 {id:'hull',name:'Reinforced hull',description:'+20 maximum shield and restore 20 shield.',apply:w=>{w.stats.maxHp+=20;w.player.hp+=20;}},
 {id:'armor',name:'Reactive armor',description:'Reduce each hit by 2. Minimum damage is 3.',eligible:w=>w.stats.armor<12,apply:w=>w.stats.armor+=2},
 {id:'speed',name:'Vector drive',description:'+8% movement speed. Up to +40%.',eligible:w=>w.stats.speed<1.39,apply:w=>w.stats.speed=Math.min(1.4,w.stats.speed+.08)},
 {id:'magnet',name:'Energy collector',description:'+45 energy attraction range.',eligible:w=>w.stats.magnet<325,apply:w=>w.stats.magnet+=45},
 {id:'repair',name:'Repair nanites',description:'Restore 1 shield every 5 seconds. Stacks.',apply:w=>w.stats.regen++},
];
export function offerAbilities(world){
 const pool=ABILITIES.filter(a=>!a.eligible||a.eligible(world));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(world.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,3).map(a=>a.id);
}
