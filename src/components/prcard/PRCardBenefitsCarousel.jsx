import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Presentación reutilizable de beneficios PR Card.
 * Los datos deben venir de un catálogo autorizado del proyecto PR principal.
 * Nunca consultar el proyecto legado desde el navegador ni usar el PIN como identificador.
 */
export default function PRCardBenefitsCarousel({ benefits = [], cardActive = false, loading = false, verified = false, error = false }) {
  const [selectedBenefit, setSelectedBenefit] = useState(null)
  useEffect(() => {
    if (!selectedBenefit) return
    const onEscape = (event) => { if (event.key === 'Escape') setSelectedBenefit(null) }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [selectedBenefit])
  const activeBenefits = benefits.filter((item) => item && item.active !== false)
  const shortCommerce = (item) => /^LH\s+Pod[oó]loga/i.test(String(item?.commerce || '')) ? 'LH Podología' : (item?.commerce || item?.title)
  const commerceDescription = (item) => shortCommerce(item) === 'LH Podología' && item?.commerce !== 'LH Podología' ? item.commerce : ''
  return (
    <section aria-label="Beneficios PR Card" className="prcard-showcase relative isolate overflow-hidden rounded-[30px] border border-yellow-300/25 bg-[#0c0d12] p-4 pb-5 shadow-[0_18px_50px_rgba(0,0,0,.3)] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(220,178,72,.18),transparent_62%),radial-gradient(ellipse_at_100%_100%,rgba(92,67,157,.12),transparent_55%)]"/>
      <div aria-hidden="true" className="prcard-showcase-glow pointer-events-none absolute -top-24 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl"/>
      <div className="relative mb-7 flex flex-col items-center text-center">
        <p className="text-[10px] font-black uppercase tracking-[.28em] text-yellow-200/70">PUNTA ROLLERS · CLUB DE BENEFICIOS</p>
        <h2 className="mt-3 text-[clamp(24px,6vw,34px)] font-black leading-tight tracking-[-.055em] text-white">Tus beneficios <span className="text-[#e8c77a]">PR Card</span></h2>
        <p className="mx-auto mt-2 max-w-[320px] text-sm leading-6 text-white/65">Acá te presentamos los beneficios y comercios de tu comunidad roller.</p>
        <div className="relative my-5 flex h-40 w-full max-w-[300px] items-center justify-center [perspective:700px]" aria-label="Ilustración animada de tarjeta PR Card">
          <div aria-hidden="true" className="absolute h-28 w-52 rotate-[-10deg] rounded-[22px] border border-yellow-200/20 bg-yellow-100/[.04]"/>
          <div className="prcard-showcase-card relative h-[138px] w-[225px] overflow-hidden rounded-[23px] border border-yellow-200/55 bg-gradient-to-br from-[#383020] via-[#15171b] to-[#080a0e] p-5 text-left shadow-[0_18px_40px_rgba(0,0,0,.6),0_0_25px_rgba(220,178,72,.13)]">
            <div aria-hidden="true" className="prcard-showcase-shine pointer-events-none absolute inset-0"/>
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between"><span className="text-lg font-black italic tracking-[-.07em] text-[#f6df9b]">PR<span className="ml-1 text-[8px] not-italic tracking-[.2em]">CARD</span></span><span className="text-[10px] font-black tracking-[.14em] text-yellow-100/75">✦</span></div>
              <div className="flex items-end justify-between"><span className="text-[9px] font-bold uppercase tracking-[.22em] text-yellow-100/65">PUNTA ROLLERS</span><span className="text-[8px] font-semibold tracking-[.12em] text-yellow-100/50">MEMBER</span></div>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[.13em] ${cardActive && verified ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-200' : 'border-yellow-300/25 bg-yellow-300/[.07] text-yellow-100'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${cardActive && verified ? 'bg-emerald-300' : 'bg-yellow-300'}`}/>
          {cardActive && verified ? 'Tu PR Card está activa' : cardActive ? 'Tarjeta en verificación' : 'Solicitá tu PR Card'}
        </span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.24em] text-white/40">DESCUBRÍ TUS BENEFICIOS</p>
        <span aria-hidden="true" className="mt-2 text-xl text-[#e8c77a]">⌄</span>
      </div>
      <style>{`@keyframes prcardFloat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(-1deg)}}@keyframes prcardShine{0%,28%{transform:translateX(-150%)}55%,100%{transform:translateX(170%)}}@keyframes prcardGlow{50%{opacity:.5;transform:translateX(-50%) scale(1.15)}}.prcard-showcase-card{animation:prcardFloat 4.2s ease-in-out infinite}.prcard-showcase-shine{background:linear-gradient(105deg,transparent 30%,rgba(255,245,204,.22) 48%,transparent 65%);animation:prcardShine 5s ease-in-out infinite}.prcard-showcase-glow{animation:prcardGlow 4s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.prcard-showcase-card,.prcard-showcase-shine,.prcard-showcase-glow{animation:none!important}}`}</style>
      {!cardActive ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
          Todavía no tenés una PR Card activa. <Link to="/app/prcard" className="font-semibold text-yellow-200 underline underline-offset-4">Solicitar mi tarjeta de beneficios</Link>.
        </div>
      ) : loading ? (
        <p className="py-5 text-sm text-white/50" role="status">Cargando beneficios…</p>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">No pudimos consultar los beneficios en este momento. Tu membresía no cambió; volvé a intentarlo más tarde.</p>
      ) : !verified ? (
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Estamos verificando tu membresía para mostrar los beneficios disponibles.</p>
      ) : activeBenefits.length ? (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3" aria-label="Deslizá para ver beneficios">
          {activeBenefits.map((item) => (
            <button type="button" onClick={() => setSelectedBenefit(item)} key={item.id} className="text-left min-w-[220px] max-w-[260px] flex-[0_0_76%] snap-start rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-[0_0_240px]">
              <div className="flex items-center gap-3">
                {item.logo ? <img src={item.logo} alt="" loading="lazy" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-1" /> : <div aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-200/10 text-yellow-200">✦</div>}
                <p className="text-sm font-bold text-white">{shortCommerce(item)}</p>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-yellow-100">{item.title}</h3>
              {commerceDescription(item) && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{commerceDescription(item)}</p>}
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
          <div role="dialog" aria-modal="true" aria-label={`Beneficio ${shortCommerce(selectedBenefit)}`} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-yellow-300/20 bg-[#171b19] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">{selectedBenefit.logo && <img src={selectedBenefit.logo} alt="" className="h-14 w-14 rounded-xl bg-white/10 object-contain p-1" />}<div><p className="text-xs uppercase tracking-wider text-yellow-200/70">Beneficio PR Card</p><h3 className="text-lg font-bold">{selectedBenefit.commerce || selectedBenefit.title}</h3></div></div>
              <button type="button" onClick={() => setSelectedBenefit(null)} aria-label="Cerrar beneficio" className="rounded-full border border-white/20 px-3 py-1 text-lg">×</button>
            </div>
            <p className="mt-5 text-xl font-bold text-yellow-200">{selectedBenefit.title}</p>
            {commerceDescription(selectedBenefit) && <p className="mt-3 text-sm text-white/60">{commerceDescription(selectedBenefit)}</p>}
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
