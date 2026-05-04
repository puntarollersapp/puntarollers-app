import PublicLayout from "../layouts/PublicLayout"

export default function Cuponeras() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        {/* HEADER */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            🎟️ Cuponeras
          </h1>
          <p className="text-gray-400 text-sm">
            Entrená a tu ritmo, con flexibilidad total.
          </p>
        </section>

        {/* EXPLICACION */}
        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            ¿Cómo funcionan?
          </p>

          <p className="text-gray-300 text-sm">
            Comprás un pack de clases y las usás dentro de un período determinado.
          </p>

          <p className="text-gray-400 text-sm">
            ✔ Reservás semana a semana  
            ✔ Podés reprogramar con aviso  
            ✔ No perdés clases si avisás a tiempo
          </p>
        </section>

        {/* BENEFICIOS */}
        <section className="space-y-3">
          <p className="section-label">Beneficios</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🧠 Flexibilidad</p>
              <p className="text-gray-400 text-xs">
                Elegís cuándo venir
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">⚡ Ritmo propio</p>
              <p className="text-gray-400 text-xs">
                Avanzás sin presión
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🎯 Compromiso real</p>
              <p className="text-gray-400 text-xs">
                Más constancia = más progreso
              </p>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <a
            href="https://wa.me/598XXXXXXXX"
            className="btn-gold w-full"
          >
            Consultar cuponeras
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}
