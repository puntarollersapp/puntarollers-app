import React, { useEffect, useState } from "react"
import PublicLayout from "../layouts/PublicLayout"
import { getCupos } from "../data/cupos"

export default function Home() {
  const [day, setDay] = useState("miercoles")
  const [cupos, setCupos] = useState(getCupos())

  useEffect(() => {
    const interval = setInterval(() => {
      setCupos(getCupos())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <PublicLayout>
      <div className="px-4 py-8 space-y-14">

        <section className="text-center space-y-6">
          <h1 className="text-4xl font-bold">
            No es solo patinar,
            <span className="block text-gold-gradient">
              es pertenecer.
            </span>
          </h1>
        </section>

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
              <ScheduleCard
                title="Principiantes"
                time="19:00 - 20:00"
                cupos={cupos.miercoles.principiantes}
              />
              <ScheduleCard
                title="Avanzado"
                time="20:00 - 21:00"
                cupos={cupos.miercoles.avanzado}
              />
            </div>
          )}

          {day === "sabado" && (
            <div className="space-y-3">
              <ScheduleCard
                title="PR Kids"
                time="19:00 - 20:00"
                cupos={cupos.sabado.kids}
              />
              <ScheduleCard
                title="Adultos"
                time="20:00 - 21:00"
                cupos={cupos.sabado.adultos}
              />
            </div>
          )}

      </div>
    </PublicLayout>
  )
}

function ScheduleCard({ title, time, cupos }) {
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
