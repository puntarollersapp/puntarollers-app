import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminUsuarios, insignias, experiencias, contenido, mensajesGlobales } from '../data/mockData'

const SECTIONS = [
  { id: 'dashboard',    label: 'Dashboard',      icon: '◈' },
  { id: 'usuarios',     label: 'Usuarios',        icon: '○', count: adminUsuarios.length },
  { id: 'insignias',    label: 'Insignias',       icon: '◇', count: insignias.length },
  { id: 'experiencias', label: 'Experiencias PR', icon: '◆', count: experiencias.length },
  { id: 'actividad',    label: 'Asistencias',     icon: '▷', count: 127 },
  { id: 'nfc',          label: 'NFC',             icon: '◎', count: 8 },
  { id: 'contenido',    label: 'Contenido',       icon: '▣', count: contenido.length },
  { id: 'tienda',       label: 'Pedidos',         icon: '◻', count: 3 },
  { id: 'mensajes',     label: 'Mensajes',        icon: '◈', count: mensajesGlobales.length },
  { id: 'pagos',        label: 'Pagos',           icon: '○', badge: 'Próximo' },
]

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
      {actionLabel && (
        <button onClick={onAction} className="btn-gold btn-sm py-2 px-3.5">
          + {actionLabel}
        </button>
      )}
    </div>
  )
}

