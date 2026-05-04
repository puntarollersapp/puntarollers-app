import React from "react"

export default function Home() {
  return (
    <div className="space-y-8 px-4 pb-10">

      {/* HERO */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">
          No es solo patinar, es pertenecer
        </h1>
        <p className="text-gray-400 text-sm">
          Bienvenido a Punta Rollers
        </p>
      </div>

      {/* INSCRIPCIONES */}
      <div className="space-y-4">

        <a href="https://form.jotform.com/Claudinio/inscripcioneskids">
          <img src="/banner-kids.png" className="rounded-xl w-full" />
        </a>

        <a href="https://form.jotform.com/Claudinio/Inscripciones2026">
          <img src="/banner-adultos.png" className="rounded-xl w-full" />
        </a>

      </div>

      {/* PLATAFORMAS */}
      <div className="space-y-4">

        <a href="https://puntarollerscard.com/">
          <img src="/banner-prcard.png" className="rounded-xl w-full" />
        </a>

        <a href="https://rollermap.vercel.app/">
          <img src="/banner-rollermap.png" className="rounded-xl w-full" />
        </a>

      </div>

      {/* ALIANZA */}
      <div className="space-y-4">

        <a href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0">
          <img src="/banner-alianza.png" className="rounded-xl w-full" />
        </a>

        <a href="https://www.instagram.com/alianzaroller">
          <div className="text-center text-sm text-gray-400 underline">
            Ver Instagram de Alianza
          </div>
        </a>

      </div>

    </div>
  )
}
