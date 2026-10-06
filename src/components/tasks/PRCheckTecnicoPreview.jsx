const STEPS=[
 ['Enviado','Ya recibimos tu evidencia.'],
 ['En revisión','Claudio o David la revisarán.'],
 ['Aprobado','La técnica quedó validada.'],
 ['Corregir','Recibís devolución y podés volver a enviarla.'],
]

export default function PRCheckTecnicoPreview(){
 return <section className="mt-6 rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(34,211,238,.07),rgba(139,92,246,.06))] p-5">
  <p className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300">PR Check Técnico</p>
  <h2 className="mt-2 text-xl font-black">Tu técnica también puede mostrar progreso.</h2>
  <p className="mt-2 text-[11px] leading-5 text-white/45">En las tareas técnicas vas a poder enviar una foto o un video corto. La evidencia entra en moderación y no se marca como aprobada hasta que un profesor la evalúe.</p>
  <div className="mt-4 grid gap-2">{STEPS.map(([status,text],index)=><article key={status} className="flex gap-3 rounded-[18px] border border-white/[.06] bg-black/20 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-[9px] font-black text-white/50">{index+1}</span><div><b className="text-[11px]">{status}</b><p className="mt-0.5 text-[10px] leading-4 text-white/35">{text}</p></div></article>)}</div>
  <div className="mt-4 rounded-[18px] border border-violet-300/10 bg-violet-400/[.06] p-4 text-[10px] leading-5 text-white/45"><b className="text-violet-200">Cuando enviás:</b> Tu tarea entró en moderación. Ya recibimos tu evidencia. Claudio o David la revisarán y, una vez evaluada, vas a recibir la devolución del profesor, el resultado y el puntaje correspondiente. <b className="text-white/70">Estado: En revisión.</b></div>
  <p className="mt-3 text-[9px] leading-4 text-white/28">Si el resultado es “Corregir”, la tarea sigue abierta. El nuevo envío no elimina los anteriores: queda historial para poder ver la evolución.</p>
 </section>
}
