import test from 'node:test'
import assert from 'node:assert/strict'
import {guardianFlow} from '../src/lib/prKidsGuardianOnboarding.js'
test('adult student reuses account',()=>assert.equal(guardianFlow({hasAdultAccount:true}),'request-child-link'))
test('new guardian requests adult access',()=>assert.equal(guardianFlow(),'request-adult-access'))
test('approved family goes to home',()=>assert.equal(guardianFlow({hasAdultAccount:true,hasApprovedChildren:true}),'family-home'))
