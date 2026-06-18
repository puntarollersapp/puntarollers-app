import PublicLayout from "../layouts/PublicLayout"

export default function Terminos() {
  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">

        {/* HEADER */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">
            📜 Reglas y condiciones
          </h1>

          <p className="text-gray-400 text-sm">
            Funcionamiento general de clases y cuponeras
          </p>
        </section>

        {/* BLOQUE */}
        <Section title="📅 Reservas y cancelaciones">
          <p>Las clases deben reservarse con anticipación.</p>
          <p>El link de reserva se envía semanalmente.</p>
          <p>Cancelaciones con mínimo 12 horas de aviso.</p>
          <p>Sin aviso → la clase se considera tomada.</p>
          <p>Las clases canceladas a tiempo pueden reprogramarse dentro del mes.</p>
        </Section>

        <Section title="⏳ Vencimiento de cuponeras">
          <p>Las cuponeras tienen duración definida al momento de compra.</p>
          <p>No se realizan extensiones salvo casos médicos justificados.</p>
        </Section>

        <Section title="⏱️ Asistencia y puntualidad">
          <p>Las clases comienzan y terminan en horario.</p>
          <p>Las llegadas tarde no se recuperan.</p>
          <p>Faltas sin aviso descuentan la clase.</p>
        </Section>

        <Section title="💳 Pagos">
          <p>Las clases se abonan antes de comenzar.</p>
          <p>Las cuponeras se pagan en su totalidad al inicio.</p>
          <p>No se dictan clases sin pago previo.</p>
          <p>Pagos grupales: del 01 al 10 de cada mes.</p>
          <p>No hay reembolsos salvo casos excepcionales.</p>
        </Section>

        <Section title="🛡️ Seguridad y equipo">
          <p>Uso obligatorio de casco y protecciones.</p>
          <p>Cada alumno es responsable de su equipo.</p>
          <p>La academia no se responsabiliza por lesiones por incumplimiento.</p>
        </Section>

        <Section title="🤝 Comportamiento">
          <p>Se exige respeto hacia profesores y compañeros.</p>
          <p>Conductas inapropiadas pueden derivar en expulsión sin reembolso.</p>
        </Section>

        <Section title="👥 Clases grupales">
          <p>Inicio puntual sin excepciones.</p>
          <p>Capacidad limitada según seguridad.</p>
          <p>Clases al aire libre pueden suspenderse por clima sin reprogramación.</p>
        </Section>

        <Section title="⚠️ Importante">
          <p>
            A partir de 2025, todas las actividades requieren firma de deslinde de responsabilidad.
          </p>
        </Section>

        {/* CTA */}
        <section className="text-center pt-4">
          <a href="/" className="text-gray-500 text-xs underline">
            Volver al inicio
          </a>
        </section>

      </div>
    </PublicLayout>
  )
}

// COMPONENTE INTERNO
function Section({ title, children }) {
  return (
    <div className="glass p-5 rounded-xl space-y-2 text-sm text-gray-300">
      <p className="text-white font-semibold">{title}</p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}
