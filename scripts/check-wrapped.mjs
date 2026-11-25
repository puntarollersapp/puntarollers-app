import assert from 'node:assert/strict'
import { buildSlides, plaqueStats, personality, humorSlides } from '../src/lib/wrapped.js'
const empty={name:'Demo',year:2026}
assert.deepEqual(buildSlides(empty).filter(s=>!s.humor&&s.id!=='soundtrack'&&s.id!=='believe').map(s=>s.id),['intro','tag','outro'])
assert.deepEqual(plaqueStats(empty),[])
assert.equal(personality(empty),'El comienzo de algo grande')
const complete={...empty,attendance:{classes:8,busiestMonth:11,favoriteWeekday:6},activity:{km:135.5,hours:15,bestMonth:10},duties:{approved:4},shifter:{category:'6K',completed:5,planCompleted:false},performance:{count:3,distances:[{km:3,count:2,bestSeconds:600,firstSeconds:720,lastSeconds:600,bestPace:200,bestSpeed:18,timeReductionPct:16.67},{km:6,count:1,bestSeconds:1500,firstSeconds:1500,lastSeconds:1500,bestPace:250,bestSpeed:14.4,timeReductionPct:null}]},frames:{frames:2},goals:1}
const slides=buildSlides(complete)
assert(slides.some(s=>s.id==='mark-3'&&s.small.includes('Redujiste tu tiempo')))
assert(!slides.find(s=>s.id==='mark-6').small.includes('Redujiste'))
assert(slides.find(s=>s.id==='shifter').small.includes('No representa un resultado oficial'))
assert.equal(personality(complete),'Roller en evolución')
assert.equal(plaqueStats(complete).length,4)
assert(!buildSlides({...empty,activity:{km:null,hours:0},duties:{approved:0}}).some(s=>s.id==='km'||s.id==='time'||s.id==='duties'))
assert(!buildSlides({...empty,awards:null}).some(s=>s.id==='awards'))
assert(buildSlides({...empty,manualActivities:1}).some(s=>s.id==='manual'))
for(const profile of [empty,complete,{...complete,badges:['Ya frena en T','ya frena en t','Primeros 6K','']}]) {
 const stories=buildSlides(profile,'fixture-1')
 const oracle=stories.filter(s=>s.id.startsWith('humor-'))
 assert.equal(oracle.length,3)
 assert.deepEqual(oracle.map(s=>s.oracleNumber),[1,2,3])
 assert(oracle.every(s=>s.kicker==='El oráculo roller'&&s.big.length>15&&s.small.length>45))
 assert(stories.at(-2).small.includes('Instagram'))
 assert.equal(new Set(stories.map(s=>s.id)).size,stories.length)
 assert.equal(stories.find(s=>s.id==='believe').song.artist,'Cher')
 assert.equal(stories.find(s=>s.id==='believe').song.title,'Believe')
 assert.equal(stories.at(-1).big,'¡FLEXIONEN!')
 assert.equal(stories.at(-2).share,true)
 assert.deepEqual(humorSlides(profile,'fixture-1'),humorSlides(profile,'fixture-1'))
 assert(stories.find(s=>s.id==='soundtrack').song.url.startsWith('https://open.spotify.com/track/'))
}
assert.equal(buildSlides({...empty,badges:['Ya frena en T','ya frena en t','Primeros 6K','']}).find(s=>s.id==='badges').value,2)
assert(!buildSlides(empty).some(s=>s.id==='badges'))
assert(new Set(Array.from({length:20},(_,i)=>humorSlides(empty,'student-'+i).map(s=>s.id).join('|'))).size>1)
console.log('PR Wrapped: historical, soundtrack, humor, badges and finale assertions passed')

