import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const hub = readFileSync(new URL('../src/components/admin/PRControlHub.jsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const areaBlock = hub.match(/const AREAS=\[([\s\S]*?)\]\s*const GROUPS=/)?.[1]
assert.ok(areaBlock, 'Cannot find Command Center area catalog')
const paths = [...areaBlock.matchAll(/\bp:'(\/admin[^']*)'/g)].map(match => match[1])
assert.ok(paths.length >= 20, 'Command Center catalog unexpectedly small')
assert.equal(new Set(paths).size, paths.length, 'Duplicate tool destinations in Command Center')
const areaKeys = [...areaBlock.matchAll(/\\bk:'([^']+)'/g)].map(match => match[1])
assert.equal(areaKeys.length, paths.length, 'Every tool must have a catalog category')
assert.match(hub, /\\.order\\('fecha'\\)\\.order\\('hora_inicio'\\)/, 'Agenda must order by the real availability time column')
assert.doesNotMatch(hub, /\\.order\\('fecha'\\)\\.order\\('hora'\\)/, 'Invalid legacy time column detected')
assert.match(hub, /pr_inscripciones_2026'\\)\\.select\\('id',\\{count:'exact',head:true\\}\\)/, 'Registration pending count must use exact count')
const routePaths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(match => match[1]))
const missing = paths.filter(path => !routePaths.has(path.split('?')[0]))
assert.deepEqual(missing, [], 'Command Center contains links without registered routes')
const restrictedBlock = hub.match(/const ADMIN_ONLY_PATHS=new Set\(\[([\s\S]*?)\]\)/)?.[1]
assert.ok(restrictedBlock, 'Cannot find full-admin-only tool catalog')
const restricted = new Set([...restrictedBlock.matchAll(/'(\/admin[^']*)'/g)].map(match => match[1]))
const adminRoutePaths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<FullAdminRoute>/g)].map(match => match[1]))
const unrestricted = paths.filter(path => adminRoutePaths.has(path.split('?')[0]) && !restricted.has(path))
assert.deepEqual(unrestricted, [], 'Full-admin routes exposed to professor in tool catalog')
const groupBlock = hub.match(/const GROUPS=\[([\s\S]*?)\]\s*const normalizeSearch=/)?.[1]
assert.ok(groupBlock, 'Cannot find Command Center navigation groups')
const groupKeys = new Set([...groupBlock.matchAll(/keys:\[([^\]]+)\]/g)].flatMap(match => [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1])))
const orphanedAreas = areaKeys.filter(key => !groupKeys.has(key))
assert.deepEqual(orphanedAreas, [], 'Tools exist in catalog but are missing from grouped navigation')
console.log(`Admin route contract OK: ${paths.length} links, ${adminRoutePaths.size} full-admin routes`)
