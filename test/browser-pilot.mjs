import {steer} from './combat-pilot.mjs';
export async function instrumentArena(page){
 // Test-only module export: exposes observations/inputs, without modifying game rules.
 await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nexport {arena};\n'});});
}
export async function pilotFight(page){
 await page.evaluate(async code=>{const {arena}=await import('/app.js');const {hazardHits}=await import('/combat.js');const steer=new Function('hazardHits',`return (${code})`)(hazardHits);const timer=setInterval(()=>{if(arena.mode==='ended'||arena.mode==='idle'){clearInterval(timer);return;}if(arena.mode==='playing')steer(arena);},100);},steer.toString());
}
