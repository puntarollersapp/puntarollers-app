import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const ADMIN_EMAIL = 'claudiofaccelli@gmail.com'
const FROM_EMAIL = 'Punta Rollers <onboarding@resend.dev>'
const DEMO_PROFILE_ID = 'pr_personal_demo_v1'
const DEMO_MARKER = '[DEMO PR PERSONAL]'
const DEMO_PREVIEW_HOST = 'puntarollers-app-git-feature-p-6b1f8f-puntarollersapps-projects.vercel.app'
const MIN_NOTICE_MINUTES = 120

const normalizePhone = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors })
const okError = (message: string) => json({ error: message }, 200)
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
const dateUY = (value: string) => new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
const timeUY = (value: string) => String(value || '').slice(0, 5)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function demoAllowed(req: Request, body: any) {
  if (body?.demo !== true) return false
  try { return new URL(req.headers.get('origin') || '').hostname === DEMO_PREVIEW_HOST } catch { return false }
}

function isoDateUTC(date: Date) { return date.toISOString().slice(0, 10) }
function uyToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
function slotStartMs(slot: any) {
  if (!slot?.fecha || !slot?.hora_inicio) return 0
  const value = new Date(`${slot.fecha}T${timeUY(slot.hora_inicio)}:00-03:00`).getTime()
  return Number.isFinite(value) ? value : 0
}
function hasEnoughNotice(slot: any) {
  return slotStartMs(slot) >= Date.now() + MIN_NOTICE_MINUTES * 60 * 1000
}

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey || !to) return false
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }) })
    return response.ok
  } catch { return false }
}

async function findProfile(db: any, phoneValue: unknown) {
  const phone = normalizePhone(phoneValue)
  if (phone.length < 8) return { phone, profile: null }
  const { data: profiles, error } = await db.from('profiles').select('id,nombre,apellido,email,telefono,particulares_habilitadas').not('telefono', 'is', null)
  if (error) throw error
  return { phone, profile: (profiles || []).find((p: any) => normalizePhone(p.telefono) === phone) || null }
}

