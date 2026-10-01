import fs from 'node:fs'
import path from 'node:path'

function build(dirName, outName, expectedFiles, expectedBytes) {
  const dir = path.resolve('scripts', dirName)
  const files = fs.readdirSync(dir).filter(f => /^p\d+\.txt$/.test(f)).sort()
  if (files.length !== expectedFiles) throw new Error(`${outName}: expected ${expectedFiles} chunks, found ${files.length}`)
  const b64 = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('')
  const buf = Buffer.from(b64, 'base64')
  if (buf.length !== expectedBytes) throw new Error(`${outName}: invalid byte length ${buf.length}`)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${outName}: invalid WEBP payload`)
  const out = path.resolve('public', outName)
  fs.writeFileSync(out, buf)
  console.log(`Built ${out} (${buf.length} bytes)`)
}

build('rollerween_exact_webp', 'rollerween-2026-exact.webp', 5, 74804)
build('rollerween_exact_badge', 'rollerween-badge-exact.webp', 1, 13334)
