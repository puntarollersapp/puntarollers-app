import { useEffect, useState } from 'react'

export default function LoadingScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2400)
    const t2 = setTimeout(() => onDone?.(), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0d22 0%, #050508 100%)' }}
    >
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

      <div className="flex gap-1.5 mt-10 opacity-40">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1 h-1 rounded-full bg-pr-gold"
            style={{ animation: `fadeIn 1.2s ease-in-out ${i * 0.2}s infinite alternate` }} />
        ))}
      </div>
    </div>
  )
}
