import { useEffect, useMemo, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'
import './Personalizadas.css'

const callPersonal = async (payload) => {
  const { data, error } = await supabase.functions.invoke('pr-personal-public', { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

const formatDay = (date) => new Intl.DateTimeFormat('es-UY', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const formatTime = (value) => String(value || '').slice(0, 5)

function PassCard({ student, pass, reservedCredits = 0 }) {
  const total = Math.max(0, Number(pass?.clases_cargadas || 0))
  const used = Math.min(total, Math.max(0, Number(pass?.clases_utilizadas || 0)))
  const left = Math.max(0, Number(pass?.clases_disponibles || 0))
  const cols = total <= 2 ? 'grid-cols-2' : total <= 4 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-5'

  return (
    <section className="pr-pass-enter pr-pass-sheen relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#251010] via-[#111] to-black p-5 shadow-[0_28px_90px_rgba(0,0,0,.45)]">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/[.04] blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[.3em] text-red-300">PR PASS · PERSONAL</p>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-white/35">Activa</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-white">{student?.nombre || 'Alumno'} {student?.apellido || ''}</h2>
            <p className="mt-1 text-sm text-white/45">{pass?.nombre_cuponera || `Cuponera de ${total} clases`}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Te quedan</p>
            <p className="text-2xl font-black text-white">{left}</p>
          </div>
        </div>

        <div className={`mt-6 grid ${cols} gap-3`}>
          {Array.from({ length: total }).map((_, index) => {
            const completed = index < used
            return (
              <div key={index} className={`pr-pass-slot relative aspect-square overflow-hidden rounded-2xl border flex items-center justify-center ${completed ? 'border-red-400/45 bg-red-500/15 shadow-[inset_0_0_24px_rgba(239,68,68,.07)]' : 'border-white/10 bg-white/[.035]'}`}>
                <div className="absolute left-2 top-2 text-[8px] font-black uppercase tracking-widest text-white/20">{String(index + 1).padStart(2, '0')}</div>
                {completed ? (
                  <div className="pr-pass-stamp flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-300/80 text-[11px] font-black tracking-tight text-red-200 shadow-lg">PR</div>
                ) : (
                  <div className="h-11 w-11 rounded-full border border-dashed border-white/15" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-white/35">{used} de {total} clases realizadas</p>
            {reservedCredits > 0 && <p className="mt-1 text-[10px] font-bold text-red-200/70">{reservedCredits} clase{reservedCredits === 1 ? '' : 's'} ya reservada{reservedCredits === 1 ? '' : 's'}</p>}
          </div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/25">Punta Rollers</p>
        </div>
      </div>
    </section>
  )
}

export default function Personalizadas() {
  const [config, setConfig] = useState(null)
  const [phone, setPhone] = useState('')
  const [student, setStudent] = useState(null)
  const [pass, setPass] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [reservedCredits, setReservedCredits] = useState(0)
  const [bookableCredits, setBookableCredits] = useState(0)
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

  const refreshIdentity = async () => {
    const data = await callPersonal({ action: 'identify', phone })
    if (!data.found) return data
    setStudent(data.student)
    setPass(data.pass)
    setUpcoming(data.upcoming || [])
    setReservedCredits(Number(data.reservedCredits || 0))
    setBookableCredits(Number(data.bookableCredits || 0))
    return data
  }

  const identify = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setConfirmed(null)
    try {
      const data = await refreshIdentity()
      if (!data.found) {
        setStudent(null)
        setPass(null)
        setUpcoming([])
        setReservedCredits(0)
        setBookableCredits(0)
        setMessage('No encontramos una cuponera activa asociada a ese número. Escribinos por WhatsApp y te ayudamos.')
        return
      }
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
      await Promise.all([loadBase(), refreshIdentity()])
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

        {student && pass && <PassCard student={student} pass={pass} reservedCredits={reservedCredits} />}

        {student && upcoming.length > 0 && (
          <section className="rounded-[26px] border border-white/10 bg-white/[.035] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Próximas clases</p>
            <div className="mt-3 space-y-2">
              {upcoming.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"><div><p className="font-black">{formatDay(item.slot.fecha)}</p><p className="mt-1 text-xs text-white/40">{formatTime(item.slot.hora_inicio)}–{formatTime(item.slot.hora_fin)}</p></div><span className="rounded-full border border-red-300/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase text-red-200">Reservada</span></div>)}
            </div>
          </section>
        )}

        {student && pass && bookableCredits > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Disponibilidad</p>
              <h2 className="mt-1 text-2xl font-black text-white">Elegí tu próxima clase</h2>
              <p className="mt-1 text-xs text-white/35">Podés reservar {bookableCredits} clase{bookableCredits === 1 ? '' : 's'} más con tu PR Pass actual.</p>
            </div>
            {days.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm text-white/45">Todavía no hay horarios publicados.</div>
            ) : days.map(([date, daySlots]) => (
              <div key={date} className="rounded-[26px] border border-white/10 bg-white/[.035] p-4">
                <p className="mb-3 text-sm font-black uppercase tracking-wider text-white">{formatDay(date)}</p>
                <div className="grid grid-cols-2 gap-2">
                  {daySlots.map((slot) => (
                    <button key={slot.id} onClick={() => setSelected(slot)} className={`rounded-2xl border px-3 py-4 text-left transition ${selected?.id === slot.id ? 'border-red-400 bg-red-500/15 shadow-[0_12px_35px_rgba(239,68,68,.12)]' : 'border-white/10 bg-black/25'}`}>
                      <p className="text-lg font-black text-white">{formatTime(slot.hora_inicio)}</p>
                      <p className="text-xs text-white/35">hasta {formatTime(slot.hora_fin)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {selected && <button disabled={busy} onClick={reserve} className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_50px_rgba(239,68,68,.22)] disabled:opacity-50">{busy ? 'Reservando…' : `Confirmar ${formatDay(selected.fecha)} · ${formatTime(selected.hora_inicio)}`}</button>}
          </section>
        )}

        {student && pass && bookableCredits <= 0 && Number(pass.clases_disponibles) > 0 && (
          <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-5 text-sm text-sky-100">Ya tenés comprometidas todas las clases disponibles de tu PR Pass en reservas futuras. Si querés cambiar un turno, contactanos.</div>
        )}

        {student && pass && Number(pass.clases_disponibles) <= 0 && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">Tu PR Pass está completa. Contactanos para cargar una nueva y seguir reservando.</div>
        )}

        {confirmed && (
          <div className="pr-pass-enter rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-6">
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
