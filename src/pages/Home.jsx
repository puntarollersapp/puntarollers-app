import React, { useState } from "react"

export default function Home() {
  const [day, setDay] = useState("miercoles")

  return (
    <div className="px-4 pb-24 pt-6 space-y-8 max-w-md mx-auto">

      {/* HERO */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white leading-tight">
          No es solo patinar,
          <span className="block text-yellow-500">es pertenecer.</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Bienvenido a Punta Rollers
        </p>
      </div>

      {/* HORARIOS */}
      <div className="space-y-4">
        <h2 className="text-white text-lg font-semibold text-center">
          ¿Cuándo entrenamos?
        </h2>

        <div className="flex gap-2 justify-center">
          {["miercoles", "sabado"].map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                day === d
                  ? "bg-yellow-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400"
              }`}
            >
              {d === "miercoles" ? "Miércoles" : "Sábado"}
            </button>
          ))}
        </div>

        {day === "miercoles" && (
          <div className="space-y-3">
            <Card
              title="Adultos Principiantes"
              time="19:00 - 20:00"
              place="Parada 2 (aire libre)"
            />
            <Card
              title="Intermedio / Avanzado"
              time="20:00 - 21:00"
              place="Parada 2 (aire libre)"
            />
          </div>
        )}

        {day === "sabado" && (
          <div className="space-y-3">
            <Card
              title="PR Kids"
              time="19:00 - 20:00"
              place="Pista cerrada"
            />
            <Card
              title="Clase Mixta"
              time="20:00 - 21:00"
              place="Pista cerrada"
            />
          </div>
        )}
      </div>

      {/* INSCRIPCIONES */}
      <Section title="Inscripciones abiertas">
        <Banner link="https://form.jotform.com/Claudinio/inscripcioneskids" img="/banner-kids.png" />
        <Banner link="https://form.jotform.com/Claudinio/Inscripciones2026" img="/banner-adultos.png" />
      </Section>

      {/* PLATAFORMAS */}
      <Section title="Plataformas">
        <Banner link="https://puntarollerscard.com/" img="/banner-prcard.png" />
        <Banner link="https://rollermap.vercel.app/" img="/banner-rollermap.png" />
      </Section>

      {/* ALIANZA */}
      <Section title="Alianza Rollers">
        <Banner link="https://chat.whatsapp.com/EmQnKWP0T6o62Pln03omq0" img="/banner-alianza.png" />
        <div className="text-center mt-2">
          <a
            href="https://www.instagram.com/alianzaroller"
            className="text-gray-400 text-sm underline"
          >
            Ver Instagram de Alianza
          </a>
        </div>
      </Section>

    </div>
  )
}

/* COMPONENTES */

function Card({ title, time, place }) {
  return (
    <div className="bg-[#0f0f0f] p-4 rounded-2xl border border-white/5 shadow-sm">
      <p className="text-white font-medium">{title}</p>
      <p className="text-gray-400 text-sm">{time}</p>
      <p className="text-gray-500 text-xs">{place}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="text-white text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function Banner({ link, img }) {
  return (
    <a href={link} className="block">
      <img
        src={img}
        className="rounded-2xl w-full shadow-lg hover:scale-[1.02] transition"
      />
    </a>
  )
}
