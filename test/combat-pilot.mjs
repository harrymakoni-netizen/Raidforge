// Runs the real Arena.update loop with input only; never changes health, damage or timers.
import {Arena} from '../dist/arena.js';
import {BASE_PROGRAM} from '../dist/program.js';
import {hazardHits} from '../dist/combat.js';
export function testArena(program=BASE_PROGRAM,difficulty='standard'){
 const a=Object.create(Arena.prototype);Object.assign(a,{program,difficulty,audienceEnabled:false,preview:false,mode:'playing',keys:new Set(),pointer:{down:false},onUpdate:()=>{},onEnd:r=>a.result=r,beep:()=>{},burst:()=>{}});a.reset();return a;
}
export function steer(a){
 const directions=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[.707,-.707],[-.707,.707],[-.707,-.707]];
 const p=a.player;let choice=[0,0],best=Infinity;
 for(const [dx,dy] of directions){let cost=0;for(const t of [.12,.25,.45,.65]){
  const rawX=p.x+dx*245*t,rawY=p.y+dy*245*t,x=Math.max(32,Math.min(968,rawX)),y=Math.max(155,Math.min(582,rawY));
  cost+=(Math.abs(rawX-x)+Math.abs(rawY-y))*.5;
  cost+=Math.max(0,120-Math.hypot(x-a.boss.x,y-a.boss.y))*3;
  for(const b of a.bullets){const dist=Math.hypot(x-(b.x+b.vx*t),y-(b.y+b.vy*t));if(dist<55)cost+=(55-dist)*(dist<22?8:1);}
  for(const h of a.hazards){if(a.elapsed+t>=h.endsAt)continue;if(hazardHits(h,{x,y},18))cost+=(a.elapsed+t>=h.fireAt?180:65);}
  cost+=Math.abs(x-500)*.002+Math.abs(y-470)*.012;
 }
 cost+=(dx!==a.lastDirection.x||dy!==a.lastDirection.y)?1:0;if(cost<best){best=cost;choice=[dx,dy];}}
 a.keys.clear();a.keys.add(' ');const [dx,dy]=choice;if(dx>0)a.keys.add('d');if(dx<0)a.keys.add('a');if(dy>0)a.keys.add('s');if(dy<0)a.keys.add('w');
 if(best>400&&a.player.dashCd<=0){if(dx||dy)a.lastDirection={x:dx,y:dy};a.dash();}
}
export function simulate(program,difficulty,policy=steer){const a=testArena(program,difficulty);for(let i=0;i<60*100&&a.mode==='playing';i++){if(i%6===0)policy(a);a.update(1/60);}return {arena:a,result:a.result};}
