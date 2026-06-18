import { useState } from 'react'
import { contenido } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'

const CATS = ['Todos', 'Eventos', 'Entrenamiento', 'Rodadas', 'PR Kids']

export default function ContentPage() {
  const [cat, setCat] = useState('Todos')
  const filtered = cat === 'Todos' ? contenido : contenido.filter(c => c.categoria === cat)

  return (
    <AppLayout title="Momentos PR" showBack>
      <div className="px-4 py-4 space-y-4">

        <div>
          <h2 className="font-display text-2xl font-bold text-white">Momentos PR</h2>
          <p className="text-white/40 text-sm font-body mt-1">Galerías, videos y recuerdos del club</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body transition-all ${
                cat === c ? 'bg-pr-gold text-pr-black font-semibold' : 'glass text-white/50 hover:text-white/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(c => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl overflow-hidden hover:border-pr-gold/30 transition-all active:scale-95"
            >
              <div
                className="aspect-video relative flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${
                    c.categoria === 'Eventos' ? 'rgba(201,168,76,0.1)' :
                    c.categoria === 'Entrenamiento' ? 'rgba(26,107,74,0.1)' :
                    c.categoria === 'Rodadas' ? 'rgba(59,74,176,0.1)' :
                    'rgba(139,74,156,0.1)'
                  }, transparent)`,
                }}
              >
                <span className="text-3xl opacity-40">
                  {c.tipo === 'video' ? '▶️' : '🖼️'}
                </span>
                {c.tipo === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-pr-gold/20 border border-pr-gold/30 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#C9A84C">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <span
                  className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-body"
                  style={{
                    background: c.tipo === 'video' ? 'rgba(59,74,176,0.5)' : 'rgba(26,107,74,0.5)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {c.tipo === 'video' ? 'Video' : 'Galería'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-white font-body font-semibold text-sm leading-tight line-clamp-2">{c.titulo}</p>
                <p className="text-white/30 text-xs font-body mt-1">{c.fecha}</p>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-body">
            No hay contenido en esta categoría
          </div>
        )}

      </div>
    </AppLayout>
  )
}
