import React, { useState } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-12 animate-fade-in">

        {/* HERO */}
        <section className="text-center space-y-4 animate-fade-up">
          <h1 className="text-3xl font-bold text-white leading-tight">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>

          <p className="text-gray-400 text-sm">
            Bienvenido a Punta Rollers
          </p>

          <div className="space-y-2 pt-2">
            <a href="/login" className="btn-gold w-full">
              Entrar como alumno
            </a>

            <a href="/admin" className="text-xs text-gray-500 underline">
              Acceso administrador
            </a>
          </div>
        </section>

        {/* QUIENES SOMOS */}
        <section className="space-y-4 text-center animate-fade-up stagger-1">
          <p className="section-label">Quiénes somos</p>

          <div className="glass p-5 rounded-xl hover:scale-[1.02] transition">
            <p className="text-white font-semibold text-lg">
              🛼 Punta Rollers
            </p>

            <p className="text-gray-300 text-sm">
              Escuela de patín en línea en Punta del Este.
            </p>

            <p className="text-gray-400 text-sm">
              Clases para niños y adultos, todos los niveles.
            </p>

            <p className="text-gray-500 text-xs">
              🔥 Comunidad · Progreso · Experiencia
            </p>
          </div>
        </section>

        {/* HORARIOS */}
        <section className="space-y-4 animate-fade-up stagger-2">
          <p className="section-label">Horarios</p>

          <div className="flex gap-2 justify-center">
            <Tab active={day==="miercoles"} onClick={()=>setDay("miercoles")}>Miércoles</Tab>
            <Tab active={day==="sabado"} onClick={()=>setDay("sabado")}>Sábado</Tab>
          </div>

          {day === "miercoles" && (
            <div className="space-y-3">
              <ScheduleCard title="Principiantes" time="19:00" />
              <ScheduleCard title="Avanzado" time="20:00" />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <ScheduleCard title="PR Kids" time="19:00" />
              <ScheduleCard title="Adultos" time="20:00" />
            </div>
          )}
        </section>

        {/* INSCRIPCIONES */}
        <section className="space-y-4 animate-fade-up stagger-3">
          <p className="section-label">Inscripciones abiertas</p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids" className="pr-banner hover:scale-[1.02] transition">
            <img src="/banner-kids.png" />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026" className="pr-banner hover:scale-[1.02] transition">
            <img src="/banner-adultos.png" />
          </a>
        </section>

        {/* EXPLORAR */}
        <section className="space-y-4 animate-fade-up stagger-4">
          <p className="section-label">Explorar</p>

          <div className="grid grid-cols-2 gap-4">

            <Card link="/cuponeras" icon="🎟️" title="Cuponeras" subtitle="Flexibilidad" />
            <Card link="/pasaporte-kids" icon="🧒" title="Kids" subtitle="Progreso" />
            <Card link="/uniformes" icon="👕" title="Uniformes" subtitle="Vestí PR" />
            <Card link="/tracking" icon="🏷️" title="Tracking" subtitle="Equipos" />

            <a href="/terminos" className="glass p-4 rounded-xl col-span-2 text-center hover:scale-[1.02] transition">
              <p className="text-white">📜 Reglas</p>
              <p className="text-gray-400 text-xs">Condiciones del club</p>
            </a>

          </div>
        </section>

        {/* PLATAFORMAS */}
        <section className="space-y-4 animate-fade-up stagger-5">
          <p className="section-label">Plataformas</p>

          <a href="https://puntarollerscard.com/" className="pr-banner hover:scale-[1.02] transition">
            <img src="/banner-prcard.png" />
          </a>

          <a href="https://rollermap.vercel.app/" className="pr-banner hover:scale-[1.02] transition">
            <img src="/banner-rollermap.png" />
          </a>
        </section>

        {/* ALIANZA */}
        <section className="space-y-4 animate-fade-up stagger-6">
          <p className="section-label">Comunidad</p>

          <a href="/alianza" className="glass p-4 rounded-xl flex justify-between items-center hover:scale-[1.02] transition">
            <div>
              <p className="text-white font-semibold">🛼 Alianza</p>
              <p className="text-gray-400 text-sm">Uruguay</p>
            </div>
            <span className="text-gray-500">→</span>
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

function Card({link, icon, title, subtitle}) {
  return (
    <a href={link} className="glass p-4 rounded-xl text-center hover:scale-[1.05] transition">
      <p className="text-xl">{icon}</p>
      <p className="text-white text-sm">{title}</p>
      <p className="text-gray-400 text-xs">{subtitle}</p>
    </a>
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

function ScheduleCard({title, time}) {
  return (
    <div className="glass p-4 rounded-xl hover:scale-[1.02] transition">
      <p className="text-white">{title}</p>
      <p className="text-gray-400 text-sm">{time}</p>
    </div>
  )
}