async function readConfig(db: any) {
  let lastError: any = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await db.from('pr_personal_config').select('reservas_habilitadas,mensaje_cerrado,titulo_publico,subtitulo_publico').eq('id', 1).single()
    if (!error && data) return data
    lastError = error
    await sleep(120 * (attempt + 1))
  }
  throw lastError || new Error('No se pudo cargar la configuración')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return okError('Método no permitido')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
  const serviceRoleKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const demo = demoAllowed(req, body)
    const storedConfig = await readConfig(db)
    const config = { ...storedConfig, reservas_habilitadas: demo || storedConfig.reservas_habilitadas, demo, anticipacion_minima_minutos: MIN_NOTICE_MINUTES }

    if (action === 'config') return json({ config })

    if (action === 'availability') {
      if (!config.reservas_habilitadas) return json({ config, slots: [] })
      const today = uyToday()
      const { data: slotRows, error } = await db.from('pr_personal_disponibilidad').select('id,fecha,hora_inicio,hora_fin,nota_interna').eq('habilitado', true).gte('fecha', today).order('fecha', { ascending: true }).order('hora_inicio', { ascending: true })
      if (error) throw error
      const slots = (slotRows || []).filter((s: any) => (demo ? s.nota_interna === DEMO_MARKER : s.nota_interna !== DEMO_MARKER) && hasEnoughNotice(s))
      const ids = slots.map((s: any) => s.id)
      let occupied = new Set<number>()
      if (ids.length) {
        const { data: reservations, error: rError } = await db.from('pr_personal_reservas').select('disponibilidad_id').in('disponibilidad_id', ids).in('estado', ['reservada', 'realizada', 'ausente'])
        if (rError) throw rError
        occupied = new Set((reservations || []).map((r: any) => Number(r.disponibilidad_id)))
      }
      return json({ config, slots: slots.map(({ nota_interna: _note, ...s }: any) => ({ ...s, ocupado: occupied.has(Number(s.id)), estado_publico: occupied.has(Number(s.id)) ? 'reservado' : 'disponible' })) })
    }

    if (action === 'identify') {
      const { phone, profile } = await findProfile(db, body?.phone)
      if (phone.length < 8) return okError('Ingresá un número de teléfono válido.')
      const correctScope = demo ? profile?.id === DEMO_PROFILE_ID : profile?.id !== DEMO_PROFILE_ID
      if (!profile || !correctScope || !profile.particulares_habilitadas) return json({ found: false, config })
      const { data: pass, error: passError } = await db.from('cuponeras_particulares').select('id,nombre_cuponera,clases_cargadas,clases_utilizadas,clases_disponibles,estado,fecha_inicio,fecha_vencimiento').eq('alumno_id', profile.id).eq('habilitada', true).eq('visible_al_alumno', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (passError) throw passError
      const { data: upcoming, error: upcomingError } = await db.from('pr_personal_reservas').select('id,estado,disponibilidad_id,fecha_reserva').eq('alumno_id', profile.id).eq('estado', 'reservada').order('fecha_reserva', { ascending: false })
      if (upcomingError) throw upcomingError
      const slotIds = (upcoming || []).map((r: any) => r.disponibilidad_id)
      let slotMap: Record<string, any> = {}
      if (slotIds.length) {
        const { data: slotRows, error: slotError } = await db.from('pr_personal_disponibilidad').select('id,fecha,hora_inicio,hora_fin').in('id', slotIds)
        if (slotError) throw slotError
        slotMap = Object.fromEntries((slotRows || []).map((s: any) => [String(s.id), s]))
      }
      const today = uyToday()
      const upcomingDetailed = (upcoming || []).map((r: any) => ({ ...r, slot: slotMap[String(r.disponibilidad_id)] || null })).filter((r: any) => r.slot && r.slot.fecha >= today).sort((a: any, b: any) => `${a.slot.fecha} ${a.slot.hora_inicio}`.localeCompare(`${b.slot.fecha} ${b.slot.hora_inicio}`))
      return json({ found: true, config, student: { id: profile.id, nombre: profile.nombre, apellido: profile.apellido }, pass: pass || null, upcoming: upcomingDetailed, reservedCredits: upcomingDetailed.length, bookableCredits: Math.max(0, Number(pass?.clases_disponibles || 0) - upcomingDetailed.length) })
    }

    if (action === 'reserve') {
      if (!config.reservas_habilitadas) return okError(config.mensaje_cerrado)
      const slotId = Number(body?.slotId)
      const { phone, profile } = await findProfile(db, body?.phone)
      if (phone.length < 8 || !Number.isFinite(slotId)) return okError('Datos de reserva inválidos.')
      const correctScope = demo ? profile?.id === DEMO_PROFILE_ID : profile?.id !== DEMO_PROFILE_ID
      if (!profile || !correctScope || !profile.particulares_habilitadas) return okError('No encontramos una cuponera activa asociada a este número.')
      const { data: pass, error: passError } = await db.from('cuponeras_particulares').select('id,clases_cargadas,clases_utilizadas,clases_disponibles,estado,nombre_cuponera').eq('alumno_id', profile.id).eq('habilitada', true).gt('clases_disponibles', 0).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (passError) throw passError
      if (!pass) return okError('Tu cuponera no tiene clases disponibles.')
      const today = uyToday()
      const { data: slot, error: slotError } = await db.from('pr_personal_disponibilidad').select('id,fecha,hora_inicio,hora_fin,habilitado,nota_interna').eq('id', slotId).eq('habilitado', true).gte('fecha', today).single()
      const correctSlotScope = demo ? slot?.nota_interna === DEMO_MARKER : slot?.nota_interna !== DEMO_MARKER
      if (slotError || !slot || !correctSlotScope) return okError('Ese turno ya no está disponible.')
      if (!hasEnoughNotice(slot)) return okError('Ese turno ya cerró. Las reservas deben hacerse con al menos 2 horas de anticipación.')
      const { data: activeReservations, error: activeError } = await db.from('pr_personal_reservas').select('disponibilidad_id').eq('alumno_id', profile.id).eq('estado', 'reservada')
      if (activeError) throw activeError
      let activeFutureCount = 0
      if ((activeReservations || []).length) {
        const activeIds = (activeReservations || []).map((r: any) => r.disponibilidad_id)
        const { data: activeSlots, error: activeSlotsError } = await db.from('pr_personal_disponibilidad').select('id,fecha').in('id', activeIds)
        if (activeSlotsError) throw activeSlotsError
        activeFutureCount = (activeSlots || []).filter((s: any) => s.fecha >= today).length
      }
      if (activeFutureCount >= Number(pass.clases_disponibles || 0)) return okError('Ya tenés reservadas todas las clases disponibles de tu PR Pass. Si necesitás cambiar un turno, contactanos.')
      const { data: reservation, error: reserveError } = await db.from('pr_personal_reservas').insert({ disponibilidad_id: slot.id, alumno_id: profile.id, cuponera_id: pass.id, estado: 'reservada', nota_interna: demo ? DEMO_MARKER : null }).select('id,estado,fecha_reserva').single()
      if (reserveError) {
        if (reserveError.code === '23505') return okError('Ese turno acaba de ser reservado por otra persona. Elegí otro horario.')
        throw reserveError
      }
      const fullName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim()
      const when = `${dateUY(slot.fecha)} · ${timeUY(slot.hora_inicio)}–${timeUY(slot.hora_fin)}`
      const prefix = demo ? '[DEMO] ' : ''
      const adminHtml = `<div><strong>Alumno:</strong> ${esc(fullName)}<br/><strong>Turno:</strong> ${esc(when)}</div>`
      const studentHtml = `<div><strong>${esc(when)}</strong><p>Tu clase quedó reservada.</p></div>`
      const [adminSent, studentSent] = await Promise.all([sendEmail(ADMIN_EMAIL, `${prefix}🛼 PR Personal — ${fullName} reservó ${timeUY(slot.hora_inicio)}`, adminHtml), profile.email ? sendEmail(profile.email, `${prefix}Tu clase PR Personal está reservada 🛼`, studentHtml) : Promise.resolve(false)])
      await db.from('pr_personal_reservas').update({ email_admin_enviado: adminSent, email_confirmacion_enviado: studentSent, updated_at: new Date().toISOString() }).eq('id', reservation.id)
      return json({ ok: true, reservation, slot: { id: slot.id, fecha: slot.fecha, hora_inicio: slot.hora_inicio, hora_fin: slot.hora_fin }, student: { nombre: profile.nombre, apellido: profile.apellido }, pass, email: { admin: adminSent, alumno: studentSent, alumno_tiene_email: Boolean(profile.email) } })
    }

    return okError('Acción no válida.')
  } catch (error) {
    console.error(error)
    return okError('No pudimos completar la operación. Probá nuevamente en unos segundos.')
  }
})
