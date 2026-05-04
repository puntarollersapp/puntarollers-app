import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { mockUser, insignias, experiencias, actividad } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const MEMBER_STATES = {
  Nuevo:      { label: 'Nuevo',     dot: '#888',    ring: 'rgba(136,136,136,0.3)',  desc: 'Empezando el camino' },
  Activo:     { label: 'Activo',    dot: '#4ecb8b', ring: 'rgba(26,107,74,0.35)',   desc: 'Entrenando con constancia' },
  Frecuente:  { label: 'Frecuente', dot: '#C9A84C', ring: 'rgba(201,168,76,0.35)',  desc: 'Presencia regular en el club' },
  Destacado:  { label: 'Destacado', dot: '#E0C060', ring: 'rgba(224,192,96,0.4)',   desc: 'Referente de la comunidad' },
  Destacada:  { label: 'Destacada', dot: '#E0C060', ring: 'rgba(224,192,96,0.4)',   desc: 'Referente de la comunidad' },
}

function MemberStatusBadge({ estado }) {
  const cfg = MEMBER_STATES[estado] || MEMBER_STATES.Activo
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold tracking-wide"
      style={{
        background: `radial-gradient(ellipse at left, ${cfg.ring} 0%, transparent 70%)`,
        border: `1px solid ${cfg.ring}`,
        color: cfg.dot,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      Miembro {cfg.label}
    </div>
  )
}

function InsigniaItem({ b }) {
  return (
    <div className={`insignia-card p-4 ${b.desbloqueada ? 'earned' : 'locked'}`}>
      {b.desbloqueada && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(201,168,76,0.2), transparent 70%)' }}
        />
      )}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: b.desbloqueada
              ? 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(184,134,12,0.08))'
              : 'rgba(255,255,255,0.04)',
            border: b.desbloqueada ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {b.emoji}
        </div>
        {b.desbloqueada
          ? <span className="text-xs text-pr-green font-body font-semibold">Ganada</span>
          : <span className="text-xs text-white/20 font-body">Bloqueada</span>
        }
      </div>
      <div className="relative z-10">
        <p className="font-body font-semibold text-sm leading-tight" style={{ color: b.desbloqueada ? '#d8d8e8' : 'rgba(216,216,232,0.3)' }}>
          {b.nombre}
        </p>
        <p className="text-xs font-body mt-1 leading-snug" style={{ color: b.desbloqueada ? 'rgba(216,216,232,0.4)' : 'rgba(216,216,232,0.15)' }}>
          {b.descripcion}
        </p>
        {b.desbloqueada && b.fecha && (
          <p className="text-[10px] font-body mt-2 font-medium" style={{ color: 'rgba(201,168,76,0.5)' }}>{b.fecha}</p>
        )}
      </div>
    </div>
  )
}

