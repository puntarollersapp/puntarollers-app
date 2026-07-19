import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

function emptyForm() {
  return {
    id: '',
    nombre: '',
    descripcion: '',
    categoria: 'Remeras',
    precio: '',
    imagen: '',
    modelos: '',
    colores: '',
    talles: '',
    activo: true,
    orden: 0,
  }
}

function arrayToText(value) {
  return Array.isArray(value) ? value.join(', ') : ''
}

function textToArray(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export default function ProductsPanel({ setMsg }) {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('productos_pr')
      .select('*')
      .order('orden', { ascending: true })

    if (error) {
      setMsg?.(`No se pudo cargar la tienda: ${error.message}`)
      setProducts([])
      setLoading(false)
      return
    }

    const list = data || []
    setProducts(list)

    if (!selectedId && list[0]?.id) {
      selectProduct(list[0])
    } else if (
      selectedId &&
      !list.some((product) => product.id === selectedId)
    ) {
      if (list[0]) selectProduct(list[0])
      else startCreate()
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) return products

    return products.filter((product) =>
      `${product.nombre} ${product.categoria} ${product.id}`
        .toLowerCase()
        .includes(term)
    )
  }, [products, query])

  function selectProduct(product) {
    setCreating(false)
    setSelectedId(product.id)
    setForm({
      id: product.id || '',
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || 'Remeras',
      precio: String(product.precio ?? ''),
      imagen: product.imagen || '',
      modelos: arrayToText(product.modelos),
      colores: arrayToText(product.colores),
      talles: arrayToText(product.talles),
      activo: Boolean(product.activo),
      orden: Number(product.orden || 0),
    })
  }

  function startCreate() {
    setCreating(true)
    setSelectedId('')
    setForm(emptyForm())
  }

  async function saveProduct() {
    try {
      setSaving(true)
      setMsg?.('Guardando producto...')

      const id = String(form.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')

      if (!id) {
        throw new Error('Falta el identificador del producto.')
      }

      if (!form.nombre.trim()) {
        throw new Error('Falta el nombre del producto.')
      }

      if (!form.imagen.trim()) {
        throw new Error('Falta la ruta de la imagen.')
      }

      const precio = Number(form.precio)

      if (!Number.isFinite(precio) || precio < 0) {
        throw new Error('El precio no es válido.')
      }

      const payload = {
        id,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        categoria: form.categoria.trim() || 'Uniformes',
        precio,
        imagen: form.imagen.trim(),
        modelos: textToArray(form.modelos),
        colores: textToArray(form.colores),
        talles: textToArray(form.talles),
        activo: Boolean(form.activo),
        orden: Number(form.orden || 0),
        updated_at: new Date().toISOString(),
      }

      if (creating) {
        const { error } = await supabase
          .from('productos_pr')
          .insert(payload)

        if (error) throw new Error(error.message)

        setMsg?.('Producto creado correctamente.')
      } else {
        const { error } = await supabase
          .from('productos_pr')
          .update(payload)
          .eq('id', selectedId)

        if (error) throw new Error(error.message)

        setMsg?.('Producto actualizado correctamente.')
      }

      setCreating(false)
      setSelectedId(id)
      await loadProducts()
    } catch (error) {
      setMsg?.(`No se pudo guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product) {
    try {
      setMsg?.(
        product.activo
          ? 'Ocultando producto...'
          : 'Activando producto...'
      )

      const { error } = await supabase
        .from('productos_pr')
        .update({
          activo: !product.activo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) throw new Error(error.message)

      setMsg?.(
        product.activo
          ? 'Producto ocultado de ambas tiendas.'
          : 'Producto activado en ambas tiendas.'
      )

      await loadProducts()
    } catch (error) {
      setMsg?.(`No se pudo cambiar el estado: ${error.message}`)
    }
  }

  async function deleteProduct() {
    if (creating || !selectedId) return

    const product = products.find((item) => item.id === selectedId)

    const confirmed = window.confirm(
      `¿Eliminar definitivamente "${product?.nombre || selectedId}"?`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setMsg?.('Eliminando producto...')

      const { error } = await supabase
        .from('productos_pr')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      setMsg?.('Producto eliminado correctamente.')
      setSelectedId('')
      setCreating(false)
      await loadProducts()
    } catch (error) {
      setMsg?.(`No se pudo eliminar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Catálogo central</p>
            <h2 className="font-display text-2xl text-white mt-1">
              Tienda PR
            </h2>
            <p className="text-white/35 text-xs mt-1">
              Los cambios se actualizan en la tienda pública y en la
              tienda de usuarios.
            </p>
          </div>

          <button
            type="button"
            onClick={startCreate}
            className="rounded-2xl bg-pr-gold text-black px-4 py-3 text-xs font-bold"
          >
            + Producto
          </button>
        </div>
      </section>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar producto..."
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />

      {loading ? (
        <section className={`${panel} p-4 text-white/45 text-sm`}>
          Cargando productos...
        </section>
      ) : (
        <>
          <section className="flex gap-3 overflow-x-auto pb-1">
            {filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => selectProduct(product)}
                className={`shrink-0 w-[210px] rounded-2xl border overflow-hidden text-left ${
                  selectedId === product.id && !creating
                    ? 'border-pr-gold bg-pr-gold/10'
                    : 'border-white/10 bg-white/[0.035]'
                }`}
              >
                <img
                  src={product.imagen}
                  alt={product.nombre}
                  className="w-full h-32 object-cover bg-white"
                />

                <div className="p-3">
                  <p className="text-white text-sm font-semibold">
                    {product.nombre}
                  </p>
                  <p className="text-pr-gold text-sm font-bold mt-1">
                    {formatPrice(product.precio)}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      product.activo
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }`}
                  >
                    {product.activo ? 'Visible' : 'Oculto'}
                  </p>
                </div>
              </button>
            ))}
          </section>

          {filtered.length === 0 && !creating && (
            <section className={`${panel} p-4 text-white/45 text-sm`}>
              No se encontraron productos.
            </section>
          )}

          <section className={`${panel} p-4 space-y-3`}>
            <div>
              <p className="section-label">
                {creating ? 'Nuevo producto' : 'Editar producto'}
              </p>
              <h3 className="font-display text-2xl text-white mt-1">
                {creating
                  ? 'Crear'
                  : form.nombre || 'Producto'}
              </h3>
            </div>

            <AdminInput
              label="Identificador"
              value={form.id}
              onChange={(value) =>
                setForm({ ...form, id: value })
              }
              placeholder="Ej: hoodie-gris"
              disabled={!creating}
            />

            <AdminInput
              label="Nombre"
              value={form.nombre}
              onChange={(value) =>
                setForm({ ...form, nombre: value })
              }
            />

            <label className="block">
              <span className="text-white/40 text-xs">
                Descripción
              </span>
              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  setForm({
                    ...form,
                    descripcion: event.target.value,
                  })
                }
                rows="3"
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
              />
            </label>

            <AdminInput
              label="Categoría"
              value={form.categoria}
              onChange={(value) =>
                setForm({ ...form, categoria: value })
              }
              placeholder="Remeras, Hoodies..."
            />

            <AdminInput
              label="Precio"
              value={form.precio}
              onChange={(value) =>
                setForm({ ...form, precio: value })
              }
              type="number"
              inputMode="numeric"
            />

            <AdminInput
              label="Ruta de imagen"
              value={form.imagen}
              onChange={(value) =>
                setForm({ ...form, imagen: value })
              }
              placeholder="/uniformes/archivo.jpg"
            />

            {form.imagen && (
              <img
                src={form.imagen}
                alt="Vista previa"
                className="w-full rounded-2xl aspect-square object-cover bg-white"
              />
            )}

            <AdminInput
              label="Modelos separados por coma"
              value={form.modelos}
              onChange={(value) =>
                setForm({ ...form, modelos: value })
              }
              placeholder="Unisex, Girls, Boys"
            />

            <AdminInput
              label="Colores separados por coma"
              value={form.colores}
              onChange={(value) =>
                setForm({ ...form, colores: value })
              }
              placeholder="Rojo, Negro"
            />

            <AdminInput
              label="Talles separados por coma"
              value={form.talles}
              onChange={(value) =>
                setForm({ ...form, talles: value })
              }
              placeholder="XS, S, M, L, XL"
            />

            <AdminInput
              label="Orden"
              value={form.orden}
              onChange={(value) =>
                setForm({
                  ...form,
                  orden: Number(value || 0),
                })
              }
              type="number"
              inputMode="numeric"
            />

            <label className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 border border-white/5 p-4">
              <span className="text-white text-sm">
                Visible en ambas tiendas
              </span>

              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) =>
                  setForm({
                    ...form,
                    activo: event.target.checked,
                  })
                }
                className="w-5 h-5"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={saveProduct}
              className="btn-gold w-full disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : creating
                ? 'Crear producto'
                : 'Guardar cambios'}
            </button>

            {!creating && selectedId && (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const product = products.find(
                      (item) => item.id === selectedId
                    )
                    if (product) toggleActive(product)
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 text-white/70 text-sm font-bold disabled:opacity-50"
                >
                  {form.activo
                    ? 'Ocultar producto'
                    : 'Mostrar producto'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={deleteProduct}
                  className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-4 text-red-200 text-sm font-bold disabled:opacity-50"
                >
                  Eliminar producto
                </button>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function AdminInput({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  inputMode,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">{label}</span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white disabled:opacity-45"
      />
    </label>
  )
}
