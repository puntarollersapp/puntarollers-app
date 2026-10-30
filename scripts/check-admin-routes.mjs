import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const hub = readFileSync(new URL('../src/components/admin/PRControlHub.jsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const areaBlock = hub.match(/const AREAS=\[([\s\S]*?)\];const GROUPS=/)?.[1]
assert.ok(areaBlock, 'Cannot find Command Center area catalog')
const paths = [...areaBlock.matchAll(/\bp:'(\/admin[^']*)'/g)].map(match => match[1])
assert.ok(paths.length >= 20, 'Command Center catalog unexpectedly small')
const routePaths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(match => match[1]))
const missing = paths.filter(path => !routePaths.has(path.split('?')[0]))
assert.deepEqual(missing, [], 'Command Center contains links without registered routes')
const restrictedBlock = hub.match(/const ADMIN_ONLY_PATHS=new Set\(\[([\s\S]*?)\]\)/)?.[1]
assert.ok(restrictedBlock, 'Cannot find full-admin-only tool catalog')
const restricted = new Set([...restrictedBlock.matchAll(/'(\/admin[^']*)'/g)].map(match => match[1]))
const adminRoutePaths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<FullAdminRoute>/g)].map(match => match[1]))
const unrestricted = paths.filter(path => adminRoutePaths.has(path.split('?')[0]) && !restricted.has(path))
assert.deepEqual(unrestricted, [], 'Full-admin routes exposed to professor in tool catalog')
console.log(`Admin route contract OK: ${paths.length} links, ${adminRoutePaths.size} full-admin routes`)
