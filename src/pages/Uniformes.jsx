import { useEffect, useMemo, useRef, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase'

const WHATSAPP_NUMBER = '59898971505'

function formatPrice(value) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function normalizeProduct(product) {
  return {
    ...product,
    modelos: Array.isArray(product.modelos) ? product.modelos : [],
    colores: Array.isArray(product.colores) ? product.colores : [],
    talles: Array.isArray(product.talles) ? product.talles : [],
  }
}

export default function Uniformes() {
  const requestRef = useRef({ fingerprint: '', key: '' })
  const [productos, setProductos] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [modelo, setModelo] = useState('')
  const [color, setColor] = useState('')
  const [talle, setTalle] = useState('')
  const [nombre, setNombre] = useState('')
  const [observacion, setObservacion] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [order, setOrder] = useState(null)
  const [saving, setSaving] = useState(false)
  const [startingPayment, setStartingPayment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [paymentReturned, setPaymentReturned] = useState(false)
  const transferOnly = true

  async function loadProducts() {
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('productos_pr')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) {
      setErrorMsg(`No se pudieron cargar los uniformes: ${error.message}`)
      setProductos([])
      setLoading(false)
      return
    }

    setProductos((data || []).map(normalizeProduct))
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'return') setPaymentReturned(true)
  }, [])

  const selected = useMemo(
    () => productos.find((product) => product.id === selectedId) || null,
    [productos, selectedId]
  )

  function selectProduct(product) {
    setSelectedId(product.id)
    setModelo(product.modelos[0] || '')
    setColor(product.colores[0] || '')
    setTalle('')
    setOrder(null)
    setErrorMsg('')
    setQuantity(1)

    setTimeout(() => {
      document
        .getElementById('formulario-pedido')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 150)
  }

  async function sendOrder() {
    if (!selected || !nombre.trim() || !email.trim() || !phone.trim() || !talle ||
        (selected.modelos.length > 0 && !modelo) || (selected.colores.length > 0 && !color)) {
      setErrorMsg('Completá producto, talle, nombre, correo y teléfono para continuar.')
      return
    }
    setSaving(true)
    setErrorMsg('')
    try {
      const payload = {
        productId: selected.id, model: modelo, color, size: talle, quantity,
        name: nombre.trim(), email: email.trim(), phone: phone.trim(), notes: observacion.trim(),
      }
      const fingerprint = JSON.stringify(payload)
      if (requestRef.current.fingerprint !== fingerprint) {
        requestRef.current = { fingerprint, key: crypto.randomUUID() }
      }
      const response = await fetch(`${supabaseUrl}/functions/v1/uniform-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ ...payload, requestKey: requestRef.current.key }),
      })
      const result = await response.json()
      if (!response.ok || !result.orderId) throw new Error('No pudimos guardar el pedido. Probá nuevamente.')
      setOrder(result)
    } catch (error) {
      setErrorMsg(error.message || 'No pudimos guardar el pedido.')
    } finally {
      setSaving(false)
    }
  }

  async function startMercadoPago() {
    if (!order?.orderId || startingPayment) return
    setStartingPayment(true)
    setErrorMsg('')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/uniform-mp-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ orderId: order.orderId, requestKey: requestRef.current.key }),
      })
      const result = await response.json()
      if (!response.ok || !result.checkoutUrl) throw new Error('Mercado Pago no está disponible para este pedido. Contactanos antes de volver a intentar.')
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo iniciar el pago.')
    } finally {
      setStartingPayment(false)
    }
  }

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-8">
        <style>{`
          @keyframes uniformGlow { 0%,100% { transform: translate3d(-5%,0,0) scale(1); opacity:.46 } 50% { transform:translate3d(9%,4%,0) scale(1.14); opacity:.72 } }
          @keyframes uniformReveal { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
          .uniform-hero { position:relative; overflow:hidden; isolation:isolate; background:linear-gradient(135deg,#15131c 0%,#0c0c10 60%,#1d0b2d 100%); border:1px solid rgba(129,22,224,.34); border-radius:28px; padding:32px 18px; animation:uniformReveal .65s ease both }
          .uniform-hero::before { content:''; position:absolute; z-index:-1; width:70%; aspect-ratio:1; right:-20%; top:-100%; background:radial-gradient(circle,#8116e0 0%,transparent 68%); filter:blur(24px); animation:uniformGlow 8s ease-in-out infinite alternate; pointer-events:none }
          .uniform-accent { color:#d0ff00 }
          @keyframes uniformFloat { 0% { transform:translate3d(0,-25px,0) rotate(-18deg);opacity:0 } 15% { opacity:.3 } 80% { opacity:.3 } 100% { transform:translate3d(18px,180px,0) rotate(24deg);opacity:0 } }
          .uniform-float { position:absolute; top:0; pointer-events:none; opacity:0; animation:uniformFloat 9s linear infinite; filter:drop-shadow(0 0 8px rgba(129,22,224,.5)); font-size:22px }
          .uniform-hero::after { content:''; position:absolute; inset:0; border-radius:inherit; border:1px solid rgba(208,255,0,.17); pointer-events:none; box-shadow:inset 0 0 30px rgba(129,22,224,.10) }
          .uniform-intro { text-align:center; border:1px solid rgba(129,22,224,.24); background:linear-gradient(160deg,rgba(129,22,224,.09),rgba(10,10,15,.8)); border-radius:22px; padding:20px 18px }
          .uniform-product { transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease }
          .uniform-product:active { transform:scale(.985) }
          .uniform-product:focus-visible { outline:2px solid #d0ff00; outline-offset:3px }
          .uniform-order-panel { border:1px solid rgba(129,22,224,.3); background:linear-gradient(145deg,rgba(129,22,224,.075),rgba(13,13,17,.95) 45%) }
          @media (prefers-reduced-motion:reduce) { .uniform-hero,.uniform-hero::before,.uniform-float { animation:none!important } .uniform-product { transition:none } }
        `}</style>
        <section className="uniform-hero text-center space-y-3">
          <span aria-hidden="true" className="uniform-float" style={{left:"9%",animationDelay:"-2s"}}>👕</span>
          <span aria-hidden="true" className="uniform-float" style={{left:"78%",animationDelay:"-5s",fontSize:17}}>👕</span>
          <span aria-hidden="true" className="uniform-float" style={{left:"45%",animationDelay:"-7s",fontSize:15}}>✦</span>
          <p className="section-label uniform-accent">PUNTA ROLLERS / TIENDA OFICIAL</p>
          <h1 className="text-3xl font-bold text-white">
            Uniformes <span className="uniform-accent">PR</span>
          </h1>
          <p className="text-gray-300 text-sm max-w-sm mx-auto">
            Elegí tu uniforme oficial y registrá tu pedido sin iniciar sesión.
          </p>
        </section>

        <section className="uniform-intro space-y-2">
          <p className="text-white text-base font-bold tracking-tight">La colección de Punta Rollers</p>
          <p className="text-white/65 text-sm leading-relaxed max-w-sm mx-auto">
            Remeras PR Kids y adultos, y buzos para acompañarte dentro y fuera de la pista.
          </p>
          <div className="pt-3 mt-3 border-t border-white/10">
            <p className="text-[#d0ff00] text-xs font-bold">PEDIDOS CON PAGO PREVIO</p>
            <p className="text-white/55 text-xs leading-relaxed mt-1 max-w-sm mx-auto">
              Registrá tu pedido y transferí a Prex. Confirmamos el pedido al verificar el comprobante.
            </p>
          </div>
        </section>

        {loading && (
          <div className="glass rounded-2xl p-4 text-white/45 text-sm">
            Cargando uniformes...
          </div>
        )}

        {paymentReturned && (
          <div className="rounded-2xl border border-pr-gold/30 p-4 text-sm text-white space-y-2">
            <p className="font-semibold text-pr-gold">Volviste de Mercado Pago</p>
            <p>El pago todavía debe confirmarse automáticamente. No hagas una segunda transferencia ni un nuevo pedido hasta verificarlo con Punta Rollers.</p>
            <a className="underline" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero consultar la confirmación de mi pago de uniformes.')}`} target="_blank" rel="noreferrer">Consultar estado por WhatsApp</a>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {!selected && (
          <section className="uniform-order-panel rounded-3xl px-5 py-5 text-center space-y-2">
            <p className="text-[#d0ff00] text-[11px] font-bold tracking-[.18em]">TU PEDIDO</p>
            <h2 className="text-white text-xl font-bold">Seleccioná un uniforme</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto">Elegí una prenda para ver los talles y completar tu pedido.</p>
          </section>
        )}
        {!loading && (
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div><p className="section-label uniform-accent">COLECCIÓN PR</p><h2 className="text-white text-2xl font-black tracking-tight mt-1">Elegí tu uniforme</h2></div>
              <span className="text-white/50 text-xs">{productos.length} productos</span>
            </div>
            {productos.length === 0 && <p className="text-white/60 text-sm">No hay uniformes disponibles en este momento.</p>}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {productos.filter(p => !/hoodie|buzo/i.test(p.id + ' ' + p.nombre)).map(product => (
                <UniformCard key={product.id} product={product} active={selectedId === product.id} onSelect={() => selectProduct(product)} compact />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {productos.filter(p => /hoodie|buzo/i.test(p.id + ' ' + p.nombre)).map(product => (
                <UniformCard key={product.id} product={product} active={selectedId === product.id} onSelect={() => selectProduct(product)} />
              ))}
            </div>
          </section>
        )}

        {selected && <section
          id="formulario-pedido"
          className="uniform-order-panel rounded-3xl p-5 space-y-4 scroll-mt-24"
        >
          <div>
            <p className="section-label">
              Pedido
            </p>

            <h2 className="text-white font-semibold text-xl mt-1">
              {selected
                ? selected.nombre
                : 'Seleccioná un uniforme'}
            </h2>

            {selected && (
              <p className="text-pr-gold font-bold mt-1">
                {formatPrice(selected.precio)}
              </p>
            )}
          </div>

          {!selected ? (
            <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
              <p className="text-white/45 text-sm">
                Tocá cualquiera de las imágenes de arriba para comenzar
                el pedido.
              </p>
            </div>
          ) : (
            <>
              {selected.modelos.length > 0 && (
                <OptionGroup
                  label="Modelo"
                  options={selected.modelos}
                  value={modelo}
                  onChange={(value) => { setModelo(value); setOrder(null) }}
                />
              )}

              {selected.colores.length > 0 && (
                <OptionGroup
                  label="Color"
                  options={selected.colores}
                  value={color}
                  onChange={(value) => { setColor(value); setOrder(null) }}
                />
              )}

              <OptionGroup
                label="Talle"
                options={selected.talles}
                value={talle}
                onChange={(value) => { setTalle(value); setOrder(null) }}
              />

              <label className="block">
                <span className="text-white/40 text-xs">
                  Nombre y apellido
                </span>
                <input
                  value={nombre}
                  onChange={(event) => { setNombre(event.target.value); setOrder(null) }}
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="block"><span className="text-white/40 text-xs">Correo electrónico</span><input type="email" value={email} onChange={e => { setEmail(e.target.value); setOrder(null) }} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white" /></label>
              <label className="block"><span className="text-white/40 text-xs">Teléfono</span><input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setOrder(null) }} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white" /></label>
              <label className="block"><span className="text-white/40 text-xs">Cantidad</span><input type="number" min="1" max="20" value={quantity} onChange={e => { setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1))); setOrder(null) }} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white" /></label>
              <p className="text-pr-gold font-bold">Total: {formatPrice(Number(selected.precio) * quantity)}</p>
              <label className="block">
                <span className="text-white/40 text-xs">
                  Observaciones
                </span>
                <textarea
                  value={observacion}
                  onChange={(event) => { setObservacion(event.target.value); setOrder(null) }}
                  rows="3"
                  className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-none"
                  placeholder="Alguna consulta o detalle del pedido"
                />
              </label>

              {!order ? (
                <button type="button" disabled={saving} onClick={sendOrder} className="btn-gold w-full">
                  {saving ? 'Guardando pedido…' : 'Registrar pedido y elegir pago'}
                </button>
              ) : (
                <div className="rounded-2xl border border-pr-gold/30 p-4 space-y-3 text-white">
                  <p className="text-pr-gold font-bold">Pedido registrado · Pendiente de pago</p>
                  <p>Importe: <strong>{formatPrice(order.amount)}</strong></p>
                  {!transferOnly && <button type="button" disabled={startingPayment} onClick={startMercadoPago} className="btn-gold w-full">
                    {startingPayment ? 'Conectando con Mercado Pago…' : 'Pagar con Mercado Pago'}
                  </button>}
                  <p className="text-xs text-white/60">Realizá una transferencia para confirmar tu pedido:</p>
                  <p>Prex · Claudio Facelli</p>
                  <p>Cuenta Prex: <strong>70658</strong></p>
                  <p className="text-xs text-white/60">Referencia: {order.orderId}. El pago se verificará antes de confirmar el pedido.</p>
                  <a
                    className="btn-gold block text-center"
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, adjunto comprobante del pedido de uniformes ' + order.orderId + ', por ' + formatPrice(order.amount) + '.')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar comprobante por WhatsApp
                  </a>
                </div>
              )}
            </>
          )}
        </section>}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Benefit
            icon="✦"
            title="Somos PR"
            text="Una misma comunidad, dentro y fuera de la pista."
          />
          <Benefit
            icon="↗"
            title="Para moverte"
            text="Elegí tu prenda para entrenar y salir a patinar."
          />
          <Benefit
            icon="◈"
            title="Estilo PR"
            text="Los colores de nuestra escuela, también fuera de clase."
          />
        </section>
      </div>
    </PublicLayout>
  )
}

function UniformCard({ product, active, onSelect, compact = false }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={active}
      className={`uniform-product group relative min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border text-left flex flex-col bg-[#17121f] ${active ? 'border-[#d0ff00] shadow-[0_0_24px_rgba(129,22,224,.35)]' : 'border-white/15 hover:border-[#8116e0]'}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <img src={product.imagen} alt={product.nombre} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {active && <span className="absolute top-2 right-2 rounded-full bg-[#d0ff00] text-black text-[10px] font-black px-2 py-1">✓</span>}
      </div>
      <div className={`w-full min-w-0 flex-1 flex flex-col ${compact ? 'p-2.5 sm:p-4 gap-1' : 'p-3 sm:p-5 gap-2'}`}>
        <p className={`font-bold text-white leading-snug break-words ${compact ? 'text-xs sm:text-base' : 'text-sm sm:text-lg'}`}>{product.nombre}</p>
        <p className={`font-black text-[#d0ff00] mt-auto pt-1 ${compact ? 'text-xs sm:text-base' : 'text-base sm:text-xl'}`}>{formatPrice(product.precio)}</p>
        {!compact && product.descripcion && <p className="text-white/60 text-xs leading-relaxed break-words">{product.descripcion}</p>}
        <span className={`block w-full rounded-xl py-2 text-center font-bold text-xs sm:text-sm ${active ? 'bg-[#d0ff00] text-black' : 'bg-[#8116e0] text-white'}`}>{active ? 'Seleccionado' : 'Elegir'}</span>
      </div>
    </button>
  )
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
              value === option
                ? 'bg-pr-gold text-black border-pr-gold'
                : 'bg-white/[0.04] text-white/60 border-white/10'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function Benefit({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-[#8116e0]/30 bg-gradient-to-b from-[#8116e0]/10 to-[#0d0b12] px-4 py-5 text-center flex flex-col items-center gap-2">
      <span aria-hidden="true" className="text-[#d0ff00] text-2xl leading-none">{icon}</span>
      <p className="text-white font-bold text-base">{title}</p>
      <p className="text-white/60 text-xs leading-relaxed max-w-[220px]">{text}</p>
    </div>
  )
}
