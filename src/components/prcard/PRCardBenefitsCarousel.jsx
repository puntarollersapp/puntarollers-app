import { Link } from 'react-router-dom'

/**
 * Presentación reutilizable de beneficios PR Card.
 * Los datos deben venir de un catálogo autorizado del proyecto PR principal.
 * Nunca consultar el proyecto legado desde el navegador ni usar el PIN como identificador.
 */
export default function PRCardBenefitsCarousel({ benefits = [], cardActive = false, loading = false }) {
  const activeBenefits = benefits.filter((item) => item && item.active !== false)
  return (
    <section aria-label="Beneficios PR Card" className="rounded-3xl border border-yellow-300/20 bg-gradient-to-br from-yellow-300/[.10] via-white/[.035] to-transparent p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-yellow-200/65">PR CARD · CLUB DE BENEFICIOS</p>
          <h2 className="mt-1 text-xl font-bold text-white">Tus beneficios PR Card</h2>
          <p className="mt-1 text-xs text-white/55">Descubrí lo que tu tarjeta tiene para vos.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cardActive ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/5 text-white/50'}`}>
          {cardActive ? 'ACTIVA' : 'SIN ACTIVAR'}
        </span>
      </div>
      {!cardActive ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
          Tu PR Card todavía no figura activa. <Link to="/app/prcard" className="font-semibold text-yellow-200 underline underline-offset-4">Consultá tu tarjeta</Link>.
        </div>
      ) : loading ? (
        <p className="py-5 text-sm text-white/50" role="status">Cargando beneficios…</p>
      ) : activeBenefits.length ? (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3" aria-label="Deslizá para ver beneficios">
          {activeBenefits.map((item) => (
            <article key={item.id} className="min-w-[220px] max-w-[260px] flex-[0_0_76%] snap-start rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-[0_0_240px]">
              <div className="flex items-center gap-3">
                {item.logo ? <img src={item.logo} alt="" loading="lazy" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1" /> : <div aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-200/10 text-yellow-200">✦</div>}
                <p className="text-sm font-bold text-white">{item.commerce || item.title}</p>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-yellow-100">{item.title}</h3>
              {item.description && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/60">{item.description}</p>}
              {item.until && <p className="mt-3 text-[11px] text-white/45">Vigencia: {item.until}</p>}
              {item.redeem && <p className="mt-2 text-xs text-white/70">{item.redeem}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Todavía no hay beneficios disponibles para mostrar.</p>
      )}
      <Link to="/app/prcard" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-yellow-200">Explorar mi PR Card <span aria-hidden="true">→</span></Link>
    </section>
  )
}
