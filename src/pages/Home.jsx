import React, { useState } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-12">

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
              Empezar ahora
            </a>
          </div>
        </section>

        <section id="inscripciones" className="space-y-4">
          <p className="section-label">Inscripciones abiertas</p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids" className="pr-banner">
            <img src="/banner-kids.png" alt="Inscripciones PR Kids" />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026" className="pr-banner">
            <img src="/banner-adultos.png" alt="Inscripciones Adultos" />
          </a>
        </section>

        <section className="space-y-4">
          <p className="section-label">Punta Rollers</p>

          <div className="grid grid-cols-1 gap-3 text-center">
            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">Comunidad</p>
              <p className="text-gray-400 text-xs">Rodamos juntos</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">Progreso</p>
              <p className="text-gray-400 text-xs">Evolucionás en cada clase</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">Experiencia</p>
              <p className="text-gray-400 text-xs">Clases, salidas, comunidad y momentos PR</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-label">El club</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">PR Kids</p>
              <p className="text-gray-400 text-xs">Desde 4 años</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">Adultos</p>
              <p className="text-gray-400 text-xs">Todos los niveles</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">PR Card</p>
              <p className="text-gray-400 text-xs">Beneficios exclusivos</p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white font-medium">Alianza</p>
              <p className="text-gray-400 text-xs">Red nacional</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-label">Horarios</p>

          <div className="flex gap-2 justify-center">
            <button
              type="button"
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
              type="button"
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
              <ScheduleCard
                title="Adultos Principiantes"
                time="19:00 - 20:00"
                place="Parada 2 · Aire libre"
                cupos="6 disponibles"
              />

              <ScheduleCard
                title="Adultos Intermedio / Avanzado"
                time="20:00 - 21:00"
                place="Parada 2 · Aire libre"
                cupos="3 disponibles"
              />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <ScheduleCard
                title="PR Kids"
                time="19:00 - 20:00"
                place="Pista cerrada"
                cupos="5 disponibles"
              />

              <ScheduleCard
                title="Adultos · Clase mixta"
                time="20:00 - 21:00"
                place="Pista cerrada"
                cupos="4 disponibles"
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <p className="section-label">Galería</p>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://drive.google.com/drive/folders/1WQK9l2aoWgaKBAiibNu6of4yrhXaJoA_"
              target="_blank"
              rel="noreferrer"
              className="glass p-4 rounded-xl text-center"
            >
              <p className="text-white font-medium">📸 Clases</p>
              <p className="text-gray-400 text-xs">
                Se actualiza después de cada clase
              </p>
            </a>

            <a
              href="https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ"
              target="_blank"
              rel="noreferrer"
              className="glass p-4 rounded-xl text-center"
            >
              <p className="text-white font-medium">🎉 Rolleadas</p>
              <p className="text-gray-400 text-xs">
                Se suben luego de cada evento
              </p>
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-label">Plataformas</p>

          <a href="https://puntarollerscard.com/" target="_blank" rel="noreferrer" className="pr-banner">
            <img src="/banner-prcard.png" alt="PR Card" />
          </a>

          <a href="https://rollermap.vercel.app/" target="_blank" rel="noreferrer" className="pr-banner">
            <img src="/banner-rollermap.png" alt="RollerMap" />
          </a>
        </section>

        <section className="space-y-4">
          <p className="section-label">Comunidad</p>

          <a
            href="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0"
            target="_blank"
            rel="noreferrer"
            className="pr-banner"
          >
            <img src="/banner-alianza.png" alt="Alianza Rollers" />
          </a>

          <a
            href="https://www.instagram.com/alianzaroller"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full"
          >
            Ver Instagram de Alianza
          </a>
        </section>

        <section className="text-center space-y-3 pt-4">
          <p className="text-white font-medium">
            ¿Ya sos parte de Punta Rollers?
          </p>

          <a href="/login" className="btn-gold w-full">
            Entrar al club
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