function QuickActions({ actions }) {
  return (
    <div className="mb-5">
      <p className="section-label mb-2.5">Acciones rápidas</p>
      <div className={`grid gap-2 grid-cols-${Math.min(actions.length, 4)}`}>
        {actions.map(a => (
          <button key={a.label} className="quick-action" onClick={a.onClick}>
            <span className="text-xl">{a.icon}</span>
            <span className="text-[11px] font-body font-medium text-center leading-tight" style={{ color: 'rgba(216,216,232,0.55)' }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function UserRow({ u, onBadge, onActivity }) {
  const badgeClass = {
    Destacada: 'badge-destacado', Destacado: 'badge-destacado',
    Activo: 'badge-activo', Frecuente: 'badge-frecuente', Inactivo: 'badge-novo',
  }[u.estado] || 'badge-novo'

  return (
    <div
      className="rounded-xl px-4 py-3.5 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.14)' }}
      >
        <span className="font-display text-xs font-bold text-gold-gradient-subtle">
          {u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-semibold text-white/80 truncate">{u.nombre}</p>
        <p className="text-xs font-body mt-0.5" style={{ color: 'rgba(216,216,232,0.28)' }}>
          {u.documento} · {u.clases} clases · {u.ultimo_acceso}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`${badgeClass} text-[10px] px-2 py-0.5 rounded-full font-body font-medium`}>{u.estado}</span>
        {u.prcard && (
          <span className="text-[10px] font-body" style={{ color: 'rgba(201,168,76,0.55)' }}>PRCard ✓</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 ml-1">
        <button
          onClick={() => onBadge?.(u)}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.14)' }}
        >
          <span className="text-xs">🏅</span>
        </button>
        <button
          onClick={() => onActivity?.(u)}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(26,107,74,0.1)', border: '1px solid rgba(26,107,74,0.18)' }}
        >
          <span className="text-xs">➕</span>
        </button>
      </div>
    </div>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] animate-slide-up">
      <div className="rounded-xl px-5 py-3 text-sm font-body font-medium" style={{ background: 'rgba(26,107,74,0.9)', border: '1px solid rgba(26,107,74,0.4)', color: '#4ecb8b', backdropFilter: 'blur(16px)' }}>
        {msg}
      </div>
    </div>
  )
}

export default function Admin() {
  const [section, setSection] = useState('dashboard')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="min-h-screen bg-pr-black">

      <header className="glass-dark sticky top-0 z-50 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 flex items-center justify-between" style={{ height: '52px' }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PR" className="w-7 h-7 object-contain opacity-90" />
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-white">PuntaRollers</span>
              <span className="section-label px-2 py-0.5 rounded" style={{ background: 'rgba(220,60,60,0.12)', color: 'rgba(220,100,100,0.7)', border: '1px solid rgba(220,60,60,0.15)' }}>Admin</span>
            </div>
          </div>
          <Link to="/app/dashboard" className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.35)' }}>
            ← Club
          </Link>
        </div>
      </header>

      <div className="flex">

        <aside
          className="hidden md:flex flex-col w-52 h-[calc(100vh-52px)] sticky top-[52px] p-3 gap-0.5"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all"
              style={section === s.id ? { background: 'rgba(255,255,255,0.05)' } : {}}
            >
              <span className={`text-base font-mono w-5 text-center ${section === s.id ? 'text-pr-gold' : 'text-white/20'}`}>
                {s.icon}
              </span>
              <span className={section === s.id ? 'text-white/85' : 'text-white/40'}>{s.label}</span>
              {s.badge && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-body" style={{ background: 'rgba(201,168,76,0.1)', color: 'rgba(201,168,76,0.55)' }}>{s.badge}</span>
              )}
              {s.count !== undefined && !s.badge && (
                <span className="ml-auto section-label">{s.count}</span>
              )}
            </button>
          ))}
        </aside>

        <main className="flex-1 px-5 py-5">

          <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-body font-medium transition-all ${
                  section === s.id ? 'bg-pr-gold text-pr-black' : 'text-white/40'
                }`}
                style={section !== s.id ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          {section === 'dashboard' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">Panel de Control</h2>
                <p className="text-sm font-body mt-1" style={{ color: 'rgba(216,216,232,0.35)' }}>Vista general del club</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Usuarios',   value: adminUsuarios.length, icon: '○', color: '#818cf8' },
                  { label: 'PRCards',    value: adminUsuarios.filter(u => u.prcard).length, icon: '◇', color: '#C9A84C' },
                  { label: 'Clases/mes', value: 47, icon: '▷', color: '#4ecb8b' },
                  { label: 'Pedidos',    value: 3,  icon: '◻', color: '#f97316' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xl font-mono" style={{ color: m.color }}>{m.icon}</span>
                    <p className="font-display text-3xl font-bold text-white mt-2">{m.value}</p>
                    <p className="section-label mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
              <QuickActions actions={[
                { icon: '🏅', label: 'Asignar insignia', onClick: () => { setSection('usuarios'); showToast('Seleccioná un usuario → 🏅') } },
                { icon: '➕', label: 'Registrar clase',  onClick: () => { setSection('actividad'); showToast('Sección Asistencias') } },
                { icon: '💬', label: 'Enviar mensaje',   onClick: () => { setSection('mensajes');  showToast('Sección Mensajes') } },
                { icon: '💳', label: 'Ver PRCards',      onClick: () => setSection('usuarios') },
              ]} />
              <div className="space-y-2">
                <p className="section-label">Alertas</p>
                {[
                  { icon: '⚠️', text: '2 usuarios con pagos vencidos', sub: 'módulo próximamente', color: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.2)', textColor: 'rgba(249,115,22,0.8)' },
                  { icon: '💬', text: '1 mensaje activo para todos',   sub: 'ver en Mensajes',     color: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.16)', textColor: 'rgba(201,168,76,0.7)' },
                ].map(a => (
                  <div key={a.text} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: a.color, border: `1px solid ${a.border}` }}>
                    <span>{a.icon}</span>
                    <div>
                      <p className="text-sm font-body font-medium" style={{ color: a.textColor }}>{a.text}</p>
                      <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.3)' }}>{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'usuarios' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Usuarios" actionLabel="Nuevo usuario" />
              <QuickActions actions={[
                { icon: '🏅', label: 'Asignar insignia', onClick: () => showToast('Seleccioná → 🏅 en el usuario') },
                { icon: '📋', label: 'Reg. asistencia',  onClick: () => showToast('Seleccioná → ➕ en el usuario') },
                { icon: '💳', label: 'Activar PRCard',   onClick: () => showToast('Próximamente') },
                { icon: '📊', label: 'Exportar lista',   onClick: () => showToast('Próximamente') },
              ]} />
              <div className="space-y-2">
                {adminUsuarios.map(u => (
                  <UserRow
                    key={u.id}
                    u={u}
                    onBadge={() => showToast(`Insignia asignada a ${u.nombre.split(' ')[0]} ✓`)}
                    onActivity={() => showToast(`Asistencia registrada para ${u.nombre.split(' ')[0]} ✓`)}
                  />
                ))}
              </div>
            </div>
          )}

          {section === 'insignias' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Insignias" actionLabel="Nueva" />
              <QuickActions actions={[
                { icon: '🏅', label: 'Asignar a usuario', onClick: () => showToast('Seleccioná en Usuarios → 🏅') },
                { icon: '✏️', label: 'Editar',             onClick: () => showToast('Próximamente') },
                { icon: '🗑️', label: 'Eliminar',           onClick: () => showToast('Próximamente') },
              ]} />
              <div className="grid grid-cols-2 gap-2.5">
                {insignias.map(b => (
                  <div
                    key={b.id}
                    className="rounded-xl p-4 relative overflow-hidden"
                    style={{
                      background: b.desbloqueada ? 'linear-gradient(145deg, rgba(16,11,2,0.9), rgba(9,9,15,0.95))' : 'rgba(255,255,255,0.02)',
                      border: b.desbloqueada ? '1px solid rgba(201,168,76,0.18)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{b.emoji}</span>
                      <button
                        onClick={() => showToast(`Insignia editada ✓`)}
                        className="text-xs rounded-lg px-2 py-1 font-body"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(216,216,232,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        Editar
                      </button>
                    </div>
                    <p className="font-body font-semibold text-sm text-white/80">{b.nombre}</p>
                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(216,216,232,0.35)' }}>{b.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'experiencias' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Experiencias PR" actionLabel="Nueva" />
              <QuickActions actions={[
                { icon: '⭐', label: 'Asignar exp.', onClick: () => showToast('Seleccioná usuario → asignar') },
                { icon: '✏️', label: 'Editar',       onClick: () => showToast('Próximamente') },
              ]} />
              <div className="space-y-2">
                {experiencias.map(e => (
                  <div key={e.id} className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base" style={{ background: `${e.color}18`, border: `1px solid ${e.color}25` }}>⭐</div>
                    <div className="flex-1">
                      <p className="text-sm font-body font-semibold text-white/80">{e.nombre}</p>
                      <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.28)' }}>{e.categoria}</p>
                    </div>
                    <button onClick={() => showToast('Experiencia asignada ✓')} className="text-xs rounded-lg px-2.5 py-1.5 font-body" style={{ background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.65)', border: '1px solid rgba(201,168,76,0.16)' }}>
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'actividad' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Asistencias" actionLabel="Registrar" onAction={() => showToast('Asistencia registrada ✓')} />
              <QuickActions actions={[
                { icon: '➕', label: 'Clase manual',    onClick: () => showToast('Asistencia registrada ✓') },
                { icon: '📡', label: 'Activar NFC',     onClick: () => setSection('nfc') },
                { icon: '📊', label: 'Ver por usuario', onClick: () => showToast('Próximamente') },
                { icon: '📋', label: 'Exportar',        onClick: () => showToast('Próximamente') },
              ]} />
              <div className="space-y-2">
                {[
                  { usuario: 'Luciana Méndez', tipo: 'Adultos Avanzados',   fecha: '28/04/2025', hora: '09:03', origen: 'NFC' },
                  { usuario: 'Sofía Pereyra',  tipo: 'Adultos Intermedios', fecha: '25/04/2025', hora: '09:08', origen: 'NFC' },
                  { usuario: 'Martín Rovira',  tipo: 'Speed Training',      fecha: '23/04/2025', hora: '19:05', origen: 'manual' },
                  { usuario: 'Camila Torres',  tipo: 'PR Kids',             fecha: '22/04/2025', hora: '16:00', origen: 'manual' },
                ].map((a, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="timeline-dot clase">🛼</div>
                    <div className="flex-1">
                      <p className="text-sm font-body font-semibold text-white/80">{a.usuario}</p>
                      <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.28)' }}>{a.tipo} · {a.fecha} {a.hora}hs</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-body"
                      style={a.origen === 'NFC'
                        ? { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.65)', border: '1px solid rgba(201,168,76,0.16)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(216,216,232,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      {a.origen}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'nfc' && (
            <div className="space-y-4 max-w-md">
              <SectionHeader title="Gestión NFC" />
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="nfc-pulse inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.7)" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <p className="font-display text-lg font-semibold text-white mb-1">Lector NFC</p>
                <p className="text-sm font-body mb-5" style={{ color: 'rgba(216,216,232,0.4)' }}>Acercá la tarjeta del miembro para registrar asistencia automáticamente.</p>
                <button className="btn-gold" onClick={() => showToast('Lector NFC activado ✓')}>Activar lector</button>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.35)' }}>Última lectura: <span style={{ color: 'rgba(216,216,232,0.65)' }}>Luciana Méndez — 28/04/2025 09:03hs</span></p>
              </div>
            </div>
          )}

          {section === 'contenido' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Contenido" actionLabel="Agregar link" onAction={() => showToast('Próximamente')} />
              <QuickActions actions={[
                { icon: '🖼️', label: 'Nueva galería', onClick: () => showToast('Próximamente') },
                { icon: '▶️', label: 'Nuevo video',   onClick: () => showToast('Próximamente') },
                { icon: '🔗', label: 'Link de Drive', onClick: () => showToast('Próximamente') },
              ]} />
              <div className="space-y-2">
                {contenido.map(c => (
                  <div key={c.id} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-base">{c.tipo === 'video' ? '▶️' : '🖼️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-white/80 truncate">{c.titulo}</p>
                      <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.28)' }}>{c.categoria} · {c.fecha}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => showToast('Editado ✓')} className="text-xs px-2 py-1 rounded-lg font-body" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(216,216,232,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>Editar</button>
                      <button onClick={() => showToast('Eliminado ✓')} className="text-xs px-2 py-1 rounded-lg font-body" style={{ background: 'rgba(220,60,60,0.06)', color: 'rgba(220,100,100,0.5)', border: '1px solid rgba(220,60,60,0.12)' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'mensajes' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Mensajes internos" actionLabel="Nuevo" onAction={() => showToast('Próximamente')} />
              <p className="text-sm font-body" style={{ color: 'rgba(216,216,232,0.35)' }}>Los mensajes activos se muestran como popup al ingresar al club.</p>
              <QuickActions actions={[
                { icon: '📢', label: 'Aviso global',       onClick: () => showToast('Próximamente') },
                { icon: '🎯', label: 'Mensaje individual', onClick: () => showToast('Próximamente') },
                { icon: '🔕', label: 'Desactivar todos',  onClick: () => showToast('Mensajes desactivados ✓') },
              ]} />
              {mensajesGlobales.map(m => (
                <div key={m.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between mb-2.5">
                    <p className="font-body font-semibold text-white/80">{m.titulo}</p>
                    <span className={m.visible ? 'badge-activo' : 'badge-novo'} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                      {m.visible ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm font-body leading-relaxed" style={{ color: 'rgba(216,216,232,0.45)' }}>{m.contenido}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.22)' }}>{m.fecha} · {m.tipo}</p>
                    <div className="flex gap-2">
                      <button onClick={() => showToast('Editado ✓')} className="text-xs px-2.5 py-1.5 rounded-lg font-body" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(216,216,232,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>Editar</button>
                      <button onClick={() => showToast('Desactivado ✓')} className="text-xs px-2.5 py-1.5 rounded-lg font-body" style={{ background: 'rgba(220,60,60,0.06)', color: 'rgba(220,100,100,0.5)', border: '1px solid rgba(220,60,60,0.1)' }}>Desactivar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'tienda' && (
            <div className="space-y-4 max-w-2xl">
              <SectionHeader title="Pedidos" />
              <QuickActions actions={[
                { icon: '✅', label: 'Confirmar pedido', onClick: () => showToast('Pedido confirmado ✓') },
                { icon: '🚚', label: 'Marcar entregado',  onClick: () => showToast('Entregado ✓') },
                { icon: '📋', label: 'Exportar',          onClick: () => showToast('Próximamente') },
              ]} />
              <div className="space-y-2">
                {[
                  { nombre: 'Luciana Méndez', prod: 'Remera PR Classic',    talle: 'M', diseno: 'Negro / Dorado',   estado: 'pendiente',  estColor: 'rgba(249,115,22,0.8)', estBg: 'rgba(249,115,22,0.1)', estBorder: 'rgba(249,115,22,0.2)' },
                  { nombre: 'Martín Rovira',  prod: 'Remera Speed Edition', talle: 'L', diseno: 'Negro / Plateado', estado: 'confirmado', estColor: '#C9A84C',              estBg: 'rgba(201,168,76,0.1)', estBorder: 'rgba(201,168,76,0.22)' },
                  { nombre: 'Sofía Pereyra',  prod: 'Remera PR Classic',    talle: 'S', diseno: 'Blanco / Dorado',  estado: 'entregado',  estColor: '#4ecb8b',              estBg: 'rgba(26,107,74,0.12)', estBorder: 'rgba(26,107,74,0.25)' },
                ].map((p, i) => (
                  <div key={i} className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xl">👕</span>
                    <div className="flex-1">
                      <p className="text-sm font-body font-semibold text-white/80">{p.nombre}</p>
                      <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.28)' }}>{p.prod} · {p.talle} · {p.diseno}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-body font-medium" style={{ background: p.estBg, color: p.estColor, border: `1px solid ${p.estBorder}` }}>
                      {p.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'pagos' && (
            <div className="max-w-md">
              <SectionHeader title="Pagos y mensualidades" />
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.14)' }}>
                  💰
                </div>
                <p className="font-display text-xl font-semibold text-white mb-2">Módulo en desarrollo</p>
                <p className="text-sm font-body leading-relaxed" style={{ color: 'rgba(216,216,232,0.38)' }}>
                  El módulo de pagos estará disponible en la próxima fase. La estructura de base de datos ya está preparada.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      <Toast msg={toast} />
    </div>
  )
              }
