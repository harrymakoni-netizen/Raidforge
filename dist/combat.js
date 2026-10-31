// Authored encounter rules run alongside each community-forged attack program.
// Version records separately whenever combat balance changes.
export const COMBAT_VERSION=2;
export const DIFFICULTIES={
 chill:{label:'Chill',speed:.8,cadence:1.2,damage:.85,warning:1.5,hazardEvery:6.2,dashCd:1.5,description:'Learn the tells. Longer warnings and a shorter fight.'},
 standard:{label:'Standard',speed:1.15,cadence:.92,damage:.55,warning:1.15,hazardEvery:4.6,dashCd:1.8,description:'Three phases. Stay moving, read the floor, earn your damage.'},
 nightmare:{label:'Nightmare',speed:1.4,cadence:.78,damage:.43,warning:.9,hazardEvery:3.6,dashCd:2.1,description:'Faster feathers, tighter warnings, fewer chances to recover.'}
};
export const PHASES=['THE SHAKEDOWN','CROSSFIRE','LAST HONK'];
export const phaseForHp=hp=>hp<=35?3:hp<=70?2:1;
export function pressureFor(phase,elapsed){return {speed:1+(phase-1)*.1+(elapsed>=60?.15:0),cadence:1-(phase-1)*.1-(elapsed>=60?.1:0)};}
export function createHazards(phase,sequence,player,difficulty,time){
 const warning=difficulty.warning;
 const base={born:time,fireAt:time+warning,endsAt:time+warning+.65};
 const mark={...base,kind:'circle',x:player.x,y:player.y,r:phase===3?86:72};
 // Lock each target when the warning begins; it never follows the player.
 if(phase===1||sequence%2===0)return [mark];
 const vertical=sequence%4===1;
 const lane={...base,kind:vertical?'vertical':'horizontal',x:player.x,y:player.y,r:phase===3?53:44};
 return phase===3?[lane,{...lane,kind:vertical?'horizontal':'vertical'}]:[lane];
}
export function hazardHits(h,p,radius=8){return h.kind==='circle'?Math.hypot(h.x-p.x,h.y-p.y)<h.r+radius:h.kind==='vertical'?Math.abs(h.x-p.x)<h.r+radius:Math.abs(h.y-p.y)<h.r+radius;}
export function combatAdvice(cause){return ({mark:'The floor locks onto your position. Leave the striped warning before it fills.',crossfire:'Crossfire cuts across the arena. Step out of both marked lanes, or dash through at impact.',feather:'Use small movements between feathers. Save your dash for a closing gap.',contact:'Keep some distance from the goose. Its body hurts as much as its feathers.'})[cause]||'Read the floor, keep firing, and save a dash for the tight spots.';}
export function validCombatFrame(f){
 const bounded=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
 return (f.phase===undefined||Number.isInteger(f.phase)&&bounded(f.phase,1,3))&&
  (f.phaseUntil===undefined||bounded(f.phaseUntil,0,100000))&&
  (f.overdrive===undefined||bounded(f.overdrive,0,4))&&
  (f.charge===undefined||bounded(f.charge,0,100))&&
  (f.hazards===undefined||Array.isArray(f.hazards)&&f.hazards.length<=4&&f.hazards.every(h=>h&&['circle','vertical','horizontal'].includes(h.kind)&&bounded(h.x,0,1000)&&bounded(h.y,0,620)&&bounded(h.r,1,100)&&bounded(h.born,0,100000)&&bounded(h.fireAt,h.born,h.born+2)&&bounded(h.endsAt,h.fireAt,h.fireAt+1)));
}
