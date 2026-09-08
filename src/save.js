import { ABILITIES } from './abilities.js';
export const SAVE_KEY='endless2d.run.v1';
const OWNER_KEY=SAVE_KEY+'.owner';
const fields=['stats','abilities','pendingChoices','offers','bossTier','nextBoss','regenTimer','reliefUntil','player','hostile','rings','trail','hazards','hazardTimer','enemies','bullets','pickups','particles','time','wave','score','kills','level','xp','nextXP','spawnTimer','shotTimer','dead','shake','rngState'];
const limits={enemies:171,hostile:100,bullets:200,pickups:240,particles:420,rings:45,trail:100,hazards:20};
export function snapshot(w){return {version:1,world:{...Object.fromEntries(fields.map(k=>[k,w[k]])),spawnSectors:w.spawnSectors||[]}};}
export function validate(data){
 if(data?.version!==1||!data.world)return false;const w=data.world;
 function safe(v,depth=0){if(depth>8)return false;if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<1e12;if(v===null||typeof v==='boolean'||typeof v==='string')return true;if(Array.isArray(v))return v.every(x=>safe(x,depth+1));if(v&&typeof v==='object')return Object.entries(v).every(([k,x])=>!['__proto__','constructor','prototype'].includes(k)&&safe(x,depth+1));return false;}
 if(w.spawnSectors!==undefined&&(!Array.isArray(w.spawnSectors)||w.spawnSectors.length>16||new Set(w.spawnSectors).size!==w.spawnSectors.length||w.spawnSectors.some(n=>!Number.isInteger(n)||n<0||n>15)))return false;
 if(!safe(w)||fields.some(k=>!(k in w))||w.dead!==false||!(w.player?.hp>0)||w.player.hp>w.stats?.maxHp)return false;
 for(const [key,max]of Object.entries(limits))if(!Array.isArray(w[key])||w[key].length>max||w[key].some(e=>!Number.isFinite(e.x)||!Number.isFinite(e.y)))return false;
 if(!Number.isFinite(w.player.x)||!Number.isFinite(w.player.y)||!Number.isFinite(w.player.angle))return false;
 if(!Number.isInteger(w.level)||w.level<1||w.time<0||w.nextXP<=0||w.xp<0||w.pendingChoices<0||!Number.isInteger(w.pendingChoices))return false;
 if(!Array.isArray(w.offers)||new Set(w.offers).size!==w.offers.length||w.offers.length!==(w.pendingChoices?3:0)||w.offers.some(id=>!ABILITIES.some(a=>a.id===id)))return false;
 if(!w.abilities||Object.entries(w.abilities).some(([id,n])=>!ABILITIES.some(a=>a.id===id)||!Number.isInteger(n)||n<1))return false;
 for(const k of ['damage','interval','projectiles','maxHp','speed','magnet'])if(!(w.stats[k]>0))return false;
 if(w.stats.projectiles>5||w.stats.interval<.099||w.stats.speed>1.41)return false;
 return true;
}
export class RunSave{
 constructor(storage,onError=()=>{}){this.storage=storage;this.onError=onError;this.owner=globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random();this.claimed=false;}
 claim(){try{this.storage.setItem(OWNER_KEY,this.owner);this.claimed=true;return true;}catch{this.onError();return false;}}
 owns(){try{return this.claimed&&this.storage.getItem(OWNER_KEY)===this.owner;}catch{return false;}}
 read(){try{const raw=this.storage.getItem(SAVE_KEY);if(!raw)return null;if(raw.length>2000000)throw Error();const data=JSON.parse(raw);if(!validate(data))throw Error();return data.world;}catch{this.onError('invalid');return null;}}
 write(world){if(!this.owns())return false;try{if(world.dead){this.storage.removeItem(SAVE_KEY);return true;}this.storage.setItem(SAVE_KEY,JSON.stringify(snapshot(world)));return true;}catch{this.onError();return false;}}
 restore(world,data){for(const k of fields)world[k]=structuredClone(data[k]);world.spawnSectors=structuredClone(data.spawnSectors||[]);world.events=[];}
}
