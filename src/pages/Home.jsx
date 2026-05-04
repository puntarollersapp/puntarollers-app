import React, { useState } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-12 animate-fade-in">

        {/* HERO */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">
            No es solo patinar,
            <span className="block text-gold-gradient">es pertenecer.</span>
          </h1>

          <p className="text-gray-400 text-sm">Bienvenido a Punta Rollers</p>

          <div className="space-y-3 pt-3">
            <a href="/login" className="btn-gold w-full">
              Entrar como alumno
            </a>

            <a href="/admin" className="text-sm text-gray-500 underline">
              Acceso administrador
            </a>
          </div>
        </section>

        {/* QUIENES SOMOS */}
        <section className="text-center space-y-4">
          <p className="section-label">Quiénes somos</p>

          <div className="glass p-5 rounded-xl">
            <p className="text-white font-semibold text-lg">🛼 Punta Rollers</p>
            <p className="text-gray-300 text-sm">
              Escuela de patín en línea en Punta del Este
            </p>
            <p className="text-gray-400 text-sm">
              Clases para niños y adultos · Todos los niveles
            </p>
          </div>
        </section>

        {/* HORARIOS */}
        <section className="space-y-4">
          <p className="section-label">Horarios</p>

          <div className="flex gap-2 justify-center">
            <Tab active={day==="miercoles"} onClick={()=>setDay("miercoles")}>Miércoles</Tab>
            <Tab active={day==="sabado"} onClick={()=>setDay("sabado")}>Sábado</Tab>
          </div>

          {day === "miercoles" && (
            <>
              <ScheduleCard title="Principiantes" time="19:00" cupos="6 disponibles" />
              <ScheduleCard title="Avanzado" time="20:00" cupos="3 disponibles" />
            </>
          )}

          {day === "sabado" && (
            <>
              <ScheduleCard title="PR Kids" time="19:00" cupos="5 disponibles" />
              <ScheduleCard title="Adultos" time="20:00" cupos="4 disponibles" />
            </>
          )}
        </section>

        {/* INSCRIPCIONES */}
        <section id="inscripciones" className="space-y-4">
          <p className="section-label">Inscripciones</p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids" className="pr-banner">
            <img src="/banner-kids.png" />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026" className="pr-banner">
            <img src="/banner-adultos.png" />
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

function ScheduleCard({ title, time, cupos }) {
  return (
    <div className="glass p-4 rounded-xl flex justify-between items-center">
      <div>
        <p className="text-white">{title}</p>
        <p className="text-gray-400 text-sm">{time}</p>
      </div>

      <p className="text-green-400 text-xs">● {cupos}</p>
    </div>
  )
}

function Tab({active, children, onClick}) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm ${
        active ? "bg-yellow-600 text-white" : "glass text-gray-400"
      }`}>
      {children}
    </button>
  )
}
