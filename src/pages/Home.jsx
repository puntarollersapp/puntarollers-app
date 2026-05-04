import React, { useState } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-12">

        {/* HERO */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white leading-tight">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>

          <p className="text-gray-400 text-sm">
            Bienvenido a Punta Rollers
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <a href="/login" className="btn-gold">
              Entrar al club
            </a>

            <a href="#inscripciones" className="btn-ghost">
              Inscribirme
            </a>
          </div>
        </section>

        {/* INSCRIPCIONES */}
        <section id="inscripciones" className="space-y-4">
          <p className="section-label">Inscripciones abiertas</p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids" className="pr-banner">
            <img src="/banner-kids.png" alt="PR Kids" />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026" className="pr-banner">
            <img src="/banner-adultos.png" alt="Adultos" />
          </a>
        </section>

        {/* ACCESOS DIRECTOS (REEMPLAZA LO CONFUSO) */}
        <section className="space-y-4">
          <p className="section-label">Accesos rápidos</p>

          <div className="grid grid-cols-2 gap-4">

            <a href="https://form.jotform.com/Claudinio/inscripcioneskids" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">🧒 PR Kids</p>
              <p className="text-gray-400 text-xs">Inscribir niño</p>
            </a>

            <a href="https://form.jotform.com/Claudinio/Inscripciones2026" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">🧑 Adultos</p>
              <p className="text-gray-400 text-xs">Inscribirme</p>
            </a>

            <a href="https://puntarollerscard.com/" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">💳 PR Card</p>
              <p className="text-gray-400 text-xs">Ver beneficios</p>
            </a>

            <a href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">🌍 Comunidad</p>
              <p className="text-gray-400 text-xs">Unirme</p>
            </a>

          </div>
        </section>

        {/* HORARIOS */}
        <section className="space-y-4">
          <p className="section-label">Horarios</p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setDay("miercoles")}
              className={`px-4 py-2 rounded-full text-sm ${
                day === "miercoles"
                  ? "bg-yellow-600 text-white"
                  : "glass text-gray-400"
              }`}
            >
              Miércoles
            </button>

            <button
              onClick={() => setDay("sabado")}
              className={`px-4 py-2 rounded-full text-sm ${
                day === "sabado"
                  ? "bg-yellow-600 text-white"
                  : "glass text-gray-400"
              }`}
            >
              Sábado
            </button>
          </div>

          {day === "miercoles" && (
            <div className="space-y-3">
              <ScheduleCard title="Adultos Principiantes" time="19:00 - 20:00" place="Parada 2 · Aire libre" cupos="6 disponibles" />
              <ScheduleCard title="Adultos Intermedio / Avanzado" time="20:00 - 21:00" place="Parada 2 · Aire libre" cupos="3 disponibles" />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <ScheduleCard title="PR Kids" time="19:00 - 20:00" place="Pista cerrada" cupos="5 disponibles" />
              <ScheduleCard title="Adultos" time="20:00 - 21:00" place="Pista cerrada" cupos="4 disponibles" />
            </div>
          )}
        </section>

        {/* GALERÍA */}
        <section className="space-y-4">
          <p className="section-label">Galería</p>

          <div className="grid grid-cols-2 gap-4">

            <a href="https://drive.google.com/drive/folders/1WQK9l2aoWgaKBAiibNu6of4yrhXaJoA_" target="_blank" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">📸 Clases</p>
              <p className="text-gray-400 text-xs">Se suben después de cada clase</p>
            </a>

            <a href="https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ" target="_blank" className="glass p-4 rounded-xl text-center">
              <p className="text-white font-medium">🎉 Eventos</p>
              <p className="text-gray-400 text-xs">Fotos de rolleadas</p>
            </a>

          </div>
        </section>

        {/* PLATAFORMAS */}
        <section className="space-y-4">
          <p className="section-label">Plataformas</p>

          <a href="https://puntarollerscard.com/" className="pr-banner">
            <img src="/banner-prcard.png" />
          </a>

          <a href="https://rollermap.vercel.app/" className="pr-banner">
            <img src="/banner-rollermap.png" />
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

function ScheduleCard({ title, time, place, cupos }) {
  return (
    <div className="glass p-4 rounded-xl">
      <p className="text-white font-medium">{title}</p>
      <p className="text-gray-400 text-sm">{time}</p>
      <p className="text-gray-500 text-xs">{place}</p>
      <p className="text-green-400 text-xs mt-1">● {cupos}</p>
    </div>
  )
}