function ExpItem({ e }) {
  return (
    <div className={`exp-card p-4 ${e.desbloqueada ? 'earned' : 'locked'}`}>
      {e.desbloqueada && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${e.color}18 0%, transparent 65%)` }}
        />
      )}
      <div className="flex items-center gap-3.5 relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{
            background: e.desbloqueada ? `${e.color}18` : 'rgba(255,255,255,0.03)',
            border: e.desbloqueada ? `1px solid ${e.color}30` : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span className="text-xl">{e.desbloqueada ? '⭐' : '🔒'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-body font-semibold text-sm leading-tight truncate" style={{ color: e.desbloqueada ? '#d8d8e8' : 'rgba(216,216,232,0.25)' }}>
              {e.nombre}
            </p>
            <span
              className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-body font-medium tracking-wide"
              style={{
                background: e.desbloqueada ? `${e.color}18` : 'rgba(255,255,255,0.04)',
                color: e.desbloqueada ? e.color : 'rgba(216,216,232,0.2)',
                border: `1px solid ${e.desbloqueada ? e.color + '30' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {e.categoria}
            </span>
          </div>
          <p className="text-xs font-body mt-0.5 leading-snug" style={{ color: e.desbloqueada ? 'rgba(216,216,232,0.38)' : 'rgba(216,216,232,0.14)' }}>
            {e.descripcion}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const u = user || mockUser
  const [editFrase, setEditFrase] = useState(false)
  const [frase, setFrase] = useState(u.frase_personal || 'Tu historia sobre ruedas empieza acá.')
  const [activeTab, setActiveTab] = useState('insignias')

  const miembroDesde = new Date(u.miembro_desde || '2022-03-15')
  const meses = Math.floor((new Date() - miembroDesde) / (1000 * 60 * 60 * 24 * 30))
  const initials = u.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2)
  const ultimaActividad = actividad[0]
  const estadoCfg = MEMBER_STATES[u.estado] || MEMBER_STATES.Activo

  return (
    <AppLayout title="Mi Perfil" showBack>
      <div className="px-4 pt-5 pb-8 space-y-5">

        <div className="animate-fade-up">
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(18,13,2,0.96) 0%, rgba(9,9,20,0.98) 100%)',
              border: '1px solid rgba(201,168,76,0.16)',
            }}
          >
            <div
              className="absolute top-0 left-0 w-48 h-24 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${estadoCfg.ring} 0%, transparent 70%)`, opacity: 0.4 }}
            />

            <div className="flex items-start gap-4 relative z-10">
              <div className="relative flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${estadoCfg.ring}` }}
                >
                  {u.foto_url ? (
                    <img src={u.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-gold-gradient-subtle">{initials}</span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg glass-gold flex items-center justify-center">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.8)" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 pt-0.5">
                <h2 className="font-display text-xl font-semibold text-white leading-tight">{u.nombre}</h2>
                <p className="text-xs font-body mt-0.5 mb-2" style={{ color: 'rgba(216,216,232,0.35)' }}>
                  {meses} meses · desde {miembroDesde.toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}
                </p>
                <MemberStatusBadge estado={u.estado} />
              </div>
            </div>

            <p className="mt-3 text-xs font-body relative z-10" style={{ color: 'rgba(216,216,232,0.32)' }}>
              {estadoCfg.desc}
            </p>

            <div className="divider-subtle my-4" />

            {ultimaActividad && (
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-pr-green" />
                <p className="text-xs font-body" style={{ color: 'rgba(216,216,232,0.35)' }}>
                  Última actividad: <span style={{ color: 'rgba(216,216,232,0.6)' }}>{ultimaActividad.nombre}</span>
                  <span className="ml-1.5" style={{ color: 'rgba(216,216,232,0.25)' }}>{ultimaActividad.fecha}</span>
                </p>
              </div>
            )}

            <div
              className="mt-3 relative z-10 rounded-xl px-4 py-3 cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => !editFrase && setEditFrase(true)}
            >
              {editFrase ? (
                <div className="space-y-2">
                  <input className="input-pr text-sm" value={frase} onChange={e => setFrase(e.target.value)} autoFocus />
                  <button onClick={() => setEditFrase(false)} className="btn-gold py-2 px-5 text-xs">Guardar</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-body italic flex-1 leading-relaxed" style={{ color: 'rgba(216,216,232,0.45)' }}>
                    "{frase}"
                  </p>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.3)" strokeWidth="2" className="flex-shrink-0 group-hover:stroke-pr-gold transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-1 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Clases',  value: u.clases_asistidas || 84, color: '#4ecb8b' },
            { label: 'Eventos', value: u.eventos || 12,           color: '#C9A84C' },
            { label: 'Exp. PR', value: u.experiencias_desbloqueadas || 7, color: '#a78bfa' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="section-label mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-up stagger-2 flex rounded-xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'insignias',    label: 'Insignias' },
            { id: 'experiencias', label: 'Exp. PR' },
            { id: 'actividad',    label: 'Actividad' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-body font-semibold transition-all duration-200 ${
                activeTab === t.id ? 'bg-pr-gold text-pr-black' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'insignias' && (
          <div className="animate-fade-up space-y-4">
            <div>
              <p className="section-label mb-2.5">Obtenidas ({insignias.filter(b => b.desbloqueada).length})</p>
              <div className="grid grid-cols-2 gap-2.5">
                {insignias.filter(b => b.desbloqueada).map(b => <InsigniaItem key={b.id} b={b} />)}
              </div>
            </div>
            <div>
              <p className="section-label mb-2.5">Por desbloquear ({insignias.filter(b => !b.desbloqueada).length})</p>
              <div className="grid grid-cols-2 gap-2.5">
                {insignias.filter(b => !b.desbloqueada).map(b => <InsigniaItem key={b.id} b={b} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experiencias' && (
          <div className="animate-fade-up space-y-4">
            <div>
              <p className="section-label mb-2.5">Colección desbloqueada ({experiencias.filter(e => e.desbloqueada).length})</p>
              <div className="space-y-2.5">
                {experiencias.filter(e => e.desbloqueada).map(e => <ExpItem key={e.id} e={e} />)}
              </div>
            </div>
            <div className="divider-subtle" />
            <div>
              <p className="section-label mb-2.5">Próximas experiencias ({experiencias.filter(e => !e.desbloqueada).length})</p>
              <div className="space-y-2.5">
                {experiencias.filter(e => !e.desbloqueada).map(e => <ExpItem key={e.id} e={e} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actividad' && (
          <div className="animate-fade-up space-y-2">
            {actividad.map(a => {
              const type = a.tipo?.toLowerCase()
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`timeline-dot ${type}`}>
                    {a.tipo === 'Clase' ? '🛼' : a.tipo === 'Insignia' ? '🏅' : '🎯'}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-body font-semibold text-white/80 truncate">{a.nombre}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: 'rgba(216,216,232,0.3)' }}>
                      {a.fecha}{a.hora !== '—' ? ` · ${a.hora}hs` : ''}
                    </p>
                  </div>
                  <div className="pt-1 flex flex-col items-end gap-1">
                    <span className="section-label capitalize">{a.tipo}</span>
                    {a.origen === 'NFC' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-body" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.18)' }}>NFC</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="animate-fade-up stagger-3">
          <p className="section-label mb-3">Equipamiento NFC</p>
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="nfc-pulse w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.7)" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-body font-semibold text-white/80">Patines PRCard Elite</p>
              <p className="text-xs font-body mt-0.5" style={{ color: 'rgba(216,216,232,0.3)' }}>NFC activo · última sync 28/04/2025</p>
            </div>
            <span className="badge-activo text-[10px] px-2.5 py-1 rounded-full font-body font-medium">Activo</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-xl text-sm font-body font-medium tracking-wide transition-all"
            style={{ background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.12)', color: 'rgba(220,100,100,0.6)' }}
          >
            Cerrar sesión
          </button>
        </div>

      </div>
    </AppLayout>
  )
}