import { ORACLE_WIDTH, ORACLE_HEIGHT, isOracleSlide, oracleFilename, drawOraclePlaque, renderOraclePlaque, shareOraclePlaque } from '../src/lib/oraclePlaque.js'
assert.equal(ORACLE_WIDTH,1080)
assert.equal(ORACLE_HEIGHT,1920)
assert(!isOracleSlide(slides.at(-1)))
assert(!isOracleSlide(slides.at(-2)))
assert.throws(()=>oracleFilename(slides.at(-1)))
const seen=new Set()
const gradient={addColorStop(){}}
function context(){
 const calls=[]
 const ctx={calls,font:'',measureText(t){const size=Number(this.font.match(/(\d+)px/)?.[1]||30);return {width:t.length*size*.65}},fillText(t,x,y){calls.push({t,x,y,width:this.measureText(t).width})},createRadialGradient(){return gradient},createLinearGradient(){return gradient}}
 for(const name of ['fillRect','save','restore','translate','rotate','beginPath','ellipse','stroke','moveTo','lineTo','closePath','fill','drawImage'])ctx[name]=()=>{}
 return ctx
}
for(let i=0;i<120;i++){
 const stories=humorSlides(complete,'oracle-check-'+i)
 for(const story of stories){
  seen.add(story.id+':'+story.oracleNumber)
  assert(isOracleSlide(story))
  assert.equal(oracleFilename(story),'PR-Oraculo-Roller-2026-0'+story.oracleNumber+'.png')
  for(const fonts of [[true,true,true],[false,false,false]]){
   const ctx=context()
   drawOraclePlaque(ctx,story,{width:300,height:100},fonts)
   const texts=ctx.calls.map(x=>x.t).join(' ')
   assert(texts.includes(story.oracleNumber===2?story.big:story.big.toLocaleUpperCase('es-UY')))
   assert(texts.includes(story.small))
   assert(texts.includes('El oráculo roller'))
   assert(texts.includes('PR WRAPPED 2026'))
   assert(texts.includes('puntarollers.com'))
   assert(ctx.calls.every(x=>x.x===540&&x.y>=250&&x.y<=1570&&x.width<=900))
  }
 }
}
assert.equal(seen.size,36,'all twelve jokes in all three designs')
let canvas
globalThis.Image=class{width=300;height=100;set src(v){assert.equal(v,'/logo.png');queueMicrotask(()=>this.onload())}}
globalThis.document={fonts:{load:async()=>[{}]},createElement(tag){assert.equal(tag,'canvas');canvas={width:0,height:0,getContext:()=>context(),toBlob(cb,type){assert.equal(this.width,1080);assert.equal(this.height,1920);assert.equal(type,'image/png');cb(new Blob(['fixture'],{type}))}};return canvas}}
const example=humorSlides(complete,'fixture')[0]
const png=await renderOraclePlaque(example)
assert.equal(png.type,'image/png')
assert.equal(canvas.width,0)
assert.equal(canvas.height,0)
let downloaded=0,shared=0
const filename=oracleFilename(example)
const download=(b,n)=>{assert.equal(b,png);assert.equal(n,filename);downloaded++}
assert.equal(await shareOraclePlaque(png,filename,{},download),'downloaded')
assert.equal(await shareOraclePlaque(png,filename,{canShare:()=>false,share:async()=>assert.fail()},download),'downloaded')
assert.equal(await shareOraclePlaque(png,filename,{canShare:({files})=>files[0].name===filename,share:async({files})=>{assert.equal(files[0].type,'image/png');shared++}},download),'shared')
assert.equal(await shareOraclePlaque(png,filename,{canShare:()=>true,share:async()=>{throw Object.assign(Error(),{name:'AbortError'})}},download),'cancelled')
assert.equal(await shareOraclePlaque(png,filename,{canShare:()=>true,share:async()=>{throw Error('unavailable')}},download),'downloaded')
assert.equal(downloaded,3)
assert.equal(shared,1)
console.log('PR Oracle: 36 story/theme variants, canvas sizing, safe text, sharing and fallback assertions passed (mock canvas and share API)')
