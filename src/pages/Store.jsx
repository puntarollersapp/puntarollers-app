import { useState } from 'react'
import { productos } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

export default function StorePage() {
  const [selected, setSelected] = useState(null)
  const [talle, setTalle] = useState('')
  const [diseno, setDiseno] = useState('')
  const [pedidoOk, setPedidoOk] = useState(false)

  const confirmar = () => {
    if (!talle || !diseno) return
    setPedidoOk(true)
    setTimeout(() => { setPedidoOk(false); setSelected(null); setTalle(''); setDiseno('') }, 3000)
  }

  return (
    <AppLayout title="Tienda PR" showBack>
      <div className="px-4 py-4 space-y-4">

        <div>
          <h2 className="font-display text-2xl font-bold text-white">Tienda</h2>
          <p className="text-white/40 text-sm font-body mt-1">Remeras y merchandising oficial</p>
        </div>

        <div className="space-y-3">
          {productos.map(p => (
            <div
              key={p.id}
              className={`glass rounded-2xl overflow-hidden transition-all cursor-pointer ${selected?.id === p.id ? 'border-pr-gold/40' : 'hover:border-pr-gold/20'}`}
              onClick={() => { setSelected(selected?.id === p.id ? null : p); setTalle(''); setDiseno('') }}
            >
              <div className="flex items-start p-4 gap-4">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(26,107,74,0.1))' }}
                >
                  👕
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-white">{p.nombre}</p>
                  <p className="text-pr-gold font-body font-bold mt-0.5">{p.precio}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.talles.slice(0, 4).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded glass text-white/40 font-body">{t}</span>
                    ))}
                    {p.talles.length > 4 && <span className="text-xs text-white/30 font-body">+{p.talles.length - 4}</span>}
                  </div>
                </div>
                <div className={`transition-transform duration-200 ${selected?.id === p.id ? 'rotate-90' : ''}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(201,168,76,0.5)" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {selected?.id === p.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-pr-border pt-3" onClick={e => e.stopPropagation()}>
                  <div>
                    <p className="text-xs text-white/40 font-body mb-2 uppercase tracking-wider">Diseño</p>
                    <div className="flex gap-2 flex-wrap">
                      {p.diseños.map(d => (
                        <button
                          key={d}
                          onClick={() => setDiseno(d)}
                          className={`px-3 py-2 rounded-lg text-xs font-body transition-all ${diseno === d ? 'bg-pr-gold text-pr-black font-semibold' : 'glass text-white/60 hover:text-white'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-body mb-2 uppercase tracking-wider">Talle</p>
                    <div className="flex gap-2 flex-wrap">
                      {p.talles.map(t => (
                        <button
                          key={t}
                          onClick={() => setTalle(t)}
                          className={`w-10 h-10 rounded-lg text-sm font-body font-semibold transition-all ${talle === t ? 'bg-pr-gold text-pr-black' : 'glass text-white/60 hover:text-white'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={confirmar}
                    disabled={!talle || !diseno}
                    className={`btn-gold w-full py-3.5 text-sm ${(!talle || !diseno) ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Hacer pedido
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {pedidoOk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-8 text-center mx-6 animate-badge-pop">
              <span className="text-5xl block mb-4">✅</span>
              <p className="font-display text-xl font-bold text-white mb-1">¡Pedido registrado!</p>
              <p className="text-white/40 text-sm font-body">Te contactaremos para coordinar el pago y entrega.</p>
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-4 text-center">
          <p className="text-white/30 text-xs font-body">Los pedidos se coordinan directamente con el club. Tienda en fase inicial.</p>
        </div>

      </div>
    </AppLayout>
  )
}
