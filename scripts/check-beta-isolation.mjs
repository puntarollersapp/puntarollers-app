// Ejecutar con: node scripts/check-beta-isolation.mjs
// Falla cerrado: NO desplegar una copia original contra Supabase compartido.
const env = process.env;
const fail = (message) => { console.error('BETA BLOQUEADA: ' + message); process.exitCode = 1; };
const url = String(env.VITE_SUPABASE_URL || '').trim();
const key = String(env.VITE_SUPABASE_ANON_KEY || '').trim();
const allow = String(env.PR_NEXT_ISOLATED_BETA || '').trim();
const expected = String(env.PR_NEXT_BETA_SUPABASE_REF || '').trim();
const production = String(env.PR_NEXT_PRODUCTION_SUPABASE_REF || '').trim();
if (allow !== 'I_HAVE_VERIFIED_ISOLATION') fail('Falta autorización explícita de aislamiento PR_NEXT_ISOLATED_BETA.');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) fail('URL de Supabase ausente o inválida.');
if (!key) fail('Falta la clave pública de la instancia aislada.');
const actual = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i)?.[1] || '';
if (!expected || expected !== actual) fail('La URL no coincide con PR_NEXT_BETA_SUPABASE_REF.');
if (!production) fail('Falta PR_NEXT_PRODUCTION_SUPABASE_REF para comprobar separación.');
if (actual && actual === production) fail('La beta apunta a la misma instancia que producción.');
if (!process.exitCode) console.log('Chequeo local de configuración: instancia beta distinta de producción. Todavía requiere auditoría RLS, Storage, Auth, webhooks y pruebas manuales.');
