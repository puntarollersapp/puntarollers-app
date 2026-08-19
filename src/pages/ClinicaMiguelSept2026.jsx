import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import mfLogo from '../assets/mfLogoData'
import './ClinicaMiguelSept2026.css'
import './ClinicaMiguelSept2026Enhancements.css'

const MAX_CUPOS = 30
const niveles = ['Primera vez', 'Principiante', 'Intermedio', 'Avanzado', 'Competitivo']

const initialForm = {
  nombre_completo: '', edad: '', nivel: '', telefono: '', email: '',
  asistencia_completa: false, opcion_pago: '',
}

export default function ClinicaMiguelSept2026() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [cupos, setCupos] = useState({ ocupados: 0, total: MAX_CUPOS, disponibles: MAX_CUPOS, lista_espera: 0 })
  const [loadingCupos, setLoadingCupos] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const waitlistActive = !loadingCupos && cupos.disponibles <= 0
  const percent = useMemo(() => Math.min(100, Math.round((Math.min(cupos.ocupados, cupos.total) / cupos.total) * 100)), [cupos])
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const loadCupos = async () => {
    const { data, error: seatsError } = await supabase.rpc('clinica_sept_2026_cupos')
    if (!seatsError && data?.[0]) setCupos(data[0])
    setLoadingCupos(false)
  }

  useEffect(() => { loadCupos() }, [])

  const validateData = () => {
    if (!form.nombre_completo.trim() || !form.edad || !form.nivel || !form.telefono.trim()) {
      setError('Completá nombre, edad, nivel y WhatsApp para continuar.')
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

  const validateFinal = () => {
    if (!form.asistencia_completa) {
      setError('Confirmá que participás de las 3 jornadas para continuar.')
      return false
    }
    if (!form.opcion_pago) {
      setError('Seleccioná una de las tres opciones de abajo tocando la tarjeta correspondiente.')
      return false
    }
    setError('')
    return true
  }

  const submit = async () => {
    if (!validateFinal()) return
    setSending(true)
    setError('')

    const { data, error: submitError } = await supabase.rpc('registrar_clinica_sept_2026_v2', {
      p_nombre_completo: form.nombre_completo.trim(),
      p_edad: Number(form.edad),
      p_nivel: form.nivel,
      p_telefono: form.telefono.trim(),
      p_email: form.email.trim(),
      p_asistencia_completa: true,
      p_opcion_pago: form.opcion_pago,
    })

    setSending(false)
    if (submitError) {
      setError('No pudimos guardar la inscripción. Probá nuevamente o escribinos por WhatsApp.')
      await loadCupos()
      return
    }

    setDone({
      id: data?.id,
      payment: form.opcion_pago,
      waitlist: Boolean(data?.lista_espera),
      estado: data?.estado,
      numeroRegistro: data?.numero_registro,
    })
    await loadCupos()
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="clinic-shell">
      <div className="clinic-grid-bg" aria-hidden="true" />
      <div className="clinic-glow clinic-glow-a" />
      <div className="clinic-glow clinic-glow-b" />

      <section className="clinic-card">
        <header className="clinic-brand">
          <img src="/logo.png" alt="Punta Rollers" />
          <div>
            <p>PUNTA ROLLERS PRESENTA</p>
            <span>Clínica Internacional de Patinaje</span>
          </div>
          <img className="clinic-mf-logo" src={mfLogo} alt="Patin's Club Miguel Flores" />
        </header>

        {step < 4 && <CapacityBar cupos={cupos} percent={percent} loading={loadingCupos} />}

        {step === 0 && (
          <div className="clinic-stage clinic-hero">
            <div className="clinic-kicker">ARGENTINA 🇦🇷 · INVITADO INTERNACIONAL</div>
            <h1>Miguel Ángel<br /><em>Flores</em></h1>
            <p className="clinic-subtitle">Subcampeón Mundial Máster · entrenador especializado con más de 40 años de experiencia.</p>

            <div className="clinic-price-hero">
              <div><span>CLÍNICA COMPLETA</span><strong>$2.000</strong></div>
              <div className="clinic-price-meta"><b>3 jornadas</b><b>6 horas totales</b><b>Todos los niveles</b></div>
            </div>

            <div className="clinic-date-band">
              <div><b>04</b><span>VIE</span></div><i>+</i><div><b>05</b><span>SÁB</span></div><i>+</i><div><b>06</b><span>DOM</span></div>
              <small>SEPTIEMBRE 2026 · PUNTA DEL ESTE</small>
            </div>

            <div className="clinic-info-grid">
              <Info icon="⏱️" title="3 días intensivos" text="2 horas por jornada" />
              <Info icon="🏟️" title="2 jornadas" text="Pista cerrada" />
              <Info icon="🌊" title="1 jornada" text="Al aire libre" />
              <Info icon="🛼" title="Todos los niveles" text="Recreativo a competitivo" />
            </div>

            {waitlistActive && <WaitlistNotice />}
            <div className="clinic-note"><b>Horarios a confirmar.</b><span>La inscripción corresponde a la clínica completa de tres jornadas.</span></div>
            <button className="clinic-primary" onClick={() => setStep(1)}>{waitlistActive ? 'Sumarme a la lista de espera →' : 'Quiero mi lugar →'}</button>
          </div>
        )}

        {step === 1 && (
          <div className="clinic-stage">
            <button className="clinic-back" onClick={() => setStep(0)}>← Volver</button>
            <div className="clinic-kicker">LA EXPERIENCIA · 6 HORAS</div>
            <h2>Aprendé. Evolucioná. <em>Superate.</em></h2>
            <p className="clinic-lead">Tres jornadas intensivas para trabajar técnica, seguridad y control con acompañamiento directo de Miguel Flores.</p>
            <div className="clinic-work-grid">
              {[['🎯','Técnica'],['〰️','Curvas'],['🛑','Frenado'],['⚖️','Centro de gravedad'],['🎚️','Control'],['⚡','Entrenamiento recreativo / competitivo']].map(([icon,label]) => <div key={label}><span>{icon}</span><b>{label}</b></div>)}
            </div>
            <div className="clinic-eval"><span>★</span><div><b>Evaluación y control personalizado</b><p>Seguimiento para que puedas aplicar lo trabajado a tu propio nivel.</p></div></div>
            <div className="clinic-includes"><span>✓ Abierto al público</span><span>✓ Certificado digital de participación</span><span>✓ Beneficio especial para alumnos PR</span></div>
            {waitlistActive && <WaitlistNotice compact />}
            <button className="clinic-primary" onClick={() => setStep(2)}>{waitlistActive ? 'Anotarme en lista de espera →' : 'Inscribirme por $2.000 →'}</button>
          </div>
        )}

        {step === 2 && (
          <div className="clinic-stage">
            <button className="clinic-back" onClick={() => setStep(1)}>← Volver a la info</button>
            <div className="clinic-kicker">TU INSCRIPCIÓN</div>
            <h2>Contanos quién se suma.</h2>
            <p className="clinic-lead">Solo lo necesario. No necesitás tener cuenta en PuntaRollers.com.</p>
            {waitlistActive && <WaitlistNotice compact />}
            <div className="clinic-form-grid">
              <label className="full">Nombre completo<input value={form.nombre_completo} onChange={e => update('nombre_completo', e.target.value)} autoComplete="name" /></label>
              <label>Edad<input type="number" inputMode="numeric" value={form.edad} onChange={e => update('edad', e.target.value)} /></label>
              <label>Nivel<select value={form.nivel} onChange={e => update('nivel', e.target.value)}><option value="">Seleccioná</option>{niveles.map(n => <option key={n}>{n}</option>)}</select></label>
              <label>WhatsApp<input type="tel" inputMode="tel" value={form.telefono} onChange={e => update('telefono', e.target.value)} autoComplete="tel" /></label>
              <label>Email <small>(opcional)</small><input type="email" inputMode="email" value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" /></label>
            </div>
            {error && <p className="clinic-error">{error}</p>}
            <button className="clinic-primary" onClick={() => validateData() && setStep(3)}>Continuar →</button>
          </div>
        )}

        {step === 3 && (
          <div className="clinic-stage">
            <button className="clinic-back" onClick={() => setStep(2)}>← Volver a mis datos</button>
            <div className="clinic-kicker">ÚLTIMO PASO</div>
            <h2>{waitlistActive ? 'Registrá tu lugar en espera.' : 'Elegí cómo reservás tu cupo.'}</h2>

            <div className="clinic-order-summary"><div><span>Clínica completa · 4, 5 y 6 septiembre</span><small>3 jornadas · 6 horas</small></div><strong>$2.000</strong></div>
            {waitlistActive && <WaitlistNotice />}

            <label className={`clinic-confirm ${form.asistencia_completa ? 'selected' : ''}`}>
              <input type="checkbox" checked={form.asistencia_completa} onChange={e => update('asistencia_completa', e.target.checked)} />
              <span>✓</span><div><b>Confirmo asistencia los 3 días</b><small>Viernes 4 · sábado 5 · domingo 6 de septiembre</small></div>
            </label>

            <div className="clinic-choice-help"><span>👇</span><div><b>Seleccioná una opción para continuar</b><small>Tocá una de estas tres tarjetas. La opción elegida quedará marcada con ✓.</small></div></div>

            <div className="clinic-payment-options">
              <PaymentOption active={form.opcion_pago === 'pagar_ahora'} onClick={() => update('opcion_pago','pagar_ahora')} icon="💳" title="Pagar ahora" text={waitlistActive ? 'Indicá que pagarías por transferencia si se libera un lugar. No transfieras hasta que PR confirme disponibilidad.' : 'Hago la transferencia de $2.000. Mi lugar queda pre-reservado hasta que Punta Rollers reciba y verifique el pago.'} />
              <PaymentOption active={form.opcion_pago === 'bonificacion_rifa'} onClick={() => update('opcion_pago','bonificacion_rifa')} icon="🎟️" title="Soy alumno PR · bonificación de rifa" text="Registro mi lugar bajo la modalidad de bonificación y el equipo PR valida el beneficio correspondiente." />
              <PaymentOption active={form.opcion_pago === 'ya_pague'} onClick={() => update('opcion_pago','ya_pague')} icon="✅" title="Ya lo pagué" text="Ya realicé el pago previamente y lo informo en mi inscripción." />
            </div>

            {!waitlistActive && form.opcion_pago === 'pagar_ahora' && (
              <div className="clinic-transfer"><div className="clinic-transfer-top"><span>DATOS PARA TRANSFERIR</span><strong>$2.000</strong></div><b>Tarjeta Prex · Claudio Facelli</b><p>Cuenta Prex: <strong>70658</strong></p><small>Tu inscripción se guarda ahora. El cupo queda confirmado cuando Punta Rollers recibe y verifica la acreditación del pago.</small></div>
            )}
            {waitlistActive && form.opcion_pago && <div className="clinic-status-preview wait"><b>⏳ Lista de espera</b><span>No realices un nuevo pago ahora. Tu registro queda a confirmación de Punta Rollers si se libera o amplía disponibilidad.</span></div>}
            {!waitlistActive && form.opcion_pago === 'bonificacion_rifa' && <div className="clinic-status-preview raffle"><b>🎟️ Validación PR</b><span>Tu inscripción queda registrada y el equipo valida la bonificación de rifa antes de confirmar el cupo.</span></div>}
            {!waitlistActive && form.opcion_pago === 'ya_pague' && <div className="clinic-status-preview paid"><b>✓ Cupo confirmado</b><span>Al enviar el formulario tu lugar queda registrado como pago realizado.</span></div>}

            {error && <p className="clinic-error">{error}</p>}
            <button className="clinic-primary" disabled={sending} onClick={submit}>{sending ? 'Guardando tu lugar…' : waitlistActive ? 'Entrar a lista de espera →' : 'Confirmar inscripción →'}</button>
            <p className="clinic-security">🔒 Primero se guarda tu inscripción. La notificación administrativa se procesa después y nunca bloquea el registro.</p>
          </div>
        )}

        {step === 4 && done && <Success result={done} cupos={cupos} />}
      </section>
    </main>
  )
}

function CapacityBar({ cupos, percent, loading }) {
  const wait = !loading && cupos.ocupados > cupos.total
  const full = !loading && cupos.disponibles <= 0
  const almost = !full && cupos.disponibles <= 8
  const extra = Math.max(0, cupos.ocupados - cupos.total)
  return <div className={`clinic-capacity ${almost ? 'almost' : ''} ${wait ? 'waitlist' : ''}`}>
    <div className="clinic-capacity-top"><div><span>30 CUPOS · EN VIVO</span><b>{loading ? '—' : `${cupos.ocupados} / ${cupos.total}`}</b></div><strong>{loading ? 'Cargando…' : wait ? `ESPERA +${extra}` : full ? 'LISTA DE ESPERA ABIERTA' : almost ? `Últimos ${cupos.disponibles}` : `${cupos.disponibles} disponibles`}</strong></div>
    <div className="clinic-bar"><i style={{width:`${percent}%`}} /></div>
    <small>{wait ? `Los 30 cupos principales están completos. Hay ${extra} ${extra === 1 ? 'persona' : 'personas'} en lista de espera.` : full ? 'Los cupos principales están completos, pero podés registrarte en lista de espera.' : 'Cada inscripción registrada ocupa un lugar automáticamente.'}</small>
  </div>
}

function WaitlistNotice({ compact = false }) {
  return <div className={`clinic-waitlist-notice ${compact ? 'compact' : ''}`}><span>⏳</span><div><b>Lista de espera abierta</b><p>Los 30 cupos principales están ocupados. Podés inscribirte igual y quedás a confirmación si se libera o amplía disponibilidad. <strong>No realices un nuevo pago hasta que Punta Rollers te confirme lugar.</strong></p></div></div>
}

function Info({ icon, title, text }) { return <div className="clinic-info"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div> }
function PaymentOption({ active, onClick, icon, title, text }) { return <button type="button" className={`clinic-payment-option ${active ? 'selected' : ''}`} onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><i>{active ? '✓' : '○'}</i></button> }

function Success({ result, cupos }) {
  if (result.waitlist) {
    return <div className="clinic-stage clinic-success">
      <div className="clinic-success-icon wait">⏳</div>
      <div className="clinic-kicker">LISTA DE ESPERA</div>
      <h2>¡Tu inscripción quedó registrada!</h2>
      <div className="clinic-result-status wait">A CONFIRMACIÓN</div>
      <p className="clinic-lead">Los 30 cupos principales ya están ocupados, pero quedaste correctamente anotado/a en la lista de espera. Punta Rollers te contactará si se libera o amplía disponibilidad.</p>
      <div className="clinic-wait-position"><span>REGISTRO</span><strong>#{result.numeroRegistro}</strong><small>{cupos.ocupados} inscripciones registradas sobre 30 cupos principales.</small></div>
      <div className="clinic-status-preview wait"><b>Importante</b><span>No realices un nuevo pago hasta recibir confirmación de Punta Rollers.</span></div>
      <div className="clinic-success-date"><b>4 · 5 · 6 SEPTIEMBRE</b><span>Punta del Este · 3 jornadas · 6 horas · horarios a confirmar</span><strong>$2.000 · clínica completa</strong></div>
      <a className="clinic-primary clinic-link" href="https://wa.me/59898971505" target="_blank" rel="noreferrer">Hablar con Punta Rollers</a>
    </div>
  }

  const content = result.payment === 'ya_pague'
    ? { icon:'✓', eyebrow:'INSCRIPCIÓN CONFIRMADA', title:'¡Cupo confirmado!', status:'CONFIRMADO', tone:'confirmed', text:'Registramos tu inscripción como pago realizado. Tu lugar para las tres jornadas quedó confirmado.' }
    : result.payment === 'bonificacion_rifa'
      ? { icon:'🎟️', eyebrow:'INSCRIPCIÓN REGISTRADA', title:'¡Tu lugar quedó registrado!', status:'PENDIENTE DE VALIDACIÓN PR', tone:'raffle', text:'Registramos tu inscripción bajo la modalidad de bonificación de rifa. El equipo de Punta Rollers validará el beneficio y te confirmará el cupo.' }
      : { icon:'💳', eyebrow:'PRE-RESERVA REGISTRADA', title:'¡Tu lugar quedó pre-reservado!', status:'PENDIENTE DE ACREDITACIÓN', tone:'pending', text:'Registramos tu inscripción. La reserva queda confirmada una vez que Punta Rollers recibe y verifica la acreditación del pago de $2.000.' }

  return <div className="clinic-stage clinic-success">
    <div className={`clinic-success-icon ${content.tone}`}>{content.icon}</div><div className="clinic-kicker">{content.eyebrow}</div><h2>{content.title}</h2><div className={`clinic-result-status ${content.tone}`}>{content.status}</div><p className="clinic-lead">{content.text}</p>
    {result.payment === 'pagar_ahora' && <div className="clinic-success-payment"><span>PARA COMPLETAR LA RESERVA</span><strong>$2.000</strong><p>Prex · Claudio Facelli · Cuenta <b>70658</b></p><small>Luego de transferir, enviá el comprobante a Punta Rollers para verificar la acreditación.</small></div>}
    <div className="clinic-success-date"><b>4 · 5 · 6 SEPTIEMBRE</b><span>Punta del Este · 3 jornadas · 6 horas · horarios a confirmar</span><strong>$2.000 · clínica completa</strong></div>
    <p className="clinic-spots-left">{cupos.disponibles > 0 ? `Quedan ${cupos.disponibles} de 30 lugares principales.` : 'Los 30 lugares principales fueron ocupados. Lista de espera abierta.'}</p>
    <a className="clinic-primary clinic-link" href="https://wa.me/59898971505" target="_blank" rel="noreferrer">Hablar con Punta Rollers</a>
  </div>
}