import {instrumentArena,pilotFight} from './browser-pilot.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await instrumentArena(page);
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Select Move and you’re goose.'}).click();
 await page.getByRole('button',{name:'Forge selected mutation'}).click();await page.getByRole('button',{name:'Equip mutation'}).click();
 await page.getByRole('button',{name:'Chill',exact:true}).click();
 await page.getByRole('checkbox',{name:'Chat powers'}).uncheck();
 await page.getByRole('button',{name:'Share challenge'}).click();const url=await page.getByLabel('CHALLENGE LINK').inputValue();assert.ok(url.includes('#challenge='));await page.getByRole('button',{name:'Close dialog'}).click();
 const other=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,isMobile:true,hasTouch:true});const friend=await other.newPage();friend.on('pageerror',e=>errors.push(e.message));await friend.goto(url);await friend.getByRole('button',{name:'Accept challenge'}).click();assert.equal(await friend.getByRole('button',{name:'Chill',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await friend.getByRole('checkbox',{name:'Chat powers'}).isChecked(),false);assert.ok((await friend.locator('#creator-credit').textContent()).includes('moss.exe'));assert.equal(await friend.evaluate(()=>location.hash),'');assert.equal(await friend.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await friend.screenshot({path:'artifacts/features-mobile.png',fullPage:true});await other.close();
 await page.getByRole('button',{name:'Enter the arena'}).click();await pilotFight(page);await page.getByText('GOOSE. COOKED.',{exact:true}).waitFor({timeout:60000});await page.keyboard.up(' ');await page.getByRole('button',{name:'View run report'}).click();assert.ok((await page.locator('#run-report').textContent()).includes('NEW PERSONAL BEST'));assert.ok((await page.locator('#run-report').textContent()).includes('moss.exe'));
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download scorecard'}).click();const file=await downloaded;await file.saveAs('artifacts/scorecard.png');assert.equal(file.suggestedFilename(),'raidforge-scorecard.png');
 await page.getByRole('button',{name:'Run book',exact:true}).click();assert.ok((await page.locator('#runs-view').textContent()).includes('Chill'));await page.reload();await page.getByRole('button',{name:'Run book 01',exact:true}).click();assert.ok((await page.locator('#runs-view').textContent()).includes('PURE SKILL'));
 await page.getByRole('button',{name:'The forge 01',exact:true}).click();await page.getByRole('checkbox',{name:'Chat powers'}).check();await page.getByRole('button',{name:'Enter the arena'}).click();await page.getByRole('button',{name:'Guardian shield',exact:false}).click();assert.ok((await page.locator('#audience-hint').textContent()).includes('12 seconds'));assert.equal(await page.getByRole('button',{name:'Goose fury',exact:false}).isDisabled(),true);await page.screenshot({path:'artifacts/features-desktop.png',fullPage:true});
 console.log(JSON.stringify({errors,verified:['share boss + difficulty + creator','accept challenge on mobile','pure-skill victory','scorecard PNG download','personal-best persistence','run book','practice power and cooldown']}));assert.deepEqual(errors,[]);
}catch(error){console.error('FIGHT DIAGNOSTIC',await page.evaluate(async()=>{const {arena:a}=await import('/app.js');return {mode:a.mode,hp:a.player.hp,boss:a.boss.hp,elapsed:a.elapsed,stats:a.stats,lastHit:a.lastHit,phase:a.phase,errors:document.querySelector('#arena-message')?.textContent};}));throw error;}finally{await browser.close();}
