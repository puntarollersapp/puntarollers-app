import { useState } from 'react'

export default function MessagePopup({ mensaje }) {
  const [visible, setVisible] = useState(true)

  if (!mensaje || !visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50">
      <div className="glass-dark p-4 rounded-xl border border-white/10">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {mensaje.titulo}
            </h3>
            <p className="text-xs text-white/60 mt-1">
              {mensaje.contenido}
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="text-white/40 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
