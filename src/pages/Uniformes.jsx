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
        <section className="text-center space-y-3">
          <p className="section-label">Tienda oficial</p>
          <h1 className="text-3xl font-bold text-white">
            👕 Uniformes PR
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Elegí tu uniforme oficial y registrá tu pedido sin iniciar sesión.
          </p>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">
            Diseño oficial de la comunidad
          </p>

          <p className="text-gray-300 text-sm leading-relaxed">
            Remeras para PR Kids, modelos para adultos y hoodies
            unisex pensados para entrenar, participar en eventos y
            representar a Punta Rollers.
          </p>

          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/[0.07] p-4">
            <p className="text-pr-gold text-sm font-semibold">
              Pedidos con pago previo
            </p>
            <p className="text-white/45 text-xs mt-1 leading-relaxed">
              Al finalizar verás los datos de transferencia. El pedido queda pendiente hasta verificar el pago.
            </p>
          </div>
        </section>

        {loading && (
          <div className="glass rounded-2xl p-4 text-white/45 text-sm">
            Cargando uniformes...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {!loading && (
          <section className="space-y-4">
            <p className="section-label">
              Elegí el producto
            </p>

            <div className="space-y-4">
              {productos.map((product) => {
                const active = selectedId === product.id

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className={`w-full glass rounded-3xl overflow-hidden text-left border transition-all ${
                      active
                        ? 'border-pr-gold shadow-[0_0_0_1px_rgba(201,168,76,0.2)]'
                        : 'border-white/10'
                    }`}
                  >
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full aspect-square object-cover bg-white"
                    />

                    <div className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {product.nombre}
                        </p>

                        <p className="text-pr-gold font-bold mt-1">
                          {formatPrice(product.precio)}
                        </p>

                        {product.descripcion && (
                          <p className="text-white/40 text-xs mt-2">
                            {product.descripcion}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          active
                            ? 'bg-pr-gold text-black'
                            : 'bg-white/[0.05] text-white/45'
                        }`}
                      >
                        {active ? 'Elegido' : 'Elegir'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section
          id="formulario-pedido"
          className="glass rounded-3xl p-5 space-y-4 scroll-mt-24"
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
                  {saving ? 'Guardando pedido…' : 'Continuar a transferencia'}
                </button>
              ) : (
                <div className="rounded-2xl border border-pr-gold/30 p-4 space-y-3 text-white">
                  <p className="text-pr-gold font-bold">Pedido registrado · Pendiente de pago</p>
                  <p>Importe: <strong>{formatPrice(order.amount)}</strong></p>
                  <button type="button" disabled={startingPayment} onClick={startMercadoPago} className="btn-gold w-full">
                    {startingPayment ? 'Conectando con Mercado Pago…' : 'Pagar con Mercado Pago'}
                  </button>
                  <p className="text-xs text-white/60">O realizá una transferencia:</p>
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
        </section>

        <section className="grid grid-cols-1 gap-3">
          <Benefit
            icon="🔥"
            title="Identidad"
            text="Representás a Punta Rollers dentro y fuera de la pista."
          />
          <Benefit
            icon="🛼"
            title="Comodidad"
            text="Prendas pensadas para acompañarte en los entrenamientos."
          />
          <Benefit
            icon="📸"
            title="Presencia"
            text="Uniformes oficiales para fotos, eventos y salidas."
          />
        </section>
      </div>
    </PublicLayout>
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
    <div className="glass p-4 rounded-2xl">
      <p className="text-white font-semibold">
        {icon} {title}
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {text}
      </p>
    </div>
  )
}
