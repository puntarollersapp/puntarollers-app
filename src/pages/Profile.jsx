import { useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  mockUser,
  contactosPR,
  insignias,
  notificaciones,
  observaciones,
  participaciones,
  profesores,
} from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const fmtDate = (date) => {
  if (!date) return 'Sin fecha'
  return new Date(date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function findProfesor(id) {
  return profesores.find(p => p.id === id) || profesores[0]
}

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold align-middle"
      style={{ background: 'linear-gradient(135deg,#1d9bf0,#5ab8ff)', boxShadow: '0 0 0 2px rgba(29,155,240,.18)' }}
      title="Miembro verificado por Punta Rollers"
    >
      ✓
    </span>
  )
}

function Avatar({ name, src, size = 'md', subtle = false }) {
  const sizes = {
    sm: 'w-9 h-9 text-xs rounded-full',
    md: 'w-14 h-14 text-lg rounded-full',
    lg: 'w-24 h-24 text-2xl rounded-full',
  }
  return (
    <div
      className={`${sizes[size]} shrink-0 overflow-hidden flex items-center justify-center font-display font-bold`}
      style={{
        background: subtle ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,rgba(201,168,76,.26),rgba(255,255,255,.06))',
        border: '1px solid rgba(201,168,76,.28)',
        color: '#E7D38A',
      }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : getInitials(name)}
    </div>
  )
}

function StatusPill({ active, labelActive, labelInactive }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: active ? 'rgba(78,203,139,.12)' : 'rgba(255,255,255,.05)',
        border: `1px solid ${active ? 'rgba(78,203,139,.28)' : 'rgba(255,255,255,.08)'}`,
        color: active ? '#76e0ad' : 'rgba(216,216,232,.48)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#76e0ad' : 'rgba(216,216,232,.35)' }} />
      {active ? labelActive : labelInactive}
    </span>
  )
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>
  )
}

function Accordion({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <SectionCard>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          {typeof count !== 'undefined' && <p className="section-label mt-1">{count}</p>}
        </div>
        <span className="text-pr-gold text-xl">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-4 space-y-3 animate-fade-in">{children}</div>}
    </SectionCard>
  )
}

