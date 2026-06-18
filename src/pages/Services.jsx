import { servicios } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

export default function ServicesPage() {
  const destacados = servicios.filter(s => s.destacado)
  const resto = servicios.filter(s => !s.destacado)

  return (
    <AppLayout title="Servicios">
      <div className="px-4 py-4 space-y-5">

        <div>
          <h2 className="font-display text-2xl font-bold text-white">Todo sobre ruedas</h2>
          <p className="text-white/40 text-sm font-body mt-1">Elegí tu camino en Punta Rollers</p>
        </div>

        <div className="space-y-3">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em]">Destacados</p>
          {destacados.map(s => (
            <ServiceCard key={s.id} service={s} big />
          ))}
        </div>

        <div className="divider-gold" />

        <div className="space-y-3">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em]">Más servicios</p>
          <div className="grid grid-cols-2 gap-3">
            {resto.map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

function ServiceCard({ service: s, big = false }) {
  const isComingSoon = s.precio === 'Próximamente' || s.precio === 'Red en expansión'

  if (big) return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${s.color}15 0%, rgba(9,9,15,0.9) 100%)`,
        border: `1px solid ${s.color}30`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${s.color}20` }}
        >
          {s.icono}
        </div>
        {isComingSoon && (
          <span className="text-xs px-2 py-0.5 rounded-full font-body text-white/40 bg-white/5 border border-white/10">Próximamente</span>
        )}
      </div>
      <h3 className="font-display text-xl font-bold text-white mb-1">{s.nombre}</h3>
      <p className="text-white/50 text-sm font-body leading-relaxed mb-3">{s.descripcion}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {s.tags.map(t => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full font-body"
              style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-pr-gold text-sm font-body font-semibold flex-shrink-0 ml-2">{s.precio}</p>
      </div>
    </div>
  )

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${s.color}10 0%, rgba(9,9,15,0.9) 100%)`,
        border: `1px solid ${s.color}25`,
      }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3" style={{ background: `${s.color}20` }}>
        {s.icono}
      </div>
      <p className="font-body font-semibold text-white text-sm mb-1">{s.nombre}</p>
      <p className="text-white/40 text-xs font-body leading-snug mb-2">{s.descripcion}</p>
      <p className="text-pr-gold text-xs font-body font-semibold">{s.precio}</p>
      {isComingSoon && (
        <div className="absolute inset-0 rounded-xl bg-pr-black/40 flex items-center justify-center">
          <span className="text-xs font-body text-white/40">Próximamente</span>
        </div>
      )}
    </div>
  )
}
