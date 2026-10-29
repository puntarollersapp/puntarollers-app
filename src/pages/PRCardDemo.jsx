import { useState } from 'react'
import { Link } from 'react-router-dom'

const samples = [
  { name: 'Comercio de ejemplo A', offer: 'Descuento ilustrativo', category: 'Bienestar' },
  { name: 'Comercio de ejemplo B', offer: 'Beneficio ilustrativo', category: 'Deportes' },
  { name: 'Comercio de ejemplo C', offer: 'Promoción ilustrativa', category: 'Servicios' },
]
export default function PRCardDemo() {
  const [selected, setSelected] = useState(null)
  return <main className="min-h-screen bg-[#090a0d] px-4 py-10 text-white"><div className="mx-auto max-w-3xl space-y-7">
    <div className="flex items-center justify-between gap-3"><Link to="/" className="text-sm text-white/60">← Punta Rollers</Link><span className="rounded-full border border-amber-300/40 px-3 py-1 text-xs font-bold text-amber-200">DEMO · SIN DATOS REALES</span></div>
    <header><p className="text-xs font-semibold uppercase tracking-[.28em] text-yellow-200/70">Punta Rollers · Club de beneficios</p><h1 className="mt-2 text-4xl font-black">Tu universo PR Card</h1><p className="mt-3 max-w-xl text-sm text-white/60">Vista previa pública. No requiere documento ni PIN y no consulta perfiles reales.</p></header>
    <div className="relative aspect-[1.586] max-w-lg overflow-hidden rounded-3xl border border-yellow-200/35 bg-gradient-to-br from-[#30251b] via-[#14161b] to-[#08090c] p-6 shadow-2xl"><div className="flex h-full flex-col justify-between"><div className="flex justify-between"><div><p className="text-xs font-bold tracking-[.26em] text-yellow-200">PR CARD</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/45">Club de beneficios</p></div><span className="text-xs text-yellow-100">MUESTRA</span></div><div><p className="text-xl font-semibold">Nombre de ejemplo</p><p className="mt-1 text-xs tracking-widest text-white/50">TARJETA NO VÁLIDA</p></div></div></div>
    <section><h2 className="text-2xl font-bold">Explorá los beneficios</h2><p className="mt-1 text-sm text-white/55">Estos tres comercios son ficticios. Tocá uno para abrir el detalle.</p><div className="mt-4 flex gap-3 overflow-x-auto pb-3">{samples.map((item,i)=><button key={i} type="button" onClick={()=>setSelected(item)} className="min-w-[210px] flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 text-left"><div className="mb-6 text-3xl text-yellow-200">✦</div><p className="text-sm font-bold">{item.name}</p><p className="mt-2 text-sm text-yellow-200">{item.offer}</p><p className="mt-3 text-xs text-white/45">{item.category} · Ejemplo</p></button>)}</div></section>
    <p className="rounded-xl border border-white/10 p-4 text-xs leading-relaxed text-white/55">La integración real incluye 22 beneficios en staging y verificación de membresía. Esta demostración es exclusivamente visual: no permite solicitar, activar ni canjear beneficios.</p>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div role="dialog" aria-modal="true" aria-label="Detalle de ejemplo" className="w-full max-w-md rounded-3xl border border-yellow-200/25 bg-[#18191d] p-6"><div className="flex justify-between"><p className="text-xs font-bold uppercase text-yellow-200">Beneficio de ejemplo</p><button type="button" onClick={()=>setSelected(null)} aria-label="Cerrar" className="rounded-full border px-3 py-1">×</button></div><h3 className="mt-5 text-xl font-bold">{selected.name}</h3><p className="mt-2 text-lg text-yellow-200">{selected.offer}</p><p className="mt-4 text-sm text-white/70">Presentación ilustrativa de condiciones y modo de uso. No válido para canje.</p></div></div>}
  </div></main>
}
