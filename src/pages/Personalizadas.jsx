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
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmed, setConfirmed] = useState(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [accepted, setAccepted] = useState(() => localStorage.getItem('pr_personal_terms') === PR_PERSONAL_TERMS_VERSION)
  const week = useMemo(() => resolveDisplayedWeek(slots), [slots])

  const visibleSlots = useMemo(() => slots.filter((s) => s.fecha >= week.start && s.fecha <= week.end), [slots, week])
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
    if (!accepted) return setMessage('Primero aceptá los Términos y Condiciones de PR Personal.')
    localStorage.setItem('pr_personal_terms', PR_PERSONAL_TERMS_VERSION)
    setBusy(true); setMessage(''); setConfirmed(null)
    const started = Date.now()
    try {
      const data = await callPersonal({ action: 'identify', phone, demo: demoMode })
      const wait = Math.max(0, 1100 - (Date.now() - started))
      if (wait) await sleep(wait)
      if (!data.found) { setStudent(null); setPass(null); setUpcoming([]); setReservedCredits(0); setBookableCredits(0); setMessage('No encontramos una cuponera activa asociada a ese número. Escribinos por WhatsApp y te ayudamos.'); return }
      setStudent(data.student); setPass(data.pass); setUpcoming(data.upcoming || []); setReservedCredits(Number(data.reservedCredits || 0)); setBookableCredits(Number(data.bookableCredits || 0))
      if (!data.pass) setMessage('Te reconocimos, pero todavía no tenés una cuponera activa visible.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const reserve = async () => {
    if (!selected) return
    setBusy(true); setMessage('')
    const started = Date.now()
    try {
      const data = await callPersonal({ action: 'reserve', phone, slotId: selected.id, demo: demoMode })
      const wait = Math.max(0, 950 - (Date.now() - started))
      if (wait) await sleep(wait)
      setConfirmed(data); setSelected(null); await Promise.all([loadBase(), refreshIdentity()])
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  if (loading) return <PublicLayout><div className="px-4 py-20"><SkateLoader /></div></PublicLayout>
  if (config && !config.reservas_habilitadas) return <PublicLayout><div className="min-h-[72vh] px-5 py-16 flex items-center"><section className="w-full rounded-[32px] border border-white/10 bg-white/[.04] p-7 text-center"><p className="pr-kicker">PR PERSONAL</p><div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-3xl">🛼</div><h1 className="mt-6 text-3xl font-black text-white">Reservas cerradas</h1><p className="mx-auto mt-3 max-w-sm text-sm text-white/50">{config.mensaje_cerrado}</p></section></div></PublicLayout>

  return (
    <PublicLayout>
      <div className="pr-personal-shell px-4 pb-20 pt-5 space-y-6">
        <section className="pr-hero pr-hero-clean" style={{ backgroundImage: 'none' }}>
          <div className="relative z-10"><div className="flex items-start justify-between gap-3"><p className="pr-kicker">PUNTA ROLLERS · PR PERSONAL</p><span className="pr-week-pill">{formatShort(week.start)} → {formatShort(week.end)}</span></div>
          <div className="mt-8 max-w-lg"><p className="pr-hero-eyebrow">CLASES PERSONALIZADAS</p><h1>Tu entrenamiento.<br/><span>Tu horario.</span></h1><p>Tu PR Pass, tus clases y tu semana en un solo lugar. Elegí el momento. Nosotros hacemos que cuente.</p></div>
          <div className="pr-hero-skate">🛼<span /></div></div>
        </section>

        {!student && <form onSubmit={identify} className="pr-login-card"><div className="pr-login-icon">PR</div><div><p className="pr-kicker">ACCESO PERSONAL</p><h2>Entrá a tu PR Pass</h2><p className="pr-muted">Usá el mismo WhatsApp que tenés registrado en Punta Rollers.</p></div><label>Tu WhatsApp</label><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Ej: 099 123 456" />
          <label className="pr-terms-check"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Leí y acepto los <button type="button" onClick={() => setTermsOpen(true)}>Términos y Condiciones</button>.</span></label>
          <button disabled={busy} className="pr-primary">{busy ? 'Buscando tu PR Pass…' : 'Ver mi PR Pass'}</button>{busy && <SkateLoader label="Buscando tu ficha…" />}</form>}

        {student && pass && <PassCard student={student} pass={pass} reservedCredits={reservedCredits} />}

        {student && upcoming.length > 0 && <section className="pr-section-card"><div className="pr-section-title"><div><p className="pr-kicker">TU AGENDA</p><h2>Próximas clases</h2></div><span>{upcoming.length}</span></div><div className="mt-4 space-y-2">{upcoming.map((item) => <div key={item.id} className="pr-upcoming"><div><strong>{formatDay(item.slot.fecha)}</strong><small>{formatTime(item.slot.hora_inicio)}–{formatTime(item.slot.hora_fin)}</small></div><b>RESERVADA</b></div>)}</div></section>}

        {student && pass && bookableCredits > 0 && <section className="space-y-4"><div className="pr-section-title"><div><p className="pr-kicker">SEMANA PUBLICADA</p><h2>Elegí tu próxima clase</h2><p className="pr-muted">Podés reservar {bookableCredits} clase{bookableCredits === 1 ? '' : 's'} más.</p></div></div>
          {days.length === 0 ? <div className="pr-empty-week"><div>🛼</div><h3>Horarios aún no publicados</h3><p>Estamos armando la próxima semana. Cuando Punta Rollers publique los primeros turnos, van a aparecer acá automáticamente.</p></div> : days.map(([date, daySlots]) => <div key={date} className="pr-day-card"><div className="pr-day-head"><strong>{formatDay(date)}</strong><span>{daySlots.length} turno{daySlots.length === 1 ? '' : 's'}</span></div><div className="pr-slot-grid">{daySlots.map((slot) => <button key={slot.id} onClick={() => setSelected(slot)} className={selected?.id === slot.id ? 'is-selected' : ''}><span>{formatTime(slot.hora_inicio)}</span><small>{formatTime(slot.hora_inicio)} → {formatTime(slot.hora_fin)}</small><em>Disponible</em></button>)}</div></div>)}
          {selected && <button disabled={busy} onClick={reserve} className="pr-primary pr-confirm">{busy ? 'Confirmando…' : `Reservar ${formatDay(selected.fecha)} · ${formatTime(selected.hora_inicio)}`}</button>}{busy && <SkateLoader label="Confirmando tu turno…" />}</section>}

        {student && pass && bookableCredits <= 0 && Number(pass.clases_disponibles) > 0 && <div className="pr-info blue">Ya tenés comprometidas todas las clases disponibles de tu PR Pass. Si querés cambiar un turno, contactanos.</div>}
        {student && pass && Number(pass.clases_disponibles) <= 0 && <div className="pr-info amber">Tu PR Pass está completa. Contactanos para cargar una nueva.</div>}
        {confirmed && <div className="pr-success pr-pass-enter"><span>✓</span><p className="pr-kicker">RESERVA CONFIRMADA</p><h2>¡Nos vemos sobre ruedas!</h2><p>{formatDay(confirmed.slot.fecha)} · {formatTime(confirmed.slot.hora_inicio)} a {formatTime(confirmed.slot.hora_fin)}.</p><small>El sello de tu PR Pass se aplica cuando la clase se marca como realizada.</small></div>}
        {message && <div className="pr-message">{message}</div>}
        <button className="pr-terms-footer" onClick={() => setTermsOpen(true)}>Términos y Condiciones · PR Personal</button>
      </div>
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </PublicLayout>
  )
}
