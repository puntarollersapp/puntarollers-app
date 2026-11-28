import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PUBLISHED_ART, FIRST_BATCH, SECOND_BATCH, frontFor, officialBack } from '../src/lib/prCollectiblesArt.js'
import { PR_COLLECTIBLES_CATALOG } from '../src/lib/prCollectiblesCatalog.js'
assert.equal(FIRST_BATCH.length,10)
assert.equal(SECOND_BATCH.length,10)
assert.equal(PUBLISHED_ART.length,20)
assert.equal(new Set(PUBLISHED_ART).size,20)
assert.equal(PR_COLLECTIBLES_CATALOG.length,50)
const hashes=new Set()
for (const code of [...PUBLISHED_ART,'PR-BACK']) {
 const card=code==='PR-BACK'?officialBack:frontFor(code)
 assert(card,code)
 const file=readFileSync(new URL('../public'+card.split('?')[0],import.meta.url))
 assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a',code+' PNG')
 assert.equal(file.toString('ascii',12,16),'IHDR',code+' IHDR')
 const w=file.readUInt32BE(16),h=file.readUInt32BE(20)
 assert(w>=500&&h>=700&&Math.abs(w/h-5/7)<.025,code+' aspect ratio '+w+'x'+h)
 const hash=createHash('sha256').update(file).digest('hex')
 assert(!hashes.has(hash),code+' duplicate image')
 hashes.add(hash)
 if(code!=='PR-BACK')assert(PR_COLLECTIBLES_CATALOG.some(c=>c.code===code),code)
 console.log(code+' '+w+'x'+h)
}
console.log('PR Collectibles: 20 distinct PNG fronts and universal back verified')
