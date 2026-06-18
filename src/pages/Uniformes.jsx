import PublicLayout from "../layouts/PublicLayout"

export default function Uniformes() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        {/* HEADER */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            👕 Uniformes PR
          </h1>

          <p className="text-gray-400 text-sm">
            Vestí Punta Rollers dentro y fuera de la pista
          </p>
        </section>

        {/* INTRO */}
        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            Diseño oficial de la comunidad
          </p>

          <p className="text-gray-300 text-sm">
            Los uniformes de Punta Rollers están pensados para acompañarte en cada entrenamiento, con comodidad, estilo y identidad.
          </p>

          <p className="text-gray-400 text-sm">
            Cada línea está adaptada según edad y uso, con diseños diferentes para niños y adultos.
          </p>
        </section>

        {/* LINEAS */}
        <section className="space-y-3">
          <p className="section-label">Líneas disponibles</p>

          <div className="grid grid-cols-1 gap-3">

            {/* KIDS */}
            <div className="glass p-4 rounded-xl space-y-2">
              <p className="text-white font-medium">
                🧒 PR Kids
              </p>

              <p className="text-gray-300 text-sm">
                Remeras diseñadas especialmente para niños.
              </p>

              <p className="text-gray-400 text-xs">
                Diseño más dinámico, cómodo y adaptado al aprendizaje.
              </p>
            </div>

            {/* ADULTOS */}
            <div className="glass p-4 rounded-xl space-y-2">
              <p className="text-white font-medium">
                🧑 Adultos
              </p>

              <p className="text-gray-300 text-sm">
                Remeras y buzos oficiales de entrenamiento.
              </p>

              <p className="text-gray-400 text-xs">
                Diseño más sobrio y técnico, pensado para rendimiento y estilo.
              </p>
            </div>

          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="space-y-3">
          <p className="section-label">¿Por qué tenerlo?</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🔥 Identidad</p>
              <p className="text-gray-400 text-xs">
                Representás Punta Rollers
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🛼 Comodidad</p>
              <p className="text-gray-400 text-xs">
                Pensado para entrenar
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">📸 Presencia</p>
              <p className="text-gray-400 text-xs">
                Se luce en fotos, eventos y salidas
              </p>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4 space-y-3">
          <a
            href="https://wa.me/598XXXXXXXX"
            className="btn-gold w-full"
          >
            Consultar talles y modelos
          </a>

          <p className="text-gray-500 text-xs">
            Disponibilidad según stock y temporada
          </p>
        </section>

      </div>
    </PublicLayout>
  )
}
