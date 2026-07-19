import PublicLayout from "../layouts/PublicLayout"

const imagenes = [
  {
    src: "/pasaporte-kids/01-presentacion-pasaporte-pr-kids.jpg",
    alt: "Presentación del Pasaporte PR Kids",
  },
  {
    src: "/pasaporte-kids/02-como-funciona-pasaporte-pr-kids.jpg",
    alt: "Cómo funciona el Pasaporte PR Kids",
  },
  {
    src: "/pasaporte-kids/03-experiencia-pasaporte-pr-kids.jpg",
    alt: "Experiencia, misiones y progreso del Pasaporte PR Kids",
  },
]

export default function PasaporteKids() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <section className="text-center space-y-3">
          <p className="section-label">PR Kids</p>
          <h1 className="text-3xl font-bold text-white">
            🧒 Pasaporte PR Kids
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Cada clase suma experiencias, sellos, logros y recompensas.
          </p>
        </section>

        <section className="space-y-4">
          {imagenes.map((imagen) => (
            <article
              key={imagen.src}
              className="overflow-hidden rounded-3xl border border-white/10 bg-black"
            >
              <img
                src={imagen.src}
                alt={imagen.alt}
                className="w-full h-auto block"
              />
            </article>
          ))}
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">
            ¿Cómo funciona?
          </p>

          <p className="text-gray-300 text-sm leading-relaxed">
            En cada clase los niños reciben sellos especiales por su
            participación, esfuerzo y progreso.
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            A medida que completan actividades, desafíos y misiones, pueden
            desbloquear reconocimientos y recompensas dentro de su experiencia
            en Punta Rollers.
          </p>
        </section>

        <section className="space-y-3">
          <Info
            title="🛼 Cada clase cuenta"
            text="La asistencia y el esfuerzo se registran dentro del pasaporte."
          />

          <Info
            title="⭐ Misiones y desafíos"
            text="El pasaporte propone actividades para aprender, mejorar y divertirse."
          />

          <Info
            title="🏆 Progreso personal"
            text="Cada niño puede ver sus avances, anotar logros y celebrar cada etapa."
          />

          <Info
            title="🎁 Sellos y recompensas"
            text="Los sellos acumulados pueden habilitar stickers, cadenitas roleras y otros estímulos definidos por Punta Rollers."
          />

          <Info
            title="💚 Refuerzo positivo"
            text="El objetivo es acompañar, motivar y reconocer el proceso sin presión ni comparaciones."
          />
        </section>

        <section className="rounded-2xl border border-pr-gold/20 bg-pr-gold/[0.07] p-5">
          <p className="text-pr-gold font-semibold">
            Tu pasaporte cuenta tu historia
          </p>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            Más clases, más sellos, más logros y más diversión sobre ruedas.
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}

function Info({ title, text }) {
  return (
    <div className="glass p-4 rounded-2xl">
      <p className="text-white font-semibold">{title}</p>
      <p className="text-gray-400 text-sm mt-1 leading-relaxed">
        {text}
      </p>
    </div>
  )
}
