// Dedicated Beta provisioning. Not deployed until treasury/server isolation is audited.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})
const url = Deno.env.get('SUPABASE_URL')!
const anon = Deno.env.get('SUPABASE_ANON_KEY')!
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(url, service, { auth: { persistSession: false } })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'No autorizado' }, 401)
  const callerClient = createClient(url, anon, {
    global: { headers: { Authorization: 'Bearer ' + token } },
    auth: { persistSession: false },
  })
  const { data: session, error: sessionError } = await callerClient.auth.getUser(token)
  if (sessionError || !session.user) return json({ error: 'Sesión inválida' }, 401)
  const { data: caller } = await admin.from('profiles').select('role').eq('auth_user_id', session.user.id).maybeSingle()
  if (caller?.role !== 'admin') return json({ error: 'Solo administradores' }, 403)

  let payload: Record<string, unknown>
  try { payload = await req.json() } catch { return json({ error: 'Solicitud inválida' }, 400) }
  if (payload.action !== 'create') return json({ error: 'Acción no permitida' }, 400)
  const nombre = String(payload.nombre || '').trim().slice(0, 100)
  const apellido = String(payload.apellido || '').trim().slice(0, 100)
  const documento = String(payload.documento || '').replace(/\D/g, '')
  const password = String(payload.password || '')
  if (!nombre || !/^\d{6,12}$/.test(documento) || password.length < 12 || password.length > 128) {
    return json({ error: 'Nombre, documento válido y contraseña de 12 caracteres como mínimo requeridos' }, 400)
  }
  const { data: duplicate, error: lookupError } = await admin.from('profiles').select('id').eq('documento', documento).maybeSingle()
  if (lookupError) return json({ error: 'No se pudo validar el documento' }, 500)
  if (duplicate) return json({ error: 'Documento ya registrado' }, 409)

  // Dedicated Beta login exists. Keep server provisioning disabled until the
  // treasury SQL and authorization policies are independently verified.
  // No writes to auth.users, profiles or pr_beta_access are permitted here.
  return json({ error: 'Alta Beta no habilitada: pendiente auditoría de Tesorería y permisos del servidor' }, 503)
})
