import PublicLayout from "../layouts/PublicLayout"

export default function Cuponeras() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <section className="text-center space-y-3">
          <p className="section-label">Modalidad flexible</p>
          <h1 className="text-3xl font-bold text-white">🎟️ Cuponeras PR</h1>
          <p className="text-gray-400 text-sm">Una forma práctica de entrenar sin perder clases cuando no podés venir fijo todo el mes.</p>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">¿Para quién son?</p>
          <p className="text-gray-300 text-sm">Para alumnos de otros departamentos, extranjeros, familias con horarios variables o niños con tenencia compartida.</p>
          <p className="text-gray-400 text-sm">En vez de pagar mensualidad fija, comprás una cuponera y se van tachando las clases usadas.</p>
        </section>

        <section className="space-y-3">
          <Info title="⏳ Vigencia" text="Cada cuponera tiene duración de dos meses." />
          <Info title="✅ Flexibilidad" text="Pagás clases por adelantado y las usás cuando asistís." />
          <Info title="📌 Simple" text="No hay sistema complejo: se controla de forma clara y manual." />
        </section>
      </div>
    </PublicLayout>
  )
}

function Info({ title, text }) {
  return <div className="glass p-4 rounded-2xl"><p className="text-white font-semibold">{title}</p><p className="text-gray-400 text-sm mt-1">{text}</p></div>
}
