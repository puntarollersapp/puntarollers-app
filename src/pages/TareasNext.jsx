import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import PRCheckTecnicoPreview from '../components/tasks/PRCheckTecnicoPreview'
import ObjetivosPreview from '../components/tasks/ObjetivosPreview'
import PRTaskModerationPreview from '../components/tasks/PRTaskModerationPreview'

const TYPES=[
 ['RODAR','Distancia, resistencia y volumen','Automático · Strava'],
 ['TÉCNICA','Habilidades y ejercicios técnicos','Video · Profesor'],
 ['ASISTENCIA','Constancia dentro de las clases','PR Check'],
 ['CONTROL','Pruebas y chequeos puntuales','Profesor'],
 ['EXPLORAR','Circuitos, lugares y experiencias','Evidencia'],
 ['EQUIPO','Objetivos que hacemos juntos','Mixto'],
]

export default function TareasNext(){
 const {user}=useAuth()
 const name=user?.nombre||'PR'
 const isStaff=['admin','profesor'].includes(user?.role)
 return <AppLayout title="Tareas">
  <main className="mx-auto min-h-screen w-full max-w-[520px] px-4 pb-36 pt-5 text-white">
   <section className="relative overflow-hidden rounded-[34px] border border-violet-300/20 bg-[radial-gradient(circle_at_85%_0%,rgba(139,92,246,.28),transparent_42%),linear-gradient(145deg,#15131d,#09090d_68%)] p-6 shadow-2xl">
    <div className="absolute -right-10 top-7 h-28 w-28 rounded-full border border-violet-300/10"/>
    <p className="text-[9px] font-black uppercase tracking-[.25em] text-violet-300">Tu entrenamiento continúa</p>
    <h1 className="mt-3 max-w-[330px] text-[36px] font-black leading-[.94] tracking-[-.045em]">{name}, tu progreso no termina en una carrera.</h1>
    <p className="mt-4 max-w-[390px] text-[13px] leading-6 text-white/52">Tareas reúne lo que entrenás, aprendés y construís dentro de Punta Rollers. Menos competir contra otros. Más ver cómo avanzás vos.</p>
   </section>
   <section className="mt-5 grid grid-cols-2 gap-3">
    <article className="rounded-[24px] border border-white/[.07] bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">Este mes</p><b className="mt-2 block text-2xl">Tareas</b><p className="mt-1 text-[10px] leading-4 text-white/35">Se activarán según tu grupo y nivel.</p></article>
    <article className="rounded-[24px] border border-white/[.07] bg-white/[.035] p-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">Tu camino</p><b className="mt-2 block text-2xl">Objetivos</b><p className="mt-1 text-[10px] leading-4 text-white/35">Metas personales con progreso e historial.</p></article>
   </section>
   <ObjetivosPreview/>
   <section className="mt-7">
    <div className="px-1"><p className="text-[9px] font-black uppercase tracking-[.22em] text-white/30">Tareas 2.0</p><h2 className="mt-1 text-xl font-black">No todo se mide de la misma forma</h2></div>
    <div className="mt-4 grid gap-2.5">{TYPES.map(([type,desc,validation])=><article key={type} className="flex items-center gap-4 rounded-[22px] border border-white/[.06] bg-white/[.025] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/[.08] text-[9px] font-black text-violet-200">{type.slice(0,2)}</span><div className="min-w-0 flex-1"><h3 className="text-[11px] font-black tracking-[.06em]">{type}</h3><p className="mt-1 text-[10px] text-white/42">{desc}</p></div><span className="max-w-[86px] text-right text-[8px] font-bold uppercase leading-4 tracking-[.08em] text-white/25">{validation}</span></article>)}</div>
   </section>
   <PRCheckTecnicoPreview/>
   {isStaff&&<PRTaskModerationPreview/>}
   <section className="mt-6 overflow-hidden rounded-[28px] border border-orange-300/15 bg-[linear-gradient(135deg,rgba(251,146,60,.10),rgba(139,92,246,.07))] p-5">
    <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">Shifter 2026 · etapa actual</p>
    <h2 className="mt-2 text-xl font-black">Tus Deberes siguen exactamente donde estaban.</h2>
    <p className="mt-2 text-[11px] leading-5 text-white/45">Mientras termina esta etapa, mantenemos intacto el sistema actual, sus registros y la sincronización con Strava.</p>
    <Link to="/app/deberes" className="mt-4 inline-flex rounded-xl bg-orange-300 px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-black">Abrir Road to Shifter</Link>
   </section>
  </main>
 </AppLayout>
}
