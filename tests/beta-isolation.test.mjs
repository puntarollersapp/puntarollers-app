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

test('beta creation remains disabled until release', () => {
  const panel = read('src/components/admin/BetaUsersPanel.jsx')
  const server = read('supabase/functions/pr-beta-admin/index.ts')
  assert.match(panel, /const provisioningReady = false/)
  assert.match(panel, /disabled=\{submitting \|\| !provisioningReady\}/)
  assert.match(server, /Alta Beta no habilitada/)
})
