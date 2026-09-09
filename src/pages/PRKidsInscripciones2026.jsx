import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReferralCodeField from '../components/ReferralCodeField'
import RegistrationPayment, { PaidClassAccess } from '../components/RegistrationPayment'
import './PRKidsInscripciones2026.css'

const initialForm = {
  nombre_nino: '',
  edad: '',
  nivel: '',
  nombre_responsable: '',
  email: '',
  telefono: '',
  quiere_remera: true,
}

export default function PRKidsInscripciones2026() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [sending, setSending] = useState(false)
  const [registrationId, setRegistrationId] = useState('')
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [referralValid, setReferralValid] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(null)
  const [paymentOriginal, setPaymentOriginal] = useState(null)
  const [finishedWith, setFinishedWith] = useState('')
  const [classAccess, setClassAccess] = useState([])
  const progress = useMemo(() => `${Math.min(step + 1, 4)} / 4`, [step])
  const baseTotal = 2000 + (form.quiere_remera ? 690 : 0)
  const total = paymentAmount ?? baseTotal

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const validateData = () => {
    if (!form.nombre_nino.trim() || !form.edad || !form.nivel || !form.nombre_responsable.trim() || !form.email.trim() || !form.telefono.trim()) {
      setError('Completá todos los datos para continuar.')
      return false
    }
    const age = Number(form.edad)
    if (!Number.isInteger(age) || age < 3 || age > 17) {
      setError('Ingresá una edad válida para PR Kids.')
      return false
    }
    setError('')
    return true
  }

  const buildPayload = () => ({
    p_modalidad: 'kids',
    p_nombre_completo: form.nombre_nino.trim(),
    p_edad: Number(form.edad),
    p_localidad: null,
    p_email: form.email.trim().toLowerCase(),
    p_telefono: form.telefono.trim(),
    p_nivel: form.nivel,
    p_turno_sabado: 'Sábado 19:00–20:00 · Pista cerrada Maldonado',
    p_objetivo_personalizadas: null,
    p_nombre_responsable: form.nombre_responsable.trim(),
    p_quiere_remera: form.quiere_remera,
    p_referral_code: referralCode.trim() || null,
  })

  const createPreReservation = async () => {
    if (!validateData()) return
    if (registrationId) {
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (referralCode.trim() && !referralValid) {
      setError('Revisá el código Amigos PR y tocá “Aplicar”, o dejalo vacío para continuar sin descuento.')
      return
    }

    setSending(true)
    setError('')
    const { data, error: insertError } = await supabase.rpc('registrar_inscripcion_2026_v4', buildPayload())
    setSending(false)

    if (insertError || !data?.id) {
      console.error('PR Kids registration error', insertError)
      if (String(insertError?.message || '').includes('CODIGO_AMIGOS_PR_INVALIDO')) {
        setReferralValid(null)
        setError('Ese código Amigos PR no es válido. Revisalo o dejalo vacío para continuar normalmente.')
      } else {
        setError('No pudimos guardar la pre-reserva. Probá nuevamente en unos minutos.')
      }
      return
    }

    setRegistrationId(data.id)
    setPaymentAmount(Number(data.monto))
    setPaymentOriginal(Number(data.monto_original || data.monto))
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishPayment = (method, result) => {
    setFinishedWith(method)
    setClassAccess(method === 'mercadopago' && Array.isArray(result?.classAccess) ? result.classAccess : [])
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="prk-shell">
      <div className="prk-blob prk-blob-a" />
      <div className="prk-blob prk-blob-b" />
      <div className="prk-stars" aria-hidden="true">✦ · ✧ · ✦ · ✧</div>
      <section className="prk-card">
        <header className="prk-header"><div className="prk-brand"><img src="/logo.png" alt="Punta Rollers" /><div><p>PR KIDS</p><span>Punta Rollers · 2026</span></div></div><span className="prk-badge">🛼 Pequeños sobre ruedas</span></header>
        {step < 4 && <div className="prk-progress"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /><small>{progress}</small></div>}

        {step === 0 && <div className="prk-stage prk-stage-home"><div className="prk-home-topline"><span>🌈</span> INSCRIPCIONES PR KIDS 2026</div><h1 className="prk-home-title">Aprendé, divertite y hacé amigos <em>sobre ruedas.</em></h1><p className="prk-lead prk-home-lead">Un espacio pensado para aprender patinaje con <strong>seguridad</strong>, ganar <strong>confianza</strong> y disfrutar cada logro. Acá aprender también se siente como jugar.</p><div className="prk-home-ribbon">✨ Cada logro se celebra</div><div className="prk-quick-grid prk-quick-grid-home"><article className="blue"><span>🗓️</span><div><b>Sábados</b><small>19:00 a 20:00</small></div></article><article className="pink"><span>🏟️</span><div><b>Pista cerrada</b><small>Maldonado · Indoor</small></div></article><article className="yellow"><span>💛</span><div><b>$2.000</b><small>mensual por niño</small></div></article><article className="green"><span>☔</span><div><b>Siempre bajo techo</b><small>Sin depender del clima</small></div></article></div><div className="prk-home-values"><span>🛡️ Seguridad</span><span>🎮 Diversión</span><span>🤝 Amigos</span></div><div className="prk-note-card prk-home-note"><span>💫</span><div><b>Conocé PR Kids antes de inscribir</b><p>Te mostramos cómo funcionan las clases, qué incluye la mensualidad y toda la información importante para las familias.</p></div></div><button className="prk-primary" onClick={() => setStep(1)}>Descubrir PR Kids →</button></div>}

        {step === 1 && <div className="prk-stage"><button className="prk-back" onClick={() => setStep(0)}>← Volver</button><p className="prk-kicker">UNA CLASE QUE SE SIENTE COMO AVENTURA</p><h1>Aprender jugando también es aprender en serio.</h1><div className="prk-benefits"><article><span>🛡️</span><div><b>Seguridad primero</b><p>Control, equilibrio y confianza sobre los patines desde cada etapa.</p></div></article><article><span>🎯</span><div><b>Habilidades reales</b><p>Coordinación, frenadas, postura, desplazamiento y autonomía.</p></div></article><article><span>🎮</span><div><b>Aprender jugando</b><p>Juegos y desafíos adaptados a la edad para mantener la motivación.</p></div></article><article><span>🤝</span><div><b>Comunidad</b><p>Amigos, risas y experiencias compartidas dentro de Punta Rollers.</p></div></article></div><div className="prk-details"><div><span>📍</span><p><b>Pista cerrada y techada</b><small>Calle Solís casi Lavalleja · Maldonado</small></p></div><div><span>👩‍⚕️</span><p><b>Cobertura médica</b><small>Disponible en el establecimiento.</small></p></div><div><span>🚻</span><p><b>Comodidad para las familias</b><small>Baños privados y cambiadores.</small></p></div></div><div className="prk-price-card"><p>Mensualidad PR Kids</p><strong>$2.000</strong><small>Sin matrícula</small><hr /><p className="uniform">👕 Remera PR Kids personalizada con el nombre del niño: $690 única vez. La sugerimos como parte del uniforme, pero podés decidir agregarla o no al momento de reservar.</p></div><button className="prk-primary" onClick={() => setStep(2)}>Quiero inscribirlo/a →</button></div>}

        {step === 2 && <div className="prk-stage"><button className="prk-back" onClick={() => setStep(1)}>← Volver a la info</button><p className="prk-kicker">AHORA SÍ 💫</p><h1>Contanos quién se suma a la aventura.</h1><p className="prk-lead">Primero los datos del niño o niña. Después, los del adulto responsable.</p><div className="prk-section-label"><span>🧒</span><b>Datos del niño/a</b></div><div className="prk-form-grid"><label>Nombre completo<input value={form.nombre_nino} onChange={e => update('nombre_nino', e.target.value)} autoComplete="name" /></label><label>Edad<input type="number" inputMode="numeric" value={form.edad} onChange={e => update('edad', e.target.value)} /></label><label className="full">Nivel de patín<select value={form.nivel} onChange={e => update('nivel', e.target.value)}><option value="">Seleccioná una opción</option><option>Primera vez</option><option>Principiante</option><option>Intermedio</option></select></label></div><div className="prk-section-label adult"><span>👨‍👩‍👧</span><b>Adulto responsable</b></div><div className="prk-form-grid"><label className="full">Nombre del padre, madre o tutor<input value={form.nombre_responsable} onChange={e => update('nombre_responsable', e.target.value)} /></label><label>Email<input type="email" inputMode="email" value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" /></label><label>WhatsApp<input type="tel" inputMode="tel" value={form.telefono} onChange={e => update('telefono', e.target.value)} autoComplete="tel" /></label></div><div className={`prk-shirt-option ${form.quiere_remera ? 'selected' : ''}`}><label><input type="checkbox" checked={form.quiere_remera} onChange={e => update('quiere_remera', e.target.checked)} /><span className="prk-shirt-check">✓</span><span className="prk-shirt-copy"><b>👕 Quiero agregar la remera PR Kids</b><small>$690 · única vez · personalizada con el nombre del niño/a</small></span></label><p>Viene seleccionada porque forma parte del uniforme de la escuela, pero podés destildarla si preferís adquirirla más adelante.</p></div><ReferralCodeField value={referralCode} onChange={setReferralCode} onValidated={setReferralValid} compact />{referralValid && <div className="prk-note-card prk-success-note"><span>🤝</span><div><b>Amigos PR aplicado</b><p>El niño/a obtiene 10% OFF en sus primeras 2 mensualidades. La remera no entra en el descuento. El alumno que lo invitó recibe su beneficio cuando confirmemos el pago.</p></div></div>}{error && <p className="prk-error">{error}</p>}<button className="prk-primary" disabled={sending} onClick={createPreReservation}>{sending ? 'Guardando pre-reserva…' : 'Continuar al pago →'}</button></div>}

        {step === 3 && <div className="prk-stage"><button className="prk-back" onClick={() => setStep(2)}>← Volver a los datos</button><div className="prk-final-icon">🏁</div><p className="prk-kicker">ÚLTIMO PASO</p><h1>Elegí cómo querés pagar.</h1><p className="prk-lead">La pre-reserva ya quedó registrada. El importe incluye automáticamente el descuento y la remera elegida.</p><div className="prk-note-card prk-success-note"><span>✅</span><div><b>Pre-reserva registrada</b><p>Aunque cierres esta página, los datos del alumno ya quedaron guardados en Punta Rollers.</p></div></div><div className="prk-summary"><div><span>🧒 Alumno/a</span><b>{form.nombre_nino}</b></div><div><span>🗓️ Horario</span><b>Sábado · 19:00 a 20:00</b></div><div><span>💛 Mensualidad</span><b>{paymentOriginal > total ? <><s>$2.000</s> · $1.800</> : '$2.000'}</b></div><div><span>👕 Remera</span><b>{form.quiere_remera ? 'Sí · $690' : 'No por ahora'}</b></div></div>{paymentOriginal > total && <div className="prk-note-card prk-success-note"><span>🎉</span><div><b>10% OFF Amigos PR</b><p>Se descontaron $200 de la mensualidad. La remera mantiene su precio normal.</p></div></div>}<RegistrationPayment registrationType="inscripciones_2026" registrationId={registrationId} amount={total} payerEmail={form.email} payerName={form.nombre_nino} onFinished={finishPayment} /></div>}

        {step === 4 && <div className="prk-stage prk-final"><div className="prk-final-icon">🎉</div><p className="prk-kicker">INSCRIPCIÓN RECIBIDA</p><h1>¡Bienvenido/a a PR Kids!</h1><p className="prk-lead">{finishedWith === 'mercadopago' ? `El pago de ${form.nombre_nino} quedó acreditado.` : finishedWith === 'mercadopago_pending' ? 'El pago está siendo procesado y te avisaremos cuando se acredite.' : 'Guardamos la inscripción y verificaremos el comprobante enviado por WhatsApp.'}</p><PaidClassAccess items={classAccess} /></div>}
      </section>
    </main>
  )
}
