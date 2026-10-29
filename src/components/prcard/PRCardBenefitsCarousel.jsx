import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Presentación reutilizable de beneficios PR Card.
 * Los datos deben venir de un catálogo autorizado del proyecto PR principal.
 * Nunca consultar el proyecto legado desde el navegador ni usar el PIN como identificador.
 */
export default function PRCardBenefitsCarousel({ benefits = [], cardActive = false, loading = false }) {
  const [selectedBenefit, setSelectedBenefit] = useState(null)
  useEffect(() => {
    if (!selectedBenefit) return
    const onEscape = (event) => { if (event.key === 'Escape') setSelectedBenefit(null) }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [selectedBenefit])
  const activeBenefits = benefits.filter((item) => item && item.active !== false)
  return (
    <section aria-label="Beneficios PR Card" className="rounded-3xl border border-yellow-300/20 bg-gradient-to-br from-yellow-300/[.10] via-white/[.035] to-transparent p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-yellow-200/65">PR CARD · CLUB DE BENEFICIOS</p>
          <h2 className="mt-1 text-xl font-bold text-white">Tus beneficios PR Card</h2>
          <p className="mt-1 text-xs text-white/55">Estos son tus beneficios activos en tu PR Card.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cardActive ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/5 text-white/50'}`}>
          {cardActive ? 'ACTIVA' : 'SIN ACTIVAR'}
        </span>
      </div>
      {!cardActive ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
          Todavía no tenés una PR Card activa. <Link to="/app/prcard" className="font-semibold text-yellow-200 underline underline-offset-4">Solicitar mi tarjeta de beneficios</Link>.
        </div>
      ) : loading ? (
        <p className="py-5 text-sm text-white/50" role="status">Cargando beneficios…</p>
      ) : activeBenefits.length ? (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3" aria-label="Deslizá para ver beneficios">
          {activeBenefits.map((item) => (
            <button type="button" onClick={() => setSelectedBenefit(item)} key={item.id} className="text-left min-w-[220px] max-w-[260px] flex-[0_0_76%] snap-start rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-[0_0_240px]">
              <div className="flex items-center gap-3">
                {item.logo ? <img src={item.logo} alt="" loading="lazy" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1" /> : <div aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-200/10 text-yellow-200">✦</div>}
                <p className="text-sm font-bold text-white">{item.commerce || item.title}</p>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-yellow-100">{item.title}</h3>
              {item.description && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/60">{item.description}</p>}
              {item.until && <p className="mt-3 text-[11px] text-white/45">Vigencia: {item.until}</p>}
              {item.redeem && <p className="mt-2 text-xs text-white/70">{item.redeem}</p>}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Todavía no hay beneficios disponibles para mostrar.</p>
      )}
      <Link to="/app/prcard" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-yellow-200">Explorar mi PR Card <span aria-hidden="true">→</span></Link>
      {selectedBenefit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBenefit(null) }}>
          <div role="dialog" aria-modal="true" aria-label={`Beneficio ${selectedBenefit.commerce || selectedBenefit.title}`} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-yellow-300/20 bg-[#171b19] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">{selectedBenefit.logo && <img src={selectedBenefit.logo} alt="" className="h-14 w-14 rounded-xl bg-white/10 object-contain p-1" />}<div><p className="text-xs uppercase tracking-wider text-yellow-200/70">Beneficio PR Card</p><h3 className="text-lg font-bold">{selectedBenefit.commerce || selectedBenefit.title}</h3></div></div>
              <button type="button" onClick={() => setSelectedBenefit(null)} aria-label="Cerrar beneficio" className="rounded-full border border-white/20 px-3 py-1 text-lg">×</button>
            </div>
            <p className="mt-5 text-xl font-bold text-yellow-200">{selectedBenefit.title}</p>
            {selectedBenefit.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">{selectedBenefit.description}</p>}
            {selectedBenefit.redeem && <div className="mt-4 rounded-xl bg-white/5 p-3"><p className="text-xs font-semibold uppercase text-white/50">Cómo usarlo</p><p className="mt-1 whitespace-pre-line text-sm">{selectedBenefit.redeem}</p></div>}
            {selectedBenefit.until && <p className="mt-3 text-sm text-white/65">Vigencia: {selectedBenefit.until}</p>}
            {selectedBenefit.phone && <p className="mt-3 text-sm">Contacto: {selectedBenefit.phone}</p>}
            {selectedBenefit.social && /^https:\/\//i.test(selectedBenefit.social) && <a href={selectedBenefit.social} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-yellow-200 underline">Ver comercio o emprendimiento</a>}
          </div>
        </div>
      )}
    </section>
  )
}
