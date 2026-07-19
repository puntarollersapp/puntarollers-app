import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

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

export default function StorePage() {
  const { user } = useAuth()

  const [productos, setProductos] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [modelo, setModelo] = useState('')
  const [color, setColor] = useState('')
  const [talle, setTalle] = useState('')
  const [nombre, setNombre] = useState(
    `${user?.nombre || ''} ${user?.apellido || ''}`.trim()
  )
  const [observacion, setObservacion] = useState('')
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
      setErrorMsg(`No se pudo cargar la tienda: ${error.message}`)
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
    const opening = selectedId !== product.id

    setSelectedId(opening ? product.id : '')
    setModelo(opening ? product.modelos[0] || '' : '')
    setColor(opening ? product.colores[0] || '' : '')
    setTalle('')
  }

  function sendOrder() {
    if (!selected) return

    if (!nombre.trim()) {
      window.alert('Ingresá tu nombre para continuar.')
      return
    }

    if (selected.modelos.length > 0 && !modelo) {
      window.alert('Seleccioná el modelo.')
      return
    }

    if (selected.colores.length > 0 && !color) {
      window.alert('Seleccioná el color.')
      return
    }

    if (!talle) {
      window.alert('Seleccioná el talle.')
      return
    }

    const lines = [
      'Hola, quiero solicitar un uniforme de Punta Rollers.',
      '',
      `Producto: ${selected.nombre}`,
      `Precio: ${formatPrice(selected.precio)}`,
      modelo ? `Modelo: ${modelo}` : '',
      color ? `Color: ${color}` : '',
      `Talle: ${talle}`,
      `Nombre: ${nombre.trim()}`,
      observacion.trim()
        ? `Observaciones: ${observacion.trim()}`
        : '',
      '',
      'Entiendo que el pedido debe abonarse para confirmarlo y que recibiré los datos de transferencia por este medio.',
    ].filter(Boolean)

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      lines.join('\n')
    )}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <AppLayout title="Tienda PR" showBack>
      <div className="px-4 py-5 space-y-5">
        <section>
          <h1 className="font-display text-3xl text-white">
            Tienda PR
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Uniformes oficiales de Punta Rollers.
          </p>
        </section>

        <section className="rounded-3xl border border-pr-gold/20 bg-pr-gold/[0.07] p-4">
          <p className="text-pr-gold text-sm font-semibold">
            Pedidos con pago previo
          </p>
          <p className="text-white/45 text-xs mt-1 leading-relaxed">
            Elegí el producto, modelo, color y talle. Al enviarlo por
            WhatsApp recibirás los datos de transferencia. El pedido se
            confirma una vez abonado.
          </p>
        </section>

        {loading && (
          <div className="glass rounded-2xl p-4 text-white/45 text-sm">
            Cargando productos...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {!loading && !errorMsg && (
          <div className="space-y-4">
            {productos.map((product) => {
              const open = selectedId === product.id

              return (
                <article
                  key={product.id}
                  className={`glass rounded-3xl overflow-hidden border transition-all ${
                    open
                      ? 'border-pr-gold/45'
                      : 'border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full text-left"
                  >
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full aspect-square object-cover bg-white"
                    />

                    <div className="p-4 flex items-start justify-between gap-3">
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

                      <span className="text-pr-gold text-xl">
                        {open ? '−' : '+'}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-white/5 p-4 space-y-4">
                      {product.modelos.length > 0 && (
                        <OptionGroup
                          label="Modelo"
                          options={product.modelos}
                          value={modelo}
                          onChange={setModelo}
                        />
                      )}

                      {product.colores.length > 0 && (
                        <OptionGroup
                          label="Color"
                          options={product.colores}
                          value={color}
                          onChange={setColor}
                        />
                      )}

                      <OptionGroup
                        label="Talle"
                        options={product.talles}
                        value={talle}
                        onChange={setTalle}
                      />

                      <label className="block">
                        <span className="text-white/40 text-xs">
                          Nombre de quien realiza el pedido
                        </span>
                        <input
                          value={nombre}
                          onChange={(event) =>
                            setNombre(event.target.value)
                          }
                          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Nombre y apellido"
                        />
                      </label>

                      <label className="block">
                        <span className="text-white/40 text-xs">
                          Observaciones
                        </span>
                        <textarea
                          value={observacion}
                          onChange={(event) =>
                            setObservacion(event.target.value)
                          }
                          rows="3"
                          className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-none"
                          placeholder="Ejemplo: consultar fecha estimada de entrega"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={sendOrder}
                        className="btn-gold w-full"
                      >
                        Solicitar por WhatsApp
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
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
