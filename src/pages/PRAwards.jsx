import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'

const previewCategories=[
  ['Asistencia de Acero','Constancia que se sostuvo durante todo el año.'],
  ['Mejor Compañero/a','Esa persona que hace mejor al grupo.'],
  ['La Radio PR','Porque una clase en silencio tampoco sería Punta Rollers.'],
  ['Premio Piso Conocido','Caerse, levantarse y seguir rodando también cuenta.'],
  ['Superación 2026','El progreso que merece ser reconocido.'],
  ['Espíritu Punta Rollers','La esencia de lo que significa pertenecer.'],
]

export default function PRAwards(){
 return <AppLayout>
  <main className="mx-auto min-h-screen w-full max-w-[520px] px-4 pb-32 pt-5 text-white">
   <section className="relative overflow-hidden rounded-[30px] border border-amber-300/20 bg-[#0b0b0e] p-6 shadow-[0_22px_70px_rgba(0,0,0,.38)]">
    <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl"/>
    <p className="text-[10px] font-black uppercase tracking-[.28em] text-amber-300">PR Awards · 2026</p>
    <h1 className="mt-3 max-w-[320px] text-[34px] font-black leading-[.96] tracking-[-.045em]">Un año sobre ruedas merece su cierre.</h1>
    <p className="mt-4 max-w-[390px] text-[13px] leading-relaxed text-white/58">La comunidad va a reconocer momentos, personas y progresos que hicieron especial este 2026.</p>
    <div className="mt-6 inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-amber-200">Votación abre · 1 de diciembre</div>
   </section>

   <section className="mt-7">
    <div className="flex items-end justify-between gap-4 px-1">
     <div><p className="text-[9px] font-black uppercase tracking-[.24em] text-white/35">Primer adelanto</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Algunas categorías</h2></div>
     <span className="text-[9px] font-bold text-white/30">Hay más por descubrir</span>
    </div>
    <div className="mt-4 grid gap-3">{previewCategories.map(([title,text],index)=><article key={title} className="rounded-[22px] border border-white/[.07] bg-white/[.035] p-4"><div className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-300/15 bg-amber-300/[.07] text-[10px] font-black text-amber-200">{String(index+1).padStart(2,'0')}</span><div><h3 className="text-[13px] font-black">{title}</h3><p className="mt-1 text-[11px] leading-relaxed text-white/42">{text}</p></div></div></article>)}</div>
   </section>

   <section className="mt-7 rounded-[26px] border border-violet-300/10 bg-gradient-to-br from-violet-500/[.10] to-transparent p-5">
    <p className="text-[9px] font-black uppercase tracking-[.22em] text-violet-300">Esto recién empieza</p>
    <h2 className="mt-2 text-lg font-black">¿Qué premio no puede faltar?</h2>
    <p className="mt-2 text-[12px] leading-relaxed text-white/48">La propuesta de categorías llegará antes de abrir la votación. Los votos serán privados y los resultados se conocerán en el cierre de PR Awards.</p>
    <Link to="/app/comunidad" className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[.05] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.12em] text-white/75">Volver a Comunidad</Link>
   </section>
  </main>
 </AppLayout>
}
