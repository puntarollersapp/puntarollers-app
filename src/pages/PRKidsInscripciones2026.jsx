import { useMemo, useState } from 'react'
import './PRKidsInscripciones2026.css'

const initialForm = {
  nombre_nino: '',
  edad: '',
  nivel: '',
  nombre_responsable: '',
  email: '',
  telefono: '',
}

export default function PRKidsInscripciones2026() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const progress = useMemo(() => `${step + 1} / 4`, [step])

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <main className="prk-shell">
      <div className="prk-blob prk-blob-a" />
      <div className="prk-blob prk-blob-b" />
      <div className="prk-stars" aria-hidden="true">✦ · ✧ · ✦ · ✧</div>

      <section className="prk-card">
        <header className="prk-header">
          <div className="prk-brand">
            <img src="/logo.png" alt="Punta Rollers" />
            <div>
              <p>PR KIDS</p>
              <span>Punta Rollers · 2026</span>
            </div>
          </div>
          <span className="prk-badge">🛼 Pequeños sobre ruedas</span>
        </header>

        <div className="prk-progress"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /><small>{progress}</small></div>

        {step === 0 && (
          <div className="prk-stage prk-stage-home">
            <div className="prk-home-topline"><span>🌈</span> INSCRIPCIONES PR KIDS 2026</div>
            <h1 className="prk-home-title">Aprendé, divertite y hacé amigos <em>sobre ruedas.</em></h1>
            <p className="prk-lead prk-home-lead">Un espacio pensado para aprender patinaje con <strong>seguridad</strong>, ganar <strong>confianza</strong> y disfrutar cada logro. Acá aprender también se siente como jugar.</p>

            <div className="prk-home-ribbon">✨ Cada logro se celebra</div>

            <div className="prk-quick-grid prk-quick-grid-home">
              <article className="blue"><span>🗓️</span><div><b>Sábados</b><small>19:00 a 20:00</small></div></article>
              <article className="pink"><span>🏟️</span><div><b>Pista cerrada</b><small>Maldonado · Indoor</small></div></article>
              <article className="yellow"><span>💛</span><div><b>$2.000</b><small>mensual por niño</small></div></article>
              <article className="green"><span>☔</span><div><b>Siempre bajo techo</b><small>Sin depender del clima</small></div></article>
            </div>

            <div className="prk-home-values">
              <span>🛡️ Seguridad</span><span>🎮 Diversión</span><span>🤝 Amigos</span>
            </div>

            <div className="prk-note-card prk-home-note">
              <span>💫</span>
              <div><b>Conocé PR Kids antes de inscribir</b><p>Te mostramos cómo funcionan las clases, qué incluye la mensualidad y toda la información importante para las familias.</p></div>
            </div>

            <button className="prk-primary" onClick={() => setStep(1)}>Descubrir PR Kids →</button>
          </div>
        )}

        {step === 1 && (
          <div className="prk-stage">
            <button className="prk-back" onClick={() => setStep(0)}>← Volver</button>
            <p className="prk-kicker">UNA CLASE QUE SE SIENTE COMO AVENTURA</p>
            <h1>Aprender jugando también es aprender en serio.</h1>

            <div className="prk-benefits">
              <article><span>🛡️</span><div><b>Seguridad primero</b><p>Control, equilibrio y confianza sobre los patines desde cada etapa.</p></div></article>
              <article><span>🎯</span><div><b>Habilidades reales</b><p>Coordinación, frenadas, postura, desplazamiento y autonomía.</p></div></article>
              <article><span>🎮</span><div><b>Aprender jugando</b><p>Juegos y desafíos adaptados a la edad para mantener la motivación.</p></div></article>
              <article><span>🤝</span><div><b>Comunidad</b><p>Amigos, risas y experiencias compartidas dentro de Punta Rollers.</p></div></article>
            </div>

            <div className="prk-details">
              <div><span>📍</span><p><b>Pista cerrada y techada</b><small>Calle Solís casi Lavalleja · Maldonado</small></p></div>
              <div><span>👩‍⚕️</span><p><b>Cobertura médica</b><small>Disponible en el establecimiento.</small></p></div>
              <div><span>🚻</span><p><b>Comodidad para las familias</b><small>Baños privados y cambiadores.</small></p></div>
            </div>

            <div className="prk-price-card">
              <p>Mensualidad PR Kids</p><strong>$2.000</strong><small>Sin matrícula</small>
              <hr />
              <p className="uniform">👕 Uniforme PR Kids: remera personalizada con el nombre del niño · $690 única vez. El talle se prueba presencialmente.</p>
            </div>

            <button className="prk-primary" onClick={() => setStep(2)}>Quiero inscribirlo/a →</button>
          </div>
        )}

        {step === 2 && (
          <div className="prk-stage">
            <button className="prk-back" onClick={() => setStep(1)}>← Volver a la info</button>
            <p className="prk-kicker">AHORA SÍ 💫</p>
            <h1>Contanos quién se suma a la aventura.</h1>
            <p className="prk-lead">Primero los datos del niño o niña. Después, los del adulto responsable.</p>

            <div className="prk-section-label"><span>🧒</span><b>Datos del niño/a</b></div>
            <div className="prk-form-grid">
              <label>Nombre completo<input value={form.nombre_nino} onChange={e => update('nombre_nino', e.target.value)} /></label>
              <label>Edad<input type="number" inputMode="numeric" value={form.edad} onChange={e => update('edad', e.target.value)} /></label>
              <label className="full">Nivel de patín<select value={form.nivel} onChange={e => update('nivel', e.target.value)}><option value="">Seleccioná una opción</option><option>Primera vez</option><option>Principiante</option><option>Intermedio</option></select></label>
            </div>

            <div className="prk-section-label adult"><span>👨‍👩‍👧</span><b>Adulto responsable</b></div>
            <div className="prk-form-grid">
              <label className="full">Nombre del padre, madre o tutor<input value={form.nombre_responsable} onChange={e => update('nombre_responsable', e.target.value)} /></label>
              <label>Email<input type="email" inputMode="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
              <label>WhatsApp<input type="tel" inputMode="tel" value={form.telefono} onChange={e => update('telefono', e.target.value)} /></label>
            </div>

            <button className="prk-primary" onClick={() => setStep(3)}>Continuar →</button>
          </div>
        )}

        {step === 3 && (
          <div className="prk-stage prk-final">
            <button className="prk-back" onClick={() => setStep(2)}>← Volver a los datos</button>
            <div className="prk-final-icon">🏁</div>
            <p className="prk-kicker">ÚLTIMO PASO</p>
            <h1>¡Ya casi está!</h1>
            <p className="prk-lead">Esta es la pantalla que vamos a conectar a la reserva, pago y confirmación definitiva cuando cerremos la lógica de PR Kids.</p>

            <div className="prk-summary">
              <div><span>🧒 Alumno/a</span><b>{form.nombre_nino || 'Nombre del niño/a'}</b></div>
              <div><span>🗓️ Horario</span><b>Sábado · 19:00 a 20:00</b></div>
              <div><span>💛 Mensualidad</span><b>$2.000</b></div>
              <div><span>👕 Uniforme</span><b>$690 · única vez</b></div>
            </div>

            <div className="prk-coming"><span>🚧</span><div><b>Diseño en construcción</b><p>La experiencia visual ya está armada. El siguiente paso será conectar esta pantalla al sistema de inscripciones y al panel Admin.</p></div></div>
          </div>
        )}
      </section>
    </main>
  )
}
