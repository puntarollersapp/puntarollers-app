import { useEffect, useState } from 'react'
import { isRollerweenActive } from '../lib/rollerween'

export default function LoadingScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  const rollerween = isRollerweenActive()

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2400)
    const t2 = setTimeout(() => onDone?.(), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: rollerween ? 'radial-gradient(circle at 50% 25%, rgba(183,91,255,.22), transparent 32%), linear-gradient(180deg,#08060b,#040405)' : 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0d22 0%, #050508 100%)' }}
    >
      {rollerween ? <>
        <div className="absolute inset-0 opacity-30" style={{backgroundImage:'repeating-linear-gradient(8deg,transparent 0 24px,rgba(255,255,255,.025) 25px),repeating-linear-gradient(91deg,transparent 0 43px,rgba(183,91,255,.035) 44px)'}}/>
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="pr-rw-stamp">OCT.01 · NEW SEASON</div>
          <div className="relative mt-8">
            <div className="pr-rw-pumpkin-wheel pr-rw-glitch scale-125"/>
            <img src="/logo.png" alt="Punta Rollers" className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 object-contain brightness-0 invert opacity-90"/>
          </div>
          <p className="mt-9 text-[9px] font-black uppercase tracking-[.28em] text-[#BEFF37]">PUNTA ROLLERS PRESENTA</p>
          <h1 className="pr-rw-title pr-rw-glitch mt-2 text-[54px] text-white">ROLLER<span className="pr-rw-purple">WEEN</span></h1>
          <p className="mt-2 font-mono text-[10px] font-black tracking-[.22em] text-white/45">SEASON 2026 // OCT 01—31</p>
          <div className="mt-8 h-px w-36 bg-gradient-to-r from-transparent via-[#BEFF37] to-transparent opacity-70"/>
          <p className="mt-4 text-[9px] font-black uppercase tracking-[.18em] text-white/28">NO ES SOLO PATINAR. ES PERTENECER.</p>
        </div>
      </> : <>
        <div className="relative logo-reveal">
          <img
            src="/logo.png"
            alt="PuntaRollers"
            className="w-44 h-44 object-contain"
            style={{ filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))' }}
          />
        </div>
        <p className="tagline-reveal mt-8 text-xs uppercase font-body" style={{ letterSpacing: '0.22em', color: '#C9A84C', opacity: 0 }}>
          Pertenecer no es para todos.
        </p>
      </>}
      <div className="relative z-10 flex gap-1.5 mt-10 opacity-40">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1 h-1 rounded-full bg-pr-gold"
            style={{ animation: `fadeIn 1.2s ease-in-out ${i * 0.2}s infinite alternate` }} />
        ))}
      </div>
    </div>
  )
}
