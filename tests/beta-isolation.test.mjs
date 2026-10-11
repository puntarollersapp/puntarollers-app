import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

test('beta users are blocked from private student routes', () => {
  const app = read('src/App.jsx')
  assert.match(app, /function PrivateRoute[\s\S]*?user\.role==='beta'[\s\S]*?<Navigate to="\/beta"/)
  assert.match(app, /function AdminRoute[\s\S]*?user\.role==='beta'[\s\S]*?<Navigate to="\/beta"/)
  assert.match(app, /function FullAdminRoute[\s\S]*?user\.role==='beta'[\s\S]*?<Navigate to="\/beta"/)
})

test('beta authentication has independent route and credentials', () => {
  const app = read('src/App.jsx')
  const auth = read('src/lib/auth.jsx')
  assert.match(app, /path="\/beta\/login"/)
  assert.match(app, /path="\/beta"/)
  assert.match(auth, /beta-\$\{cleanDoc\}@usuarios\.puntarollers\.app/)
  assert.match(auth, /profile\?\.role!=='beta'/)
  assert.match(auth, /!access\?\.enabled/)
})

test('beta role cannot inherit student or treasury flags', () => {
  const auth = read('src/lib/auth.jsx')
  assert.match(auth, /participaComoAlumno=role!=='beta'/)
  assert.match(auth, /esTesoreria:role!=='beta'/)
  assert.match(auth, /const betaUser=isBetaRole\(user\)/)
})

test('beta cached session is not trusted before server check', () => {
  const auth = read('src/lib/auth.jsx')
  assert.match(auth, /cached&&cached\.role!=='beta'&&active/)
  assert.match(auth, /if\(profileData\.role==='beta'\)/)
})

test('beta creation is gated by server release authorization', () => {
  const panel = read('src/components/admin/BetaUsersPanel.jsx')
  const server = read('supabase/functions/pr-beta-admin/index.ts')
  assert.match(panel, /const provisioningReady = true/)
  assert.match(panel, /disabled=\{submitting \|\| !provisioningReady\}/)
  assert.match(server, /PR_BETA_PROVISIONING_ENABLED/)
})

test('beta profiles are excluded from student and payment screens', () => {
  const students = read('src/pages/AdminAlumnos.jsx')
  const payments = read('src/components/admin/PaymentsPanel.jsx')
  assert.match(students, /p\?\.role!=='beta'/)
  assert.match(payments, /profile\.role !== 'beta'/)
})

test('treasury applies a defensive beta exclusion while RPC is audited', () => {
  const treasury = read('src/components/treasury/TreasuryPanel.jsx')
  assert.match(treasury, /item\?\.role !== 'beta'/)
  assert.match(treasury, /obtener_panel_pagos/)
})

test('beta home clears previous authorization when account changes', () => {
  const home = read('src/pages/BetaHome.jsx')
  assert.match(home, /setAccess\(null\)/)
  assert.match(home, /catch\(\(\) => \{ if \(live\) setAccess\(\{ profileId: user\.id, result: \{ enabled: false \} \}\)/)
})

test('beta provisioning creates separate auth and profile records with rollback', () => {
  const server = read('supabase/functions/pr-beta-admin/index.ts')
  assert.match(server, /auth\.admin\.createUser/)
  assert.match(server, /role: 'beta'/)
  assert.match(server, /participa_como_alumno: false/)
  assert.match(server, /es_tesoreria: false/)
  assert.match(server, /auth\.admin\.deleteUser/)
})

test('beta home never displays authorization from a different profile', () => {
  const home = read('src/pages/BetaHome.jsx')
  assert.match(home, /profileId: user\.id/)
  assert.match(home, /access\?\.profileId === user\?\.id/)
  assert.match(home, /currentAccess\.enabled/)
})

test('server release gate precedes duplicate document lookup and auth creation', () => {
  const server = read('supabase/functions/pr-beta-admin/index.ts')
  const gate = server.indexOf("Deno.env.get('PR_BETA_PROVISIONING_ENABLED')")
  const lookup = server.indexOf("from('profiles').select('id').eq('documento'")
  const create = server.indexOf('auth.admin.createUser')
  assert.ok(gate > 0 && lookup > gate && create > lookup)
})

test('beta service requires caller admin and an authenticated identity', () => {
  const server = read('supabase/functions/pr-beta-admin/index.ts')
  assert.match(server, /callerClient\.auth\.getUser\(token\)/)
  assert.match(server, /caller\?\.role !== 'admin'/)
  assert.match(server, /password\.length < 12/)
})
