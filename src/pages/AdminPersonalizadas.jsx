import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const digits = (v) => String(v || '').replace(/\D/g, '')
const hhmm = (v) => String(v || '').slice(0, 5)
const iso = (d) => d.toISOString().slice(0, 10)
const day = (v) => new Intl.DateTimeFormat('es-UY', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${v}T12:00:00Z`))

function mondayOf(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - weekday + 1)
  return d
}

function shiftDate(value, days) {
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return iso(d)
}

export default function AdminPersonalizadas() {
  const [config, setConfig] = useState(null)
  const [slots, setSlots] = useState([])
  const [reservations, setReservations] = useState([])
  const [profiles, setProfiles] = useState({})
  const [passes, setPasses] = useState({})
  const [slot, setSlot] = useState({ fecha: '', hora_inicio: '', hora_fin: '' })
  const [student, setStudent] = useState({ nombre: '', apellido: '', telefono: '', email: '', clases: 4 })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    const [cfgRes, slotRes, resRes] = await Promise.all([
      supabase.from('pr_personal_config').select('*').eq('id', 1).single(),
      supabase.from('pr_personal_disponibilidad').select('*').order('fecha').order('hora_inicio'),
      supabase.from('pr_personal_reservas').select('*').order('fecha_reserva', { ascending: false }).limit(100),
    ])
    setConfig(cfgRes.data || null)
    setSlots(slotRes.data || [])
    const rows = resRes.data || []
    setReservations(rows)

    const profileIds = [...new Set(rows.map((r) => r.alumno_id).filter(Boolean))]
    const passIds = [...new Set(rows.map((r) => r.cuponera_id).filter(Boolean))]
    if (profileIds.length) {
      const { data } = await supabase.from('profiles').select('id,nombre,apellido,telefono').in('id', profileIds)
      setProfiles(Object.fromEntries((data || []).map((x) => [x.id, x])))
    } else setProfiles({})
    if (passIds.length) {
      const { data } = await supabase.from('cuponeras_particulares').select('id,clases_cargadas,clases_utilizadas,clases_disponibles').in('id', passIds)
      setPasses(Object.fromEntries((data || []).map((x) => [x.id, x])))
    } else setPasses({})
  }

  useEffect(() => { load() }, [])

  const slotMap = useMemo(() => Object.fromEntries(slots.map((x) => [x.id, x])), [slots])
  const futureSlots = useMemo(() => slots.filter((x) => x.habilitado && x.fecha >= new Date().toISOString().slice(0, 10)), [slots])
  const upcomingReservations = useMemo(() => reservations.filter((r) => ['reservada'].includes(r.estado)).length, [reservations])

  const toggle = async () => {
    if (!config) return
    setBusy(true)
    const next = !config.reservas_habilitadas
    const { error } = await supabase.from('pr_personal_config').update({ reservas_habilitadas: next, updated_at: new Date().toISOString() }).eq('id', 1)
    setBusy(false)
    if (error) return setNotice(error.message)
    setConfig({ ...config, reservas_habilitadas: next })
    setNotice(next ? 'Reservas abiertas.' : 'Reservas cerradas.')
  }

  const addSlot = async (e) => {
    e.preventDefault()
    if (!slot.fecha || !slot.hora_inicio || !slot.hora_fin) return
    if (slot.hora_fin <= slot.hora_inicio) return setNotice('La hora de fin debe ser posterior a la hora de inicio.')
    setBusy(true)
    const existing = slots.find((x) => x.fecha === slot.fecha && hhmm(x.hora_inicio) === slot.hora_inicio && hhmm(x.hora_fin) === slot.hora_fin)
    let error = null
    if (existing) {
      ;({ error } = await supabase.from('pr_personal_disponibilidad').update({ habilitado: true, updated_at: new Date().toISOString() }).eq('id', existing.id))
    } else {
      ;({ error } = await supabase.from('pr_personal_disponibilidad').insert({ ...slot, habilitado: true }))
    }
    setBusy(false)
    if (error) return setNotice(error.message)
    setSlot({ fecha: '', hora_inicio: '', hora_fin: '' })
    setNotice('Turno publicado.')
    await load()
  }

  const duplicatePreviousWeek = async () => {
    setBusy(true)
    setNotice('')
    try {
      const thisMonday = mondayOf()
      const previousMonday = new Date(thisMonday)
      previousMonday.setUTCDate(previousMonday.getUTCDate() - 7)
      const previousSunday = new Date(previousMonday)
      previousSunday.setUTCDate(previousSunday.getUTCDate() + 6)

      const from = iso(previousMonday)
      const to = iso(previousSunday)
      const source = slots.filter((x) => x.habilitado && x.fecha >= from && x.fecha <= to)
      if (!source.length) throw new Error('La semana anterior no tiene horarios activos para copiar.')

      const existingKeys = new Set(slots.map((x) => `${x.fecha}|${hhmm(x.hora_inicio)}|${hhmm(x.hora_fin)}`))
      const rows = source.map((x) => ({
        fecha: shiftDate(x.fecha, 7),
        hora_inicio: x.hora_inicio,
        hora_fin: x.hora_fin,
        habilitado: true,
        nota_interna: x.nota_interna || null,
      })).filter((x) => !existingKeys.has(`${x.fecha}|${hhmm(x.hora_inicio)}|${hhmm(x.hora_fin)}`))

      if (!rows.length) throw new Error('Los horarios de esta semana ya están cargados.')
      const { error } = await supabase.from('pr_personal_disponibilidad').insert(rows)
      if (error) throw error
      setNotice(`Semana copiada: ${rows.length} turno${rows.length === 1 ? '' : 's'} agregado${rows.length === 1 ? '' : 's'}.`)
      await load()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  const addPass = async (e) => {
    e.preventDefault()
    const phone = digits(student.telefono)
    const total = Math.max(1, Number(student.clases || 1))
    if (!student.nombre.trim() || phone.length < 8) return setNotice('Nombre y teléfono son obligatorios.')
    setBusy(true)
    setNotice('')
    try {
      const { data: candidates, error: findError } = await supabase.from('profiles').select('id,nombre,telefono').not('telefono', 'is', null)
      if (findError) throw findError
      let profile = (candidates || []).find((x) => digits(x.telefono) === phone)
      if (!profile) {
        const { data, error } = await supabase.from('profiles').insert({
          id: `personal_${crypto.randomUUID()}`,
          nombre: student.nombre.trim(), apellido: student.apellido.trim() || null,
          telefono: phone, email: student.email.trim() || null, role: 'alumno',
          particulares_habilitadas: true, es_solo_personalizadas: true,
        }).select('id,nombre').single()
        if (error) throw error
        profile = data
      } else {
        const { error } = await supabase.from('profiles').update({ particulares_habilitadas: true, telefono: phone }).eq('id', profile.id)
        if (error) throw error
      }
      const { error } = await supabase.from('cuponeras_particulares').insert({
        alumno_id: profile.id, clases_cargadas: total, clases_utilizadas: 0, clases_disponibles: total,
        habilitada: true, estado: 'activa', nombre_cuponera: `PR Pass · ${total} clase${total === 1 ? '' : 's'}`,
        fecha_inicio: new Date().toISOString().slice(0, 10), visible_al_alumno: true,
      })
      if (error) throw error
      setStudent({ nombre: '', apellido: '', telefono: '', email: '', clases: 4 })
      setNotice(`PR Pass creada para ${profile.nombre}.`)
    } catch (err) { setNotice(err.message) } finally { setBusy(false) }
  }

  const status = async (r, next, reason = null) => {
    setBusy(true)
    setNotice('')
    try {
      const update = { estado: next, motivo_estado: reason, updated_at: new Date().toISOString() }
      if (next === 'realizada') update.realizada_en = new Date().toISOString()
      if (next === 'suspendida') update.suspendida_en = new Date().toISOString()
      if (next === 'cancelada') update.cancelada_en = new Date().toISOString()

      if (next === 'realizada' && !r.credito_consumido && r.cuponera_id) {
        const p = passes[r.cuponera_id]
        if (!p || Number(p.clases_disponibles) <= 0) throw new Error('La cuponera no tiene clases disponibles.')
        const { error } = await supabase.from('cuponeras_particulares').update({
          clases_utilizadas: Number(p.clases_utilizadas) + 1,
          clases_disponibles: Number(p.clases_disponibles) - 1,
          ultima_clase: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', r.cuponera_id)
        if (error) throw error
        update.credito_consumido = true
        update.credito_devuelto = false
      }
      const { error } = await supabase.from('pr_personal_reservas').update(update).eq('id', r.id)
      if (error) throw error
      setNotice(next === 'realizada' ? 'Clase realizada: se aplicó el sello PR.' : `Clase ${next}. El crédito no fue consumido.`)
      await load()
    } catch (err) { setNotice(err.message) } finally { setBusy(false) }
  }

  const undoCompleted = async (r) => {
    if (!r.credito_consumido || !r.cuponera_id) return status(r, 'suspendida', 'Corrección administrativa')
    const reason = window.prompt('Motivo de la corrección:', 'Clase suspendida / no realizada')
    if (!reason) return
    setBusy(true)
    setNotice('')
    try {
      const p = passes[r.cuponera_id]
      if (!p) throw new Error('No se encontró la cuponera de esta reserva.')
      const { error: passError } = await supabase.from('cuponeras_particulares').update({
        clases_utilizadas: Math.max(0, Number(p.clases_utilizadas) - 1),
        clases_disponibles: Number(p.clases_disponibles) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', r.cuponera_id)
      if (passError) throw passError
      const { error } = await supabase.from('pr_personal_reservas').update({
        estado: 'suspendida', motivo_estado: reason, credito_consumido: false, credito_devuelto: true,
        suspendida_en: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', r.id)
      if (error) throw error
      setNotice('Corrección hecha: el crédito volvió a la PR Pass.')
      await load()
    } catch (err) { setNotice(err.message) } finally { setBusy(false) }
  }

  const otherReason = (r, next) => {
    const reason = window.prompt(next === 'suspendida' ? 'Motivo de la suspensión:' : 'Motivo de la cancelación:')
    if (reason?.trim()) status(r, next, reason.trim())
  }

  return (
    <div className="min-h-screen bg-[#080808] px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div><Link to="/admin" className="text-xs font-bold text-white/35">← Volver al admin</Link><p className="mt-4 text-[10px] font-black uppercase tracking-[.34em] text-red-300">PUNTA ROLLERS · ADMIN</p><h1 className="mt-1 text-3xl font-black">PR Personal</h1><p className="mt-1 text-sm text-white/35">Cuponeras, agenda y seguimiento de clases.</p></div>
          <a href="/personalizadas" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black">Ver página ↗</a>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-white/30">Turnos</p><p className="mt-1 text-2xl font-black">{futureSlots.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-white/30">Reservas</p><p className="mt-1 text-2xl font-black">{upcomingReservations}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-white/30">Estado</p><p className={`mt-2 text-xs font-black uppercase ${config?.reservas_habilitadas ? 'text-emerald-300' : 'text-red-300'}`}>{config?.reservas_habilitadas ? 'Abiertas' : 'Cerradas'}</p></div>
        </div>

        <section className={`rounded-[28px] border p-5 ${config?.reservas_habilitadas ? 'border-emerald-300/20 bg-emerald-400/10' : 'border-red-300/20 bg-red-500/10'}`}>
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-white/45">Estado público</p><h2 className="mt-1 text-xl font-black">{config?.reservas_habilitadas ? 'Reservas abiertas' : 'Reservas cerradas'}</h2></div><button disabled={busy} onClick={toggle} className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-black">{config?.reservas_habilitadas ? 'Cerrar' : 'Abrir'}</button></div>
          {config && <div className="mt-4 flex gap-2"><input value={config.mensaje_cerrado} onChange={(e) => setConfig({ ...config, mensaje_cerrado: e.target.value })} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm" /><button onClick={async () => { const { error } = await supabase.from('pr_personal_config').update({ mensaje_cerrado: config.mensaje_cerrado }).eq('id', 1); setNotice(error ? error.message : 'Mensaje guardado.') }} className="rounded-2xl border border-white/10 px-4 text-xs font-black">Guardar</button></div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Nueva cuponera</p><h2 className="mt-1 text-xl font-black">Crear PR Pass</h2>
            <form onSubmit={addPass} className="mt-4 grid grid-cols-2 gap-3"><input placeholder="Nombre" value={student.nombre} onChange={(e) => setStudent({ ...student, nombre: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><input placeholder="Apellido" value={student.apellido} onChange={(e) => setStudent({ ...student, apellido: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><input placeholder="WhatsApp" value={student.telefono} onChange={(e) => setStudent({ ...student, telefono: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><input placeholder="Email (opcional)" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><select value={student.clases} onChange={(e) => setStudent({ ...student, clases: Number(e.target.value) })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm">{[1,2,4,5,8,10].map((n) => <option key={n} value={n}>{n} clase{n === 1 ? '' : 's'}</option>)}</select><button disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">Crear</button></form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Agenda semanal</p><h2 className="mt-1 text-xl font-black">Agregar horario</h2></div><button disabled={busy} onClick={duplicatePreviousWeek} className="rounded-xl border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] font-black">Duplicar semana</button></div>
            <form onSubmit={addSlot} className="mt-4 grid grid-cols-2 gap-3"><input type="date" value={slot.fecha} onChange={(e) => setSlot({ ...slot, fecha: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><input type="time" value={slot.hora_inicio} onChange={(e) => setSlot({ ...slot, hora_inicio: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><input type="time" value={slot.hora_fin} onChange={(e) => setSlot({ ...slot, hora_fin: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /><button disabled={busy} className="col-span-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black">Publicar turno</button></form>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto">{futureSlots.map((x) => <div key={x.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3"><div><p className="text-sm font-black">{day(x.fecha)}</p><p className="text-xs text-white/40">{hhmm(x.hora_inicio)}–{hhmm(x.hora_fin)}</p></div><button onClick={async () => { await supabase.from('pr_personal_disponibilidad').update({ habilitado: false }).eq('id', x.id); load() }} className="text-xs font-bold text-red-300">Ocultar</button></div>)}</div>
          </section>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Clases</p><h2 className="mt-1 text-xl font-black">Reservas recientes</h2>
          <div className="mt-4 space-y-3">{reservations.length === 0 && <p className="text-sm text-white/35">Todavía no hay reservas.</p>}{reservations.map((r) => { const s = slotMap[r.disponibilidad_id]; const p = profiles[r.alumno_id]; return <article key={r.id} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{p?.nombre || 'Alumno'} {p?.apellido || ''}</p><p className="mt-1 text-xs text-white/40">{s ? `${day(s.fecha)} · ${hhmm(s.hora_inicio)}–${hhmm(s.hora_fin)}` : 'Turno'}</p>{r.motivo_estado && <p className="mt-1 text-xs text-white/30">{r.motivo_estado}</p>}</div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase">{r.estado}</span></div>{r.estado === 'reservada' && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"><button onClick={() => status(r, 'realizada')} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-200">✓ Realizada</button><button onClick={() => status(r, 'suspendida', 'Lluvia / mal clima')} className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-200">☔ Clima</button><button onClick={() => status(r, 'suspendida', 'Imprevisto PR / profesor')} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-100">Imprevisto PR</button><button onClick={() => status(r, 'cancelada', 'Alumno avisó con tiempo')} className="rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-black text-violet-200">Avisó alumno</button><button onClick={() => status(r, 'reprogramada', 'Reprogramación acordada')} className="rounded-xl bg-white/[.06] px-3 py-2 text-xs font-black text-white/65">↻ Reprogramar</button><button onClick={() => otherReason(r, 'suspendida')} className="rounded-xl bg-white/[.06] px-3 py-2 text-xs font-black text-white/65">Otro motivo</button></div>}{r.estado === 'realizada' && r.credito_consumido && <button onClick={() => undoCompleted(r)} className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">Corregir y devolver crédito</button>}</article>})}</div>
        </section>

        {notice && <div className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#161616]/95 px-4 py-3 text-sm shadow-2xl">{notice}</div>}
      </div>
    </div>
  )
}
