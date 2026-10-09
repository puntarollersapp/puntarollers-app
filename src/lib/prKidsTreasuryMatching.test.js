import {describe,it} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeKidsTreasuryName,rankKidsTreasuryCandidates} from './prKidsTreasuryMatching.js'
describe('PR Kids treasury matching is advisory',()=>{
 it('strips PR Kid prefix',()=>assert.equal(normalizeKidsTreasuryName('PR Kid Sofía López'),'sofia lopez'))
 it('strips Kid prefix',()=>assert.equal(normalizeKidsTreasuryName('Kid Juan Pérez'),'juan perez'))
 it('normalizes accent and spacing',()=>assert.equal(normalizeKidsTreasuryName('  SOFÍA   López '),'sofia lopez'))
 it('ranks exact normalized name first',()=>{
  const results=rankKidsTreasuryCandidates('Sofía López',[{id:'1',nombre:'Kid Sofía López'},{id:'2',nombre:'Sofía García'}])
  assert.equal(results[0].id,'1');assert.equal(results[0].score,100)
 })
 it('does not match on surname alone',()=>assert.deepEqual(rankKidsTreasuryCandidates('Sofía López',[{id:'1',nombre:'Juan López'}]),[]))
 it('does not match one-word child name',()=>assert.deepEqual(rankKidsTreasuryCandidates('Sofía',[{id:'1',nombre:'Sofía López'}]),[]))
 it('returns no approval decision',()=>assert.equal('approved' in (rankKidsTreasuryCandidates('Sofía López',[{id:'1',nombre:'Sofía López'}])[0]),false))
})
