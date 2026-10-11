// Dedicated Beta provisioning. Deployed with a server-side release gate; creation remains disabled by default.
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
  // Never mutate a pre-existing student or staff identity.
  // The flag is server-only and defaults to disabled.
  if (Deno.env.get('PR_BETA_PROVISIONING_ENABLED') !== 'true') {
    return json({ error: 'Alta Beta deshabilitada por configuración del servidor' }, 503)
  }
  const { data: duplicate, error: lookupError } = await admin.from('profiles').select('id').eq('documento', documento).maybeSingle()
  if (lookupError) return json({ error: 'No se pudo validar el documento' }, 500)
  if (duplicate) return json({ error: 'Documento ya registrado' }, 409)

  const email = `beta-${documento}@usuarios.puntarollers.app`
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { purpose: 'puntarollers-beta' },
  })
  if (createError || !created.user) return json({ error: 'No se pudo crear la identidad Beta' }, 409)
  const authId = created.user.id
  const profileId = `beta-${authId}`
  try {
    const { error: profileError } = await admin.from('profiles').insert({
      id: profileId, auth_user_id: authId, documento, nombre, apellido, email,
      role: 'beta', pin: null, participa_como_alumno: false,
      es_profesor: false, es_tesoreria: false, exento_mensualidad: true,
      acceso_habilitado: false, prcard_activa: false, tracking_activo: false,
    })
    if (profileError) throw profileError
    const { error: accessError } = await admin.from('pr_beta_access').insert({
      profile_id: profileId, enabled: true, features: {},
    })
    if (accessError) throw accessError
    return json({ success: true, profile_id: profileId }, 201)
  } catch (_error) {
    // Compensation: remove partial profile/access before removing Auth identity.
    await admin.from('pr_beta_access').delete().eq('profile_id', profileId)
    await admin.from('profiles').delete().eq('id', profileId).eq('role', 'beta')
    await admin.auth.admin.deleteUser(authId)
    return json({ error: 'No se pudo completar el alta Beta; se intentó revertir la operación' }, 500)
  }
})
