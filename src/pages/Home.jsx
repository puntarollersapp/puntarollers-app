import React, { useState } from "react"

export default function Home() {

  const [day, setDay] = useState("miercoles")

  return (
    <div className="px-4 py-6 space-y-8">

      {/* HERO */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">
          No es solo patinar, es pertenecer
        </h1>
        <p className="text-gray-400 text-sm">
          Bienvenido a Punta Rollers
        </p>
      </div>

      {/* HORARIOS */}
      <div className="space-y-4">
        <h2 className="text-white text-xl font-semibold text-center">
          ¿Cuándo entrenamos?
        </h2>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setDay("miercoles")}
            className={`px-4 py-2 rounded-full text-sm ${
              day === "miercoles"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            Miércoles
          </button>

          <button
            onClick={() => setDay("sabado")}
            className={`px-4 py-2 rounded-full text-sm ${
              day === "sabado"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            Sábado
          </button>
        </div>

        {/* CONTENIDO */}
        {day === "miercoles" && (
          <div className="space-y-3">

            <div className="bg-[#0f0f0f] p-4 rounded-xl">
              <p className="text-white font-medium">Adultos Principiantes</p>
              <p className="text-gray-400 text-sm">19:00 - 20:00</p>
              <p className="text-gray-500 text-xs">Parada 2 (aire libre)</p>
            </div>

            <div className="bg-[#0f0f0f] p-4 rounded-xl">
              <p className="text-white font-medium">Intermedio / Avanzado</p>
              <p className="text-gray-400 text-sm">20:00 - 21:00</p>
              <p className="text-gray-500 text-xs">Parada 2 (aire libre)</p>
            </div>

          </div>
        )}

        {day === "sabado" && (
          <div className="space-y-3">

            <div className="bg-[#0f0f0f] p-4 rounded-xl">
              <p className="text-white font-medium">PR Kids</p>
              <p className="text-gray-400 text-sm">19:00 - 20:00</p>
              <p className="text-gray-500 text-xs">Pista cerrada</p>
            </div>

            <div className="bg-[#0f0f0f] p-4 rounded-xl">
              <p className="text-white font-medium">Clase Mixta</p>
              <p className="text-gray-400 text-sm">20:00 - 21:00</p>
              <p className="text-gray-500 text-xs">Pista cerrada</p>
            </div>

          </div>
        )}
      </div>

      {/* INSCRIPCIONES */}
      <div className="space-y-4">
        <h2 className="text-white text-lg font-semibold">
          Inscripciones abiertas
        </h2>

        <a href="https://form.jotform.com/Claudinio/inscripcioneskids">
          <img src="/banner-kids.png" className="rounded-xl w-full" />
        </a>

        <a href="https://form.jotform.com/Claudinio/Inscripciones2026">
          <img src="/banner-adultos.png" className="rounded-xl w-full" />
        </a>
      </div>

      {/* PLATAFORMAS */}
      <div className="space-y-4">
        <h2 className="text-white text-lg font-semibold">
          Plataformas
        </h2>

        <a href="https://puntarollerscard.com/">
          <img src="/banner-prcard.png" className="rounded-xl w-full" />
        </a>

        <a href="https://rollermap.vercel.app/">
          <img src="/banner-rollermap.png" className="rounded-xl w-full" />
        </a>
      </div>

      {/* ALIANZA */}
      <div className="space-y-4">
        <h2 className="text-white text-lg font-semibold">
          Alianza Rollers
        </h2>

        <a href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0">
          <img src="/banner-alianza.png" className="rounded-xl w-full" />
        </a>

        <div className="text-center">
          <a
            href="https://www.instagram.com/alianzaroller"
            className="text-gray-400 text-sm underline"
          >
            Ver Instagram de Alianza
          </a>
        </div>
      </div>

    </div>
  )
}
