import { useEffect, useMemo, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'
import { PR_PERSONAL_TERMS, PR_PERSONAL_TERMS_TITLE, PR_PERSONAL_TERMS_VERSION } from './PersonalizadasTerms'
import './Personalizadas.css'

const callPersonal = async (payload) => {
  const { data, error } = await supabase.functions.invoke('pr-personal-public', { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

const formatDay = (date) => new Intl.DateTimeFormat('es-UY', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const formatShort = (date) => new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
const formatTime = (value) => String(value || '').slice(0, 5)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const MIN_NOTICE_MS = 2 * 60 * 60 * 1000

function slotStartMs(slot) {
  if (!slot?.fecha || !slot?.hora_inicio) return 0
  const value = new Date(`${slot.fecha}T${formatTime(slot.hora_inicio)}:00-03:00`).getTime()
  return Number.isFinite(value) ? value : 0
}

function shiftIso(value, amount) {
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

function publishedWeek() {
  const now = new Date()
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hour12: false
  }).formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  const today = `${parts.year}-${parts.month}-${parts.day}`
  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday)
  const hour = Number(parts.hour || 0)
  const currentMondayOffset = weekday === 0 ? -6 : 1 - weekday
  let start = shiftIso(today, currentMondayOffset)
  if (weekday === 0 || (weekday === 6 && hour >= 15)) start = shiftIso(start, 7)
  return { start, end: shiftIso(start, 6) }
}

function resolveDisplayedWeek(slots) {
  const base = publishedWeek()
  const hasBase = slots.some((s) => s.fecha >= base.start && s.fecha <= base.end)
  if (hasBase) return base

  const next = { start: shiftIso(base.start, 7), end: shiftIso(base.end, 7) }
  const hasNext = slots.some((s) => s.fecha >= next.start && s.fecha <= next.end)
  return hasNext ? next : base
}

function SkateLoader({ label = 'Preparando tu PR Pass…' }) {
  return <div className="pr-loader-card"><div className="pr-loader-track"><span className="pr-loader-skate">🛼</span></div><p>{label}</p></div>
}

function TermsModal({ onClose }) {
  return (
    <div className="pr-modal-backdrop" role="dialog" aria-modal="true">
      <section className="pr-modal-card">
        <div className="pr-modal-head"><div><p className="pr-kicker">PUNTA ROLLERS · PR PERSONAL</p><h2>{PR_PERSONAL_TERMS_TITLE}</h2><span>Versión {PR_PERSONAL_TERMS_VERSION}</span></div><button onClick={onClose}>Cerrar</button></div>
        <div className="pr-terms-scroll">{PR_PERSONAL_TERMS.map((section) => <article key={section.title}><h3>{section.title}</h3>{section.paragraphs.map((p) => <p key={p}>{p}</p>)}</article>)}</div>
        <button className="pr-primary" onClick={onClose}>Entendido</button>
      </section>
    </div>
  )
}

function PassCard({ student, pass, reservedCredits = 0 }) {
  const total = Math.max(0, Number(pass?.clases_cargadas || 0))
  const used = Math.min(total, Math.max(0, Number(pass?.clases_utilizadas || 0)))
  const left = Math.max(0, Number(pass?.clases_disponibles || 0))
  const cols = total <= 2 ? 'grid-cols-2' : total <= 4 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-5'
  return (
    <section className="pr-pass-enter pr-pass-sheen relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#251010] via-[#111] to-black p-5 shadow-[0_28px_90px_rgba(0,0,0,.45)]">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/20 blur-3xl" />
      <div className="relative"><div className="flex items-center justify-between gap-4"><p className="text-[10px] font-black uppercase tracking-[.3em] text-red-300">PR PASS · PERSONAL</p><span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-black uppercase tracking-[.18em] text-white/35">Activa</span></div>
      <div className="mt-4 flex items-end justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-2xl font-black text-white">{student?.nombre || 'Alumno'} {student?.apellido || ''}</h2><p className="mt-1 text-sm text-white/45">{pass?.nombre_cuponera || `Cuponera de ${total} clases`}</p></div><div className="shrink-0 rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-right"><p className="text-[9px] font-black uppercase tracking-widest text-white/30">Te quedan</p><p className="text-2xl font-black text-white">{left}</p></div></div>
      <div className={`mt-6 grid ${cols} gap-3`}>{Array.from({ length: total }).map((_, index) => { const completed = index < used; return <div key={index} className={`pr-pass-slot relative aspect-square overflow-hidden rounded-2xl border flex items-center justify-center ${completed ? 'border-red-400/45 bg-red-500/15' : 'border-white/10 bg-white/[.035]'}`}><div className="absolute left-2 top-2 text-[8px] font-black text-white/20">{String(index + 1).padStart(2, '0')}</div>{completed ? <div className="pr-pass-stamp flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-300/80 text-[11px] font-black text-red-200">PR</div> : <div className="h-11 w-11 rounded-full border border-dashed border-white/15" />}</div> })}</div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><div><p className="text-xs text-white/35">{used} de {total} clases realizadas</p>{reservedCredits > 0 && <p className="mt-1 text-[10px] font-bold text-red-200/70">{reservedCredits} reservada{reservedCredits === 1 ? '' : 's'}</p>}</div><p className="text-[9px] font-black uppercase tracking-[.18em] text-white/25">Punta Rollers</p></div></div>
    </section>
  )
}

export default function Personalizadas() {
  const demoMode = useMemo(() => new URLSearchParams(window.location.search).get('demo') === '1', [])
  const [config, setConfig] = useState(null)
  const [phone, setPhone] = useState('')
  const [student, setStudent] = useState(null)
  const [pass, setPass] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [reservedCredits, setReservedCredits] = useState(0)
  const [bookableCredits, setBookableCredits] = useState(0)
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmed, setConfirmed] = useState([])
  const [termsOpen, setTermsOpen] = useState(false)
  const [accepted, setAccepted] = useState(() => localStorage.getItem('pr_personal_terms') === PR_PERSONAL_TERMS_VERSION)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const week = useMemo(() => resolveDisplayedWeek(slots), [slots])

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const visibleSlots = useMemo(() => slots.filter((s) => s.fecha >= week.start && s.fecha <= week.end && slotStartMs(s) >= nowTick + MIN_NOTICE_MS), [slots, week, nowTick])
  const days = useMemo(() => { const map = new Map(); visibleSlots.forEach((slot) => { if (!map.has(slot.fecha)) map.set(slot.fecha, []); map.get(slot.fecha).push(slot) }); return [...map.entries()] }, [visibleSlots])

  const loadBase = async () => {
    setLoading(true)
    const started = Date.now()
    try {
      const [{ config: cfg }, availability] = await Promise.all([callPersonal({ action: 'config', demo: demoMode }), callPersonal({ action: 'availability', demo: demoMode })])
      const wait = Math.max(0, 850 - (Date.now() - started))
      if (wait) await sleep(wait)
      setConfig(cfg); setSlots(availability?.slots || [])
    } catch (error) { setMessage(error.message || 'No pudimos cargar los turnos.') } finally { setLoading(false) }
  }
  useEffect(() => { loadBase() }, [])

  const refreshIdentity = async () => {
    const data = await callPersonal({ action: 'identify', phone, demo: demoMode })
    if (!data.found) return data
    setStudent(data.student); setPass(data.pass); setUpcoming(data.upcoming || []); setReservedCredits(Number(data.reservedCredits || 0)); setBookableCredits(Number(data.bookableCredits || 0)); return data
  }

  const identify = async (event) => {
    event.preventDefault()
    if (config?.reservas_habilitadas && !accepted) return setMessage('Primero aceptá los Términos y Condiciones de PR Personal.')
    if (config?.reservas_habilitadas) localStorage.setItem('pr_personal_terms', PR_PERSONAL_TERMS_VERSION)
    setBusy(true); setMessage(''); setConfirmed([])
    const started = Date.now()
    try {
      const data = await callPersonal({ action: 'identify', phone, demo: demoMode })
      const wait = Math.max(0, 1100 - (Date.now() - started))
      if (wait) await sleep(wait)
      if (!data.found) { setStudent(null); setPass(null); setUpcoming([]); setReservedCredits(0); setBookableCredits(0); setMessage('No encontramos una cuponera activa asociada a ese número. Escribinos por WhatsApp y te ayudamos.'); return }
      const nextUpcoming = data.upcoming || []
      setStudent(data.student); setPass(data.pass); setUpcoming(nextUpcoming); setReservedCredits(Number(data.reservedCredits || 0)); setBookableCredits(Number(data.bookableCredits || 0))
      if (!data.pass) setMessage('Te reconocimos, pero todavía no tenés una cuponera activa visible.')
      else if (!config?.reservas_habilitadas && nextUpcoming.length === 0) setMessage('No tenés próximas clases reservadas.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const toggleSlot = (slot) => {
    if (slot.ocupado || busy) return
    setMessage('')
    setSelected((current) => {
      const alreadySelected = current.some((item) => item.id === slot.id)
      if (alreadySelected) return current.filter((item) => item.id !== slot.id)
      if (current.length >= bookableCredits) {
        setMessage(`Podés seleccionar hasta ${bookableCredits} clase${bookableCredits === 1 ? '' : 's'} con tu saldo actual.`)
        return current
      }
      return [...current, slot]
    })
  }

  const reserve = async () => {
    if (selected.length === 0) return
    setBusy(true); setMessage('')
    const started = Date.now()
    const ordered = [...selected].sort((a, b) => `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`))
    const completed = []
    try {
      for (const slot of ordered) {
        const data = await callPersonal({ action: 'reserve', phone, slotId: slot.id, demo: demoMode })
        completed.push(data)
      }
      const wait = Math.max(0, 950 - (Date.now() - started))
      if (wait) await sleep(wait)
      setConfirmed(completed)
      setSelected([])
    } catch (error) {
      setConfirmed(completed)
      setSelected([])
      setMessage(completed.length > 0
        ? `Se confirmaron ${completed.length} de ${ordered.length} clases. ${error.message}`
        : error.message)
    } finally {
      await Promise.all([loadBase(), refreshIdentity()])
      setBusy(false)
    }
  }

  if (loading) return <PublicLayout><div className="px-4 py-20"><SkateLoader /></div></PublicLayout>

  return (
    <PublicLayout>
      <div className="pr-personal-shell px-4 pb-20 pt-5 space-y-6">
        <section className="pr-hero pr-hero-clean" style={{ backgroundImage: 'none' }}>
          <div className="relative z-10"><div className="flex items-start justify-between gap-3"><p className="pr-kicker">PUNTA ROLLERS · PR PERSONAL</p><span className="pr-week-pill">{formatShort(week.start)} → {formatShort(week.end)}</span></div>
          <div className="mt-8 max-w-lg"><p className="pr-hero-eyebrow">CLASES PERSONALIZADAS</p><h1>Tu entrenamiento.<br/><span>Tu horario.</span></h1><p>Tu PR Pass, tus clases y tu semana en un solo lugar. Elegí el momento. Nosotros hacemos que cuente.</p></div>
          <div className="pr-hero-skate">🛼<span /></div></div>
        </section>

        {config && !config.reservas_habilitadas && <section className="rounded-[28px] border border-red-300/20 bg-red-400/[.07] p-5">
          <p className="pr-kicker">PR PERSONAL · CONSULTA</p>
          <div className="mt-2 flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-white">Reservas cerradas</h2><p className="mt-2 text-sm leading-6 text-white/50">{config.mensaje_cerrado}</p></div><span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-red-200">CERRADAS</span></div>
          <p className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs leading-5 text-white/45">Si ya reservaste una clase, podés consultar tu horario abajo. Cerrar las reservas no borra ni modifica los turnos confirmados.</p>
        </section>}

        {!student && <form onSubmit={identify} className="pr-login-card"><div className="pr-login-icon">PR</div><div><p className="pr-kicker">{config?.reservas_habilitadas ? 'ACCESO PERSONAL' : 'CONSULTAR RESERVA'}</p><h2>{config?.reservas_habilitadas ? 'Entrá a tu PR Pass' : '¿Qué horario reservé?'}</h2><p className="pr-muted">{config?.reservas_habilitadas ? 'Usá tu documento o el mismo WhatsApp que tenés registrado en Punta Rollers.' : 'Ingresá tu documento o WhatsApp registrado para ver tus próximas clases confirmadas.'}</p></div><label>Documento o WhatsApp</label><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Ej: 48036677 o 099 123 456" />
          {config?.reservas_habilitadas && <label className="pr-terms-check"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Leí y acepto los <button type="button" onClick={() => setTermsOpen(true)}>Términos y Condiciones</button>.</span></label>}
          <button disabled={busy} className="pr-primary">{busy ? 'Buscando tu reserva…' : (config?.reservas_habilitadas ? 'Ver mi PR Pass' : 'Ver mi horario')}</button>{busy && <SkateLoader label="Buscando tu ficha…" />}</form>}

        {student && pass && <PassCard student={student} pass={pass} reservedCredits={reservedCredits} />}

        {student && upcoming.length > 0 && <section className="pr-section-card"><div className="pr-section-title"><div><p className="pr-kicker">TU AGENDA</p><h2>Próximas clases</h2></div><span>{upcoming.length}</span></div><div className="mt-4 space-y-2">{upcoming.map((item) => <div key={item.id} className="pr-upcoming"><div><strong>{formatDay(item.slot.fecha)}</strong><small>{formatTime(item.slot.hora_inicio)}–{formatTime(item.slot.hora_fin)}</small></div><b>RESERVADA</b></div>)}</div></section>}

        {config?.reservas_habilitadas && student && pass && bookableCredits > 0 && <section className="space-y-4"><div className="pr-section-title"><div><p className="pr-kicker">SEMANA PUBLICADA</p><h2>Elegí tus próximas clases</h2><p className="pr-muted">Podés seleccionar y confirmar hasta {bookableCredits} clase{bookableCredits === 1 ? '' : 's'} juntas. Los turnos dejan de estar disponibles 2 horas antes.</p></div></div>
          {days.length === 0 ? <div className="pr-empty-week"><div>🛼</div><h3>Sin turnos disponibles por ahora</h3><p>Los horarios que ya pasaron o están a menos de 2 horas de comenzar dejan de mostrarse automáticamente.</p></div> : days.map(([date, daySlots]) => <div key={date} className="pr-day-card"><div className="pr-day-head"><strong>{formatDay(date)}</strong><span>{daySlots.filter((slot) => !slot.ocupado).length} disponible{daySlots.filter((slot) => !slot.ocupado).length === 1 ? '' : 's'}</span></div><div className="pr-slot-grid">{daySlots.map((slot) => {
            const occupied = Boolean(slot.ocupado)
            const chosen = selected.some((item) => item.id === slot.id)
            return <button key={slot.id} type="button" disabled={occupied || busy} aria-pressed={chosen} onClick={() => toggleSlot(slot)} className={`${chosen ? 'is-selected' : ''} ${occupied ? 'opacity-45 cursor-not-allowed border-white/5 bg-white/[.02]' : ''}`}><span>{formatTime(slot.hora_inicio)}</span><small>{formatTime(slot.hora_inicio)} → {formatTime(slot.hora_fin)}</small><em className={occupied ? '!text-white/35' : ''}>{occupied ? 'Reservado' : chosen ? 'Seleccionado' : 'Disponible'}</em></button>
          })}</div></div>)}
          {selected.length > 0 && <div className="pr-info blue">Seleccionaste {selected.length} de {bookableCredits} clase{bookableCredits === 1 ? '' : 's'} disponibles. Podés tocar un horario nuevamente para quitarlo.</div>}
          {selected.length > 0 && <button disabled={busy} onClick={reserve} className="pr-primary pr-confirm">{busy ? `Confirmando ${selected.length} clase${selected.length === 1 ? '' : 's'}…` : `Confirmar ${selected.length} clase${selected.length === 1 ? '' : 's'}`}</button>}{busy && <SkateLoader label="Confirmando tus turnos…" />}</section>}

        {config?.reservas_habilitadas && student && pass && bookableCredits <= 0 && Number(pass.clases_disponibles) > 0 && <div className="pr-info blue">Ya tenés comprometidas todas las clases disponibles de tu PR Pass. Si querés cambiar un turno, contactanos.</div>}
        {config?.reservas_habilitadas && student && pass && Number(pass.clases_disponibles) <= 0 && <div className="pr-info amber">Tu PR Pass está completa. Contactanos para cargar una nueva.</div>}
        {confirmed.length > 0 && <div className="pr-success pr-pass-enter"><span>✓</span><p className="pr-kicker">{confirmed.length === 1 ? 'RESERVA CONFIRMADA' : 'RESERVAS CONFIRMADAS'}</p><h2>¡Nos vemos sobre ruedas!</h2><div className="mt-3 space-y-1">{confirmed.map((item) => <p key={item.reservation.id}>{formatDay(item.slot.fecha)} · {formatTime(item.slot.hora_inicio)} a {formatTime(item.slot.hora_fin)}.</p>)}</div><small>El sello de tu PR Pass se aplica cuando cada clase se marca como realizada.</small></div>}
        {message && <div className="pr-message">{message}</div>}
        <button className="pr-terms-footer" onClick={() => setTermsOpen(true)}>Términos y Condiciones · PR Personal</button>
      </div>
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </PublicLayout>
  )
}
