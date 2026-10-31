import {validateProgram} from './program.js';
import {COMBAT_VERSION,DIFFICULTIES} from './combat.js';
export {DIFFICULTIES};
export const POWERS={shield:{label:'Guardian shield',command:'!shield',description:'Three seconds of invulnerability.',duration:3},heal:{label:'Second wind',command:'!heal',description:'Restore one heart, up to five.',duration:1.5},fury:{label:'Goose fury',command:'!fury',description:'Faster enemy projectiles for five seconds.',duration:5}};
function text(value,max,fallback){return typeof value==='string'&&value.trim()?value.trim().slice(0,max):fallback;}
export function normalizeChallenge(input){
 if(!input||input.version!==1)throw Error('This challenge version is not supported.');
 if(input.combatVersion!==undefined&&input.combatVersion!==COMBAT_VERSION)throw Error('This challenge uses a different arena rules version.');
 if(!Object.hasOwn(DIFFICULTIES,input.difficulty))throw Error('Unknown challenge difficulty.');
 const p=validateProgram(input.program);
 const program={name:p.name,tagline:p.tagline,movement:p.movement,recycleMisses:p.recycleMisses,patterns:p.patterns.map(a=>({kind:a.kind,count:a.count,speed:a.speed,every:a.every,spread:a.spread,condition:a.condition,color:a.color}))};
 return {version:1,combatVersion:COMBAT_VERSION,program,difficulty:input.difficulty,audienceEnabled:input.audienceEnabled===true,author:text(input.author,60,'A fellow workshop'),mutationAuthor:text(input.mutationAuthor,60,'Community'),trait:text(input.trait,240,'Shared mutation')};
}
export function encodeChallenge(input){const payload=normalizeChallenge(input);const bytes=new TextEncoder().encode(JSON.stringify(payload));if(bytes.length>6000)throw Error('This boss is too large to share as a link.');return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decodeChallenge(code){if(typeof code!=='string'||code.length>8000||!/^[A-Za-z0-9_-]+$/.test(code))throw Error('Invalid challenge link.');try{const bytes=Uint8Array.from(atob(code.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));return normalizeChallenge(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}catch(e){throw Error('The challenge link is damaged or contains an unsupported attack.');}}
export function challengeKey(program,difficulty='standard',audienceEnabled=false){const n=normalizeChallenge({version:1,program,difficulty,audienceEnabled});const value=JSON.stringify({combatVersion:COMBAT_VERSION,program:n.program,difficulty:n.difficulty,audienceEnabled:n.audienceEnabled});let hash=2166136261;for(const c of value){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return 'RF-'+(hash>>>0).toString(16).padStart(8,'0').toUpperCase();}
export function summarizeRun(result){
 const stats=result.stats||{};const shots=Math.max(0,Number(stats.shots)||0),hits=Math.min(shots,Math.max(0,Number(stats.hits)||0)),accuracy=shots?Math.round(hits/shots*100):0;
 const health=Math.max(0,Math.min(5,Number(result.health)||0)),damage=Math.max(0,Math.min(100,Number(stats.damage)||0)),time=Math.max(0,Number(result.time)||0);
 const score=Math.round(result.won?10000+health*600+accuracy*10+Math.max(0,3000-time*50):damage*20+accuracy*2);
 const rank=result.won?(health>=4&&time<60?'S':health>=3?'A':health>=1?'B':'C'):'—';
 return {score,rank,accuracy,shots,hits,dashes:Math.max(0,Number(stats.dashes)||0),powers:Math.max(0,Number(stats.powers)||0),grazes:Math.max(0,Number(stats.grazes)||0),overdrives:Math.max(0,Number(stats.overdrives)||0),damage:Math.round(damage)};
}
export function bestRun(records,key){return records.filter(r=>r.won&&r.challengeKey===key).sort((a,b)=>a.time-b.time||b.health-a.health)[0]||null;}
