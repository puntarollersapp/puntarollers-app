import { useEffect } from 'react'

export default function LoadingScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone()
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050508] z-50">
      <div className="text-center">
        <h1 className="text-gold-gradient text-2xl font-semibold">
          Punta Rollers
        </h1>
        <p className="mt-2 text-xs tracking-widest text-white/40">
          CLUB EXPERIENCE
        </p>
      </div>
    </div>
  )
}
