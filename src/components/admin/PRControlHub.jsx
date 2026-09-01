import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const AREA = {
  alumnos: { accent: '#e7c76b', soft: 'rgba(231,199,107,.11)', border: 'rgba(231,199,107,.22)' },
  personal: { accent: '#ff6b6b', soft: 'rgba(255,107,107,.10)', border: 'rgba(255,107,107,.22)' },
  inscripciones: { accent: '#64d98b', soft: 'rgba(100,217,139,.10)', border: 'rgba(100,217,139,.22)' },
  accesos: { accent: '#6ec8ff', soft: 'rgba(110,200,255,.10)', border: 'rgba(110,200,255,.22)' },
  admin: { accent: '#ffad5b', soft: 'rgba(255,173,91,.10)', border: 'rgba(255,173,91,.22)' },
  comunidad: { accent: '#bc8cff', soft: 'rgba(188,140,255,.10)', border: 'rgba(188,140,255,.22)' },
}

function localDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthStatus(value) {
  const d = value ? new Date(`${value}T23:59:59`) : null
  if (!d || Number.isNaN(d.getTime())) return 'missing'
  return d.getTime() < Date.now() ? 'expired' : 'ok'
}

function montevideoToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function mondayFor(value) {
  const d = new Date(`${value}T12:00:00Z`)
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - weekday + 1)
  return d.toISOString().slice(0, 10)
}

