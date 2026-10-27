// A bounded, declarative attack language. No eval, dynamic imports or generated JS.
export const PROGRAM_SCHEMA = {
  type:'object', additionalProperties:false, required:['name','tagline','movement','recycleMisses','patterns'],
  properties:{name:{type:'string',maxLength:48},tagline:{type:'string',maxLength:160},movement:{type:'string',enum:['float','chase','mirror']},recycleMisses:{type:'boolean'},patterns:{type:'array',minItems:1,maxItems:3,items:{type:'object',additionalProperties:false,required:['kind','count','speed','every','spread','condition','color'],properties:{kind:{type:'string',enum:['ring','aim','spiral']},count:{type:'integer',minimum:1,maximum:12},speed:{type:'number',minimum:45,maximum:180},every:{type:'number',minimum:0.8,maximum:5},spread:{type:'number',minimum:0.2,maximum:6.28},condition:{type:'string',enum:['always','moving','still','enraged']},color:{type:'string',enum:['orange','violet','mint']}}}}}
};
export function validateProgram(p) {
  if(!p || typeof p!=='object' || Array.isArray(p)) throw new Error('Attack program must be an object.');
  const keys=['name','tagline','movement','recycleMisses','patterns'];
  if(Object.keys(p).some(k=>!keys.includes(k))) throw new Error('Unknown attack instruction.');
  if(typeof p.name!=='string'||!p.name.trim()||p.name.length>48) throw new Error('Boss name must be 1–48 characters.');
  if(typeof p.tagline!=='string'||p.tagline.length>160) throw new Error('Description is too long.');
  if(!['float','chase','mirror'].includes(p.movement)||typeof p.recycleMisses!=='boolean') throw new Error('Invalid behavior.');
  if(!Array.isArray(p.patterns)||p.patterns.length<1||p.patterns.length>3) throw new Error('Use 1–3 attack patterns.');
  for(const a of p.patterns){
    if(!a || Object.keys(a).some(k=>!['kind','count','speed','every','spread','condition','color'].includes(k))) throw new Error('Unknown pattern instruction.');
    if(!['ring','aim','spiral'].includes(a.kind)||!['always','moving','still','enraged'].includes(a.condition)||!['orange','violet','mint'].includes(a.color)) throw new Error('Invalid attack instruction.');
    for(const [key,min,max] of [['count',1,12],['speed',45,180],['every',0.8,5],['spread',0.2,6.28]]) if(!Number.isFinite(a[key])||a[key]<min||a[key]>max) throw new Error(`${key} exceeds the arena limits.`);
    if(!Number.isInteger(a.count)) throw new Error('Projectile count must be an integer.');
  }
  if(p.patterns.reduce((n,a)=>n+a.count/a.every,0)>22) throw new Error('Too many projectiles per second.');
  return structuredClone(p);
}
export const BASE_PROGRAM=validateProgram({name:'The Honkfather',tagline:'Your mistakes are its ammunition.',movement:'float',recycleMisses:false,patterns:[{kind:'ring',count:8,speed:85,every:2.5,spread:6.28,condition:'always',color:'orange'}]});
export const PRESETS=[
 {id:'ricochet',title:'Your misses. His ammunition.',prompt:'Every shot I miss comes back at me. Give the goose a spiral attack.',author:'pixelwitch',label:'PROJECTILES',program:{...BASE_PROGRAM,recycleMisses:true,patterns:[{kind:'spiral',count:5,speed:95,every:1.8,spread:4.5,condition:'always',color:'orange'}]}},
 {id:'freeze',title:'Move and you’re goose.',prompt:'The goose only attacks while I am moving. Make it mirror my position.',author:'moss.exe',label:'MOVEMENT',program:{...BASE_PROGRAM,tagline:'Hold still. It can smell movement.',movement:'mirror',patterns:[{kind:'aim',count:3,speed:120,every:1.2,spread:0.7,condition:'moving',color:'violet'}]}},
 {id:'rage',title:'A very personal space problem.',prompt:'At half health, unleash a second ring of feathers.',author:'goose_enjoyer',label:'PHASE TWO',program:{...BASE_PROGRAM,tagline:'You have made a powerful anem-y.',movement:'chase',patterns:[...BASE_PROGRAM.patterns,{kind:'ring',count:10,speed:130,every:1.8,spread:6.28,condition:'enraged',color:'violet'}]}}
];
export function inspectProgram(input){const p=validateProgram(input);return {valid:true,patterns:p.patterns.length,maxBulletsPerSecond:Math.round(p.patterns.reduce((n,a)=>n+a.count/a.every,0)*10)/10,checks:['Schema and instruction limits passed','Projectile budget passed','No executable JavaScript or network instructions'],program:p};}
export function buildProjectiles(pattern, boss, player, time){
 const aim=Math.atan2(player.y-boss.y,player.x-boss.x), base=pattern.kind==='aim'?aim:pattern.kind==='spiral'?time*1.1:time*.17;
 return Array.from({length:pattern.count},(_,i)=>{const angle=base+(pattern.kind==='aim'?(i-(pattern.count-1)/2)*pattern.spread/Math.max(1,pattern.count-1):i*pattern.spread/pattern.count);return{x:boss.x,y:boss.y,vx:Math.cos(angle)*pattern.speed,vy:Math.sin(angle)*pattern.speed,life:7,color:pattern.color,r:5};});
}
