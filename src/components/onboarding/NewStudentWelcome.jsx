import { Link } from 'react-router-dom'
export default function NewStudentWelcome({show=false}){
 if(!show)return null
 return <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(34,211,238,.07),rgba(139,92,246,.05))] p-5">
  <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"/>
  <div className="relative"><p className="text-[8px] font-black tracking-[.2em] text-cyan-200/65">TU HISTORIA RECIÉN EMPIEZA</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Bienvenido a tu PR.</h2><p className="mt-3 max-w-[500px] text-[10px] leading-5 text-white/38">No necesitás tener kilómetros, premios ni un historial previo para pertenecer. Empezá por tu identidad, conectá lo que uses y descubrí la comunidad a tu ritmo.</p>
  <div className="mt-5 grid grid-cols-3 gap-2"><Link to="/app/mi-pr" className="rounded-[18px] border border-white/[.07] bg-black/20 p-3 text-center"><b className="text-[9px]">1 · MI PR</b><p className="mt-1 text-[7px] text-white/25">Tu identidad</p></Link><Link to="/app/perfil" className="rounded-[18px] border border-white/[.07] bg-black/20 p-3 text-center"><b className="text-[9px]">2 · PERFIL</b><p className="mt-1 text-[7px] text-white/25">Conexiones</p></Link><Link to="/app/comunidad" className="rounded-[18px] border border-white/[.07] bg-black/20 p-3 text-center"><b className="text-[9px]">3 · COMUNIDAD</b><p className="mt-1 text-[7px] text-white/25">Tu gente</p></Link></div></div>
 </section>
}