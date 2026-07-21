import { servicios } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

export default function ServicesPage() {
  const destacados = servicios.filter(
    (service) => service.destacado
  )

  const resto = servicios.filter(
    (service) => !service.destacado
  )

  return (
    <AppLayout title="Servicios">
      <div className="px-4 py-4 space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Todo sobre ruedas
          </h2>

          <p className="text-white/40 text-sm font-body mt-1">
            Elegí tu camino en Punta Rollers
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em]">
            Destacados
          </p>

          {destacados.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              big
            />
          ))}
        </div>

        <div className="divider-gold" />

        <div className="space-y-3">
          <p className="text-white/40 text-xs font-body uppercase tracking-[0.15em]">
            Más servicios
          </p>

          <div className="grid grid-cols-2 gap-3">
            {resto.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function ServiceCard({
  service,
  big = false,
}) {
  const isComingSoon =
    service.precio === 'Próximamente' ||
    service.precio === 'Red en expansión'

  if (big) {
    return (
      <div
        className="rounded-2xl p-5 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${service.color}15 0%, rgba(9,9,15,0.9) 100%)`,
          border: `1px solid ${service.color}30`,
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{
              background: `${service.color}20`,
            }}
          >
            {service.icono}
          </div>

          {isComingSoon && (
            <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-full font-body text-white/50 bg-white/5 border border-white/10">
              Próximamente
            </span>
          )}
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-1">
          {service.nombre}
        </h3>

        <p className="text-white/50 text-sm font-body leading-relaxed mb-3">
          {service.descripcion}
        </p>

        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap min-w-0">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full font-body"
                style={{
                  background: `${service.color}15`,
                  color: service.color,
                  border: `1px solid ${service.color}30`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-pr-gold text-sm font-body font-semibold shrink-0 ml-2">
            {service.precio}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-pointer min-h-[230px] flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${service.color}10 0%, rgba(9,9,15,0.9) 100%)`,
        border: `1px solid ${service.color}25`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 shrink-0"
        style={{
          background: `${service.color}20`,
        }}
      >
        {service.icono}
      </div>

      <p className="font-body font-semibold text-white text-sm mb-1">
        {service.nombre}
      </p>

      <p className="text-white/40 text-xs font-body leading-snug mb-3 flex-1">
        {service.descripcion}
      </p>

      <div className="pt-2 border-t border-white/[0.06]">
        <span
          className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            isComingSoon
              ? 'border-white/10 bg-white/[0.04] text-white/45'
              : 'border-pr-gold/20 bg-pr-gold/10 text-pr-gold'
          }`}
        >
          {service.precio}
        </span>
      </div>
    </div>
  )
}
