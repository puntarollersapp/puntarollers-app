const QUEUE=[
 {student:'Martina P.',task:'T-stop · 3 repeticiones',kind:'VIDEO',sent:'Hoy · 18:42',status:'EN REVISIÓN'},
 {student:'Santiago R.',task:'Frenado controlado',kind:'VIDEO',sent:'Ayer · 21:06',status:'EN REVISIÓN'},
]

export default function PRTaskModerationPreview(){
 return <section className="mt-7 overflow-hidden rounded-[28px] border border-amber-300/15 bg-[linear-gradient(145deg,rgba(251,191,36,.07),rgba(139,92,246,.04))] p-5">
  <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">Vista profesor · Beta</p><h2 className="mt-2 text-xl font-black">Moderación técnica</h2></div><span className="rounded-full border border-amber-300/15 bg-amber-300/[.07] px-3 py-1 text-[9px] font-black text-amber-200">2 PENDIENTES</span></div>
  <p className="mt-2 text-[11px] leading-5 text-white/42">Así llegará la evidencia a Claudio o David: alumno, tarea, tipo, fecha e historial de intentos. Esta vista todavía no escribe en producción.</p>
  <div className="mt-4 grid gap-3">{QUEUE.map((item)=><article key={item.student+item.task} className="rounded-[20px] border border-white/[.07] bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">{item.kind} · {item.sent}</p><h3 className="mt-1 text-[12px] font-black">{item.student}</h3><p className="mt-1 text-[10px] text-white/42">{item.task}</p></div><span className="text-[8px] font-black uppercase tracking-[.12em] text-cyan-300">{item.status}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled className="rounded-xl border border-white/10 px-3 py-2.5 text-[9px] font-black uppercase tracking-[.1em] text-white/35">Corregir</button><button type="button" disabled className="rounded-xl bg-white/10 px-3 py-2.5 text-[9px] font-black uppercase tracking-[.1em] text-white/45">Aprobar</button></div></article>)}</div>
  <div className="mt-4 rounded-[18px] border border-white/[.06] bg-white/[.025] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Contrato de moderación</p><p className="mt-2 text-[10px] leading-5 text-white/40">Aprobar cierra el intento y guarda profesor, fecha, devolución y puntaje. Corregir mantiene la tarea abierta y exige un nuevo intento sin borrar la evidencia anterior.</p></div>
 </section>
}
