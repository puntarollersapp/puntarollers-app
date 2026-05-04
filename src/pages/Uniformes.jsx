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
            Vestí la experiencia Punta Rollers.
          </p>
        </section>

        {/* IMAGEN PRINCIPAL */}
        <section className="pr-banner">
          <img src="/uniformes-pr.png" alt="Uniformes Punta Rollers" />
        </section>

        {/* DESCRIPCION */}
        <section className="glass p-5 rounded-xl space-y-3">
          <p className="text-white font-semibold">
            Diseño exclusivo
          </p>

          <p className="text-gray-300 text-sm">
            Nuestras remeras están diseñadas para patinar cómodo, con estilo y representar la comunidad PR.
          </p>

          <p className="text-gray-400 text-sm">
            Material liviano, respirable y pensado para entrenamiento.
          </p>
        </section>

        {/* BENEFICIOS */}
        <section className="space-y-3">
          <p className="section-label">¿Por qué tenerla?</p>

          <div className="grid grid-cols-1 gap-3">

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🔥 Identidad</p>
              <p className="text-gray-400 text-xs">
                Formás parte de Punta Rollers
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">🛼 Comodidad</p>
              <p className="text-gray-400 text-xs">
                Ideal para entrenar
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-white">📸 Estética</p>
              <p className="text-gray-400 text-xs">
                Se ve increíble en fotos y eventos
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
            Pedir mi uniforme
          </a>

          <p className="text-gray-500 text-xs">
            Consultá talles y disponibilidad por WhatsApp
          </p>
        </section>

      </div>
    </PublicLayout>
  )
}
