import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Inscripciones2026.css'

const groupSchedules = [
  { day: 'Miércoles', time: '19:30–20:30', level: 'Todos los niveles', place: 'Parada 2 · Punta del Este', type: 'Aire libre' },
  { day: 'Sábado', time: '09:00–10:00', level: 'Intermedios + Avanzados', place: 'Parada 2 · Punta del Este', type: 'Aire libre' },
  { day: 'Sábado', time: '10:00–11:00', level: 'Principiantes', place: 'Parada 2 · Punta del Este', type: 'Aire libre' },
  { day: 'Sábado', time: '20:00–21:00', level: 'Todos los niveles', place: 'Maldonado', type: 'Pista cerrada' },
]

const saturdayOptions = [
  'Sábado 09:00–10:00 · Intermedios/Avanzados · Parada 2',
  'Sábado 10:00–11:00 · Principiantes · Parada 2',
  'Sábado 20:00–21:00 · Todos los niveles · Pista cerrada Maldonado',
]

const initialForm = {
  nombre_completo: '', edad: '', localidad: '', email: '', telefono: '', nivel: '',
  turno_sabado: '', objetivo_personalizadas: '',
}

export default function Inscripciones2026() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [accepted, setAccepted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const amount = mode === 'personalizadas' ? 2900 : 1500
  const progress = useMemo(() => `${Math.min(step + 1, 5)} / 5`, [step])

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const chooseMode = (value) => {
    setMode(value)
    setForm(initialForm)
    setError('')
    setStep(1)
  }

  const validateStudent = () => {
    if (!form.nombre_completo.trim() || !form.edad || !form.localidad.trim() || !form.email.trim() || !form.telefono.trim() || !form.nivel) {
      setError('Completá todos los datos para continuar.')
      return false
    }
    const age = Number(form.edad)
    if (!Number.isInteger(age) || age < 5 || age > 100) {
      setError('Ingresá una edad válida.')
      return false
    }
    setError('')
    return true
  }

  const validateSpecific = () => {
    if (mode === 'grupales' && !form.turno_sabado) {
      setError('Elegí tu turno de los sábados.')
      return false
    }
    if (mode === 'personalizadas' && !form.objetivo_personalizadas.trim()) {
      setError('Contanos brevemente qué te gustaría trabajar.')
      return false
    }
    setError('')
    return true
  }

  const submit = async () => {
    if (!accepted) {
      setError('Confirmá que entendés cómo funciona la pre-reserva.')
      return
    }
    setSending(true)
    setError('')
    const payload = {
      modalidad: mode,
      nombre_completo: form.nombre_completo.trim(),
      edad: Number(form.edad),
      localidad: form.localidad.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim(),
      nivel: form.nivel,
      turno_sabado: mode === 'grupales' ? form.turno_sabado : null,
      objetivo_personalizadas: mode === 'personalizadas' ? form.objetivo_personalizadas.trim() : null,
      monto: amount,
      metodo_pago: 'Prex',
      estado: 'pre_reserva',
      comprobante_recibido: false,
    }
    const { error: insertError } = await supabase.from('pr_inscripciones_2026').insert(payload)
    setSending(false)
    if (insertError) {
      setError('No pudimos guardar tu inscripción. Probá nuevamente en unos minutos.')
      return
    }
    setStep(5)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="pr-reg-shell">
      <div className="pr-reg-orb pr-reg-orb-a" />
      <div className="pr-reg-orb pr-reg-orb-b" />
      <section className="pr-reg-card">
        <header className="pr-reg-brand">
          <img src="/logo.png" alt="Punta Rollers" className="pr-reg-logo" />
          <span className="pr-reg-pill">Nuevos ingresos · Septiembre 2026</span>
        </header>

        {step < 5 && <div className="pr-reg-progress"><span style={{ width: `${((step + 1) / 5) * 100}%` }} /><small>{progress}</small></div>}

        {step === 0 && (
          <div className="pr-reg-stage">
            <p className="pr-reg-kicker">INSCRIPCIONES 2026</p>
            <h1>Elegí cómo querés patinar.</h1>
            <p className="pr-reg-lead">Estas inscripciones son para comenzar en septiembre. Primero conocé cada modalidad y después decidí si querés hacer tu pre-reserva.</p>
            <p className="pr-reg-choice-hint">Elegí la opción que más te interese para ver cómo funciona, precios y disponibilidad.</p>
            <div className="pr-reg-choice-grid">
              <button className="pr-reg-choice pr-reg-choice-group" onClick={() => chooseMode('grupales')}>
                <span className="pr-reg-choice-icon">👥</span><strong>Clases Grupales</strong><small>Hasta 2 encuentros por semana</small><b>$1.500 / mes</b>
              </button>
              <button className="pr-reg-choice pr-reg-choice-private" onClick={() => chooseMode('personalizadas')}>
                <span className="pr-reg-choice-icon">⭐</span><strong>Personalizadas 1 a 1</strong><small>Una hora enfocada 100% en vos</small><b>$2.900 / 4 clases</b>
              </button>
            </div>
            <p className="pr-reg-note">Tu lugar se confirma únicamente después de que verifiquemos el pago.</p>
          </div>
        )}

        {step === 1 && mode === 'grupales' && (
          <div className="pr-reg-stage">
            <button className="pr-reg-back" onClick={() => setStep(0)}>← Cambiar modalidad</button>
            <p className="pr-reg-kicker">CLASES GRUPALES</p>
            <h1>Patiná, aprendé y compartí.</h1>
            <div className="pr-reg-price"><span>Mensualidad</span><strong>$1.500</strong><small>Miércoles + 1 turno fijo los sábados</small></div>
            <div className="pr-reg-schedules">
              {groupSchedules.map(item => <article key={`${item.day}-${item.time}`}><div><b>{item.day}</b><strong>{item.time}</strong></div><p>{item.level}</p><small>{item.place} · {item.type}</small></article>)}
            </div>
            <div className="pr-reg-info"><b>🌦️ Sobre las clases al aire libre</b><p>Los encuentros en Parada 2 dependen del clima. Si se suspenden por lluvia, no generan una fecha adicional de recuperación.</p></div>
            <button className="pr-reg-primary" onClick={() => setStep(2)}>Quiero hacer mi pre-reserva →</button>
          </div>
        )}

        {step === 1 && mode === 'personalizadas' && (
          <div className="pr-reg-stage">
            <button className="pr-reg-back" onClick={() => setStep(0)}>← Cambiar modalidad</button>
            <p className="pr-reg-kicker">PERSONALIZADAS 1 A 1</p>
            <h1>Una hora enfocada 100% en vos.</h1>
            <p className="pr-reg-lead">Encuentros individuales adaptados a tu nivel, tus objetivos y tu ritmo. Desde cero o para perfeccionar técnica.</p>
            <div className="pr-reg-price"><span>Cuponera</span><strong>$2.900</strong><small>4 encuentros · 60 min aprox.</small></div>
            <div className="pr-reg-feature-grid">
              <article><b>🎯 A tu medida</b><p>Equilibrio, empuje, frenadas, giros, seguridad, técnica y práctica en calle.</p></article>
              <article><b>📅 Vos elegís</b><p>Cada domingo recibís los horarios libres y reservás el que mejor te quede.</p></article>
              <article><b>⚡ Flexible</b><p>Podés tomar 1 o 2 clases por semana o dejar semanas libres.</p></article>
              <article><b>🔒 Cupos reales</b><p>Es una persona por hora, por eso la disponibilidad es más limitada.</p></article>
            </div>
            <div className="pr-reg-info"><b>Cancelaciones</b><p>Si avisás con anticipación, el cupón no se pierde. Si no asistís o cancelás cuando ya llegó el horario, el encuentro se descuenta.</p></div>
            <button className="pr-reg-primary" onClick={() => setStep(2)}>Quiero hacer mi pre-reserva →</button>
          </div>
        )}

        {step === 2 && (
          <div className="pr-reg-stage">
            <button className="pr-reg-back" onClick={() => setStep(1)}>← Volver a la información</button>
            <p className="pr-reg-kicker">DATOS DEL ALUMNO</p><h1>Ahora sí, contanos quién sos.</h1>
            <div className="pr-reg-form-grid">
              <label>Nombre completo<input value={form.nombre_completo} onChange={e => update('nombre_completo', e.target.value)} autoComplete="name" /></label>
              <label>Edad<input type="number" inputMode="numeric" value={form.edad} onChange={e => update('edad', e.target.value)} /></label>
              <label>Localidad<input value={form.localidad} onChange={e => update('localidad', e.target.value)} /></label>
              <label>Email<input type="email" inputMode="email" value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" /></label>
              <label>WhatsApp<input type="tel" inputMode="tel" value={form.telefono} onChange={e => update('telefono', e.target.value)} autoComplete="tel" /></label>
              <label>Nivel de patín<select value={form.nivel} onChange={e => update('nivel', e.target.value)}><option value="">Seleccioná</option><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select></label>
            </div>
            {error && <p className="pr-reg-error">{error}</p>}
            <button className="pr-reg-primary" onClick={() => validateStudent() && setStep(3)}>Continuar →</button>
          </div>
        )}

        {step === 3 && (
          <div className="pr-reg-stage">
            <button className="pr-reg-back" onClick={() => setStep(2)}>← Volver a mis datos</button>
            <p className="pr-reg-kicker">TU MODALIDAD</p>
            {mode === 'grupales' ? <><h1>Elegí tu turno de los sábados.</h1><p className="pr-reg-lead">El miércoles 19:30 está incluido para todos.</p><div className="pr-reg-radio-list">{saturdayOptions.map(option => <label key={option} className={form.turno_sabado === option ? 'selected' : ''}><input type="radio" name="turno" checked={form.turno_sabado === option} onChange={() => update('turno_sabado', option)} /><span>{option}</span></label>)}</div></> : <><h1>¿Qué te gustaría conseguir?</h1><p className="pr-reg-lead">Así podemos preparar mejor tu experiencia desde el primer encuentro.</p><textarea className="pr-reg-textarea" rows="6" value={form.objetivo_personalizadas} onChange={e => update('objetivo_personalizadas', e.target.value)} placeholder="Ej.: aprender desde cero, ganar seguridad, mejorar frenadas, técnica, salir a calle…" /></>}
            {error && <p className="pr-reg-error">{error}</p>}
            <button className="pr-reg-primary" onClick={() => validateSpecific() && setStep(4)}>Ver pago y confirmar →</button>
          </div>
        )}

        {step === 4 && (
          <div className="pr-reg-stage">
            <button className="pr-reg-back" onClick={() => setStep(3)}>← Volver</button>
            <p className="pr-reg-kicker">ÚLTIMO PASO</p><h1>Pre-reservá tu lugar para septiembre.</h1>
            <div className="pr-reg-payment"><span>Importe a abonar</span><strong>${amount.toLocaleString('es-UY')}</strong><div><b>Tarjeta Prex</b><p>Claudio Facelli</p><p>Cuenta Prex: <strong>70658</strong></p></div></div>
            <div className="pr-reg-info"><b>📲 Después de transferir</b><p>Identificá la transferencia con el <strong>nombre del alumno</strong> y enviá el comprobante al WhatsApp de Punta Rollers:</p><a href="https://wa.me/59898971505" target="_blank" rel="noreferrer">098 971 505</a></div>
            <p className="pr-reg-lead">Completar este formulario genera una <strong>pre-reserva</strong>. Tu lugar queda confirmado cuando Punta Rollers verifica el pago. Quedarás en el listado de nuevos ingresos hasta la convocatoria de septiembre.</p>
            <label className="pr-reg-check"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>Entiendo que la inscripción corresponde a septiembre de 2026 y que la reserva se confirma luego de verificar el pago.</span></label>
            {error && <p className="pr-reg-error">{error}</p>}
            <button className="pr-reg-primary" disabled={sending} onClick={submit}>{sending ? 'Guardando…' : 'Enviar pre-reserva ✓'}</button>
          </div>
        )}

        {step === 5 && (
          <div className="pr-reg-stage pr-reg-success">
            <div className="pr-reg-success-icon">✓</div><p className="pr-reg-kicker">SOLICITUD RECIBIDA</p><h1>¡Ya estás en la lista para septiembre!</h1>
            <p className="pr-reg-lead">Recibimos tu pre-reserva. Cuando corroboremos el pago, Punta Rollers se pondrá en contacto contigo para confirmar tu lugar.</p>
            <div className="pr-reg-info"><b>¿Qué sigue?</b><p>Te vamos a mantener en el listado de nuevos ingresos y, antes de comenzar en septiembre, recibirás la información necesaria para incorporarte a tu grupo.</p></div>
            <a className="pr-reg-primary pr-reg-link" href="https://wa.me/59898971505" target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp</a>
          </div>
        )}
      </section>
    </main>
  )
}