import React, { useEffect, useState } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "")
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 200)
    }
  }, [])

  return (
    <PublicLayout>
      <div className="px-4 py-8 space-y-14">

        {/* ───── HERO PRO ───── */}
        <section className="text-center space-y-6 animate-fade-up">
          <h1 className="text-4xl font-bold leading-tight">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>

          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            La comunidad de patín en línea más activa de Punta del Este.
          </p>

          <div className="space-y-3 pt-2">
            <a href="/login" className="btn-gold w-full">
              Entrar como alumno
            </a>

            <a href="/admin" className="btn-ghost w-full">
              Acceso administrador
            </a>
          </div>
        </section>

        {/* ───── QUIÉNES SOMOS ───── */}
        <section className="space-y-4 animate-fade-up stagger-1">
          <p className="section-label text-center">Quiénes somos</p>

          <div className="glass p-6 rounded-2xl text-center space-y-3">
            <p className="text-xl font-semibold">🛼 Punta Rollers</p>

            <p className="text-gray-300 text-sm">
              Escuela de patín en línea en Punta del Este.
            </p>

            <p className="text-gray-400 text-sm">
              Clases para niños y adultos · Todos los niveles.
            </p>

            <p className="text-gray-500 text-xs">
              Comunidad · progreso · experiencia real sobre ruedas.
            </p>
          </div>
        </section>

        {/* ───── DÓNDE ESTAMOS ───── */}
        <section className="space-y-4 animate-fade-up stagger-2">
          <p className="section-label">Dónde estamos</p>

          <div className="grid gap-3">
            <div className="glass p-4 rounded-2xl">
              <p className="text-white font-semibold">📍 Parada 2</p>
              <p className="text-gray-400 text-sm">Punta del Este · Aire libre</p>
            </div>

            <div className="glass p-4 rounded-2xl">
              <p className="text-white font-semibold">🏟️ Pista cerrada</p>
              <p className="text-gray-400 text-sm">Maldonado · Clases indoor</p>
            </div>
          </div>
        </section>

        {/* ───── HORARIOS ───── */}
        <section className="space-y-4 animate-fade-up stagger-3">
          <p className="section-label">Horarios</p>

          <div className="flex gap-2 justify-center">
            <Tab active={day === "miercoles"} onClick={() => setDay("miercoles")}>
              Miércoles
            </Tab>
            <Tab active={day === "sabado"} onClick={() => setDay("sabado")}>
              Sábado
            </Tab>
          </div>

          {day === "miercoles" && (
            <div className="space-y-3">
              <ScheduleCard
                title="Principiantes"
                time="19:00 - 20:00"
                cupos="6 disponibles"
              />
              <ScheduleCard
                title="Avanzado"
                time="20:00 - 21:00"
                cupos="3 disponibles"
              />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <ScheduleCard
                title="PR Kids"
                time="19:00 - 20:00"
                cupos="5 disponibles"
              />
              <ScheduleCard
                title="Adultos"
                time="20:00 - 21:00"
                cupos="4 disponibles"
              />
            </div>
          )}
        </section>

        {/* ───── INSCRIPCIONES ───── */}
        <section id="inscripciones" className="space-y-4 animate-fade-up stagger-4">
          <p className="section-label">Inscripciones</p>

          <a
            href="https://form.jotform.com/Claudinio/inscripcioneskids"
            className="pr-banner"
          >
            <img src="/banner-kids.png" />
          </a>

          <a
            href="https://form.jotform.com/Claudinio/Inscripciones2026"
            className="pr-banner"
          >
            <img src="/banner-adultos.png" />
          </a>
        </section>

        {/* ───── EXPLORAR ───── */}
        <section id="explorar" className="space-y-4 animate-fade-up stagger-5">
          <p className="section-label">Explorar Punta Rollers</p>

          <div className="grid grid-cols-2 gap-4">

            <Card link="/cuponeras" icon="🎟️" title="Cuponeras" subtitle="Cómo funcionan" />
            <Card link="/pasaporte-kids" icon="🧒" title="Pasaporte Kids" subtitle="Progreso infantil" />
            <Card link="/uniformes" icon="👕" title="Uniformes" subtitle="Remeras y buzos" />
            <Card link="/tracking" icon="🏷️" title="PR Tracking" subtitle="Identificación" />

            <a href="/terminos" className="glass p-4 rounded-2xl text-center col-span-2">
              <p className="text-white font-semibold">📜 Reglas y condiciones</p>
              <p className="text-gray-400 text-xs">Funcionamiento del club</p>
            </a>

          </div>
        </section>

        {/* ───── GALERÍA ───── */}
        <section className="space-y-4 animate-fade-up stagger-6">
          <p className="section-label">Galería</p>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://drive.google.com/drive/folders/1WQK9l2aoWgaKBAiibNu6of4yrhXaJoA_"
              target="_blank"
              className="glass p-4 rounded-2xl text-center"
            >
              <p className="text-white font-semibold">📸 Clases</p>
              <p className="text-gray-400 text-xs">
                Se actualiza luego de cada clase
              </p>
            </a>

            <a
              href="https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ"
              target="_blank"
              className="glass p-4 rounded-2xl text-center"
            >
              <p className="text-white font-semibold">🎉 Rolleadas</p>
              <p className="text-gray-400 text-xs">
                Fotos de eventos y salidas
              </p>
            </a>
          </div>
        </section>

        {/* ───── PLATAFORMAS ───── */}
        <section className="space-y-4 animate-fade-up">
          <p className="section-label">Plataformas PR</p>

          <a href="https://puntarollerscard.com/" className="pr-banner">
            <img src="/banner-prcard.png" />
          </a>

          <a href="https://rollermap.vercel.app/" className="pr-banner">
            <img src="/banner-rollermap.png" />
          </a>
        </section>

        {/* ───── ALIANZA ───── */}
        <section className="space-y-4 animate-fade-up">
          <p className="section-label">Comunidad</p>

          <a href="/alianza" className="glass p-4 rounded-2xl flex justify-between">
            <div>
              <p className="text-white font-semibold">🛼 Alianza Rollers</p>
              <p className="text-gray-400 text-sm">
                Comunidad nacional en expansión
              </p>
            </div>

            <span className="text-gray-500">→</span>
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

/* COMPONENTES */

function ScheduleCard({ title, time, cupos }) {
  return (
    <div className="glass p-4 rounded-2xl flex justify-between items-center">
      <div>
        <p className="text-white font-semibold">{title}</p>
        <p className="text-gray-400 text-sm">{time}</p>
      </div>

      <p className="text-green-400 text-xs">● {cupos}</p>
    </div>
  )
}

function Tab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm ${
        active ? "bg-yellow-600 text-white" : "glass text-gray-400"
      }`}
    >
      {children}
    </button>
  )
}

function Card({ link, icon, title, subtitle }) {
  return (
    <a href={link} className="glass p-4 rounded-2xl text-center">
      <p className="text-xl">{icon}</p>
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-gray-400 text-xs">{subtitle}</p>
    </a>
  )
}
