import {performance} from 'node:perf_hooks';
const root=process.argv[2]||new URL('../',import.meta.url).pathname.replace(/\/$/,'');
const {World}=await import(root+'/src/world.js');
const {ENEMIES}=await import(root+'/src/config.js');
const times=[];
for(let batch=0;batch<5;batch++){
const w=new World(()=>.63);w.spawnTimer=1e9;w.nextBoss=1e9;w.shotTimer=1e9;
for(let i=0;i<170;i++){const a=i*2.39996,r=100+i*4;w.enemies.push({...ENEMIES.scout,type:'scout',x:Math.cos(a)*r,y:Math.sin(a)*r,hp:1e8,maxHp:1e8,hit:0,seed:i});}
let sum=0;for(let i=0;i<1800;i++){w.player.invincible=1;while(w.pendingChoices)w.chooseAbility(w.offers[0]);if(i%15===0)for(let j=0;j<40;j++)w.bullets.push({x:0,y:0,vx:Math.cos(j)*680,vy:Math.sin(j)*680,life:.8,damage:1});const start=performance.now();w.update(1/60,{x:Math.sin(i*.02),y:Math.cos(i*.02)},{width:390,height:844});sum+=performance.now()-start;w.events.length=0;}times.push(sum/1800);
}console.log(JSON.stringify({msPerStep:times,median:times.sort((a,b)=>a-b)[2]}));
