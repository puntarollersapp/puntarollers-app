const OBJECTIVES=[
 {title:'Rodar 6 km sin parar',value:4.2,target:6,unit:'km',source:'Personal'},
 {title:'Dominar T-stop',value:2,target:3,unit:'controles',source:'Profesor'},
 {title:'Asistir a 6 clases',value:4,target:6,unit:'clases',source:'PR Check'},
]

export default function ObjetivosPreview(){
 return <section className="mt-7">
  <div className="flex items-end justify-between px-1"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-violet-300">Tu camino</p><h2 className="mt-1 text-xl font-black">Objetivos personales</h2></div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-white/25">Vista beta</span></div>
  <p className="mt-2 px-1 text-[11px] leading-5 text-white/42">Metas tuyas o propuestas por el profesor. No son un ranking: muestran cuánto te falta para llegar a algo que querés conseguir.</p>
  <div className="mt-4 grid gap-3">{OBJECTIVES.map((o)=>{const pct=Math.min(100,Math.round((o.value/o.target)*100));return <article key={o.title} className="rounded-[24px] border border-white/[.07] bg-white/[.03] p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-[8px] font-black uppercase tracking-[.15em] text-white/25">{o.source}</span><h3 className="mt-1 text-[13px] font-black">{o.title}</h3></div><b className="text-sm text-violet-200">{pct}%</b></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-violet-400" style={{width:`${pct}%`}}/></div><div className="mt-2 flex justify-between text-[9px] font-bold text-white/30"><span>{o.value} {o.unit}</span><span>Meta · {o.target} {o.unit}</span></div></article>})}</div>
  <div className="mt-3 rounded-[20px] border border-dashed border-violet-300/20 p-4 text-center"><b className="text-[10px] uppercase tracking-[.12em] text-violet-200">+ Nuevo objetivo</b><p className="mt-1 text-[9px] text-white/28">Se habilitará cuando el motor de Objetivos pase QA.</p></div>
 </section>
}
