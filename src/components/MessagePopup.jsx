import { useState, useEffect } from 'react'
import { mensajesGlobales } from '../data/mockData'

export default function MessagePopup() {
  const [visible, setVisible] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pr_msg_dismissed')
    const active = mensajesGlobales.find(m => m.visible)
    if (active && !dismissed) {
      setMsg(active)
      const t = setTimeout(() => setVisible(true), 1400)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('pr_msg_dismissed', '1')
    setVisible(false)
  }

  if (!msg || !visible) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 pb-28">
      <div className="absolute inset-0" style={{ background: 'rgba(5,5,8,0.5)' }} onClick={dismiss} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'rgba(9,9,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', zIndex: 1 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🎯</span>
          <div className="flex-1">
            <p className="font-display text-base font-semibold text-white">{msg.titulo}</p>
            <p className="text-sm font-body mt-1.5 leading-relaxed" style={{ color: 'rgba(216,216,232,0.55)' }}>{msg.contenido}</p>
          </div>
          <button onClick={dismiss} className="opacity-30 hover:opacity-70">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button onClick={dismiss} className="mt-4 w-full btn-ghost py-2.5 text-xs">
          Entendido
        </button>
      </div>
    </div>
  )
}
