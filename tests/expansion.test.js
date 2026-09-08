import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {moveEnemy} from '../src/behaviors.js';
import {ENEMIES} from '../src/config.js';
import {levelLine} from '../src/banter.js';
import {snapshot,validate} from '../src/save.js';
test('spawn covers all sixteen perimeter sectors safely on phone and landscape',()=>{
 for(const view of [{width:360,height:780},{width:844,height:390}]){
 const w=new World();const sectors=new Set();
 for(let i=0;i<16;i++){w.spawn(view);const e=w.enemies.at(-1),hw=view.width/2+100,hh=view.height/2+100;let side,t;
 if(e.y===-hh){side=0;t=(e.x/hw+1)/2;}else if(e.x===hw){side=1;t=(e.y/hh+1)/2;}else if(e.y===hh){side=2;t=(e.x/hw+1)/2;}else{side=3;t=(e.y/hh+1)/2;}
 sectors.add(side*4+Math.min(3,Math.floor(t*4)));assert.ok(Math.abs(e.x)>view.width/2||Math.abs(e.y)>view.height/2);}
 assert.equal(sectors.size,16);}
});
test('new enemies move finitely and bomber warning is delayed and bounded',()=>{
 const w=new World();for(const type of ['orbiter','hunter','bomber']){const e={...ENEMIES[type],type,x:120,y:0,cooldown:0};moveEnemy(e,w,1/60);assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));}
 assert.equal(w.hazards.length,1);assert.equal(w.hazards[0].age,0);assert.equal(w.player.hp,100);
});
test('level banter avoids consecutive repeats and old saves remain compatible',()=>{
 for(let i=0;i<20;i++){const a=levelLine('');assert.notEqual(levelLine(a),a);}
 const data=snapshot(new World());delete data.world.spawnSectors;assert.equal(validate(data),true);
});
