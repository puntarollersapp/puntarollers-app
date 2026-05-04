import React from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Alianza() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">

        <section className="space-y-4">
          <a
            href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0"
            target="_blank"
            rel="noreferrer"
            className="pr-banner"
          >
            <img src="/banner-alianza.png" alt="Alianza Rollers" />
          </a>
        </section>

        <section className="glass p-5 rounded-xl space-y-4 text-center">
          <p className="section-label">Comunidad nacional</p>

          <h1 className="text-2xl font-bold text-white">
            🌍 Alianza Rollers
          </h1>

          <p className="text-gray-300 text-sm">
            Rodamos juntos, sumamos energía y conectamos rolleros de todo Uruguay.
          </p>

          <p className="text-gray-400 text-sm">
            Alianza Rollers une equipos, escuelas y patinadores del país para compartir,
            conectar y convocar salidas oficiales de calle abierta en distintas localidades.
          </p>

          <p className="text-gray-500 text-xs">
            Nuestra meta: ser la comunidad roller más grande de Uruguay.
          </p>
        </section>

        <section className="space-y-4">
          <p className="section-label">¿Cómo funciona?</p>

          <div className="grid grid-cols-1 gap-3">
            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">📲 WhatsApp</p>
              <p className="text-gray-400 text-sm">
                Usamos el grupo para enviar avisos de salidas, convocatorias y actividades.
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">📸 Instagram</p>
              <p className="text-gray-400 text-sm">
                Publicamos actividades, fotos, eventos y novedades de la comunidad.
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">🛼 Comunidad</p>
              <p className="text-gray-400 text-sm">
                La idea es que más rolleros puedan conocerse, sumarse y rodar juntos.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <a
            href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0"
            target="_blank"
            rel="noreferrer"
            className="btn-gold w-full"
          >
            Unirme al WhatsApp
          </a>

          <a
            href="https://www.instagram.com/alianzaroller"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full"
          >
            Ver Instagram
          </a>

          <a href="/" className="block text-center text-xs text-gray-500 underline">
            Volver al inicio
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}