function ObservationCard({ obs, onReact }) {
  const profe = findProfesor(obs.autor_id)
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex gap-3">
        <Avatar name={profe.nombre} src={profe.foto_url} size="sm" subtle />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{profe.nombre}</p>
              <p className="text-[11px] text-white/35">{fmtDate(obs.fecha)} · {obs.tipo}</p>
            </div>
            {obs.reaccion && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/45">
                {obs.reaccion === 'motivo' ? '❤️ Me motivó' : '👍 Recibido'}
              </span>
            )}
          </div>
          <h4 className="mt-3 font-body font-semibold text-pr-gold">{obs.titulo}</h4>
          <p className="mt-1 text-sm leading-relaxed text-white/60 whitespace-pre-line">{obs.descripcion}</p>
          {obs.imagen_url && (
            <img src={obs.imagen_url} alt="Adjunto" className="mt-3 mx-auto max-h-44 rounded-xl object-cover border border-white/10" />
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={() => onReact(obs.id, 'recibido')} className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white/60 border border-white/10">👍 Recibido</button>
            <button onClick={() => onReact(obs.id, 'motivo')} className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white/60 border border-white/10">❤️ Me motivó</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InsigniaCard({ badge, locked = false }) {
  const profe = badge.otorgada_por_id ? findProfesor(badge.otorgada_por_id) : null
  const official = badge.tipo === 'oficial'
  return (
    <div
      className="rounded-2xl p-3 overflow-hidden relative"
      style={{
        background: locked
          ? 'rgba(255,255,255,.025)'
          : official
            ? 'linear-gradient(150deg,rgba(201,168,76,.16),rgba(255,255,255,.035))'
            : 'linear-gradient(150deg,rgba(88,166,255,.13),rgba(196,88,255,.08))',
        border: locked ? '1px dashed rgba(255,255,255,.10)' : '1px solid rgba(201,168,76,.16)',
        opacity: locked ? 0.72 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: locked ? 'rgba(255,255,255,.04)' : (official ? 'rgba(201,168,76,.15)' : 'rgba(88,166,255,.14)'), border: '1px solid rgba(255,255,255,.08)' }}>
          {badge.imagen_url ? <img src={badge.imagen_url} alt="" className="w-10 h-10 object-contain" /> : <span className="text-xl">{locked ? '🔒' : '🏅'}</span>}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white leading-tight">{badge.nombre}</p>
          <p className="text-xs text-white/45 leading-snug mt-1">{badge.descripcion}</p>
          {!locked && profe && (
            <p className="text-[11px] text-white/32 mt-2">Otorgada por {profe.nombre} · {fmtDate(badge.fecha)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationItem({ n }) {
  return (
    <div className="flex gap-3 rounded-xl p-3" style={{ background: n.leida ? 'rgba(255,255,255,.025)' : 'rgba(201,168,76,.07)', border: '1px solid rgba(255,255,255,.06)' }}>
      <span className="mt-0.5">{n.tipo === 'insignia' ? '🏅' : n.tipo === 'observacion' ? '📝' : n.tipo === 'participacion' ? '🎉' : n.tipo === 'aviso' ? '📢' : '🔔'}</span>
      <div>
        <p className="text-sm font-semibold text-white">{n.titulo}</p>
        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{n.descripcion}</p>
        <p className="text-[11px] text-white/28 mt-1">{fmtDate(n.fecha)}</p>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const u = user || mockUser
  const [obsList, setObsList] = useState(observaciones)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('pr_onboarding_seen'))

  const unlocked = insignias.filter(i => i.desbloqueada)
  const lockedPreview = insignias.filter(i => !i.desbloqueada).slice(0, 3)
  const latestObs = obsList[0]
  const latestBadge = unlocked[unlocked.length - 1]
  const unread = notificaciones.filter(n => !n.leida).length
  const groups = u.grupos || ['Parada 2']

  const reactToObs = (id, reaction) => {
    setObsList(list => list.map(obs => obs.id === id ? { ...obs, reaccion: reaction } : obs))
  }

  const closeOnboarding = () => {
    localStorage.setItem('pr_onboarding_seen', '1')
    setShowOnboarding(false)
  }

  return (
    <AppLayout title="Mi Perfil" showBack>
      <div className="px-4 pt-4 pb-8 space-y-4">
        {showOnboarding && (
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl p-5" style={{ background: 'linear-gradient(160deg,#121212,#08080d)', border: '1px solid rgba(201,168,76,.18)' }}>
              <p className="section-label">Bienvenido a Punta Rollers</p>
              <h2 className="font-display text-2xl text-white mt-2">No es solo patinar, es pertenecer.</h2>
              <p className="text-sm text-white/55 leading-relaxed mt-3">
                Este es tu espacio PR: acá vas a ver observaciones de tus entrenadores, insignias, eventos en los que participaste, contactos y novedades importantes.
              </p>
              <div className="mt-4 rounded-2xl p-3 bg-white/5 border border-white/10 text-sm text-white/55">
                Te recomendamos completar tu foto, banner e Instagram para que tu perfil se sienta más tuyo.
              </div>
              <button onClick={closeOnboarding} className="btn-gold w-full mt-5">Entendido</button>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-3xl border border-white/10" style={{ background: 'rgba(255,255,255,.03)' }}>
          <div className="h-36 relative" style={{ background: u.banner_url ? undefined : 'linear-gradient(135deg,rgba(201,168,76,.20),rgba(26,107,74,.16),rgba(5,5,8,1))' }}>
            {u.banner_url && <img src={u.banner_url} alt="Banner" className="w-full h-full object-cover" />}
            <button className="absolute right-3 top-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/35 border border-white/10 text-white/70">Cambiar banner</button>
          </div>
          <div className="px-5 pb-5 -mt-12 relative z-10">
            <button className="block relative">
              <Avatar name={u.nombre} src={u.foto_url} size="lg" />
              <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-pr-gold text-pr-black flex items-center justify-center text-xs font-bold border-2 border-pr-black">✎</span>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-white leading-tight">{u.nombre}</h1>
              {u.verificado && <VerifiedBadge />}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/5 text-white/55 border border-white/10 text-xs">Miembro desde {fmtDate(u.miembro_desde)}</span>
              {groups.map(g => <span key={g} className="px-3 py-1 rounded-full bg-pr-gold/10 text-pr-gold border border-pr-gold/20 text-xs">{g}</span>)}
            </div>
            <div className="mt-3 space-y-1 text-sm text-white/55">
              {u.instagram && <p>Instagram: <span className="text-white/75">{u.instagram}</span></p>}
              {u.ciudad && <p>Ciudad: <span className="text-white/75">{u.ciudad}</span></p>}
              {u.sobre_mi && <p className="leading-relaxed">{u.sobre_mi}</p>}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2.5">
          <SectionCard className="text-center"><p className="font-display text-2xl text-pr-gold font-bold">{unlocked.length}</p><p className="section-label mt-1">Insignias</p></SectionCard>
          <SectionCard className="text-center"><p className="font-display text-2xl text-pr-green font-bold">{participaciones.length}</p><p className="section-label mt-1">Eventos</p></SectionCard>
          <SectionCard className="text-center"><p className="font-display text-2xl text-white font-bold">{obsList.length}</p><p className="section-label mt-1">Observ.</p></SectionCard>
        </div>

        <SectionCard>
          <p className="section-label">Últimas novedades</p>
          <div className="mt-3 grid gap-3">
            {latestBadge && <div className="rounded-xl p-3 bg-pr-gold/8 border border-pr-gold/15"><p className="text-xs text-white/40">Última insignia</p><p className="text-sm font-semibold text-white">{latestBadge.nombre}</p></div>}
            {latestObs && <div className="rounded-xl p-3 bg-white/5 border border-white/10"><p className="text-xs text-white/40">Última observación</p><p className="text-sm font-semibold text-white">{latestObs.titulo}</p><p className="text-xs text-white/45 mt-1 line-clamp-2">{latestObs.descripcion}</p></div>}
            <div className="rounded-xl p-3 bg-white/5 border border-white/10"><p className="text-sm font-semibold text-white">🔔 {unread ? `Tenés ${unread} novedades` : 'Sin novedades pendientes'}</p></div>
          </div>
        </SectionCard>

        <Accordion title="Insignias" count={`${unlocked.length} obtenidas`} defaultOpen>
          <div className="space-y-3">
            {unlocked.map(b => <InsigniaCard key={b.id} badge={b} />)}
          </div>
          {lockedPreview.length > 0 && (
            <div className="pt-2">
              <p className="section-label mb-2">Próximas por desbloquear</p>
              <div className="space-y-3">{lockedPreview.map(b => <InsigniaCard key={b.id} badge={b} locked />)}</div>
            </div>
          )}
        </Accordion>

        <Accordion title="Eventos en los que participaste" count={`${participaciones.length} registrados`}>
          {participaciones.map(p => (
            <div key={p.id} className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="font-semibold text-white">{p.nombre}</p>
              <p className="text-xs text-white/35 mt-1">{fmtDate(p.fecha)}</p>
              <p className="text-sm text-white/52 mt-2 leading-relaxed">{p.descripcion}</p>
            </div>
          ))}
        </Accordion>

        <Accordion title="Observaciones de tus entrenadores" count="Tu evolución">
          {obsList.slice(0, 10).map(obs => <ObservationCard key={obs.id} obs={obs} onReact={reactToObs} />)}
          {obsList.length > 10 && <button className="btn-gold w-full">Ver más</button>}
        </Accordion>

        <Accordion title="Notificaciones" count={`${notificaciones.length > 50 ? 50 : notificaciones.length} recientes`}>
          {notificaciones.slice(0, 50).map(n => <NotificationItem key={n.id} n={n} />)}
        </Accordion>

        <Accordion title="Contactos PR" count="Profes y grupo correspondiente">
          {contactosPR.map(c => (
            <a key={c.id} href={c.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl p-3 bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-semibold text-white">{c.titulo}</p>
                <p className="text-xs text-white/35">{c.tipo} · {c.valor}</p>
              </div>
              <span className="text-pr-gold text-sm">Abrir</span>
            </a>
          ))}
        </Accordion>

        <Accordion title="Mis Servicios" count="PR Card y PR Tracking">
          <div className="flex items-center justify-between rounded-xl p-3 bg-white/5 border border-white/10">
            <div><p className="font-semibold text-white">PR Card</p><p className="text-xs text-white/40">Acceso a beneficios</p></div>
            <StatusPill active={u.prcard_activa} labelActive="Activa" labelInactive="Inactiva" />
          </div>
          <div className="flex items-center justify-between rounded-xl p-3 bg-white/5 border border-white/10">
            <div><p className="font-semibold text-white">PR Tracking</p><p className="text-xs text-white/40">Protección de equipamiento</p></div>
            <StatusPill active={u.prtracking_activo} labelActive="Activo" labelInactive="Inactivo" />
          </div>
        </Accordion>

        <Accordion title="Configuración" count="Datos editables por el alumno">
          <div className="grid gap-2 text-sm text-white/55">
            <button className="text-left rounded-xl p-3 bg-white/5 border border-white/10">Editar nombre visible</button>
            <button className="text-left rounded-xl p-3 bg-white/5 border border-white/10">Editar Instagram, ciudad, email y cumpleaños</button>
            <button className="text-left rounded-xl p-3 bg-white/5 border border-white/10">Cambiar PIN de ingreso</button>
            <button onClick={logout} className="text-left rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-200">Cerrar sesión</button>
          </div>
        </Accordion>
      </div>
    </AppLayout>
  )
}
