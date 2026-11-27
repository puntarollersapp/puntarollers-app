import PassCard from '../components/PRPersonalPassCard'
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

function PersonalAgendaStatus({closed,student}) {
 return <section className="pr-agenda-status"><div className="pr-agenda-status-icon" aria-hidden="true"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h2m4 0h2"/></svg></div><div><p className="pr-kicker">AGENDA SEMANAL</p><h2>{closed?'Reservas cerradas':'Elegí tu próxima clase'}</h2><p>{closed?'Los próximos horarios se publicarán el domingo.':'La agenda está abierta para seleccionar tus turnos.'}</p>{closed&&<small>{student?'Tus turnos confirmados se mantienen sin cambios.':'Ingresá tu WhatsApp para consultar tus reservas confirmadas.'}</small>}</div><span className={closed?'pr-agenda-tag closed':'pr-agenda-tag'}>{closed?'CERRADA':'ABIERTA'}</span></section>
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
  const [paymentPending, setPaymentPending] = useState(false)
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
    setStudent(data.student); setPass(data.pass); setUpcoming(data.upcoming || []); setReservedCredits(Number(data.reservedCredits || 0)); setBookableCredits(Number(data.bookableCredits || 0)); setPaymentPending(Boolean(data.paymentPending)); return data
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
      setStudent(data.student); setPass(data.pass); setUpcoming(nextUpcoming); setReservedCredits(Number(data.reservedCredits || 0)); setBookableCredits(Number(data.bookableCredits || 0)); setPaymentPending(Boolean(data.paymentPending))
      if (data.paymentPending) setMessage('')
      else if (!data.pass) setMessage('Te reconocimos, pero todavía no tenés una cuponera activa visible.')
      else if (!config?.reservas_habilitadas && nextUpcoming.length === 0) setMessage('No tenés próximas clases reservadas.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const toggleSlot = (slot) => {
    if (paymentPending || slot.ocupado || busy) return
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
    if (paymentPending || selected.length === 0) return
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
      <div className="pr-personal-shell pr-personal-editorial pr-personal-v3 px-4 pb-20 pt-5 space-y-6">
        <section className={student?"pr-hero pr-hero-clean pr-hero-signed":"pr-hero pr-hero-clean"}><div className="pr-personal-orbit" aria-hidden="true"/><div className="pr-personal-sun" aria-hidden="true"/><div className="pr-personal-watermark" aria-hidden="true">1:1</div>
          <div className="relative z-10"><div className="flex items-start justify-between gap-3"><p className="pr-kicker">PUNTA ROLLERS · PR PERSONAL</p><span className="pr-week-pill">{formatShort(week.start)} → {formatShort(week.end)}</span></div>
          <div className="mt-8 max-w-lg"><p className="pr-hero-eyebrow">CLASES PERSONALIZADAS</p>{student?<><h1>Tu espacio.<br/><span>Tu evolución.</span></h1><p>Gestioná tu PR Pass y tus próximos entrenamientos.</p></>:<><h1>Tu entrenamiento.<br/><span>Tu horario.</span></h1><p>Tu PR Pass, tus clases y tu semana en un solo lugar. Elegí el momento. Nosotros hacemos que cuente.</p></>}</div>
          <div className="pr-personal-hero-tags"><span>PR PASS</span><span>TRAINING 1:1</span><span>TU EVOLUCIÓN</span></div></div>
        </section>

        {config && !student && <PersonalAgendaStatus closed={!config.reservas_habilitadas} student={false}/>}

        {!student && <form onSubmit={identify} className="pr-login-card"><div className="pr-login-icon" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="8" width="26" height="17" rx="4"/><path d="M3 13h26M8 19h7M21 19h3"/></svg></div><div><p className="pr-kicker">{config?.reservas_habilitadas ? 'ACCESO PERSONAL' : 'CONSULTAR RESERVA'}</p><h2>{config?.reservas_habilitadas ? 'Entrá a tu PR Pass' : '¿Qué horario reservé?'}</h2><p className="pr-muted">{config?.reservas_habilitadas ? 'Usá el mismo WhatsApp que tenés registrado en Punta Rollers.' : 'Ingresá tu WhatsApp registrado para ver tus próximas clases confirmadas.'}</p></div><label htmlFor="pr-personal-phone">Tu WhatsApp</label><input id="pr-personal-phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Ej: 099 123 456" />
          {config?.reservas_habilitadas && <label className="pr-terms-check"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Leí y acepto los <button type="button" onClick={() => setTermsOpen(true)}>Términos y Condiciones</button>.</span></label>}
          <button disabled={busy} className="pr-primary">{busy ? 'Buscando tu reserva…' : (config?.reservas_habilitadas ? 'Ver mi PR Pass' : 'Ver mi horario')}</button>{busy && <SkateLoader label="Buscando tu ficha…" />}</form>}

        {student && paymentPending && <section role="status" style={{background:'linear-gradient(145deg,#211b24,#111317)',border:'1px solid rgba(255,120,150,.35)',borderRadius:24,padding:'28px 24px',textAlign:'center',marginBottom:22,boxShadow:'0 16px 40px rgba(0,0,0,.18)'}}><div style={{fontSize:12,letterSpacing:3,color:'#ff8ea5',fontWeight:800}}>PR PERSONAL · ESTADO DE CUENTA</div><div style={{fontSize:34,margin:'16px 0 8px'}}>🔒</div><h2 style={{fontSize:25,fontWeight:850,color:'#fff',marginBottom:10}}>Reservas pendientes de habilitación</h2><p style={{color:'#c9c1ca',lineHeight:1.7}}>Tu PR Pass tiene {Number(pass?.clases_disponibles || 0)} clases disponibles. Podés consultar los horarios publicados, pero para reservar primero necesitamos confirmar el pago.</p><div style={{marginTop:20,padding:15,borderRadius:14,background:'rgba(255,255,255,.05)',color:'#ffb7c6',fontWeight:700}}>Pago pendiente · Reservas bloqueadas</div><p style={{color:'#a9a3ae',fontSize:13,marginTop:15}}>Una vez acreditado el pago, Punta Rollers habilitará tus reservas.</p></section>}

        {student && pass && <PassCard student={student} pass={pass} reservedCredits={reservedCredits} bookableCredits={bookableCredits} paymentPending={paymentPending} />}
        {config && student && <PersonalAgendaStatus closed={!config.reservas_habilitadas} student={true}/>}

        {student && upcoming.length > 0 && <section className="pr-section-card pr-next-v3"><div className="pr-section-title"><div><p className="pr-kicker">TU AGENDA</p><h2>Próximas clases</h2></div><span>{upcoming.length}</span></div><div className="mt-4 space-y-2">{upcoming.map((item) => <div key={item.id} className="pr-upcoming"><div className="pr-next-date"><strong>{formatDay(item.slot.fecha)}</strong><small>ENTRENAMIENTO 1:1</small></div><div className="pr-next-time"><strong>{formatTime(item.slot.hora_inicio)}</strong><small>Hasta {formatTime(item.slot.hora_fin)}</small></div><b>CONFIRMADA</b></div>)}</div></section>}

        {config?.reservas_habilitadas && student && pass && (paymentPending || bookableCredits > 0) && <section className="pr-personal-calendar space-y-4"><div className="pr-section-title"><div><p className="pr-kicker">SEMANA PUBLICADA</p><h2>{paymentPending ? 'Horarios publicados' : 'Elegí tus próximas clases'}</h2><p className="pr-muted">{paymentPending ? 'Podés consultar todos los horarios disponibles. La selección y reserva se habilitarán cuando confirmemos tu pago.' : `Podés seleccionar y confirmar hasta ${bookableCredits} clase${bookableCredits === 1 ? '' : 's'} juntas. Los turnos dejan de estar disponibles 2 horas antes.`}</p></div></div>
          <div className="pr-personal-legend" aria-label="Estados de los turnos"><span><i/>Disponible</span><span><i/>Seleccionado</span><span><i/>Reservado</span></div>{days.length === 0 ? <div className="pr-empty-week"><div>🛼</div><h3>Sin turnos disponibles por ahora</h3><p>Los horarios que ya pasaron o están a menos de 2 horas de comenzar dejan de mostrarse automáticamente.</p></div> : days.map(([date, daySlots]) => <div key={date} className="pr-day-card"><div className="pr-day-head"><strong>{formatDay(date)}</strong><span>{daySlots.filter((slot) => !slot.ocupado).length} disponible{daySlots.filter((slot) => !slot.ocupado).length === 1 ? '' : 's'}</span></div><div className="pr-slot-grid">{daySlots.map((slot) => {
            const occupied = Boolean(slot.ocupado)
            const chosen = selected.some((item) => item.id === slot.id)
            return <button key={slot.id} type="button" disabled={paymentPending || occupied || busy} aria-pressed={chosen} onClick={() => toggleSlot(slot)} className={`${chosen ? 'is-selected' : ''} ${occupied ? 'is-occupied' : 'is-available'} ${paymentPending ? 'is-readonly' : ''}`}><span>{formatTime(slot.hora_inicio)}<i aria-hidden="true">{chosen?'✓':occupied?'—':paymentPending?'·':'+'}</i></span><small>Hasta {formatTime(slot.hora_fin)}</small><em className={occupied ? '!text-white/35' : ''}>{occupied ? 'Reservado' : paymentPending ? 'Disponible · solo consulta' : chosen ? 'Seleccionado' : 'Disponible'}</em></button>
          })}</div></div>)}
          {selected.length > 0 && <div className="pr-info blue pr-personal-selection" role="status">Seleccionaste {selected.length} de {bookableCredits} clase{bookableCredits === 1 ? '' : 's'} disponibles. Podés tocar un horario nuevamente para quitarlo.</div>}
          {selected.length > 0 && <button disabled={busy} onClick={reserve} className="pr-primary pr-confirm">{busy ? `Confirmando ${selected.length} clase${selected.length === 1 ? '' : 's'}…` : `Confirmar ${selected.length} clase${selected.length === 1 ? '' : 's'}`}</button>}{busy && <SkateLoader label="Confirmando tus turnos…" />}</section>}

        {config?.reservas_habilitadas && student && pass && !paymentPending && bookableCredits <= 0 && Number(pass.clases_disponibles) > 0 && <div className="pr-info blue">Ya tenés comprometidas todas las clases disponibles de tu PR Pass. Si querés cambiar un turno, contactanos.</div>}
        {config?.reservas_habilitadas && student && pass && Number(pass.clases_disponibles) <= 0 && <div className="pr-info amber">Tu PR Pass está completa. Contactanos para cargar una nueva.</div>}
        {confirmed.length > 0 && <div className="pr-success pr-pass-enter pr-confirm-v3" role="status"><span>✓</span><p className="pr-kicker">{confirmed.length === 1 ? 'RESERVA CONFIRMADA' : 'RESERVAS CONFIRMADAS'}</p><h2>¡Nos vemos sobre ruedas!</h2><div className="pr-confirm-tickets">{confirmed.map((item) => <article key={item.reservation.id}><div><small>PR PERSONAL · RESERVA</small><strong>{formatDay(item.slot.fecha)}</strong></div><b>{formatTime(item.slot.hora_inicio)}–{formatTime(item.slot.hora_fin)}</b><span aria-hidden="true">✓</span></article>)}</div><small>El sello de tu PR Pass se aplica cuando cada clase se marca como realizada.</small></div>}
        {message && <div className="pr-message">{message}</div>}
        <button className="pr-terms-footer" onClick={() => setTermsOpen(true)}>Términos y Condiciones · PR Personal</button>
      </div>
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </PublicLayout>
  )
}
