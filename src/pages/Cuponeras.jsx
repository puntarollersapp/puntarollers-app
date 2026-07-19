import PublicLayout from "../layouts/PublicLayout"

const WHATSAPP_NUMBER = "59898971505"

export default function Cuponeras() {
  const solicitarCuponera = () => {
    const mensaje = [
      "Hola, quiero solicitar una Cuponera PR.",
      "",
      "Modalidad: 4 clases",
      "Precio: $2.000",
      "Vigencia: 2 meses desde la activación",
      "",
      "Entiendo que la cuponera se confirma una vez realizado el pago y que recibiré los datos de transferencia por este medio.",
    ].join("\n")

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      mensaje
    )}`

    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <section className="text-center space-y-3">
          <p className="section-label">Modalidad flexible</p>

          <h1 className="text-3xl font-bold text-white">
            🎟️ Cuponeras PR
          </h1>

          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Entrená a tu ritmo, sin depender de una mensualidad fija.
          </p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-pr-gold/25 bg-gradient-to-br from-pr-gold/20 via-white/[0.05] to-black p-5">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-pr-gold/10 blur-3xl" />

          <div className="relative space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-pr-gold text-xs uppercase tracking-[0.2em] font-semibold">
                  Cuponera oficial
                </p>

                <h2 className="text-white text-2xl font-bold mt-1">
                  4 clases PR
                </h2>

                <p className="text-white/45 text-sm mt-1">
                  Para usar dentro de un período de dos meses.
                </p>
              </div>

              <div className="shrink-0 w-20 h-20 rounded-2xl bg-pr-gold text-black flex items-center justify-center text-4xl shadow-lg shadow-pr-gold/10">
                🛼
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-pr-gold/35 bg-black/20 p-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-white/45 text-xs">Valor total</p>
                <p className="text-pr-gold text-3xl font-bold mt-1">
                  $2.000
                </p>
              </div>

              <div className="text-right">
                <p className="text-white/45 text-xs">Vigencia</p>
                <p className="text-white font-semibold mt-1">2 meses</p>
              </div>
            </div>

            <button
              type="button"
              onClick={solicitarCuponera}
              className="btn-gold w-full py-4"
            >
              Solicitar cuponera por WhatsApp
            </button>
          </div>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">¿Para quién es?</p>

          <p className="text-gray-300 text-sm leading-relaxed">
            Está pensada para alumnos de otros departamentos, extranjeros,
            familias con horarios variables o niños con tenencia compartida.
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            En lugar de abonar una mensualidad fija, comprás cuatro clases por
            adelantado y las utilizás cuando asistís.
          </p>
        </section>

        <section className="space-y-3">
          <Info
            title="4️⃣ Cuatro clases"
            text="La cuponera incluye cuatro clases de Punta Rollers."
          />

          <Info
            title="⏳ Dos meses de vigencia"
            text="Tenés hasta dos meses desde la activación para utilizar las cuatro clases."
          />

          <Info
            title="✅ Uso flexible"
            text="Cada vez que asistís se descuenta una clase de tu cuponera."
          />

          <Info
            title="💳 Confirmación con pago"
            text="La cuponera queda activa una vez realizado el pago. Los datos de transferencia se coordinan por WhatsApp."
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-white/35 text-xs text-center leading-relaxed">
            La cuponera es personal e intransferible. Las clases no utilizadas
            dentro del período de vigencia no se acumulan.
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
      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{text}</p>
    </div>
  )
}
