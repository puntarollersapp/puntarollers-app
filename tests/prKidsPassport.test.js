import test from 'node:test'
import assert from 'node:assert/strict'
import {calculatePassportBalance,normalizeRewardCatalog} from '../src/lib/prKidsPassport.js'

test('duplicate scanner events count once',()=>{
 const events=[{attendance_source:'scanner',source_event_id:'a'},{attendance_source:'scanner',source_event_id:'a'},{attendance_source:'scanner',source_event_id:'b'}]
 assert.deepEqual(calculatePassportBalance({attendance:events}),{earned:2,used:0,available:2,inconsistent:false})
})
test('voided check-ins are excluded and redemption cannot create negative balance',()=>{
 const result=calculatePassportBalance({attendance:[{source_event_id:'a'},{source_event_id:'b',voided_at:'2026-10-09'}],redemptions:[{counts_as_spent:true,stamps_used:3}]})
 assert.deepEqual(result,{earned:1,used:3,available:0,inconsistent:true})
})
test('existing reward schema normalizes without inventing thresholds',()=>{
 const catalog=normalizeRewardCatalog([{id:'a',nombre:'Premio A',sellos:5,activo:true,stock_total:10,stock_reservado:2,stock_entregado:3},{id:'b',nombre:'Inactivo',sellos:1,activo:false}])
 assert.equal(catalog.length,1)
 assert.equal(catalog[0].requiredStamps,5)
 assert.equal(catalog[0].stockAvailable,5)
})
