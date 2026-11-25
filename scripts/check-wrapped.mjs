import assert from 'node:assert/strict'
import { buildSlides, plaqueStats, personality } from '../src/lib/wrapped.js'
const empty={name:'Demo',year:2026}
assert.deepEqual(buildSlides(empty).map(s=>s.id),['intro','tag','outro'])
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
console.log('PR Wrapped: 11 assertions passed')
