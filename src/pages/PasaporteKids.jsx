import PublicLayout from "../layouts/PublicLayout"

export default function PasaporteKids() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <section className="text-center space-y-3">
          <p className="section-label">PR Kids</p>
          <h1 className="text-3xl font-bold text-white">🧒 Pasaporte Kids</h1>
          <p className="text-gray-400 text-sm">Un compañero físico para motivar, jugar y registrar avances.</p>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">¿Cómo funciona?</p>
          <p className="text-gray-300 text-sm">Se entrega a nuestros alumnos niños. Cada clase puede sumar sellos, actividades, notas y recuerdos.</p>
          <p className="text-gray-400 text-sm">Al juntar cierta cantidad de sellos, pueden canjear estímulos como medias, cadenitas, mochilas u otras sorpresas.</p>
        </section>

        <section className="space-y-3">
          <p className="section-label">También incluye</p>
          <Info title="⭐ Stickers motivacionales" text="Los profesores otorgan stickers por logros: buen compañero, ya gira, patina de espaldas, actitud destacada y más." />
          <Info title="🎲 Actividades" text="Juegos, dibujos, perfil propio y espacios para que el niño sienta el pasaporte como suyo." />
          <Info title="💚 Refuerzo positivo" text="No es presión: es motivación, pertenencia y celebración del proceso." />
        </section>
      </div>
    </PublicLayout>
  )
}

function Info({ title, text }) {
  return <div className="glass p-4 rounded-2xl"><p className="text-white font-semibold">{title}</p><p className="text-gray-400 text-sm mt-1">{text}</p></div>
}
