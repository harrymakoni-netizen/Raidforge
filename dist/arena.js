import {BASE_PROGRAM,validateProgram,buildProjectiles} from './program.js';
const COLORS={orange:'#ff965b',violet:'#b296fa',mint:'#a8dabd'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Arena {
 constructor(canvas,{onUpdate=()=>{},onEnd=()=>{},onPause=()=>{},onFrame=()=>{}}={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onUpdate=onUpdate;this.onEnd=onEnd;this.onPause=onPause;this.onFrame=onFrame;this.program=BASE_PROGRAM;this.mode='idle';this.keys=new Set();this.pointer={x:500,y:220,down:false};this.sound=false;this.last=0;this.clock=0;this.frameClock=0;this.bullets=[];this.shots=[];this.particles=[];this.preview=false;this.remote=false;this.reset();
  this.resize=()=>{const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);};this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);
  this.onKeyDown=e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.querySelector('dialog[open]'))return;if(this.remote)return;const key=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright','shift','escape'].includes(key)&&this.mode!=='idle')e.preventDefault();this.keys.add(key);if(key==='escape'&&(this.mode==='playing'||this.mode==='paused'))this.pause();if(key==='shift')this.dash();};
  this.onKeyUp=e=>this.keys.delete(e.key.toLowerCase());window.addEventListener('keydown',this.onKeyDown);window.addEventListener('keyup',this.onKeyUp);window.addEventListener('blur',()=>{this.keys.clear();this.pointer.down=false;if(this.mode==='playing')this.pause();});
  const pos=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*620};};
  canvas.addEventListener('pointerdown',e=>{if(this.remote)return;this.pointer={...pos(e),down:true,touch:e.pointerType==='touch'};canvas.setPointerCapture(e.pointerId);canvas.focus();});canvas.addEventListener('pointermove',e=>{Object.assign(this.pointer,pos(e));});canvas.addEventListener('pointerup',()=>this.pointer.down=false);canvas.addEventListener('pointercancel',()=>this.pointer.down=false);
  this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 reset(){this.player={x:500,y:490,hp:5,invulnerable:0,dashCd:0,dashTime:0};this.boss={x:500,y:220,hp:100};this.elapsed=0;this.shotTimer=0;this.attackTimers=[];this.bullets=[];this.shots=[];this.particles=[];this.damageFlash=0;this.onUpdate(this.snapshot());}
 setProgram(program){this.program=validateProgram(program);if(this.mode!=='idle')this.stop();}
 start(preview=false){this.reset();this.preview=preview;this.mode='playing';this.onPause(false);this.onUpdate(this.snapshot());this.canvas.focus();if(this.sound)this.initAudio();}
 stop(){this.mode='idle';this.preview=false;this.keys.clear();this.pointer.down=false;this.reset();}
 pause(){if(this.mode==='playing'){this.mode='paused';this.keys.clear();this.pointer.down=false;}else if(this.mode==='paused')this.mode='playing';this.onPause(this.mode==='paused');}
 dash(){if(this.mode!=='playing'||this.player.dashCd>0)return;this.player.dashTime=.16;this.player.invulnerable=.3;this.player.dashCd=1.5;this.beep(220,.07,'sine',.025);}
 snapshot(){return{bossHp:this.boss.hp,playerHp:this.player.hp,time:this.elapsed,mode:this.mode,preview:this.preview};}
 frame(){return{player:this.player,boss:this.boss,bullets:this.bullets,shots:this.shots,elapsed:this.elapsed,mode:this.mode,preview:this.preview};}
 receiveFrame(frame){if(!this.remote)return;Object.assign(this,{player:frame.player,boss:frame.boss,bullets:frame.bullets,shots:frame.shots,elapsed:frame.elapsed,mode:frame.mode,preview:frame.preview});this.onUpdate(this.snapshot());}
 initAudio(){try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();if(this.audio.state==='suspended')this.audio.resume();}catch{this.sound=false;}}
 beep(freq,duration,type='sine',volume=.015){if(!this.sound)return;this.initAudio();if(!this.audio)return;const o=this.audio.createOscillator(),g=this.audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.audio.currentTime);g.gain.setValueAtTime(volume,this.audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.audio.currentTime+duration);o.connect(g);g.connect(this.audio.destination);o.start();o.stop(this.audio.currentTime+duration);}
 burst(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*120;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,color});}if(this.particles.length>150)this.particles.splice(0,this.particles.length-150);}
 update(dt){
  this.elapsed+=dt;const p=this.player,b=this.boss;p.invulnerable=Math.max(0,p.invulnerable-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dashTime=Math.max(0,p.dashTime-dt);this.damageFlash=Math.max(0,this.damageFlash-dt);
  let dx=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft')),dy=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
  if(this.pointer.touch&&this.pointer.down){dx=this.pointer.x-p.x;dy=this.pointer.y-p.y;if(Math.hypot(dx,dy)<8)dx=dy=0;}
  if(this.preview){dx=Math.cos(this.elapsed*.65);dy=Math.sin(this.elapsed*.9)*.45;}
  const moving=!!(dx||dy);if(moving){const len=Math.hypot(dx,dy),speed=p.dashTime>0?780:225;p.x=clamp(p.x+dx/len*speed*dt,40,960);p.y=clamp(p.y+dy/len*speed*dt,125,575);if(p.dashTime>0)this.burst(p.x,p.y,'#8fe2c1',1);}
  if(this.program.movement==='mirror')b.x+=(1000-p.x-b.x)*dt*1.2;
  else if(this.program.movement==='chase'&&moving){b.x+=(p.x-b.x)*dt*.22;b.y+=((Math.min(p.y,360))-b.y)*dt*.22;}
  else {b.x=500+Math.sin(this.elapsed*.55)*110;b.y=220+Math.sin(this.elapsed*.8)*25;}
  b.x=clamp(b.x,130,870);b.y=clamp(b.y,150,370);
  this.program.patterns.forEach((a,i)=>{this.attackTimers[i]=(this.attackTimers[i]??0)+dt;const active=a.condition==='always'||a.condition==='moving'&&moving||a.condition==='still'&&!moving||a.condition==='enraged'&&b.hp<=50;
   if(this.attackTimers[i]>=a.every&&active){this.attackTimers[i]=0;this.bullets.push(...buildProjectiles(a,b,p,this.elapsed));this.beep(120+i*60,.05,'triangle',.009);}
  });
  this.shotTimer-=dt;if((this.pointer.down||this.keys.has(' ')||this.preview)&&this.shotTimer<=0){this.shotTimer=.16;let aim=this.pointer.touch||this.preview||this.keys.has(' ')?b:this.pointer;let a=Math.atan2(aim.y-p.y,aim.x-p.x);this.shots.push({x:p.x,y:p.y,vx:Math.cos(a)*650,vy:Math.sin(a)*650,life:1.5});this.beep(460,.025,'sine',.006);}
  for(const s of this.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(Math.hypot(s.x-b.x,s.y-b.y)<48){s.life=0;s.hit=true;if(!this.preview)b.hp=Math.max(0,b.hp-1.6);else b.hp=65+30*Math.sin(this.elapsed*.13);this.burst(s.x,s.y,'#f8dc9d',3);}
   if(!s.hit&&!s.recycled&&(s.x<0||s.x>1000||s.y<95||s.y>620||s.life<=0)&&this.program.recycleMisses){s.recycled=true;s.life=0;let x=clamp(s.x,20,980),y=clamp(s.y,120,600),a=Math.atan2(p.y-y,p.x-x);this.bullets.push({x,y,vx:Math.cos(a)*125,vy:Math.sin(a)*125,life:6,r:5,color:'violet'});}
  }this.shots=this.shots.filter(s=>s.life>0&&s.x>-20&&s.x<1020&&s.y>80&&s.y<640);
  for(const s of this.bullets){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(Math.hypot(s.x-p.x,s.y-p.y)<12+s.r&&p.invulnerable<=0){s.life=0;if(!this.preview){p.hp--;p.invulnerable=1;this.damageFlash=.18;this.burst(p.x,p.y,'#ff987b',16);this.beep(75,.15,'sawtooth',.035);}}}
  this.bullets=this.bullets.filter(s=>s.life>0&&s.x>-20&&s.x<1020&&s.y>85&&s.y<640).slice(-240);
  if(Math.hypot(b.x-p.x,b.y-p.y)<55&&p.invulnerable<=0&&!this.preview){p.hp--;p.invulnerable=1;this.damageFlash=.18;}
  for(const s of this.particles){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;}this.particles=this.particles.filter(s=>s.life>0);
  this.onUpdate(this.snapshot());if(!this.preview&&(b.hp<=0||p.hp<=0)){this.mode='ended';this.onEnd({won:b.hp<=0,time:this.elapsed,health:p.hp});}
 }
 tick(t){const dt=Math.min((t-this.last)/1000||0,.035);this.last=t;this.clock+=dt;if(this.mode==='playing'&&!this.remote)this.update(dt);this.draw();this.frameClock+=dt;if(this.frameClock>.08&&!this.remote){this.frameClock=0;this.onFrame(this.frame());}this.raf=requestAnimationFrame(x=>this.tick(x));}
 draw(){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;if(!w||!h)return;c.setTransform(w/1000,0,0,h/620,0,0);c.clearRect(0,0,1000,620);const active=this.mode!=='idle',t=this.clock;
  const bg=c.createRadialGradient(500,270,10,500,300,650);bg.addColorStop(0,'#25322e');bg.addColorStop(.5,'#18221f');bg.addColorStop(1,'#121718');c.fillStyle=bg;c.fillRect(0,0,1000,620);
  c.strokeStyle='#73857c0c';c.lineWidth=1;for(let x=-600;x<1600;x+=64){c.beginPath();c.moveTo(x,0);c.lineTo(x+440,620);c.stroke();c.beginPath();c.moveTo(x+440,0);c.lineTo(x,620);c.stroke();}
  // Worn arena boundary, cardinal markers, and a slow moving forge ring.
  c.save();c.translate(500,active?335:320);c.scale(1,.53);[228,282,294,350].forEach((r,i)=>{c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.strokeStyle=i===2?'#c5ac6c3b':'#8eaa8d20';c.lineWidth=i===2?2:1;c.stroke();});
  c.setLineDash([2,13]);c.beginPath();c.arc(0,0,312,0,Math.PI*2);c.strokeStyle='#c2b48455';c.stroke();c.setLineDash([]);c.rotate(t*.035);for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.arc(0,0,282,a,a+.15);c.strokeStyle='#d7b57188';c.lineWidth=4;c.stroke();}c.restore();
  c.font='11px "IBM Plex Mono", monospace';c.textAlign='center';c.fillStyle='#b6ab6b66';c.fillText('N',500,143);c.fillText('S',500,503);c.fillText('W',165,326);c.fillText('E',835,326);
  for(let i=0;i<25;i++){const x=(i*137.5+Math.sin(t*.25+i)*20)%1000,y=80+((i*67-t*(6+i%4))%450+450)%450;c.globalAlpha=.15+.15*Math.sin(t+i);c.fillStyle=i%3===0?'#b5d9b0':'#f3b26e';c.fillRect(x,y,1.5+i%2,1.5+i%2);}c.globalAlpha=1;
  // Floating fragments around the specimen.
  if(!active){for(let i=0;i<7;i++){const a=i/7*Math.PI*2+t*.09,x=500+Math.cos(a)*205,y=270+Math.sin(a)*82;c.save();c.translate(x,y);c.rotate(a+.7);c.fillStyle='#b4c2b645';c.beginPath();c.ellipse(0,0,4,12,0,0,Math.PI*2);c.fill();c.restore();}}
  const b=active?this.boss:{x:500,y:277+Math.sin(t*1.6)*7};this.drawGoose(b.x,b.y,active?.72:1.28,t,active&&b.hp<50);
  if(active){for(const s of this.bullets){c.save();c.translate(s.x,s.y);c.rotate(Math.atan2(s.vy,s.vx));c.shadowColor=COLORS[s.color];c.shadowBlur=12;c.fillStyle=COLORS[s.color];c.beginPath();c.ellipse(0,0,8,4,0,0,Math.PI*2);c.fill();c.fillStyle='#fff1d5';c.fillRect(-2,-1,4,2);c.restore();}
   for(const s of this.shots){c.strokeStyle='#bbffe2';c.lineWidth=3;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x-s.vx*.018,s.y-s.vy*.018);c.stroke();}
   const p=this.player;c.save();c.translate(p.x,p.y);if(p.invulnerable>0)c.globalAlpha=.45+.35*Math.sin(t*40);c.shadowColor='#81dfc3';c.shadowBlur=16;c.fillStyle='#91d2b5';c.beginPath();c.moveTo(0,-15);c.lineTo(11,11);c.lineTo(0,6);c.lineTo(-11,11);c.closePath();c.fill();c.fillStyle='#f1ffd9';c.fillRect(-2,-6,4,8);c.shadowBlur=0;c.strokeStyle=p.dashCd>0?'#82ac8e33':'#baf5d78a';c.lineWidth=1;c.beginPath();c.arc(0,0,22,0,Math.PI*2*(1-p.dashCd/1.5));c.stroke();c.restore();
   for(const s of this.particles){c.globalAlpha=s.life;c.fillStyle=s.color;c.fillRect(s.x,s.y,3,3);}c.globalAlpha=1;
  }
  if(this.damageFlash>0){c.fillStyle=`rgba(255,70,30,${this.damageFlash})`;c.fillRect(0,0,1000,620);}const vignette=c.createRadialGradient(500,300,160,500,300,610);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#03090a99');c.fillStyle=vignette;c.fillRect(0,0,1000,620);
 }
 drawGoose(x,y,s,t,enraged){const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);
  // Ground shadow and warm underglow.
  let shadow=c.createRadialGradient(0,66,3,0,66,115);shadow.addColorStop(0,'#060909bb');shadow.addColorStop(1,'#05090900');c.fillStyle=shadow;c.beginPath();c.ellipse(0,67,120,32,0,0,7);c.fill();
  const glow=c.createRadialGradient(0,0,20,0,0,110);glow.addColorStop(0,enraged?'#fa77481c':'#e4d2a513');glow.addColorStop(1,'#0000');c.fillStyle=glow;c.fillRect(-130,-140,260,260);
  // Orange feet.
  c.fillStyle='#d58b45';for(const side of [-1,1]){c.beginPath();c.moveTo(side*24,43);c.lineTo(side*27,62);c.lineTo(side*46,67);c.lineTo(side*17,69);c.lineTo(side*12,61);c.lineTo(side*16,45);c.fill();}
  // Feathered body and swept wings, with custom illustrated shading.
  let body=c.createLinearGradient(-55,-20,60,70);body.addColorStop(0,'#f5f1dc');body.addColorStop(.5,'#d7ddce');body.addColorStop(1,'#93a99b');c.fillStyle=body;c.strokeStyle='#d1d7bf';c.lineWidth=1;c.beginPath();c.moveTo(-37,-20);c.bezierCurveTo(-75,-15,-76,35,-44,51);c.bezierCurveTo(-15,67,39,66,61,36);c.bezierCurveTo(76,13,51,-18,20,-22);c.closePath();c.fill();c.stroke();
  c.save();c.rotate(-.1+Math.sin(t*2)*.025);c.fillStyle='#a7b8a9';c.beginPath();c.moveTo(-24,-8);c.bezierCurveTo(-66,-5,-93,9,-101,31);c.lineTo(-84,28);c.lineTo(-88,39);c.lineTo(-69,33);c.lineTo(-71,44);c.bezierCurveTo(-38,38,-20,23,-17,5);c.fill();c.strokeStyle='#dbe2ce66';for(let i=0;i<4;i++){c.beginPath();c.moveTo(-31,-1+i*7);c.quadraticCurveTo(-53,10+i*6,-80+i*4,22+i*4);c.stroke();}c.restore();
  c.fillStyle='#eef0d9';c.beginPath();c.moveTo(28,-11);c.bezierCurveTo(62,-11,89,4,101,23);c.lineTo(85,22);c.lineTo(91,33);c.lineTo(74,29);c.lineTo(75,40);c.bezierCurveTo(49,34,32,19,25,5);c.fill();
  // Long neck curves into a stern face.
  let neck=c.createLinearGradient(-22,-90,29,25);neck.addColorStop(0,'#f7f5df');neck.addColorStop(.6,'#e9eed9');neck.addColorStop(1,'#b3c3af');c.fillStyle=neck;c.beginPath();c.moveTo(-19,18);c.bezierCurveTo(-24,-9,-2,-23,-4,-45);c.bezierCurveTo(-8,-59,-15,-63,-12,-79);c.bezierCurveTo(-9,-98,22,-103,37,-85);c.bezierCurveTo(46,-72,43,-59,28,-52);c.bezierCurveTo(15,-46,32,-18,34,0);c.bezierCurveTo(39,21,12,41,-8,31);c.closePath();c.fill();
  // Beak, brow and tiny dangerous eye.
  c.fillStyle='#e9a654';c.beginPath();c.moveTo(34,-78);c.lineTo(65,-65);c.quadraticCurveTo(65,-58,38,-58);c.lineTo(31,-63);c.closePath();c.fill();c.strokeStyle='#704927';c.lineWidth=1.7;c.beginPath();c.moveTo(39,-64);c.lineTo(60,-63);c.stroke();c.fillStyle='#151f1b';c.beginPath();c.arc(24,-78,3.7,0,7);c.fill();c.fillStyle=enraged?'#ff6246':'#e8b762';c.beginPath();c.arc(25,-78,1.5,0,7);c.fill();c.strokeStyle='#4f6253';c.lineWidth=3;c.beginPath();c.moveTo(15,-86);c.lineTo(30,-83);c.stroke();
  // Crooked dark fedora, ribbon, feather.
  c.save();c.translate(8,-94);c.rotate(-.14);c.fillStyle='#202b28';c.strokeStyle='#597061';c.lineWidth=1;c.beginPath();c.ellipse(0,2,42,10,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(-25,0);c.lineTo(-23,-27);c.quadraticCurveTo(-10,-35,-1,-28);c.quadraticCurveTo(11,-34,24,-26);c.lineTo(27,0);c.closePath();c.fill();c.stroke();c.fillStyle='#856344';c.fillRect(-25,-9,51,7);c.fillStyle='#d7c08e';c.beginPath();c.ellipse(-25,-19,3,14,-.3,0,7);c.fill();c.restore();
  // Gold chain and an engraved H medallion.
  c.strokeStyle='#c4a05d';c.lineWidth=3;c.beginPath();c.moveTo(-17,0);c.bezierCurveTo(-7,25,24,26,34,3);c.stroke();c.fillStyle='#c0a05d';c.strokeStyle='#f3d58c';c.lineWidth=1;c.beginPath();c.arc(12,24,9,0,7);c.fill();c.stroke();c.font='bold 10px serif';c.textAlign='center';c.fillStyle='#5c512f';c.fillText('H',12,28);
  c.restore();
 }
}
