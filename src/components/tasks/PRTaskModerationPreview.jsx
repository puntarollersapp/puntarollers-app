export default function PRTaskModerationPreview(){
 return <section className="mt-7 overflow-hidden rounded-[30px] border border-amber-300/14 bg-[linear-gradient(145deg,rgba(251,191,36,.055),rgba(139,92,246,.035))] p-5">
  <div className="flex items-start justify-between gap-4"><div><p className="text-[8px] font-black uppercase tracking-[.22em] text-amber-200/55">MODERACIÓN TÉCNICA · BETA</p><h2 className="mt-2 text-xl font-black">La bandeja antes de abrirla.</h2></div><span className="rounded-full border border-white/[.08] px-3 py-1 text-[7px] font-black text-white/24">SIN DATOS FICTICIOS</span></div>
  <p className="mt-3 max-w-[520px] text-[9px] leading-5 text-white/30">Cuando Tareas 2.0 tenga backend beta aislado, cada foto o video pendiente aparecerá acá con alumno, tarea, intento, fecha y profesor responsable. Hasta entonces no simulamos personas ni revisiones reales.</p>
  <div className="mt-5 rounded-[24px] border border-dashed border-amber-200/12 bg-black/20 p-6 text-center">
   <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-amber-200/12 bg-amber-200/[.04] text-lg text-amber-100/35">◎</div>
   <h3 className="mt-4 text-sm font-black">No hay una cola beta conectada todavía.</h3>
   <p className="mx-auto mt-2 max-w-[370px] text-[8px] leading-4 text-white/24">La interfaz queda lista para recibir únicamente evidencias reales cuando pasemos la capa de permisos y almacenamiento.</p>
  </div>
  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><State n="01" t="PENDIENTE"/><State n="02" t="EN REVISIÓN"/><State n="03" t="APROBADA"/><State n="04" t="CORREGIR"/></div>
  <div className="mt-4 rounded-[18px] border border-white/[.06] bg-white/[.02] p-4"><p className="text-[7px] font-black uppercase tracking-[.16em] text-white/26">CONTRATO DE MODERACIÓN</p><p className="mt-2 text-[9px] leading-5 text-white/30">Aprobar cerrará el intento guardando profesor, fecha, devolución y puntaje. Corregir mantendrá la tarea abierta y permitirá reenviar sin borrar el intento anterior.</p></div>
 </section>
}
function State({n,t}){return <div className="rounded-[16px] border border-white/[.06] bg-black/15 p-3"><p className="text-[12px] font-black text-amber-100/20">{n}</p><p className="mt-2 text-[6px] font-black tracking-[.12em] text-white/24">{t}</p></div>}
