import { actividad } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const TYPE_CONFIG = {
  Clase: {
    dot: 'clase',
    icon: '🛼',
    label: 'Clase',
    color: '#4ecb8b',
    bg: 'rgba(26,107,74,0.12)',
    border: 'rgba(26,107,74,0.2)',
  },
  Evento: {
    dot: 'evento',
    icon: '🎯',
    label: 'Evento',
    color: '#818cf8',
    bg: 'rgba(59,74,176,0.12)',
    border: 'rgba(59,74,176,0.2)',
  },
  Insignia: {
    dot: 'insignia',
    icon: '🏅',
    label: 'Insignia',
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.1)',
    border: 'rgba(201,168,76,0.18)',
  },
}

function ActivityRow({ a, isLast }) {
  const cfg = TYPE_CONFIG[a.tipo] || TYPE_CONFIG.Clase

  return (
    <div className="flex items-start gap-3.5 relative">
      {!isLast && (
        <div
          className="absolute left-[19px] top-[42px] bottom-[-8px] w-px"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      )}
      <div className={`timeline-dot ${cfg.dot} flex-shrink-0 relative z-10`}>
        {cfg.icon}
      </div>
      <div
        className="flex-1 rounded-xl px-4 py-3 mb-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-body font-semibold" style={{ color: 'rgba(216,216,232,0.85)' }}>
              {a.nombre}
            </p>
            <p className="text-xs font-body mt-0.5" style={{ color: 'rgba(216,216,232,0.28)' }}>
              {a.fecha}{a.hora !== '—' ? ` · ${a.hora}hs` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
            {a.origen === 'NFC' && (
              <span
                className="text-[10px] px-2 py-0.5 rounded font-body"
                style={{ background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.15)' }}
              >
                NFC
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const grupos = actividad.reduce((acc, a) => {
    const mes = new Date(a.fecha).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(a)
    return acc
  }, {})

  const totalClases = actividad.filter(a => a.tipo === 'Clase').length

  return (
    <AppLayout title="Actividad" showBack>
      <div className="px-4 pt-5 pb-8 space-y-6">

        <div className="animate-fade-up grid grid-cols-3 gap-2.5">
          {[
            { label: 'Clases',   value: 84,         color: '#4ecb8b' },
            { label: 'Eventos',  value: 12,          color: '#818cf8' },
            { label: 'Este mes', value: totalClases, color: '#C9A84C' },
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

        <div className="animate-fade-up stagger-1 flex gap-3">
          {Object.values(TYPE_CONFIG).map(t => (
            <div key={t.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              <span className="section-label" style={{ color: t.color, opacity: 0.7 }}>{t.label}</span>
            </div>
          ))}
        </div>

        <div className="animate-fade-up stagger-2 space-y-1">
          {Object.entries(grupos).map(([mes, items]) => (
            <div key={mes} className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <p className="section-label capitalize" style={{ color: 'rgba(216,216,232,0.35)' }}>{mes}</p>
                <div className="flex-1 divider-subtle" />
                <span className="section-label">{items.length} reg.</span>
              </div>
              {items.map((a, idx) => (
                <ActivityRow key={a.id} a={a} isLast={idx === items.length - 1} />
              ))}
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  )
}
