import { useMemo, useState } from 'react'
import PublicLayout from '../layouts/PublicLayout'

const WHATSAPP_NUMBER = '59898971505'

const PRODUCTS = [
  {
    id: 'kids-roja',
    name: 'Remera PR Kids',
    subtitle: 'Modelo infantil oficial',
    image: '/uniformes/pr-kids-roja.jpg',
    price: 900,
    category: 'Kids',
    options: {
      modelo: ['PR Kids'],
      color: ['Rojo'],
      talle: ['4', '6', '8', '10', '12', '14'],
    },
  },
  {
    id: 'girls-violeta',
    name: 'Remera PR Girls',
    subtitle: 'Modelo femenino oficial',
    image: '/uniformes/pr-girls-violeta.jpg',
    price: 1200,
    category: 'Adultos',
    options: {
      modelo: ['Girls'],
      color: ['Violeta'],
      talle: ['XS', 'S', 'M', 'L', 'XL'],
    },
  },
  {
    id: 'boys-celeste',
    name: 'Remera PR Boys',
    subtitle: 'Modelo masculino oficial',
    image: '/uniformes/pr-boys-celeste.jpg',
    price: 1200,
    category: 'Adultos',
    options: {
      modelo: ['Boys'],
      color: ['Celeste'],
      talle: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
  },
  {
    id: 'hoodie-rojo',
    name: 'Hoodie PR Rojo',
    subtitle: 'Modelo unisex',
    image: '/uniformes/hoodie-pr-rojo.jpg',
    price: 1800,
    category: 'Hoodies',
    options: {
      modelo: ['Unisex'],
      color: ['Rojo'],
      talle: ['S', 'M', 'L', 'XL', 'XXL'],
    },
  },
  {
    id: 'hoodie-negro',
    name: 'Hoodie PR Negro',
    subtitle: 'Modelo unisex',
    image: '/uniformes/hoodie-pr-negro.jpg',
    price: 1800,
    category: 'Hoodies',
    options: {
      modelo: ['Unisex'],
      color: ['Negro'],
      talle: ['S', 'M', 'L', 'XL', 'XXL'],
    },
  },
]

function formatPrice(value) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Uniformes() {
  const [selectedProductId, setSelectedProductId] = useState(PRODUCTS[0].id)
  const [selectedModel, setSelectedModel] = useState(PRODUCTS[0].options.modelo[0])
  const [selectedColor, setSelectedColor] = useState(PRODUCTS[0].options.color[0])
  const [selectedSize, setSelectedSize] = useState(PRODUCTS[0].options.talle[0])
  const [name, setName] = useState('')
  const [student, setStudent] = useState('')
  const [notes, setNotes] = useState('')

  const selectedProduct = useMemo(
    () => PRODUCTS.find((product) => product.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  )

  function chooseProduct(product) {
    setSelectedProductId(product.id)
    setSelectedModel(product.options.modelo[0])
    setSelectedColor(product.options.color[0])
    setSelectedSize(product.options.talle[0])
  }

  const whatsappLink = useMemo(() => {
    const message = [
      'Hola, quiero solicitar un uniforme de Punta Rollers.',
      '',
      `Producto: ${selectedProduct.name}`,
      `Modelo: ${selectedModel}`,
      `Color: ${selectedColor}`,
      `Talle: ${selectedSize}`,
      `Precio publicado: ${formatPrice(selectedProduct.price)}`,
      name.trim() ? `Nombre de quien solicita: ${name.trim()}` : '',
      student.trim() ? `Alumno/a: ${student.trim()}` : '',
      notes.trim() ? `Observaciones: ${notes.trim()}` : '',
      '',
      'Entiendo que el pedido se confirma una vez abonado y que los datos de transferencia me serán enviados por WhatsApp.',
    ]
      .filter(Boolean)
      .join('\n')

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  }, [
    selectedProduct,
    selectedModel,
    selectedColor,
    selectedSize,
    name,
    student,
    notes,
  ])

  return (
    <PublicLayout>
      <div className="px-4 py-6 space-y-10">
        <section className="text-center space-y-3">
          <p className="section-label">Tienda oficial</p>

          <h1 className="text-3xl font-bold text-white">
            👕 Uniformes PR
          </h1>

          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Elegí tu modelo, color y talle. El pedido se envía directamente por
            WhatsApp.
          </p>
        </section>

        <section className="glass p-5 rounded-2xl space-y-3">
          <p className="text-white font-semibold">
            Diseño oficial de la comunidad
          </p>

          <p className="text-gray-300 text-sm leading-relaxed">
            Los uniformes de Punta Rollers están pensados para acompañarte en
            entrenamientos, salidas, eventos y actividades del club.
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            Cada línea tiene su propio diseño y disponibilidad según modelo,
            color, talle y stock.
          </p>
        </section>

        <section className="space-y-4">
          <p className="section-label">Modelos disponibles</p>

          <div className="grid grid-cols-1 gap-4">
            {PRODUCTS.map((product) => {
              const active = selectedProductId === product.id

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => chooseProduct(product)}
                  className={`text-left overflow-hidden rounded-2xl border transition-all ${
                    active
                      ? 'border-pr-gold bg-pr-gold/10'
                      : 'border-white/10 bg-white/[0.035]'
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full aspect-square object-cover bg-white"
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">
                          {product.name}
                        </p>

                        <p className="text-gray-400 text-xs mt-1">
                          {product.subtitle}
                        </p>
                      </div>

                      <p className="text-pr-gold font-bold text-sm">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <p className="text-gray-500 text-xs mt-3">
                      {product.category}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="glass p-5 rounded-2xl space-y-5">
          <div>
            <p className="section-label">Armá tu pedido</p>

            <h2 className="text-white font-semibold text-xl mt-1">
              {selectedProduct.name}
            </h2>

            <p className="text-pr-gold font-bold mt-1">
              {formatPrice(selectedProduct.price)}
            </p>
          </div>

          <OptionGroup
            label="Modelo"
            values={selectedProduct.options.modelo}
            selected={selectedModel}
            onSelect={setSelectedModel}
          />

          <OptionGroup
            label="Color"
            values={selectedProduct.options.color}
            selected={selectedColor}
            onSelect={setSelectedColor}
          />

          <OptionGroup
            label="Talle"
            values={selectedProduct.options.talle}
            selected={selectedSize}
            onSelect={setSelectedSize}
          />

          <Field
            label="Tu nombre"
            value={name}
            onChange={setName}
            placeholder="Ej: Claudio Facelli"
          />

          <Field
            label="Nombre del alumno/a"
            value={student}
            onChange={setStudent}
            placeholder="Opcional"
          />

          <label className="block">
            <span className="text-gray-400 text-xs">
              Observaciones
            </span>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows="3"
              placeholder="Ej: necesito confirmar medidas"
              className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white resize-none"
            />
          </label>

          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-4">
            <p className="text-pr-gold text-sm font-semibold">
              Información importante
            </p>

            <p className="text-white/60 text-xs leading-relaxed mt-2">
              El uniforme debe abonarse para confirmar el pedido. Los datos de
              transferencia se envían por WhatsApp una vez realizada la
              solicitud.
            </p>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full text-center"
          >
            Solicitar por WhatsApp
          </a>

          <p className="text-gray-500 text-xs text-center">
            Pedidos al 098 971 505 · Disponibilidad según stock y temporada
          </p>
        </section>

        <section className="space-y-3">
          <p className="section-label">¿Por qué tenerlo?</p>

          <div className="grid grid-cols-1 gap-3">
            <Benefit
              icon="🔥"
              title="Identidad"
              text="Representás Punta Rollers dentro y fuera de la pista."
            />

            <Benefit
              icon="🛼"
              title="Comodidad"
              text="Diseñado para acompañarte durante el entrenamiento."
            />

            <Benefit
              icon="📸"
              title="Presencia"
              text="Ideal para clases, fotos, eventos y rolleadas."
            />
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}

function OptionGroup({ label, values, selected, onSelect }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-2">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`px-4 py-2 rounded-xl border text-sm ${
              selected === value
                ? 'bg-pr-gold text-black border-pr-gold font-semibold'
                : 'bg-white/5 text-white/60 border-white/10'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-gray-400 text-xs">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />
    </label>
  )
}

function Benefit({ icon, title, text }) {
  return (
    <div className="glass p-4 rounded-2xl">
      <p className="text-white font-medium">
        {icon} {title}
      </p>

      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
        {text}
      </p>
    </div>
  )
}
