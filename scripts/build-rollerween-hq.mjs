import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('scripts/rollerween_hq300')
const files = fs.readdirSync(dir).filter(f => /^part\d+\.txt$/.test(f)).sort()
if (files.length !== 7) throw new Error(`RollerWeen HQ: expected 7 chunks, found ${files.length}`)
const b64 = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('')
const buf = Buffer.from(b64, 'base64')
if (buf.length !== 58002) throw new Error(`RollerWeen HQ: invalid byte length ${buf.length}`)
if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('RollerWeen HQ: invalid WEBP payload')
const out = path.resolve('public/rollerween-2026-hq.webp')
fs.writeFileSync(out, buf)
console.log(`Built ${out} (${buf.length} bytes) from ${files.length} chunks`)
