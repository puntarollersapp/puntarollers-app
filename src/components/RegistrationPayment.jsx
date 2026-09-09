import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseAnonKey, supabaseUrl } from '../lib/supabase'
import './RegistrationPayment.css'
import './PaidClassAccess.css'

const MP_PUBLIC_KEY = String(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-ceb5b5a3-7bad-4f78-abee-c1767b154db8').trim()
const WHATSAPP = '59898971505'

let sdkPromise
function loadMercadoPago() {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago)
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => resolve(window.MercadoPago)
      script.onerror = () => reject(new Error('sdk_load_failed'))
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

export default function RegistrationPayment({ registrationType, registrationId, amount, payerEmail, payerName, onFinished }) {
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const brickRef = useRef(null)
  const containerId = useMemo(() => `mp-card-${registrationId.replaceAll('-', '')}`, [registrationId])
  const whatsappUrl = useMemo(() => {
    const text = `Hola Punta Rollers, envío el comprobante de transferencia. Alumno/a: ${payerName}. Importe: $${Number(amount).toLocaleString('es-UY')}. Inscripción: ${registrationId}.`
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
  }, [amount, payerName, registrationId])

  useEffect(() => {
    if (method !== 'mercadopago') return undefined
    let cancelled = false

    async function mountBrick() {
      setStatus('loading')
      setMessage('')
      try {
        const MercadoPago = await loadMercadoPago()
        if (cancelled) return
        const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-UY' })
        const bricks = mp.bricks()
        brickRef.current = await bricks.create('cardPayment', containerId, {
          initialization: { amount: Number(amount), payer: { email: payerEmail || '' } },
          customization: { paymentMethods: { maxInstallments: 12 } },
          callbacks: {
            onReady: () => setStatus('ready'),
            onError: () => {
              setStatus('error')
              setMessage('No pudimos cargar Mercado Pago. Podés reintentar o elegir transferencia.')
            },
            onSubmit: async (formData, additionalData) => {
              setStatus('processing')
              setMessage('')
              try {
                const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-order`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
                  body: JSON.stringify({
                    registrationType,
                    registrationId,
                    token: formData.token,
                    payment_method_id: formData.payment_method_id,
                    payment_type_id: additionalData?.paymentTypeId,
                    installments: formData.installments,
                    payer: formData.payer,
                  }),
                })
                const result = await response.json().catch(() => ({}))
                if (result.paymentState === 'paid') {
                  setStatus('paid')
                  setMessage('Pago acreditado. Tu inscripción quedó confirmada.')
                  onFinished?.('mercadopago', result)
                  return
                }
                if (result.paymentState === 'pending' || response.status === 202 || result.error === 'payment_already_started') {
                  setStatus('pending')
                  setMessage('El pago está siendo procesado. Tu inscripción ya está guardada y te avisaremos cuando se acredite.')
                  return
                }
                setStatus('error')
                setMessage(result.message || 'El pago fue rechazado. Tu inscripción sigue guardada; podés revisar los datos o elegir transferencia.')
              } catch {
                setStatus('pending')
                setMessage('No pudimos confirmar el resultado. Tu inscripción sigue guardada; no repitas el pago hasta recibir confirmación.')
              }
            },
          },
        })
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage('No pudimos cargar Mercado Pago. Podés reintentar o elegir transferencia.')
        }
      }
    }

    mountBrick()
    return () => {
      cancelled = true
      brickRef.current?.unmount?.()
      brickRef.current = null
    }
  }, [amount, containerId, method, onFinished, payerEmail, registrationId, registrationType])

  return <div className="registration-payment">
    <div className="registration-payment__choices">
      <button type="button" className={method === 'mercadopago' ? 'active' : ''} onClick={() => setMethod('mercadopago')}><span>💳</span><b>Pagar ahora</b><small>Tarjeta con Mercado Pago</small></button>
      <button type="button" className={method === 'transferencia' ? 'active' : ''} onClick={() => setMethod('transferencia')}><span>📲</span><b>Transferencia</b><small>Prex + comprobante por WhatsApp</small></button>
    </div>

    {method === 'mercadopago' && <div className="registration-payment__panel">
      <p className="registration-payment__saved">✓ La inscripción ya está guardada. Mercado Pago cobrará exactamente <strong>${Number(amount).toLocaleString('es-UY')}</strong>.</p>
      {status === 'loading' && <p>Cargando el pago seguro…</p>}
      <div id={containerId} />
      {message && <p className={`registration-payment__message ${status}`}>{message}</p>}
      {status === 'pending' && <button type="button" className="registration-payment__finish" onClick={() => onFinished?.('mercadopago_pending')}>Finalizar y esperar confirmación</button>}
    </div>}

    {method === 'transferencia' && <div className="registration-payment__panel registration-payment__transfer">
      <span>IMPORTE A TRANSFERIR</span><strong>${Number(amount).toLocaleString('es-UY')}</strong>
      <div><b>Tarjeta Prex · Claudio Facelli</b><p>Cuenta Prex: <strong>70658</strong></p></div>
      <p>Después de transferir, enviá el comprobante. El mensaje ya incluye nombre, importe e identificación de la inscripción.</p>
      <a href={whatsappUrl} target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp</a>
      <button type="button" className="registration-payment__finish" onClick={() => onFinished?.('transferencia')}>Ya transferí · finalizar</button>
    </div>}
  </div>
}

export function PaidClassAccess({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return <section className="paid-access" aria-labelledby="paid-access-title">
    <div className="paid-access__hero"><span>✓ PAGO ACREDITADO</span><h2 id="paid-access-title">Tus ruedas ya tienen destino.</h2><p>Entrá a tus grupos y guardá las ubicaciones. Todo lo necesario para tu primera clase está acá.</p></div>
    <div className="paid-access__grid">{items.map(item => <article className="paid-access__card" key={item.id}>
      <div className="paid-access__top"><small>{item.eyebrow}</small><span>🛼</span></div><h3>{item.title}</h3><p className="paid-access__schedule">{item.schedule}</p><p className="paid-access__place">📍 {item.place}</p>
      <div className="paid-access__actions"><a className="whatsapp" href={item.whatsappUrl} target="_blank" rel="noreferrer">Entrar al grupo <b>↗</b></a><a className="maps" href={item.mapsUrl} target="_blank" rel="noreferrer">Cómo llegar <b>→</b></a></div>
    </article>)}</div>
    <p className="paid-access__private">🔒 Estos accesos se habilitaron porque Mercado Pago confirmó tu pago. No compartas los enlaces fuera de tu grupo.</p>
  </section>
}
