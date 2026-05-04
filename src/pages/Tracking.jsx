import PublicLayout from "../layouts/PublicLayout"

export default function Tracking() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            🏷️ PR Tracking
          </h1>

          <p className="text-gray-400 text-sm">
            Sistema de identificación y control de equipamiento
          </p>
        </section>

        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            ¿Qué es PR Tracking?
          </p>

          <p className="text-gray-300 text-sm">
            Es un sistema que permite identificar y recuperar equipamiento en caso de pérdida.
          </p>

          <p className="text-gray-400 text-sm">
            Cada elemento puede estar vinculado a su dueño mediante un sistema de registro.
          </p>
        </section>

        <section className="space-y-3">
          <p className="section-label">¿Para qué sirve?</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🔎 Identificación</p>
              <p className="text-gray-400 text-xs">
                Saber a quién pertenece cada equipo
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">📦 Recuperación</p>
              <p className="text-gray-400 text-xs">
                En caso de pérdida, facilita devolverlo
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🛡️ Seguridad</p>
              <p className="text-gray-400 text-xs">
                Más control dentro de la comunidad
              </p>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  )
}
