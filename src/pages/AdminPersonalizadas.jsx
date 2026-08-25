import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const emptySlot = { fecha: '', hora_inicio: '', hora_fin: '' }
const emptyStudent = { nombre: '', apellido: '', telefono: '', email: '', clases: 4 }

const normalizePhone = (value) => String(value || '').replace(/\D/g, '')
const formatTime = (value) => String(value || '').slice(0, 5)
const formatDate = (value) => new Intl.DateTimeFormat('es-UY', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))

export default function AdminPersonalizadas() {
  const [config, setConfig] = useState(null)
  const [slots, setSlots] = useState([])
  const [reservations, setReservations] = useState([])
  const [slotForm, setSlotForm] = useState(emptySlot)
  const [studentForm, setStudentForm] = useState(emptyStudent)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    const [{ data: cfg }, { data: slotRows }, { data: reservationRows }] = await Promise.all([
      supabase.from('pr_personal_config').select('*').eq('id', 1).single(),
      supabase.from('pr_personal_disponibilidad').select('*').order('fecha').order('hora_inicio'),
      supabase.from('pr_personal_reservas').select('*, pr_personal_disponibilidad(fecha,hora_inicio,hora_fin), profiles:alumno_id(nombre,apellido,telefono), cuponeras_particulares:cuponera_id(clases_cargadas,clases_disponibles)').order('fecha_reserva', { ascending: false }).limit(100),
    ])
    setConfig(cfg || null)
    setSlots(slotRows || [])
    setReservations(reservationRows || [])
  }

  useEffect(() => { load() }, [])

  const futureSlots = useMemo(() => slots.filter((slot) => slot.fecha >= new Date().toISOString().slice(0, 10)), [slots])

  const toggleReservations = async () => {
    if (!config) return
    setBusy(true)
    setNotice('')
    const next = !config.reservas_habilitadas
    const { error } = await supabase.from('pr_personal_config').update({ reservas_habilitadas: next, updated_at: new Date().toISOString() }).eq('id', 1)
    setBusy(false)
    if (error) return setNotice(error.message)
    setConfig({ ...config, reservas_habilitadas: next })
  }

  const saveClosedMessage = async () => {
    setBusy(true)
    const { error } = await supabase.from('pr_personal_config').update({ mensaje_cerrado: config.mensaje_cerrado, updated_at: new Date().toISOString() }).eq('id', 1)
    setBusy(false)
    setNotice(error ? error.message : 'Mensaje de reservas cerradas actualizado.')
  }

  const createSlot = async (event) => {
    event.preventDefault()
    if (!slotForm.fecha || !slotForm.hora_inicio || !slotForm.hora_fin) return
    setBusy(true)
    setNotice('')
    const { error } = await supabase.from('pr_personal_disponibilidad').insert({ ...slotForm, habilitado: true })
    setBusy(false)
    if (error) return setNotice(error.message)
    setSlotForm(emptySlot)
    await load()
  }

  const removeSlot = async (id) => {
    setBusy(true)
    const { error } = await supabase.from('pr_personal_disponibilidad').update({ habilitado: false }).eq('id', id)
    setBusy(false)
    if (error) return setNotice(error.message)
    await load()
  }

  const createStudentPass = async (event) => {
    event.preventDefault()
    const phone = normalizePhone(studentForm.telefono)
    const total = Math.max(1, Number(studentForm.clases || 1))
    if (!studentForm.nombre.trim() || phone.length < 8) return setNotice('Nombre y teléfono son obligatorios.')

    setBusy(true)
    setNotice('')
    try {
      const { data: candidates, error: findError } = await supabase.from('profiles').select('id,nombre,apellido,telefono').not('telefono', 'is', null)
      if (findError) throw findError
      let profile = (candidates || []).find((row) => normalizePhone(row.telefono) === phone)

      if (!profile) {
        const id = `personal_${crypto.randomUUID()}`
        const { data, error } = await supabase.from('profiles').insert({
          id,
          nombre: studentForm.nombre.trim(),
          apellido: studentForm.apellido.trim() || null,
          telefono: phone,
          email: studentForm.email.trim() || null,
          role: 'alumno',
          particulares_habilitadas: true,
          es_solo_personalizadas: true,
        }).select('id,nombre,apellido,telefono').single()
        if (error) throw error
        profile = data
      } else {
        const { error } = await supabase.from('profiles').update({ particulares_habilitadas: true, telefono: phone }).eq('id', profile.id)
        if (error) throw error
      }

      const { error: passError } = await supabase.from('cuponeras_particulares').insert({
        alumno_id: profile.id,
        clases_cargadas: total,
        clases_utilizadas: 0,
        clases_disponibles: total,
        habilitada: true,
        estado: 'activa',
        nombre_cuponera: `PR Pass · ${total} clase${total === 1 ? '' : 's'}`,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        visible_al_alumno: true,
      })
      if (passError) throw passError

      setStudentForm(emptyStudent)
      setNotice(`PR Pass creada para ${profile.nombre}.`)
    } catch (error) {
      setNotice(error.message || 'No se pudo crear la cuponera.')
    } finally {
      setBusy(false)
    }
  }

  const setReservationStatus = async (reservation, estado, motivo = null) => {
    setBusy(true)
    setNotice('')
    try {
      const updates = { estado, motivo_estado: motivo, updated_at: new Date().toISOString() }
      if (estado === 'suspendida') updates.suspendida_en = new Date().toISOString()
      if (estado === 'cancelada') updates.cancelada_en = new Date().toISOString()
      if (estado === 'realizada') updates.realizada_en = new Date().toISOString()

      if (estado === 'realizada' && !reservation.credito_consumido && reservation.cuponera_id) {
        const pass = reservation.cuponeras_particulares
        const before = Number(pass?.clases_disponibles || 0)
        if (before <= 0) throw new Error('La cuponera ya no tiene clases disponibles.')
        const { error: passError } = await supabase.from('cuponeras_particulares').update({
          clases_utilizadas: Number(pass?.clases_cargadas || 0) - before + 1,
          clases_disponibles: before - 1,
          ultima_clase: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', reservation.cuponera_id)
        if (passError) throw passError
        updates.credito_consumido = true
      }

      const { error } = await supabase.from('pr_personal_reservas').update(updates).eq('id', reservation.id)
      if (error) throw error
      await load()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white px-4 pb-24 pt-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link to="/admin" className="text-xs font-bold text-white/35">← Volver al admin</Link>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[.34em] text-red-300">PUNTA ROLLERS · ADMIN</p>
            <h1 className="mt-1 text-3xl font-black">PR Personal</h1>
            <p className="mt-1 text-sm text-white/40">Turnos, alumnos, cuponeras y clases personalizadas.</p>
          </div>
          <a href="/personalizadas" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black">Ver página ↗</a>
        </header>

        <section className={`rounded-[28px] border p-5 ${config?.reservas_habilitadas ? 'border-emerald-300/20 bg-emerald-400/10' : 'border-red-300/20 bg-red-500/10'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/45">Estado público</p>
              <h2 className="mt-1 text-xl font-black">{config?.reservas_habilitadas ? 'Reservas abiertas' : 'Reservas cerradas'}</h2>
            </div>
            <button disabled={busy} onClick={toggleReservations} className={`rounded-2xl px-4 py-3 text-xs font-black ${config?.reservas_habilitadas ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>{config?.reservas_habilitadas ? 'Cerrar' : 'Abrir'}</button>
          </div>
          {config && (
            <div className="mt-4 flex gap-2">
              <input value={config.mensaje_cerrado} onChange={(e) => setConfig({ ...config, mensaje_cerrado: e.target.value })} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none" />
              <button onClick={saveClosedMessage} className="rounded-2xl border border-white/10 px-4 text-xs font-black">Guardar</button>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Nueva cuponera</p>
            <h2 className="mt-1 text-xl font-black">Crear PR Pass</h2>
            <form onSubmit={createStudentPass} className="mt-4 grid grid-cols-2 gap-3">
              <input placeholder="Nombre" value={studentForm.nombre} onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input placeholder="Apellido" value={studentForm.apellido} onChange={(e) => setStudentForm({ ...studentForm, apellido: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input placeholder="WhatsApp" value={studentForm.telefono} onChange={(e) => setStudentForm({ ...studentForm, telefono: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input placeholder="Email (opcional)" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <select value={studentForm.clases} onChange={(e) => setStudentForm({ ...studentForm, clases: Number(e.target.value) })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                {[1,2,4,5,8,10].map((n) => <option key={n} value={n}>{n} clase{n === 1 ? '' : 's'}</option>)}
              </select>
              <button disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">Crear cuponera</button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Agenda semanal</p>
            <h2 className="mt-1 text-xl font-black">Agregar horario</h2>
            <form onSubmit={createSlot} className="mt-4 grid grid-cols-2 gap-3">
              <input type="date" value={slotForm.fecha} onChange={(e) => setSlotForm({ ...slotForm, fecha: e.target.value })} className="col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input type="time" value={slotForm.hora_inicio} onChange={(e) => setSlotForm({ ...slotForm, hora_inicio: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <input type="time" value={slotForm.hora_fin} onChange={(e) => setSlotForm({ ...slotForm, hora_fin: e.target.value })} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" />
              <button disabled={busy} className="col-span-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black">Publicar turno</button>
            </form>
            <div className="mt-4 space-y-2 max-h-72 overflow-auto">
              {futureSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div><p className="text-sm font-black">{formatDate(slot.fecha)}</p><p className="text-xs text-white/40">{formatTime(slot.hora_inicio)}–{formatTime(slot.hora_fin)}</p></div>
                  <button onClick={() => removeSlot(slot.id)} className="text-xs font-bold text-red-300">Ocultar</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">Clases</p><h2 className="mt-1 text-xl font-black">Reservas recientes</h2></div>
            <span className="text-xs text-white/35">{reservations.length} registros</span>
          </div>
          <div className="mt-4 space-y-3">
            {reservations.length === 0 && <p className="text-sm text-white/35">Todavía no hay reservas.</p>}
            {reservations.map((reservation) => {
              const slot = reservation.pr_personal_disponibilidad
              const student = reservation.profiles
              return (
                <article key={reservation.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{student?.nombre || 'Alumno'} {student?.apellido || ''}</p>
                      <p className="mt-1 text-xs text-white/40">{slot ? `${formatDate(slot.fecha)} · ${formatTime(slot.hora_inicio)}–${formatTime(slot.hora_fin)}` : 'Turno'}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[10px] font-black uppercase tracking-wider">{reservation.estado}</span>
                  </div>
                  {reservation.estado === 'reservada' && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button disabled={busy} onClick={() => setReservationStatus(reservation, 'realizada')} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-200">✓ Realizada</button>
                      <button disabled={busy} onClick={() => setReservationStatus(reservation, 'suspendida', 'Lluvia / mal clima')} className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-200">☔ Clima</button>
                      <button disabled={busy} onClick={() => setReservationStatus(reservation, 'suspendida', 'Imprevisto')} className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-100">Imprevisto</button>
                      <button disabled={busy} onClick={() => setReservationStatus(reservation, 'cancelada', 'Aviso con tiempo')} className="rounded-xl bg-white/[.06] px-3 py-2 text-xs font-black text-white/65">Cancelar</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {notice && <div className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#161616]/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">{notice}</div>}
      </div>
    </div>
  )
}
