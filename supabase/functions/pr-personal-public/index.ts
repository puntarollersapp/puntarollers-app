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

const normalizePhone = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors })
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
const dateUY = (value: string) => new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
const timeUY = (value: string) => String(value || '').slice(0, 5)

function demoAllowed(req: Request, body: any) {
  if (body?.demo !== true) return false
  try {
    return new URL(req.headers.get('origin') || '').hostname === DEMO_PREVIEW_HOST
  } catch {
    return false
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey || !to) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    if (!response.ok) {
      console.error('Resend error', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('Email error', error)
    return false
  }
}

async function findProfile(db: any, phoneValue: unknown) {
  const phone = normalizePhone(phoneValue)
  if (phone.length < 8) return { phone, profile: null }
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id,nombre,apellido,email,telefono,particulares_habilitadas')
    .not('telefono', 'is', null)
  if (error) throw error
  const profile = (profiles || []).find((p: any) => normalizePhone(p.telefono) === phone) || null
  return { phone, profile }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
  const serviceRoleKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const demo = demoAllowed(req, body)

    const { data: storedConfig, error: configError } = await db
      .from('pr_personal_config')
      .select('reservas_habilitadas,mensaje_cerrado,titulo_publico,subtitulo_publico')
      .eq('id', 1)
      .single()
    if (configError) throw configError

    const config = { ...storedConfig, reservas_habilitadas: demo || storedConfig.reservas_habilitadas, demo }
    if (action === 'config') return json({ config })

    if (action === 'availability') {
      if (!config.reservas_habilitadas) return json({ config, slots: [] })
      const today = new Date().toISOString().slice(0, 10)
      const { data: slotRows, error } = await db
        .from('pr_personal_disponibilidad')
        .select('id,fecha,hora_inicio,hora_fin,nota_interna')
        .eq('habilitado', true)
        .gte('fecha', today)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
      if (error) throw error

      const slots = (slotRows || []).filter((s: any) => demo ? s.nota_interna === DEMO_MARKER : s.nota_interna !== DEMO_MARKER)
      const ids = slots.map((s: any) => s.id)
      let occupied = new Set<number>()
      if (ids.length) {
        const { data: reservations, error: rError } = await db
          .from('pr_personal_reservas')
          .select('disponibilidad_id')
          .in('disponibilidad_id', ids)
          .in('estado', ['reservada', 'realizada', 'ausente'])
        if (rError) throw rError
        occupied = new Set((reservations || []).map((r: any) => Number(r.disponibilidad_id)))
      }
      return json({ config, slots: slots.filter((s: any) => !occupied.has(Number(s.id))).map(({ nota_interna: _note, ...s }: any) => s) })
    }

    if (action === 'identify') {
      const { phone, profile } = await findProfile(db, body?.phone)
      if (phone.length < 8) return json({ error: 'Ingresá un número de teléfono válido.' }, 400)
      const correctScope = demo ? profile?.id === DEMO_PROFILE_ID : profile?.id !== DEMO_PROFILE_ID
      if (!profile || !correctScope || !profile.particulares_habilitadas) return json({ found: false, config })

      const { data: pass, error: passError } = await db
        .from('cuponeras_particulares')
        .select('id,nombre_cuponera,clases_cargadas,clases_utilizadas,clases_disponibles,estado,fecha_inicio,fecha_vencimiento')
        .eq('alumno_id', profile.id)
        .eq('habilitada', true)
        .eq('visible_al_alumno', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (passError) throw passError

      const { data: upcoming, error: upcomingError } = await db
        .from('pr_personal_reservas')
        .select('id,estado,disponibilidad_id,fecha_reserva')
        .eq('alumno_id', profile.id)
        .eq('estado', 'reservada')
        .order('fecha_reserva', { ascending: false })
      if (upcomingError) throw upcomingError

      const slotIds = (upcoming || []).map((r: any) => r.disponibilidad_id)
      let slotMap: Record<string, any> = {}
      if (slotIds.length) {
        const { data: slotRows, error: slotError } = await db
          .from('pr_personal_disponibilidad')
          .select('id,fecha,hora_inicio,hora_fin')
          .in('id', slotIds)
        if (slotError) throw slotError
        slotMap = Object.fromEntries((slotRows || []).map((s: any) => [String(s.id), s]))
      }

      const today = new Date().toISOString().slice(0, 10)
      const upcomingDetailed = (upcoming || [])
        .map((r: any) => ({ ...r, slot: slotMap[String(r.disponibilidad_id)] || null }))
        .filter((r: any) => r.slot && r.slot.fecha >= today)
        .sort((a: any, b: any) => `${a.slot.fecha} ${a.slot.hora_inicio}`.localeCompare(`${b.slot.fecha} ${b.slot.hora_inicio}`))

      return json({
        found: true,
        config,
        student: { id: profile.id, nombre: profile.nombre, apellido: profile.apellido },
        pass: pass || null,
        upcoming: upcomingDetailed,
        reservedCredits: upcomingDetailed.length,
        bookableCredits: Math.max(0, Number(pass?.clases_disponibles || 0) - upcomingDetailed.length),
      })
    }

    if (action === 'reserve') {
      if (!config.reservas_habilitadas) return json({ error: config.mensaje_cerrado }, 403)
      const slotId = Number(body?.slotId)
      const { phone, profile } = await findProfile(db, body?.phone)
      if (phone.length < 8 || !Number.isFinite(slotId)) return json({ error: 'Datos de reserva inválidos.' }, 400)
      const correctScope = demo ? profile?.id === DEMO_PROFILE_ID : profile?.id !== DEMO_PROFILE_ID
      if (!profile || !correctScope || !profile.particulares_habilitadas) return json({ error: 'No encontramos una cuponera activa asociada a este número.' }, 404)

      const { data: pass, error: passError } = await db
        .from('cuponeras_particulares')
        .select('id,clases_cargadas,clases_utilizadas,clases_disponibles,estado,nombre_cuponera')
        .eq('alumno_id', profile.id)
        .eq('habilitada', true)
        .gt('clases_disponibles', 0)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (passError) throw passError
      if (!pass) return json({ error: 'Tu cuponera no tiene clases disponibles.' }, 409)

      const today = new Date().toISOString().slice(0, 10)
      const { data: activeReservations, error: activeError } = await db
        .from('pr_personal_reservas')
        .select('disponibilidad_id')
        .eq('alumno_id', profile.id)
        .eq('estado', 'reservada')
      if (activeError) throw activeError

      let activeFutureCount = 0
      if ((activeReservations || []).length) {
        const activeIds = (activeReservations || []).map((r: any) => r.disponibilidad_id)
        const { data: activeSlots, error: activeSlotsError } = await db
          .from('pr_personal_disponibilidad')
          .select('id,fecha')
          .in('id', activeIds)
        if (activeSlotsError) throw activeSlotsError
        activeFutureCount = (activeSlots || []).filter((s: any) => s.fecha >= today).length
      }
      if (activeFutureCount >= Number(pass.clases_disponibles || 0)) {
        return json({ error: 'Ya tenés reservadas todas las clases disponibles de tu PR Pass. Si necesitás cambiar un turno, contactanos.' }, 409)
      }

      const { data: slot, error: slotError } = await db
        .from('pr_personal_disponibilidad')
        .select('id,fecha,hora_inicio,hora_fin,habilitado,nota_interna')
        .eq('id', slotId)
        .eq('habilitado', true)
        .gte('fecha', today)
        .single()
      const correctSlotScope = demo ? slot?.nota_interna === DEMO_MARKER : slot?.nota_interna !== DEMO_MARKER
      if (slotError || !slot || !correctSlotScope) return json({ error: 'Ese turno ya no está disponible.' }, 409)

      const { data: reservation, error: reserveError } = await db
        .from('pr_personal_reservas')
        .insert({ disponibilidad_id: slot.id, alumno_id: profile.id, cuponera_id: pass.id, estado: 'reservada', nota_interna: demo ? DEMO_MARKER : null })
        .select('id,estado,fecha_reserva')
        .single()
      if (reserveError) {
        if (reserveError.code === '23505') return json({ error: 'Ese turno acaba de ser reservado. Elegí otro horario.' }, 409)
        throw reserveError
      }

      const fullName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim()
      const when = `${dateUY(slot.fecha)} · ${timeUY(slot.hora_inicio)}–${timeUY(slot.hora_fin)}`
      const prefix = demo ? '[DEMO] ' : ''
      const adminHtml = `<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;color:#151515"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;padding:28px;border:1px solid #e8e8e8"><div style="font-size:12px;font-weight:800;color:#e11d48;letter-spacing:.14em">${prefix}PR PERSONAL</div><h1 style="font-size:25px;margin:8px 0 22px">Nueva reserva 🛼</h1><p><strong>Alumno:</strong> ${esc(fullName)}</p><p><strong>Turno:</strong> ${esc(when)}</p><p><strong>WhatsApp:</strong> ${esc(profile.telefono)}</p><p><strong>Email:</strong> ${esc(profile.email || '-')}</p><p><strong>PR Pass:</strong> ${esc(pass.nombre_cuponera || `${pass.clases_cargadas} clases`)}</p><p><strong>Clases disponibles:</strong> ${esc(pass.clases_disponibles)}</p></div></div>`
      const studentHtml = `<div style="font-family:Arial,sans-serif;background:#080808;padding:24px;color:#fff"><div style="max-width:620px;margin:auto;background:#141414;border-radius:22px;padding:30px;border:1px solid #2a2a2a"><div style="font-size:12px;font-weight:800;color:#f87171;letter-spacing:.16em">${prefix}PUNTA ROLLERS · PR PERSONAL</div><h1 style="font-size:27px;margin:9px 0 18px">Tu clase quedó reservada.</h1><p style="color:#d4d4d4">Hola ${esc(profile.nombre)} 👋</p><div style="margin:22px 0;padding:18px;border-radius:16px;background:#1d1d1d;border:1px solid #303030"><strong>${esc(when)}</strong></div><p style="color:#a3a3a3;font-size:14px">La reserva no descuenta una clase todavía. Tu PR Pass recibe el sello cuando la clase se marca como realizada.</p><p style="margin-top:24px;color:#737373;font-size:12px">No es solo patinar. Es pertenecer.</p></div></div>`

      const [adminSent, studentSent] = await Promise.all([
        sendEmail(ADMIN_EMAIL, `${prefix}🛼 PR Personal — ${fullName} reservó ${timeUY(slot.hora_inicio)}`, adminHtml),
        profile.email ? sendEmail(profile.email, `${prefix}Tu clase PR Personal está reservada 🛼`, studentHtml) : Promise.resolve(false),
      ])

      await db.from('pr_personal_reservas').update({ email_admin_enviado: adminSent, email_confirmacion_enviado: studentSent, updated_at: new Date().toISOString() }).eq('id', reservation.id)

      return json({
        ok: true,
        reservation,
        slot: { id: slot.id, fecha: slot.fecha, hora_inicio: slot.hora_inicio, hora_fin: slot.hora_fin },
        student: { nombre: profile.nombre, apellido: profile.apellido },
        pass,
        email: { admin: adminSent, alumno: studentSent, alumno_tiene_email: Boolean(profile.email) },
      })
    }

    return json({ error: 'Acción no válida.' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: 'No pudimos completar la operación.' }, 500)
  }
})
