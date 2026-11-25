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
 assert.equal(stories.filter(s=>s.id.startsWith('humor-')).length,3)
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
