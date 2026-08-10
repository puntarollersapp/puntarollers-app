import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'

const CATS = ['Todos', 'Clases', 'Rolleadas', 'Contenido']

const contenido = [
  {
    id: 'galeria-clases',
    titulo: 'Galería de clases',
    categoria: 'Clases',
    tipo: 'galeria',
    fecha: 'Actualización permanente',
    url: 'https://drive.google.com/drive/folders/1Bn4Yy6IDiy8lJYyKf12z99Qyx5GllSST',
  },
  {
    id: 'rolleadas-pr',
    titulo: 'Rolleadas PR',
    categoria: 'Rolleadas',
    tipo: 'galeria',
    fecha: 'Eventos y salidas',
    url: 'https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ',
  },
  {
    id: 'contenido-pr',
    titulo: 'Contenido PR',
    categoria: 'Contenido',
    tipo: 'video',
    fecha: 'Videos y recursos',
    url: 'https://drive.google.com/drive/folders/1hnBU-O1sjZC88O6EqMa_1dKAE5HybkW_',
  },
]

export default function ContentPage() {
  const [cat, setCat] = useState('Todos')

  const filtered =
    cat === 'Todos'
      ? contenido
      : contenido.filter((item) => item.categoria === cat)

  return (
    <AppLayout title="Momentos PR" showBack>
      <div className="px-4 py-4 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Momentos PR
          </h2>

          <p className="text-white/40 text-sm font-body mt-1">
            Galerías, videos y recuerdos del club
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCat(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body transition-all ${
                cat === category
                  ? 'bg-pr-gold text-pr-black font-semibold'
                  : 'glass text-white/50 hover:text-white/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-xl overflow-hidden hover:border-pr-gold/30 transition-all active:scale-95"
            >
              <div
                className="aspect-video relative flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${
                    item.categoria === 'Clases'
                      ? 'rgba(26,107,74,0.1)'
                      : item.categoria === 'Rolleadas'
                        ? 'rgba(201,168,76,0.1)'
                        : 'rgba(59,74,176,0.1)'
                  }, transparent)`,
                }}
              >
                <span className="text-3xl opacity-40">
                  {item.tipo === 'video' ? '▶️' : '🖼️'}
                </span>

                {item.tipo === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-pr-gold/20 border border-pr-gold/30 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#C9A84C"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                <span
                  className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-body"
                  style={{
                    background:
                      item.tipo === 'video'
                        ? 'rgba(59,74,176,0.5)'
                        : 'rgba(26,107,74,0.5)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {item.tipo === 'video' ? 'Video' : 'Galería'}
                </span>
              </div>

              <div className="p-3">
                <p className="text-white font-body font-semibold text-sm leading-tight line-clamp-2">
                  {item.titulo}
                </p>

                <p className="text-white/30 text-xs font-body mt-1">
                  {item.fecha}
                </p>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-[24px] border border-white/[.07] bg-white/[.025] px-5 py-10 text-center font-body">
            <div className="text-3xl">🎬</div>
            <p className="mt-3 font-semibold text-white">La próxima pieza PR se está preparando.</p>
            <p className="mt-1 text-xs text-white/30">Cuando publiquemos contenido en esta categoría, lo vas a encontrar acá.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
