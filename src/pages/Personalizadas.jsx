import { useEffect, useMemo, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'

const callPersonal = async (payload) => {
  const { data, error } = await supabase.functions.invoke('pr-personal-public', { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

const formatDay = (date) => new Intl.DateTimeFormat('es-UY', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const formatTime = (value) => String(value || '').slice(0, 5)

function PassCard({ student, pass }) {
  const total = Math.max(0, Number(pass?.clases_cargadas || 0))
  const used = Math.max(0, Number(pass?.clases_utilizadas || 0))

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[.10] via-white/[.04] to-black p-5 shadow-2xl">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-red-500/15 blur-3xl" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[.28em] text-red-300">PR PASS · PERSONAL</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{student?.nombre || 'Alumno'} {student?.apellido || ''}</h2>
            <p className="mt-1 text-sm text-white/45">{pass?.nombre_cuponera || `Cuponera de ${total} clases`}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/35">Disponibles</p>
            <p className="text-2xl font-black text-white">{pass?.clases_disponibles ?? 0}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: total }).map((_, index) => {
            const completed = index < used
            return (
              <div key={index} className={`aspect-square rounded-2xl border flex items-center justify-center transition-all ${completed ? 'border-red-400/60 bg-red-500/20 shadow-[0_0_28px_rgba(239,68,68,.16)]' : 'border-white/10 bg-white/[.035]'}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black ${completed ? 'rotate-[-9deg] border-red-300 text-red-200' : 'border-white/15 text-white/25'}`}>
                  {completed ? 'PR' : index + 1}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-white/35">Cada clase realizada recibe su sello PR. Reservar no descuenta una clase hasta que la clase se complete.</p>
      </div>
    </section>
  )
}

export default function Personalizadas() {
  const [config, setConfig] = useState(null)
  const [phone, setPhone] = useState('')
  const [student, setStudent] = useState(null)
  const [pass, setPass] = useState(null)
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  const loadBase = async () => {
    setLoading(true)
    try {
      const [{ config: cfg }, availability] = await Promise.all([
        callPersonal({ action: 'config' }),
        callPersonal({ action: 'availability' }),
      ])
      setConfig(cfg)
      setSlots(availability?.slots || [])
    } catch (error) {
      setMessage(error.message || 'No pudimos cargar los turnos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBase() }, [])

  const days = useMemo(() => {
    const map = new Map()
    slots.forEach((slot) => {
      if (!map.has(slot.fecha)) map.set(slot.fecha, [])
      map.get(slot.fecha).push(slot)
    })
    return [...map.entries()]
  }, [slots])

  const identify = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const data = await callPersonal({ action: 'identify', phone })
      if (!data.found) {
        setStudent(null)
        setPass(null)
        setMessage('No encontramos una cuponera activa asociada a ese número. Escribinos por WhatsApp y te ayudamos.')
        return
      }
      setStudent(data.student)
      setPass(data.pass)
      if (!data.pass) setMessage('Te reconocimos, pero todavía no tenés una cuponera activa visible.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const reserve = async () => {
    if (!selected) return
    setBusy(true)
    setMessage('')
    try {
      const data = await callPersonal({ action: 'reserve', phone, slotId: selected.id })
      setConfirmed(data)
      setSelected(null)
      await loadBase()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PublicLayout><div className="px-4 py-20 text-center text-white/50">Preparando PR Personal…</div></PublicLayout>

  if (config && !config.reservas_habilitadas) {
    return (
      <PublicLayout>
        <div className="min-h-[72vh] px-5 py-16 flex items-center">
          <section className="w-full rounded-[32px] border border-white/10 bg-white/[.04] p-7 text-center shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-[.34em] text-red-300">PR PERSONAL</p>
            <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-3xl">🛼</div>
            <h1 className="mt-6 text-3xl font-black text-white">Reservas cerradas</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/50">{config.mensaje_cerrado}</p>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[.28em] text-white/25">No es solo patinar. Es pertenecer.</p>
          </section>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="px-4 pb-20 pt-7 space-y-6">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[.34em] text-red-300">PR PERSONAL</p>
          <h1 className="text-4xl font-black tracking-tight text-white">Tu entrenamiento.<br />Tu horario.</h1>
          <p className="max-w-md text-sm leading-relaxed text-white/45">Ingresá tu teléfono, revisá tu PR Pass y reservá uno de los turnos disponibles de esta semana.</p>
        </header>

        {!student && (
          <form onSubmit={identify} className="rounded-[28px] border border-white/10 bg-white/[.045] p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Tu WhatsApp</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Ej: 099 123 456" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-lg font-semibold text-white outline-none focus:border-red-400/60" />
            <button disabled={busy} className="mt-3 w-full rounded-2xl bg-white px-4 py-4 text-sm font-black text-black disabled:opacity-50">{busy ? 'Buscando…' : 'Ver mi PR Pass'}</button>
          </form>
        )}

        {student && pass && <PassCard student={student} pass={pass} />}

        {student && pass && Number(pass.clases_disponibles) > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Disponibilidad</p>
              <h2 className="mt-1 text-2xl font-black text-white">Elegí tu próxima clase</h2>
            </div>
            {days.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm text-white/45">Todavía no hay horarios publicados.</div>
            ) : days.map(([date, daySlots]) => (
              <div key={date} className="rounded-[26px] border border-white/10 bg-white/[.035] p-4">
                <p className="mb-3 text-sm font-black uppercase tracking-wider text-white">{formatDay(date)}</p>
                <div className="grid grid-cols-2 gap-2">
                  {daySlots.map((slot) => (
                    <button key={slot.id} onClick={() => setSelected(slot)} className={`rounded-2xl border px-3 py-4 text-left transition ${selected?.id === slot.id ? 'border-red-400 bg-red-500/15' : 'border-white/10 bg-black/25'}`}>
                      <p className="text-lg font-black text-white">{formatTime(slot.hora_inicio)}</p>
                      <p className="text-xs text-white/35">hasta {formatTime(slot.hora_fin)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {selected && (
              <button disabled={busy} onClick={reserve} className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_50px_rgba(239,68,68,.22)] disabled:opacity-50">{busy ? 'Reservando…' : `Confirmar ${formatDay(selected.fecha)} · ${formatTime(selected.hora_inicio)}`}</button>
            )}
          </section>
        )}

        {student && pass && Number(pass.clases_disponibles) <= 0 && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">Tu cuponera está completa. Contactanos para cargar una nueva y seguir reservando.</div>
        )}

        {confirmed && (
          <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-6">
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-emerald-200">Reserva confirmada</p>
            <h2 className="mt-2 text-2xl font-black text-white">¡Nos vemos sobre ruedas! 🛼</h2>
            <p className="mt-2 text-sm text-white/55">{formatDay(confirmed.slot.fecha)} · {formatTime(confirmed.slot.hora_inicio)} a {formatTime(confirmed.slot.hora_fin)}.</p>
            <p className="mt-3 text-xs text-white/35">Tu clase todavía no fue descontada. El sello se aplica cuando la clase se marca como realizada.</p>
          </div>
        )}

        {message && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/60">{message}</div>}
      </div>
    </PublicLayout>
  )
}
