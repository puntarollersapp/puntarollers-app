import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './ClinicaMiguelSept2026.css'

const MAX_CUPOS = 30
const niveles = ['Primera vez', 'Principiante', 'Intermedio', 'Avanzado', 'Competitivo']

const initialForm = {
  nombre_completo: '',
  edad: '',
  nivel: '',
  telefono: '',
  email: '',
  asistencia_completa: false,
  opcion_pago: '',
}

export default function ClinicaMiguelSept2026() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [cupos, setCupos] = useState({ ocupados: 0, total: MAX_CUPOS, disponibles: MAX_CUPOS })
  const [loadingCupos, setLoadingCupos] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const percent = useMemo(() => Math.min(100, Math.round((cupos.ocupados / cupos.total) * 100)), [cupos])

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
      setError('Para reservar el cupo necesitamos que confirmes asistencia a las 3 jornadas.')
      return false
    }
    if (!form.opcion_pago) {
      setError('Elegí cómo vas a completar el pago.')
      return false
    }
    setError('')
    return true
  }

  const submit = async () => {
    if (!validateFinal()) return
    setSending(true)
    setError('')

    const { data, error: submitError } = await supabase.rpc('registrar_clinica_sept_2026', {
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
      const full = String(submitError.message || '').toLowerCase().includes('cupos agotados')
      setError(full ? 'Los 30 cupos ya fueron ocupados.' : 'No pudimos guardar la inscripción. Probá nuevamente o escribinos por WhatsApp.')
      await loadCupos()
      return
    }

    setDone({ id: data, payment: form.opcion_pago })
    await loadCupos()
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="clinic-shell">
      <div className="clinic-glow clinic-glow-a" />
      <div className="clinic-glow clinic-glow-b" />

      <section className="clinic-card">
        <header className="clinic-brand">
          <img src="/logo.png" alt="Punta Rollers" />
          <div>
            <p>PUNTA ROLLERS PRESENTA</p>
            <span>Clínica Internacional de Patinaje</span>
          </div>
        </header>

        {step < 4 && <CapacityBar cupos={cupos} percent={percent} loading={loadingCupos} />}

        {step === 0 && (
          <div className="clinic-stage clinic-hero">
            <div className="clinic-kicker">ARGENTINA 🇦🇷 · INVITADO INTERNACIONAL</div>
            <h1>Miguel Ángel<br /><em>Flores</em></h1>
            <p className="clinic-subtitle">Subcampeón Mundial Máster · entrenador especializado con más de 40 años de experiencia.</p>

            <div className="clinic-date-band">
              <div><b>04</b><span>VIE</span></div>
              <i>+</i>
              <div><b>05</b><span>SÁB</span></div>
              <i>+</i>
              <div><b>06</b><span>DOM</span></div>
              <small>SEPTIEMBRE 2026</small>
            </div>

            <div className="clinic-info-grid">
              <Info icon="⏱️" title="3 días intensivos" text="2 horas por jornada" />
              <Info icon="🏟️" title="2 jornadas" text="Pista cerrada" />
              <Info icon="🌊" title="1 jornada" text="Al aire libre" />
              <Info icon="🛼" title="Todos los niveles" text="Recreativo a competitivo" />
            </div>

            <div className="clinic-note"><b>Horarios a confirmar.</b><span>La inscripción reserva tu lugar para las tres jornadas.</span></div>
            <button className="clinic-primary" disabled={cupos.disponibles <= 0} onClick={() => setStep(1)}>{cupos.disponibles <= 0 ? 'Cupos agotados' : 'Quiero mi lugar →'}</button>
          </div>
        )}

        {step === 1 && (
          <div className="clinic-stage">
            <button className="clinic-back" onClick={() => setStep(0)}>← Volver</button>
            <div className="clinic-kicker">LA EXPERIENCIA</div>
            <h2>Entrenamiento que se lleva a la pista.</h2>
            <p className="clinic-lead">Tres jornadas para trabajar técnica, seguridad y control con acompañamiento directo de Miguel Flores.</p>
            <div className="clinic-work-grid">
              {[
                ['🎯','Técnica'],['〰️','Curvas'],['🛑','Frenado'],['⚖️','Centro de gravedad'],['🎚️','Control'],['⚡','Entrenamiento recreativo / competitivo']
              ].map(([icon,label]) => <div key={label}><span>{icon}</span><b>{label}</b></div>)}
            </div>
            <div className="clinic-eval"><span>★</span><div><b>Evaluación y control personalizado</b><p>Seguimiento para que puedas aplicar lo trabajado a tu propio nivel.</p></div></div>
            <button className="clinic-primary" onClick={() => setStep(2)}>Inscribirme →</button>
          </div>
        )}

        {step === 2 && (
          <div className="clinic-stage">
            <button className="clinic-back" onClick={() => setStep(1)}>← Volver a la info</button>
            <div className="clinic-kicker">TU INSCRIPCIÓN</div>
            <h2>Contanos quién se suma.</h2>
            <p className="clinic-lead">Solo lo necesario. No necesitás tener cuenta en PuntaRollers.com.</p>

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
            <h2>Elegí cómo reservás tu cupo.</h2>

            <label className={`clinic-confirm ${form.asistencia_completa ? 'selected' : ''}`}>
              <input type="checkbox" checked={form.asistencia_completa} onChange={e => update('asistencia_completa', e.target.checked)} />
              <span>✓</span>
              <div><b>Confirmo asistencia los 3 días</b><small>Viernes 4 · sábado 5 · domingo 6 de septiembre</small></div>
            </label>

            <div className="clinic-payment-options">
              <PaymentOption active={form.opcion_pago === 'pagar_ahora'} onClick={() => update('opcion_pago','pagar_ahora')} icon="💳" title="Pagar ahora" text="Veo los datos de transferencia y mi cupo queda pendiente de aprobación hasta verificar el pago." />
              <PaymentOption active={form.opcion_pago === 'bonificacion_rifa'} onClick={() => update('opcion_pago','bonificacion_rifa')} icon="🎟️" title="Soy alumno PR · bonificación de rifa" text="Registro mi lugar y Punta Rollers valida la bonificación correspondiente." />
              <PaymentOption active={form.opcion_pago === 'ya_pague'} onClick={() => update('opcion_pago','ya_pague')} icon="✅" title="Ya lo pagué" text="Registro la inscripción como cupo confirmado." />
            </div>

            {form.opcion_pago === 'pagar_ahora' && (
              <div className="clinic-transfer">
                <span>DATOS PARA TRANSFERIR</span>
                <b>Tarjeta Prex · Claudio Facelli</b>
                <p>Cuenta Prex: <strong>70658</strong></p>
                <small>El importe final de la clínica todavía está pendiente de cargar en esta versión de prueba.</small>
              </div>
            )}

            {error && <p className="clinic-error">{error}</p>}
            <button className="clinic-primary" disabled={sending || cupos.disponibles <= 0} onClick={submit}>{sending ? 'Guardando tu lugar…' : 'Confirmar inscripción →'}</button>
            <p className="clinic-security">🔒 La inscripción se guarda primero. El aviso por email a Punta Rollers se envía después y nunca bloquea tu registro.</p>
          </div>
        )}

        {step === 4 && done && <Success payment={done.payment} cupos={cupos} />}
      </section>
    </main>
  )
}

