import test from 'node:test'
import assert from 'node:assert/strict'
import {kidsNavigationState} from '../src/lib/prKidsNavigationState.js'
test('hide family navigation without authenticated approved access',()=>{
 assert.deepEqual(kidsNavigationState(),{showKids:false,showRequest:false})
 assert.deepEqual(kidsNavigationState({authenticated:true,loading:false,approvedChildren:[]}),{showKids:false,showRequest:true})
 assert.deepEqual(kidsNavigationState({authenticated:true,loading:true,approvedChildren:[{id:'child'}]}),{showKids:false,showRequest:false})
})
test('show PR Kids navigation only when approved children are returned',()=>{
 assert.deepEqual(kidsNavigationState({authenticated:true,loading:false,approvedChildren:[{id:'child'}]}),{showKids:true,showRequest:false})
})
