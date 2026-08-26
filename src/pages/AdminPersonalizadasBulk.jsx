import { useMemo, useState } from 'react'
import AdminPersonalizadas from './AdminPersonalizadas'
import { supabase } from '../lib/supabase'

const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const total = (7 * 60) + (i * 30)
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
})

const hhmm = (value) => String(value || '').slice(0, 5)
const dayLabel = (value) => new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
const shortDate = (value) => new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))

function addOneHour(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
  const total = ((hours * 60) + minutes + 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function shiftIso(value, amount) {
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

function mondayFor(value) {
  const d = new Date(`${value}T12:00:00Z`)
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - weekday + 1)
  return d.toISOString().slice(0, 10)
}

const STATE_STYLE = {
  reservada: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  realizada: 'border-sky-300/20 bg-sky-400/10 text-sky-200',
  cancelada: 'border-red-300/20 bg-red-500/10 text-red-200',
  suspendida: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
  reprogramada: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
  ausente: 'border-orange-300/20 bg-orange-400/10 text-orange-200',
}

function WeeklyRoster({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [week, setWeek] = useState(null)
  const [error, setError] = useState('')

  useState(() => {
    let alive = true
    const run = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const { data: futureSlots, error: slotError } = await supabase
          .from('pr_personal_disponibilidad')
          .select('id,fecha,hora_inicio,hora_fin,habilitado')
          .gte('fecha', today)
          .order('fecha')
          .order('hora_inicio')
        if (slotError) throw slotError

        const first = (futureSlots || []).find((slot) => slot.habilitado) || futureSlots?.[0]
        const anchor = first?.fecha || today
        const start = mondayFor(anchor)
        const end = shiftIso(start, 6)
        setWeek({ start, end })

        const weekSlots = (futureSlots || []).filter((slot) => slot.fecha >= start && slot.fecha <= end)
        const ids = weekSlots.map((slot) => slot.id)
        if (!ids.length) {
          if (alive) setRows([])
          return
        }

        const [{ data: reservations, error: reservationError }, { data: profiles, error: profileError }] = await Promise.all([
          supabase.from('pr_personal_reservas').select('*').in('disponibilidad_id', ids),
          supabase.from('profiles').select('id,nombre,apellido,telefono,foto'),
        ])
        if (reservationError) throw reservationError
        if (profileError) throw profileError

        const slotMap = Object.fromEntries(weekSlots.map((slot) => [slot.id, slot]))
        const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]))
        const ordered = (reservations || []).map((reservation) => ({
          ...reservation,
          slot: slotMap[reservation.disponibilidad_id],
          student: profileMap[reservation.alumno_id],
        })).filter((item) => item.slot).sort((a, b) => `${a.slot.fecha} ${a.slot.hora_inicio}`.localeCompare(`${b.slot.fecha} ${b.slot.hora_inicio}`))
        if (alive) setRows(ordered)
      } catch (err) {
        if (alive) setError(err?.message || 'No se pudo cargar la agenda semanal.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  })

  const active = rows.filter((row) => ['reservada', 'realizada', 'ausente'].includes(row.estado))
  const inactive = rows.filter((row) => !['reservada', 'realizada', 'ausente'].includes(row.estado))

  const renderRow = (row) => (
    <div key={row.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
      <div className="min-w-0"><p className="truncate text-sm font-black text-white">{row.student ? `${row.student.nombre || ''} ${row.student.apellido || ''}`.trim() : 'Alumno'}</p><p className="mt-1 text-[11px] text-white/35 sm:hidden">{dayLabel(row.slot.fecha)} · {hhmm(row.slot.hora_inicio)}–{hhmm(row.slot.hora_fin)}</p></div>
      <p className="hidden text-xs font-bold capitalize text-white/55 sm:block">{dayLabel(row.slot.fecha)}</p>
      <p className="hidden text-xs font-black text-white/70 sm:block">{hhmm(row.slot.hora_inicio)}–{hhmm(row.slot.hora_fin)}</p>
      <span className={`self-start rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${STATE_STYLE[row.estado] || 'border-white/10 bg-white/[.04] text-white/50'}`}>{row.estado || 'reservada'}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div className="mx-auto mt-5 max-w-4xl rounded-[30px] border border-white/10 bg-[#111] p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-red-300">PR Personal · Admin</p><h2 className="mt-1 text-2xl font-black">Agenda de la semana</h2><p className="mt-1 text-sm text-white/40">{week ? `${shortDate(week.start)} → ${shortDate(week.end)}` : 'Cargando semana…'} · ordenada por día y horario.</p></div>
          <button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/50">Cerrar</button>
        </div>

        {loading && <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-6 text-center text-sm text-white/45">Cargando anotados…</div>}
        {error && <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {!loading && !error && <>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-white/35">Anotados activos</p><p className="mt-1 text-3xl font-black">{active.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-white/35">Movimientos</p><p className="mt-1 text-3xl font-black">{rows.length}</p></div></div>
          <div className="mt-5"><div className="mb-2 hidden grid-cols-[1.3fr_1fr_1fr_auto] gap-3 px-4 text-[9px] font-black uppercase tracking-widest text-white/25 sm:grid"><span>Alumno</span><span>Día</span><span>Horario</span><span>Estado</span></div><div className="space-y-2">{active.length ? active.map(renderRow) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">Todavía no hay alumnos anotados para esta semana.</div>}</div></div>
          {inactive.length > 0 && <div className="mt-7"><p className="mb-3 text-[10px] font-black uppercase tracking-[.22em] text-white/30">Canceladas / suspendidas / reprogramadas</p><div className="space-y-2 opacity-70">{inactive.map(renderRow)}</div></div>}
        </>}
      </div>
    </div>
  )
}

export default function AdminPersonalizadasBulk() {
  const [open, setOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [date, setDate] = useState('')
  const [times, setTimes] = useState([])
  const [repeatDates, setRepeatDates] = useState([])
  const [repeatInput, setRepeatInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const dates = useMemo(() => [...new Set([date, ...repeatDates].filter(Boolean))], [date, repeatDates])

  const toggleTime = (time) => {
    setTimes((current) => current.includes(time)
      ? current.filter((item) => item !== time)
      : [...current, time].sort())
  }

  const addRepeatDate = () => {
    if (!repeatInput || repeatInput === date || repeatDates.includes(repeatInput)) return
    setRepeatDates((current) => [...current, repeatInput].sort())
    setRepeatInput('')
  }

  const publish = async () => {
    if (!date) return setMessage('Elegí primero la fecha principal.')
    if (!times.length) return setMessage('Seleccioná al menos un horario.')

    setBusy(true)
    setMessage('')
    try {
      const from = dates.slice().sort()[0]
      const to = dates.slice().sort().at(-1)
      const { data: existing, error: fetchError } = await supabase
        .from('pr_personal_disponibilidad')
        .select('id,fecha,hora_inicio,hora_fin,habilitado')
        .gte('fecha', from)
        .lte('fecha', to)
      if (fetchError) throw fetchError

      const existingMap = new Map((existing || []).map((row) => [`${row.fecha}|${String(row.hora_inicio).slice(0,5)}`, row]))
      const inserts = []
      const reactivateIds = []
      let skipped = 0

      dates.forEach((fecha) => {
        times.forEach((hora_inicio) => {
          const key = `${fecha}|${hora_inicio}`
          const found = existingMap.get(key)
          if (found) {
            if (!found.habilitado) reactivateIds.push(found.id)
            else skipped += 1
            return
          }
          inserts.push({ fecha, hora_inicio, hora_fin: addOneHour(hora_inicio), habilitado: true })
        })
      })

      if (reactivateIds.length) {
        const { error } = await supabase
          .from('pr_personal_disponibilidad')
          .update({ habilitado: true, updated_at: new Date().toISOString() })
          .in('id', reactivateIds)
        if (error) throw error
      }

      if (inserts.length) {
        const { error } = await supabase.from('pr_personal_disponibilidad').insert(inserts)
        if (error) throw error
      }

      const published = inserts.length + reactivateIds.length
      setMessage(`${published} horario${published === 1 ? '' : 's'} publicado${published === 1 ? '' : 's'}${skipped ? ` · ${skipped} ya existían` : ''}.`)
      setTimes([])
      setRepeatDates([])
      window.setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      setMessage(error?.message || 'No se pudieron publicar los horarios.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AdminPersonalizadas />

      <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
        <button type="button" onClick={() => setRosterOpen(true)} className="rounded-2xl border border-white/15 bg-[#171717]/95 px-5 py-3 text-sm font-black text-white shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-xl active:scale-[.98]">📋 Agenda semanal</button>
        <button type="button" onClick={() => setOpen(true)} className="rounded-2xl border border-red-300/25 bg-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_20px_60px_rgba(0,0,0,.5)] active:scale-[.98]">+ Cargar varios horarios</button>
      </div>

      {rosterOpen && <WeeklyRoster onClose={() => setRosterOpen(false)} />}

      {open && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="mx-auto mt-6 max-w-2xl rounded-[30px] border border-white/10 bg-[#111] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-red-300">Agenda rápida</p><h2 className="mt-1 text-2xl font-black">Cargar varios horarios</h2><p className="mt-1 text-sm text-white/40">Una fecha, todos los turnos que quieras. Cada clase dura 1 hora.</p></div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/50">Cerrar</button>
            </div>

            <div className="mt-5"><label className="text-[10px] font-black uppercase tracking-widest text-white/35">Fecha principal</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm" /></div>

            <div className="mt-5"><div className="flex items-center justify-between gap-3"><label className="text-[10px] font-black uppercase tracking-widest text-white/35">Horarios</label><span className="text-xs font-black text-red-200">{times.length} seleccionados</span></div><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">{TIME_OPTIONS.map((time) => { const active = times.includes(time); return <button key={time} type="button" onClick={() => toggleTime(time)} className={`rounded-xl border px-2 py-3 text-xs font-black transition ${active ? 'border-red-300/50 bg-red-500 text-white' : 'border-white/10 bg-white/[.03] text-white/55'}`}>{time}</button> })}</div>{times.length > 0 && <p className="mt-3 text-xs text-white/35">Se crearán: {times.map((time) => `${time}–${addOneHour(time)}`).join(' · ')}</p>}</div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] p-4"><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Repetir estos mismos horarios en otros días</p><div className="mt-3 flex gap-2"><input type="date" value={repeatInput} onChange={(e) => setRepeatInput(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" /><button type="button" onClick={addRepeatDate} className="rounded-xl border border-white/10 bg-white/[.05] px-4 text-xs font-black">Agregar día</button></div>{repeatDates.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{repeatDates.map((item) => <button key={item} type="button" onClick={() => setRepeatDates((current) => current.filter((dateItem) => dateItem !== item))} className="rounded-full border border-red-300/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-100">{item} ×</button>)}</div>}</div>

            {message && <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">{message}</div>}
            <button disabled={busy} onClick={publish} className="mt-5 min-h-14 w-full rounded-2xl bg-red-500 px-5 text-sm font-black text-white disabled:opacity-50">{busy ? 'Publicando…' : `Publicar ${times.length * Math.max(1, dates.length)} horario${times.length * Math.max(1, dates.length) === 1 ? '' : 's'}`}</button>
          </div>
        </div>
      )}
    </>
  )
}
