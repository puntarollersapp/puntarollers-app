import PublicLayout from "../layouts/PublicLayout"

export default function Tracking() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <section className="text-center space-y-3">
          <p className="section-label">Servicio para alumnos PR</p>
          <h1 className="text-3xl font-bold text-white">🏷️ PR Tracking</h1>
          <p className="text-gray-400 text-sm">Identificación NFC para equipamiento, legitimidad y recuperación.</p>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">¿Qué es?</p>
          <p className="text-gray-300 text-sm">PR Tracking vincula un chip NFC configurado a un artículo: patines, casco, protecciones, termo u otro equipamiento.</p>
          <p className="text-gray-400 text-sm">Al acercar un celular, se puede ver información del artículo, foto, modelo, detalles y contacto del dueño para comprobar legitimidad o reportar pérdida.</p>
        </section>

        <section className="space-y-3">
          <p className="section-label">Para qué sirve</p>
          <Info title="🛡️ Legitimidad" text="Ayuda a comprobar que un artículo pertenece realmente a un alumno PR." />
          <Info title="🔎 Recuperación" text="Si algo se pierde o queda en clase, facilita contactar al dueño." />
          <Info title="📦 Organización" text="Ideal para patines, cascos, protecciones, termos y accesorios." />
        </section>
      </div>
    </PublicLayout>
  )
}

function Info({ title, text }) {
  return <div className="glass p-4 rounded-2xl"><p className="text-white font-semibold">{title}</p><p className="text-gray-400 text-sm mt-1">{text}</p></div>
}
