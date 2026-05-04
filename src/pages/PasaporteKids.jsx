import PublicLayout from "../layouts/PublicLayout"

export default function PasaporteKids() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        {/* HEADER */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            🧒 Pasaporte PR Kids
          </h1>

          <p className="text-gray-400 text-sm">
            Aprender jugando, progresar patinando.
          </p>
        </section>

        {/* IMAGEN PRINCIPAL */}
        <section className="pr-banner">
          <img src="/pasaporte-kids.png" alt="Pasaporte PR Kids" />
        </section>

        {/* EXPLICACION */}
        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            ¿Qué es el pasaporte?
          </p>

          <p className="text-gray-300 text-sm">
            Es una herramienta donde los niños registran su progreso dentro de Punta Rollers.
          </p>

          <p className="text-gray-400 text-sm">
            Cada logro, habilidad y avance se marca con insignias y niveles.
          </p>
        </section>

        {/* BENEFICIOS */}
        <section className="space-y-3">
          <p className="section-label">¿Qué logran los niños?</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🏆 Motivación constante</p>
              <p className="text-gray-400 text-xs">
                Ven su progreso en cada clase
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🎯 Objetivos claros</p>
              <p className="text-gray-400 text-xs">
                Saben qué aprender y cómo avanzar
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🛼 Diversión real</p>
              <p className="text-gray-400 text-xs">
                Aprenden jugando, no por obligación
              </p>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <a
            href="https://form.jotform.com/Claudinio/inscripcioneskids"
            className="btn-gold w-full"
          >
            Inscribir a mi hijo
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}