function shiftIso(value, amount) {
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

function SectionCard({ tone, icon, title, description, meta, alert, children, onClick }) {
  const c = AREA[tone]
  return (
    <article
      onClick={onClick}
      className={`rounded-[28px] border p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] ${onClick ? 'cursor-pointer active:scale-[.99]' : ''}`}
      style={{ borderColor: c.border, background: `linear-gradient(145deg, ${c.soft}, rgba(255,255,255,.018))` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl" style={{ borderColor: c.border, background: c.soft }}>{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: c.accent }}>{title}</p>
            <p className="mt-1 text-sm leading-5 text-white/45">{description}</p>
          </div>
        </div>
        <span className="text-xl text-white/25">→</span>
      </div>
      {(meta || alert) && <div className="mt-5 flex flex-wrap items-center gap-2">
        {meta && <span className="rounded-full border border-white/8 bg-black/25 px-3 py-1.5 text-[10px] font-black text-white/55">{meta}</span>}
        {alert && <span className="rounded-full px-3 py-1.5 text-[10px] font-black" style={{ color: c.accent, background: c.soft }}>{alert}</span>}
      </div>}
      {children}
    </article>
  )
}

function MiniAction({ label, onClick }) {
  return <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-[11px] font-black text-white/65 active:scale-[.98]">{label}</button>
}

export default function PRControlHub() {
  const { user } = useAuth()
  const [open, setOpen] = useState(true)
  const [view, setView] = useState('inicio')
  const [quickOpen, setQuickOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [profiles, setProfiles] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [accessRequests, setAccessRequests] = useState([])
  const [personalReservations, setPersonalReservations] = useState([])
  const [personalPasses, setPersonalPasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const today = montevideoToday()
      const weekStart = mondayFor(today)
      const weekEnd = shiftIso(weekStart, 6)
      const [profilesResult, regResult, accessResult, slotsResult, passResult] = await Promise.all([
        supabase.from('profiles').select('id,nombre,apellido,telefono,documento,role,ultimo_ingreso,mensualidad_hasta,prcard_activa,acceso_habilitado,particulares_habilitadas').order('nombre'),
        supabase.from('pr_inscripciones_2026').select('id,modalidad,nombre_completo,telefono,estado,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.functions.invoke('pr-access-admin', { body: { action: 'list' } }),
        supabase.from('pr_personal_disponibilidad').select('id,fecha,hora_inicio,hora_fin').gte('fecha', weekStart).lte('fecha', weekEnd),
        supabase.from('cuponeras_particulares').select('id,alumno_id,clases_disponibles,habilitada,visible_al_alumno,estado')
      ])

      let reservations = []
      const slotIds = (slotsResult.data || []).map((s) => s.id)
      if (slotIds.length) {
        const res = await supabase.from('pr_personal_reservas').select('id,disponibilidad_id,alumno_id,estado').in('disponibilidad_id', slotIds).in('estado', ['reservada','realizada','ausente'])
        reservations = res.data || []
      }

      if (!alive) return
      setProfiles(profilesResult.data || [])
      setRegistrations(regResult.data || [])
      setAccessRequests(accessResult.data?.requests || [])
      setPersonalReservations(reservations)
      setPersonalPasses(passResult.data || [])
      setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => { alive = false }
  }, [])

  const students = useMemo(() => profiles.filter((p) => p.role === 'alumno'), [profiles])
  const pendingAccess = accessRequests.filter((r) => r.estado === 'pendiente' || r.estado === 'perfil_creado').length
  const pendingRegistrations = registrations.filter((r) => !['confirmado','pago_verificado','cancelado'].includes(r.estado)).length
  const pendingPersonalRegs = registrations.filter((r) => r.modalidad === 'personalizadas' && !['confirmado','pago_verificado','cancelado'].includes(r.estado)).length
  const expiredPayments = students.filter((p) => monthStatus(p.mensualidad_hasta) === 'expired').length
  const activePasses = personalPasses.filter((p) => p.habilitada && p.visible_al_alumno && Number(p.clases_disponibles || 0) > 0).length
  const attentionTotal = pendingAccess + pendingRegistrations + expiredPayments

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return profiles.filter((p) => `${p.nombre || ''} ${p.apellido || ''} ${p.telefono || ''} ${p.documento || ''}`.toLowerCase().includes(q)).slice(0, 6)
  }, [profiles, query])

  function clickLegacy(label) {
    setOpen(false)
    setQuickOpen(false)
    window.setTimeout(() => {
      const buttons = [...document.querySelectorAll('button')]
      const target = buttons.find((b) => b.textContent?.trim().toLowerCase() === label.toLowerCase())
        || buttons.find((b) => b.textContent?.toLowerCase().includes(label.toLowerCase()))
      if (target) target.click()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 80)
  }

  function go(path) {
    window.location.href = path
  }

  if (!open) {
    return <button type="button" onClick={() => { setOpen(true); setView('inicio') }} className="fixed left-4 top-4 z-[210] rounded-2xl border border-pr-gold/25 bg-[#15130d]/95 px-4 py-3 text-xs font-black text-pr-gold shadow-2xl backdrop-blur-xl">← PR Control</button>
  }

  const home = <>
    <section className="rounded-[30px] border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.018] p-5 shadow-[0_30px_90px_rgba(0,0,0,.36)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-pr-gold">PR CONTROL</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-white">Hola, {user?.nombre || 'Admin'} 👋🏻</h1>
          <p className="mt-2 text-sm text-white/40">Todo Punta Rollers, ordenado para resolver más rápido.</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-black text-white/35">Panel clásico</button>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 p-4">
        <span className={`h-2.5 w-2.5 rounded-full ${attentionTotal ? 'bg-amber-300' : 'bg-emerald-300'}`} />
        <div><p className="text-sm font-black text-white">{attentionTotal ? `${attentionTotal} cosas necesitan tu atención` : 'Todo al día'}</p><p className="text-[11px] text-white/35">{loading ? 'Actualizando estado…' : 'Datos actuales del panel administrativo'}</p></div>
      </div>
    </section>

    <section className="relative">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3.5">
        <span>🔎</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar alumno por nombre, teléfono o documento…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />{query && <button onClick={() => setQuery('')} className="text-xs font-black text-white/30">✕</button>}
      </div>
      {searchResults.length > 0 && <div className="absolute left-0 right-0 top-[58px] z-20 rounded-3xl border border-white/10 bg-[#111]/98 p-2 shadow-2xl backdrop-blur-xl">
        {searchResults.map((p) => <button key={p.id} onClick={() => { setQuery(''); clickLegacy('Usuarios') }} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left active:bg-white/[.05]"><div><p className="text-sm font-black text-white">{p.nombre} {p.apellido}</p><p className="mt-1 text-[10px] text-white/35">{p.telefono || p.documento || 'Alumno Punta Rollers'}</p></div><span className="text-white/25">→</span></button>)}
      </div>}
    </section>

    {(pendingAccess > 0 || pendingRegistrations > 0 || expiredPayments > 0) && <section>
      <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-200">ATENCIÓN HOY</p><p className="mt-1 text-xs text-white/30">Primero lo que necesita una decisión tuya.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {pendingAccess > 0 && <button onClick={() => go('/admin/nuevos-accesos')} className="rounded-3xl border border-sky-300/20 bg-sky-400/[.075] p-4 text-left"><p className="text-2xl">🔐</p><p className="mt-3 text-2xl font-black text-white">{pendingAccess}</p><p className="text-xs font-black text-sky-200">Accesos pendientes</p><p className="mt-1 text-[10px] text-white/35">Crear perfil o habilitar acceso</p></button>}
        {pendingRegistrations > 0 && <button onClick={() => go('/admin/inscripciones-2026')} className="rounded-3xl border border-emerald-300/20 bg-emerald-400/[.075] p-4 text-left"><p className="text-2xl">🛼</p><p className="mt-3 text-2xl font-black text-white">{pendingRegistrations}</p><p className="text-xs font-black text-emerald-200">Inscripciones pendientes</p><p className="mt-1 text-[10px] text-white/35">Revisar nuevos ingresos</p></button>}
        {expiredPayments > 0 && <button onClick={() => clickLegacy('Pagos')} className="rounded-3xl border border-orange-300/20 bg-orange-400/[.075] p-4 text-left"><p className="text-2xl">💳</p><p className="mt-3 text-2xl font-black text-white">{expiredPayments}</p><p className="text-xs font-black text-orange-200">Mensualidades vencidas</p><p className="mt-1 text-[10px] text-white/35">Revisar pagos</p></button>}
      </div>
    </section>}

    <section>
      <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[.22em] text-white/35">ÁREAS DE GESTIÓN</p><p className="mt-1 text-xs text-white/25">Cada color identifica siempre el mismo universo.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SectionCard tone="alumnos" icon="👥" title="ALUMNOS" description="Perfiles, grupos, progreso, objetivos y actividad." meta={`${students.length} alumnos`} onClick={() => setView('alumnos')} />
        <SectionCard tone="personal" icon="🎟️" title="PR PERSONAL" description="Reservas, horarios, PR Pass, cuponeras e historial." meta={`${personalReservations.length} reservas esta semana`} alert={pendingPersonalRegs ? `${pendingPersonalRegs} preinscripciones` : null} onClick={() => setView('personal')} />
        <SectionCard tone="inscripciones" icon="🛼" title="INSCRIPCIONES" description="Adultos, Personalizadas, PR Kids y clínicas." meta={`${registrations.length} registros`} alert={pendingRegistrations ? `${pendingRegistrations} pendientes` : 'Todo revisado'} onClick={() => setView('gestion')} />
        <SectionCard tone="accesos" icon="🔐" title="ACCESOS" description="Bienvenida, creación de perfil, activación y PR Card." meta={`${accessRequests.length} solicitudes`} alert={pendingAccess ? `${pendingAccess} por resolver` : 'Todo al día'} onClick={() => setView('gestion')} />
        <SectionCard tone="admin" icon="💳" title="ADMINISTRACIÓN" description="Pagos, mensualidades, cupos, contactos, tienda y config." alert={expiredPayments ? `${expiredPayments} vencidas` : 'Sin alertas'} onClick={() => setView('mas')} />
        <SectionCard tone="comunidad" icon="🏆" title="COMUNIDAD & ACTIVIDAD" description="Insignias, eventos, observaciones y herramientas de seguimiento." onClick={() => setView('comunidad')} />
      </div>
    </section>
  </>

  const alumnosView = <AreaPage title="Alumnos" subtitle="Todo lo relacionado con perfiles y evolución." tone="alumnos" onBack={() => setView('inicio')}>
    <Tool title="Perfiles y alumnos" desc="Buscar, editar y administrar fichas." onClick={() => clickLegacy('Usuarios')} />
    <Tool title="Grupos" desc="Organizar alumnos y grupos de clase." onClick={() => clickLegacy('Grupos')} />
    <Tool title="Performance" desc="Tomas, tiempos y evolución técnica." onClick={() => clickLegacy('Performance')} />
    <Tool title="Objetivos" desc="Crear y seguir objetivos por alumno." onClick={() => clickLegacy('Objetivos')} />
  </AreaPage>

  const personalView = <AreaPage title="PR Personal" subtitle="Clases 1 a 1 y PR Pass, todo junto." tone="personal" onBack={() => setView('inicio')}>
    <div className="grid grid-cols-2 gap-3"><StatBox label="Reservas semana" value={personalReservations.length} /><StatBox label="PR Pass activos" value={activePasses} /></div>
    <Tool title="Agenda y horarios" desc="Reservas semanales y publicación de turnos." onClick={() => go('/admin/personalizadas')} />
    <Tool title="Cuponeras e historial" desc="Clases restantes, historial y alumnos Personal." onClick={() => clickLegacy('Particulares')} />
    <Tool title="Preinscripciones" desc="Personas nuevas interesadas en Personalizadas." badge={pendingPersonalRegs ? `${pendingPersonalRegs} pendientes` : null} onClick={() => go('/admin/inscripciones-2026')} />
  </AreaPage>

  const gestionView = <AreaPage title="Gestión" subtitle="Nuevos ingresos, accesos y seguimiento." tone="inscripciones" onBack={() => setView('inicio')}>
    <Tool title="Inscripciones 2026" desc="Adultos, Personalizadas, Kids y clínica." badge={pendingRegistrations ? `${pendingRegistrations} pendientes` : null} onClick={() => go('/admin/inscripciones-2026')} />
    <Tool title="Nuevos accesos" desc="Solicitud → perfil → acceso activo." badge={pendingAccess ? `${pendingAccess} por resolver` : null} onClick={() => go('/admin/nuevos-accesos')} />
    <Tool title="Pagos" desc="Mensualidades, vencimientos y comprobantes." onClick={() => clickLegacy('Pagos')} />
  </AreaPage>

  const comunidadView = <AreaPage title="Comunidad" subtitle="Seguimiento, logros y participación PR." tone="comunidad" onBack={() => setView('inicio')}>
    <Tool title="Acciones" desc="Observaciones, insignias y participaciones." onClick={() => clickLegacy('Acciones')} />
    <Tool title="Eventos" desc="Gestionar eventos y participaciones." onClick={() => clickLegacy('Eventos')} />
    <Tool title="Objetivos" desc="Seguimiento individual de metas." onClick={() => clickLegacy('Objetivos')} />
    <Tool title="Performance" desc="Evolución y rendimiento." onClick={() => clickLegacy('Performance')} />
  </AreaPage>

  const masView = <AreaPage title="Más herramientas" subtitle="Todo sigue disponible, sin ocupar espacio en tu día a día." tone="admin" onBack={() => setView('inicio')}>
    <Tool title="Pagos" desc="Mensualidades y estado de cobros." onClick={() => clickLegacy('Pagos')} />
    <Tool title="Contactos" desc="Directorio y contactos administrativos." onClick={() => clickLegacy('Contactos')} />
    <Tool title="Tienda" desc="Productos y gestión de tienda." onClick={() => clickLegacy('Tienda')} />
    <Tool title="Cupos" desc="Capacidad y cupos de grupos." onClick={() => clickLegacy('Cupos')} />
    <Tool title="Configuración" desc="Opciones generales del sistema." onClick={() => clickLegacy('Config')} />
    <Tool title="Panel clásico completo" desc="Acceso a todas las herramientas originales." onClick={() => setOpen(false)} />
  </AreaPage>

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#080809] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6">
        <div className="space-y-5">{view === 'inicio' ? home : view === 'alumnos' ? alumnosView : view === 'personal' ? personalView : view === 'gestion' ? gestionView : view === 'comunidad' ? comunidadView : masView}</div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-[205] w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-[26px] border border-white/10 bg-[#111]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,.6)] backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          <NavButton active={view === 'inicio'} icon="⌂" label="Inicio" onClick={() => setView('inicio')} />
          <NavButton active={view === 'alumnos'} icon="👥" label="Alumnos" onClick={() => setView('alumnos')} />
          <NavButton active={view === 'personal'} icon="🎟️" label="Personal" onClick={() => setView('personal')} />
          <NavButton active={view === 'gestion'} icon="✓" label="Gestión" onClick={() => setView('gestion')} />
          <NavButton active={view === 'mas' || view === 'comunidad'} icon="•••" label="Más" onClick={() => setView('mas')} />
        </div>
      </div>

      <button onClick={() => setQuickOpen(true)} className="fixed bottom-[88px] right-5 z-[206] flex h-14 w-14 items-center justify-center rounded-full bg-pr-gold text-xl font-black text-black shadow-[0_16px_50px_rgba(0,0,0,.6)] active:scale-[.96]">⚡</button>

      {quickOpen && <div className="fixed inset-0 z-[220] flex items-end bg-black/70 p-3 backdrop-blur-sm" onClick={() => setQuickOpen(false)}>
        <div onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-xl rounded-[30px] border border-white/10 bg-[#111] p-5 shadow-2xl">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-pr-gold">ACCIÓN RÁPIDA</p><h2 className="mt-1 text-2xl font-black">¿Qué querés hacer?</h2></div><button onClick={() => setQuickOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/40">Cerrar</button></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <QuickTile icon="👤" label="Crear alumno" onClick={() => clickLegacy('Usuarios')} />
            <QuickTile icon="💳" label="Registrar pago" onClick={() => clickLegacy('Pagos')} />
            <QuickTile icon="🎟️" label="Cargar cuponera" onClick={() => clickLegacy('Particulares')} />
            <QuickTile icon="🗓️" label="Publicar horarios" onClick={() => go('/admin/personalizadas')} />
            <QuickTile icon="🏆" label="Dar insignia" onClick={() => clickLegacy('Acciones')} />
            <QuickTile icon="🔐" label="Nuevos accesos" onClick={() => go('/admin/nuevos-accesos')} />
          </div>
        </div>
      </div>}
    </div>
  )
}

function AreaPage({ title, subtitle, tone, onBack, children }) {
  const c = AREA[tone]
  return <><section className="rounded-[30px] border p-5" style={{ borderColor: c.border, background: `linear-gradient(145deg, ${c.soft}, rgba(255,255,255,.02))` }}><button onClick={onBack} className="text-xs font-black text-white/35">← PR Control</button><p className="mt-6 text-[10px] font-black uppercase tracking-[.24em]" style={{ color: c.accent }}>PUNTA ROLLERS · ADMIN</p><h1 className="mt-1 text-4xl font-black tracking-[-.04em]">{title}</h1><p className="mt-2 text-sm text-white/40">{subtitle}</p></section><div className="space-y-3">{children}</div></>
}

function Tool({ title, desc, badge, onClick }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[.035] p-4 text-left active:scale-[.99]"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-white">{title}</h3>{badge && <span className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-black text-white/50">{badge}</span>}</div><p className="mt-1 text-xs leading-5 text-white/35">{desc}</p></div><span className="text-xl text-white/20">→</span></button>
}
function StatBox({ label, value }) { return <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">{label}</p><p className="mt-1 text-3xl font-black text-white">{value}</p></div> }
function NavButton({ active, icon, label, onClick }) { return <button onClick={onClick} className={`rounded-2xl px-1 py-2 text-center ${active ? 'bg-white/[.08]' : ''}`}><span className="block text-base">{icon}</span><span className={`mt-1 block text-[9px] font-black ${active ? 'text-white' : 'text-white/30'}`}>{label}</span></button> }
function QuickTile({ icon, label, onClick }) { return <button onClick={onClick} className="rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left active:scale-[.98]"><span className="text-xl">{icon}</span><p className="mt-3 text-xs font-black text-white">{label}</p></button> }
