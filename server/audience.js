import {randomUUID} from 'node:crypto';
import {POWERS} from '../dist/challenges.js';
// The broadcaster's fresh, authenticated frame determines whether a voting round exists.
export class AudienceRounds {
 constructor({now=()=>Date.now(),duration=12000,onStatus=()=>{},onPower=()=>{}}={}){Object.assign(this,{now,duration,onStatus,onPower});this.rooms=new Map();}
 frame(login,frame){const now=this.now();const enabled=frame.mode==='playing'&&!frame.preview&&frame.audienceEnabled===true&&typeof frame.runId==='string';let round=this.rooms.get(login);
  if(!enabled){if(round){this.rooms.delete(login);this.onStatus(login,this.status(login));}return;}
  if(!round||round.runId!==frame.runId||now-round.lastSeen>2500){round={runId:frame.runId,id:randomUUID(),endsAt:now+this.duration,lastSeen:now,votes:new Map()};this.rooms.set(login,round);this.onStatus(login,this.status(login));}else round.lastSeen=now;
 }
 status(login){const r=this.rooms.get(login);if(!r)return{active:false,counts:{shield:0,heal:0,fury:0}};const counts={shield:0,heal:0,fury:0};for(const v of r.votes.values())counts[v.power]++;return{active:true,runId:r.runId,roundId:r.id,endsAt:r.endsAt,remainingMs:Math.max(0,r.endsAt-this.now()),counts,total:r.votes.size};}
 vote(login,power,userId,name){if(!Object.hasOwn(POWERS,power))return false;this.tick();const round=this.rooms.get(login);if(!round||this.now()-round.lastSeen>2500||!userId)return false;if(round.votes.size>=10000&&!round.votes.has(userId))return false;round.votes.set(userId,{power,name:String(name||'viewer').slice(0,40)});this.onStatus(login,this.status(login));return true;}
 tick(){const now=this.now();for(const[login,round]of this.rooms){if(now-round.lastSeen>2500){this.rooms.delete(login);this.onStatus(login,this.status(login));continue;}if(now<round.endsAt)continue;const status=this.status(login);const choices=Object.keys(POWERS).filter(p=>status.counts[p]>0).sort((a,b)=>status.counts[b]-status.counts[a]||Object.keys(POWERS).indexOf(a)-Object.keys(POWERS).indexOf(b));
   if(choices.length){const power=choices[0],supporters=[...round.votes.values()].filter(v=>v.power===power);this.onPower(login,{id:randomUUID(),runId:round.runId,roundId:round.id,power,voters:supporters.length,credits:supporters.slice(0,3).map(v=>v.name)});}
   round.id=randomUUID();round.endsAt=now+this.duration;round.votes.clear();this.onStatus(login,this.status(login));
  }}
}
