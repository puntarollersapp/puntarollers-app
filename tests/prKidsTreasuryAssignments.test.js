import test from 'node:test'
import assert from 'node:assert/strict'
import {suggestUniqueTreasuryProfile,validateKidsTreasuryAssignments} from '../src/lib/prKidsTreasuryMatching.js'
test('suggests reuse only for a unique exact normalized name',()=>{
 assert.equal(suggestUniqueTreasuryProfile('Lucía Pérez',[{nombre:'Lucia Perez',profile_id:'one'},{nombre:'Lucia Pereyra',profile_id:'two'}]),'one')
 assert.equal(suggestUniqueTreasuryProfile('Lucía Pérez',[{nombre:'Lucia Perez',profile_id:'one'},{nombre:'Lucia Perez',profile_id:'two'}]),null)
 assert.equal(suggestUniqueTreasuryProfile('Lucía Pérez',[{nombre:'Lucia Pereyra',profile_id:'two'}]),null)
})
test('blocks assigning one treasury profile to two children',()=>{
 const children=[{matches:[{profile_id:'one'}]},{matches:[{profile_id:'one'}]}]
 assert.equal(validateKidsTreasuryAssignments(children,{0:'one',1:'one'}).valid,false)
 assert.equal(validateKidsTreasuryAssignments(children,{0:'one'}).valid,false)
 assert.equal(validateKidsTreasuryAssignments([{matches:[{profile_id:'one'}]}],{0:'one'}).valid,true)
})