function CapacityBar({ cupos, percent, loading }) {
  const almost = cupos.disponibles <= 8
  return <div className="clinic-capacity"><div className="clinic-capacity-top"><div><span>CUPO LIMITADO</span><b>{loading ? '—' : `${cupos.ocupados} / ${cupos.total}`}</b></div><strong>{loading ? 'Cargando…' : cupos.disponibles === 0 ? 'COMPLETO' : almost ? `Últimos ${cupos.disponibles}` : `${cupos.disponibles} disponibles`}</strong></div><div className="clinic-bar"><i style={{width:`${percent}%`}} /></div><small>Cada inscripción ocupa un lugar en tiempo real.</small></div>
}

function Info({ icon, title, text }) { return <div className="clinic-info"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div> }

function PaymentOption({ active, onClick, icon, title, text }) { return <button type="button" className={`clinic-payment-option ${active ? 'selected' : ''}`} onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><i>{active ? '✓' : '○'}</i></button> }

function Success({ payment, cupos }) {
  const content = payment === 'ya_pague'
    ? { icon:'🎉', title:'¡Cupo confirmado!', text:'Tu inscripción quedó registrada como pagada. Punta Rollers recibió además una notificación automática.' }
    : payment === 'bonificacion_rifa'
      ? { icon:'🎟️', title:'¡Lugar registrado!', text:'Tu cupo quedó guardado y Punta Rollers validará la bonificación de rifa.' }
      : { icon:'💳', title:'¡Preinscripción recibida!', text:'Tu lugar quedó registrado. La confirmación final se realiza cuando Punta Rollers verifica la transferencia.' }

  return <div className="clinic-stage clinic-success"><div className="clinic-success-icon">{content.icon}</div><div className="clinic-kicker">CLÍNICA MIGUEL FLORES</div><h2>{content.title}</h2><p className="clinic-lead">{content.text}</p><div className="clinic-success-date"><b>4 · 5 · 6 SEPTIEMBRE</b><span>3 días intensivos · horarios a confirmar</span></div><p className="clinic-spots-left">{cupos.disponibles > 0 ? `Quedan ${cupos.disponibles} de 30 lugares.` : 'Los 30 lugares fueron ocupados.'}</p><a className="clinic-primary clinic-link" href="https://wa.me/59898971505" target="_blank" rel="noreferrer">Hablar con Punta Rollers</a></div>
}
