import PublicLayout from "../layouts/PublicLayout"

export default function Tracking() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        {/* HEADER */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            📊 PR Tracking
          </h1>

          <p className="text-gray-400 text-sm">
            Seguimiento real de tu progreso dentro del club.
          </p>
        </section>

        {/* IMAGEN */}
        <section className="pr-banner">
          <img src="/tracking-pr.png" alt="PR Tracking" />
        </section>

        {/* DESCRIPCION */}
        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            ¿Qué es PR Tracking?
          </p>

          <p className="text-gray-300 text-sm">
            Es el sistema interno de Punta Rollers que registra tu actividad dentro del club.
          </p>

          <p className="text-gray-400 text-sm">
            Cada clase, progreso y participación queda registrado para que puedas ver tu evolución real.
          </p>
        </section>

        {/* FUNCIONES */}
        <section className="space-y-3">
          <p className="section-label">¿Qué registra?</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🛼 Clases</p>
              <p className="text-gray-400 text-xs">
                Asistencia y constancia
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">📈 Progreso</p>
              <p className="text-gray-400 text-xs">
                Evolución en habilidades
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🏆 Actividad</p>
              <p className="text-gray-400 text-xs">
                Participación en eventos y comunidad
              </p>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4 space-y-3">
          <a href="/login" className="btn-gold w-full">
            Ver mi progreso
          </a>

          <p className="text-gray-500 text-xs">
            Disponible para alumnos activos del club
          </p>
        </section>

      </div>
    </PublicLayout>
  )
}
