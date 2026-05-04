import { useState, useEffect } from "react"
import PublicLayout from "../layouts/PublicLayout"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  const [cupos, setCupos] = useState({
    miercoles: { principiantes: 6, avanzado: 3 },
    sabado: { kids: 8, adultos: 5 }
  })

  return (
    <PublicLayout>
      <div className="px-4 py-8 space-y-12">

        {/* HERO */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>

          <p className="text-gray-400">
            Bienvenido a Punta Rollers
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <a href="/login" className="btn-gold">
              Entrar como alumno
            </a>

            <a href="/admin" className="text-sm text-gray-400 underline">
              Acceso administrador
            </a>
          </div>
        </section>

        {/* QUIENES SOMOS */}
        <section className="space-y-3">
          <p className="section-label">Quiénes somos</p>

          <div className="glass p-5 rounded-2xl text-center">
            <p className="text-white font-semibold">
              🛼 Punta Rollers
            </p>
            <p className="text-gray-400 text-sm">
              Escuela de patín en línea en Punta del Este
            </p>
            <p className="text-gray-500 text-xs">
              Clases para niños y adultos · Todos los niveles
            </p>
          </div>
        </section>

        {/* HORARIOS */}
        <section className="space-y-4">
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
              <Card title="Principiantes" time="19:00 - 20:00" cupos={cupos.miercoles.principiantes} />
              <Card title="Avanzado" time="20:00 - 21:00" cupos={cupos.miercoles.avanzado} />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <Card title="PR Kids" time="19:00 - 20:00" cupos={cupos.sabado.kids} />
              <Card title="Adultos" time="20:00 - 21:00" cupos={cupos.sabado.adultos} />
            </div>
          )}
        </section>

        {/* INSCRIPCIONES */}
        <section className="space-y-4">
          <p className="section-label">Inscripciones</p>

          <a href="https://form.jotform.com/Claudinio/inscripcioneskids">
            <img src="/banner-kids.png" className="rounded-xl w-full" />
          </a>

          <a href="https://form.jotform.com/Claudinio/Inscripciones2026">
            <img src="/banner-adultos.png" className="rounded-xl w-full" />
          </a>
        </section>

        {/* PLATAFORMAS */}
        <section className="space-y-4">
          <p className="section-label">Plataformas</p>

          <a href="https://puntarollerscard.com/">
            <img src="/banner-prcard.png" className="rounded-xl w-full" />
          </a>

          <a href="https://rollermap.vercel.app/">
            <img src="/banner-rollermap.png" className="rounded-xl w-full" />
          </a>
        </section>

        {/* ALIANZA */}
        <section className="space-y-4">
          <p className="section-label">Alianza</p>

          <a href="/alianza">
            <div className="glass p-4 rounded-xl text-center">
              🤝 Alianza Rollers
            </div>
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

/* COMPONENTES */

function Card({ title, time, cupos }) {
  return (
    <div className="glass p-4 rounded-2xl flex justify-between items-center">
      <div>
        <p className="text-white font-semibold">{title}</p>
        <p className="text-gray-400 text-sm">{time}</p>
      </div>

      <p className="text-green-400 text-xs">
        ● {cupos} disponibles
      </p>
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
