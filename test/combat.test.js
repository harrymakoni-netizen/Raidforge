import test from 'node:test';
import assert from 'node:assert/strict';
import {BASE_PROGRAM,PRESETS} from '../dist/program.js';
import {COMBAT_VERSION,DIFFICULTIES,createHazards,hazardHits,pressureFor} from '../dist/combat.js';
import {encodeChallenge,decodeChallenge,challengeKey,bestRun} from '../dist/challenges.js';
import {validFrame} from '../server/index.js';
import {testArena,simulate} from './combat-pilot.mjs';

test('standing still and holding fire loses every preset on Standard and Nightmare; active dodging can win',()=>{
 for(const difficulty of ['standard','nightmare'])for(const program of [BASE_PROGRAM,...PRESETS.map(p=>p.program)]){
  const passive=simulate(program,difficulty,a=>a.keys.add(' '));assert.equal(passive.result?.won,false,`${difficulty}: passive cheese`);
  const active=simulate(program,difficulty);assert.equal(active.result?.won,true,`${difficulty}: no viable clear`);assert.equal(active.result.phase,3);assert.ok(active.result.time>30);assert.ok(active.result.time<65);assert.ok(active.arena.bullets.length<=240);
 }
});
test('warnings lock their target and never damage before impact; leaving the mark avoids damage',()=>{
 const a=testArena();a.hazardTimer=0;a.update(.01);const mark={...a.hazards[0]};a.update(.5);assert.equal(a.player.hp,5);assert.deepEqual(a.hazards[0],mark);
 a.player.x=mark.x+mark.r+20;a.update(.7);assert.equal(a.player.hp,5);
 a.player.x=mark.x;a.update(.01);assert.equal(a.player.hp,4);assert.equal(a.lastHit,'mark');a.update(.01);assert.equal(a.player.hp,4,'hurt grace prevents repeated damage from the same strike');
 const cross=createHazards(3,1,{x:500,y:400},DIFFICULTIES.standard,5);assert.equal(cross.length,2);assert.equal(hazardHits(cross[0],{x:500,y:560}),true);assert.equal(hazardHits(cross[0],{x:800,y:400}),false);
});
test('phase changes clear threats, pause damage and resume with stronger pressure; pause freezes the fight',()=>{
 const a=testArena();a.boss.hp=69;a.bullets=[{x:500,y:490,vx:0,vy:0,r:5,life:3,color:'orange'}];a.hazards=createHazards(1,0,a.player,DIFFICULTIES.standard,0);a.update(.01);assert.equal(a.phase,2);assert.equal(a.bullets.length,0);assert.equal(a.hazards.length,0);assert.equal(a.player.hp,5);assert.ok(a.player.invulnerable>1);
 a.boss.hp=34;a.update(.01);assert.equal(a.phase,3);assert.ok(pressureFor(3,61).cadence<pressureFor(1,0).cadence);
 a.onPause=()=>{};a.pause();assert.equal(a.mode,'paused');a.dash();assert.equal(a.stats.dashes,0);a.pause();assert.equal(a.mode,'playing');
});
test('dash really moves without a held direction, respects cooldown and preserves chat shield',()=>{
 const a=testArena();a.audienceEnabled=true;a.applyPower('shield');a.dash();a.dash();assert.equal(a.stats.dashes,1);assert.equal(a.player.invulnerable,3);const before=a.player.y;a.update(.05);assert.ok(a.player.y<before-20);assert.ok(a.player.invulnerable>2.9);assert.ok(a.player.dashCd>0);
});
test('each close dodge charges once; shielded dodges do not charge; eight clean grazes trigger temporary Overdrive',()=>{
 const a=testArena();const feather=()=>({x:a.player.x+25,y:a.player.y,vx:0,vy:0,r:5,life:3,color:'orange'});
 a.bullets=[feather()];a.update(.01);a.update(.01);assert.equal(a.stats.grazes,1);assert.equal(a.charge,12.5);
 a.player.invulnerable=1;a.bullets=[feather()];a.update(.01);assert.equal(a.stats.grazes,1);a.player.invulnerable=0;
 for(let i=0;i<7;i++){a.bullets=[feather()];a.update(.01);}assert.equal(a.stats.grazes,8);assert.equal(a.stats.overdrives,1);assert.equal(a.overdrive,4);assert.equal(a.charge,0);
 a.shots=[{x:a.boss.x,y:a.boss.y,vx:0,vy:0,life:1}];a.update(.01);assert.ok(Math.abs(a.boss.hp-(100-DIFFICULTIES.standard.damage*1.65))<.001);
 a.overdrive=0;a.charge=50;a.takeHit('feather');assert.equal(a.charge,25);
});
test('new rules separate personal records and shared challenges reject incompatible rules',()=>{
 const source={version:1,combatVersion:COMBAT_VERSION,program:BASE_PROGRAM,difficulty:'standard',audienceEnabled:false};assert.equal(decodeChallenge(encodeChallenge(source)).combatVersion,2);assert.throws(()=>encodeChallenge({...source,combatVersion:99}));
 // Exact pre-update hashing format, to protect existing records from being compared with tougher runs.
 const current=decodeChallenge(encodeChallenge(source));const value=JSON.stringify({program:current.program,difficulty:'standard',audienceEnabled:false});let hash=2166136261;for(const c of value){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}const oldKey='RF-'+(hash>>>0).toString(16).padStart(8,'0').toUpperCase();const key=challengeKey(BASE_PROGRAM,'standard',false);assert.notEqual(key,oldKey);assert.equal(bestRun([{won:true,time:10,challengeKey:oldKey}],key),null);
});
test('OBS validates and relays bounded hazard, phase and Overdrive state',()=>{
 const a=testArena();a.runId='combat-test';a.hazards=createHazards(3,1,a.player,DIFFICULTIES.standard,0);const frame=a.frame();assert.equal(validFrame(frame),true);assert.equal(validFrame({...frame,phase:9}),false);assert.equal(validFrame({...frame,overdrive:Infinity}),false);assert.equal(validFrame({...frame,hazards:[{...frame.hazards[0],r:10000}]}),false);assert.equal(validFrame({...frame,hazards:Array(5).fill(frame.hazards[0])}),false);
 const viewer=testArena();viewer.remote=true;viewer.receiveFrame(frame);assert.deepEqual(viewer.hazards,frame.hazards);assert.equal(viewer.phase,frame.phase);
});

test('mutation preview demonstrates all three phases and conditional rage attacks without a scored result',()=>{
 const a=testArena(PRESETS[2].program);a.preview=true;for(let i=0;i<60*22;i++)a.update(1/60);assert.equal(a.phase,3);assert.equal(a.boss.hp,30);assert.equal(a.player.hp,5);assert.equal(a.result,undefined);assert.equal(a.stats.damage,0);assert.ok(a.bullets.some(b=>b.color==='violet'));
});
