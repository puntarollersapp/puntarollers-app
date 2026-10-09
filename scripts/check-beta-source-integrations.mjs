// PR NEXT: preflight estático para evitar que la beta use referencias directas a producción.
// No sustituye pruebas de integración, permisos, Edge Functions o RLS.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
const root = new URL('../src/', import.meta.url).pathname
const productionRef = 'ycgxnzeaihuwlwfwalom'
const files = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(js|jsx|ts|tsx)$/.test(name)) files.push(full)
  }
}
walk(root)
const violations = []
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const rel = relative(root, file)
  if (source.includes(productionRef)) violations.push(`${rel}: referencia directa al proyecto productivo`)
  if (/https?:\/\/[^\s'"`]*\.supabase\.co\/functions\/v1/i.test(source)) violations.push(`${rel}: Edge Function con host Supabase fijo`)
}
if (violations.length) {
  console.error('PR NEXT: preflight de aislamiento FALLÓ:\n' + violations.join('\n'))
  process.exitCode = 1
} else console.log(`PR NEXT: ${files.length} archivos fuente inspeccionados, sin referencias directas detectadas a producción.`)
