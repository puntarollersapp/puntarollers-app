import { Link } from 'react-router-dom'
import { ROLLERWEEN, isRollerweenActive } from '../lib/rollerween'

export default function RollerweenClinicBanner({ compact=false }) {
  if (!isRollerweenActive()) return null
  return <Link to={ROLLERWEEN.clinic.href} className={`group relative block overflow-hidden border border-violet-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(190,255,55,.12),transparent_34%),linear-gradient(135deg,rgba(100,31,155,.30),rgba(10,8,14,.96)_55%)] shadow-[0_18px_48px_rgba(75,24,110,.18)] transition active:scale-[.99] ${compact?'rounded-[20px] p-4':'mb-4 rounded-[26px] p-5'}`}>
    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#BEFF37]/10 bg-[#BEFF37]/[.035]"/>
    <div className="relative z-10 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#BEFF37]">28 · 29 · 30 OCTUBRE</p>
        <h3 className={`${compact?'mt-1 text-[18px]':'mt-2 text-[23px]'} font-black leading-tight text-white`}>CLÍNICA INTERNACIONAL<br/><span className="text-violet-300">MIGUEL FLORES</span></h3>
        <p className="mt-2 text-[10px] leading-4 text-white/45">No olvides reservar tu cupo. Tres jornadas de entrenamiento · cupos limitados.</p>
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#BEFF37]/25 bg-[#BEFF37]/10 text-lg text-[#BEFF37] transition group-hover:translate-x-1">→</div>
    </div>
    <div className="relative z-10 mt-3 border-t border-white/[.06] pt-3 text-[8px] font-black uppercase tracking-[.14em] text-violet-200/65">RESERVAR MI CUPO →</div>
  </Link>
}
