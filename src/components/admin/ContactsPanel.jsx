import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const panel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

function emptyForm() {
  return {
    id: '',
    nombre: '',
    detalle: '',
    telefono: '',
    activo: true,
    orden: 1,
  }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function buildWhatsAppLink(phone) {
  const clean = normalizePhone(phone)
  return clean ? `https://wa.me/${clean}` : ''
}

export default function ContactsPanel({ setMsg }) {
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')

  async function loadContacts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('contactos_pr')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (error) {
      setMsg(
        `No se pudieron cargar los contactos: ${error.message}`
      )
      setContacts([])
      setLoading(false)
      return
    }

    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const activeCount = useMemo(
    () =>
      contacts.filter(
        (contact) => contact.activo
      ).length,
    [contacts]
  )

  function startEdit(contact) {
    const phoneFromLink = String(contact.link || '')
      .replace('https://wa.me/', '')
      .replace(/\D/g, '')

    setEditingId(contact.id)
    setForm({
      id: contact.id,
      nombre: contact.nombre || '',
      detalle: contact.detalle || '',
      telefono: phoneFromLink || '',
      activo:
        typeof contact.activo === 'boolean'
          ? contact.activo
          : true,
      orden: Number(contact.orden || 1),
    })

    setTimeout(() => {
      document
        .getElementById('contact-form')
        ?.scrollIntoView({
          behavior: 'smooth',
        })
    }, 100)
  }

  function cancelEdit() {
    setEditingId('')
    setForm(emptyForm())
  }

  async function saveContact() {
    try {
      setSaving(true)
      setMsg('Guardando contacto...')

      const nombre = form.nombre.trim()
      const detalle = form.detalle.trim()
      const telefono = normalizePhone(
        form.telefono
      )

      if (!nombre) {
        throw new Error(
          'Ingresá el nombre del contacto.'
        )
      }

      if (!telefono) {
        throw new Error(
          'Ingresá el número con código de país.'
        )
      }

      const payload = {
        nombre,
        detalle,
        link: buildWhatsAppLink(telefono),
        activo: Boolean(form.activo),
        orden: Math.max(
          1,
          Number(form.orden || 1)
        ),
      }

      if (editingId) {
        const { error } = await supabase
          .from('contactos_pr')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          throw new Error(error.message)
        }

        setMsg(
          'Contacto actualizado para todos los usuarios.'
        )
      } else {
        const { error } = await supabase
          .from('contactos_pr')
          .insert(payload)

        if (error) {
          throw new Error(error.message)
        }

        setMsg(
          'Contacto agregado para todos los usuarios.'
        )
      }

      cancelEdit()
      await loadContacts()
    } catch (error) {
      setMsg(
        `No se pudo guardar: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(contact) {
    try {
      setMsg('Actualizando contacto...')

      const { error } = await supabase
        .from('contactos_pr')
        .update({
          activo: !contact.activo,
        })
        .eq('id', contact.id)

      if (error) {
        throw new Error(error.message)
      }

      setMsg(
        contact.activo
          ? 'Contacto ocultado para los alumnos.'
          : 'Contacto visible para los alumnos.'
      )

      await loadContacts()
    } catch (error) {
      setMsg(
        `No se pudo actualizar: ${error.message}`
      )
    }
  }

  async function deleteContact(contact) {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente a ${contact.nombre}?`
    )

    if (!confirmed) return

    try {
      setMsg('Eliminando contacto...')

      const { error } = await supabase
        .from('contactos_pr')
        .delete()
        .eq('id', contact.id)

      if (error) {
        throw new Error(error.message)
      }

      if (editingId === contact.id) {
        cancelEdit()
      }

      setMsg(
        'Contacto eliminado correctamente.'
      )

      await loadContacts()
    } catch (error) {
      setMsg(
        `No se pudo eliminar: ${error.message}`
      )
    }
  }

  return (
    <div className="space-y-4">
      <section
        className={`${panel} p-5 bg-gradient-to-br from-pr-gold/10 to-white/[0.025]`}
      >
        <p className="section-label">
          Contactos PR
        </p>

        <h2 className="font-display text-3xl text-white mt-1">
          Agenda general
        </h2>

        <p className="text-white/40 text-sm mt-2 leading-relaxed">
          Los cambios se aplican automáticamente
          en el perfil de todos los alumnos.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat
            label="Contactos"
            value={contacts.length}
          />

          <Stat
            label="Visibles"
            value={activeCount}
          />
        </div>
      </section>

      <section
        id="contact-form"
        className={`${panel} p-4 space-y-3`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">
              {editingId
                ? 'Editar contacto'
                : 'Nuevo contacto'}
            </p>

            <h3 className="font-display text-2xl text-white mt-1">
              {editingId
                ? form.nombre || 'Contacto'
                : 'Agregar contacto'}
            </h3>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-white/40 text-xs"
            >
              Cancelar
            </button>
          )}
        </div>

        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(value) =>
            setForm({
              ...form,
              nombre: value,
            })
          }
          placeholder="Ej: Lucía · Tesorería"
        />

        <Input
          label="Descripción"
          value={form.detalle}
          onChange={(value) =>
            setForm({
              ...form,
              detalle: value,
            })
          }
          placeholder="Ej: Pagos, mensualidades y consultas"
        />

        <Input
          label="Teléfono con código de país"
          value={form.telefono}
          onChange={(value) =>
            setForm({
              ...form,
              telefono: value,
            })
          }
          placeholder="Ej: 59899220929"
          inputMode="numeric"
        />

        <Input
          label="Orden"
          type="number"
          value={form.orden}
          onChange={(value) =>
            setForm({
              ...form,
              orden: value,
            })
          }
          inputMode="numeric"
        />

        <label className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 border border-white/5 p-4">
          <div>
            <p className="text-white text-sm font-semibold">
              Visible para los alumnos
            </p>

            <p className="text-white/30 text-xs mt-1">
              Podés ocultarlo sin eliminarlo.
            </p>
          </div>

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
          onClick={saveContact}
          className="btn-gold w-full disabled:opacity-50"
        >
          {saving
            ? 'Guardando...'
            : editingId
              ? 'Guardar cambios'
              : 'Agregar contacto'}
        </button>
      </section>

      <section className={`${panel} p-4`}>
        <p className="section-label">
          Contactos cargados
        </p>

        {loading ? (
          <p className="text-white/40 text-sm mt-3">
            Cargando contactos...
          </p>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl bg-black/25 border border-white/5 p-4 mt-3">
            <p className="text-white font-semibold">
              Todavía no hay contactos
            </p>

            <p className="text-white/35 text-sm mt-1">
              Agregá el primero desde el formulario.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl bg-black/25 border border-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold">
                      {contact.nombre}
                    </p>

                    {contact.detalle && (
                      <p className="text-white/40 text-xs mt-1 leading-relaxed">
                        {contact.detalle}
                      </p>
                    )}

                    <p className="text-pr-gold/75 text-xs mt-2 break-all">
                      {contact.link ||
                        'Sin enlace'}
                    </p>

                    <p
                      className={`text-xs mt-2 ${
                        contact.activo
                          ? 'text-emerald-400'
                          : 'text-red-300'
                      }`}
                    >
                      {contact.activo
                        ? 'Visible'
                        : 'Oculto'}
                      {' · '}
                      Orden {contact.orden || 1}
                    </p>
                  </div>

                  <span className="text-xl">
                    📱
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(contact)
                    }
                    className="rounded-xl bg-white/5 border border-white/10 py-2.5 text-white/75 text-xs"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleActive(contact)
                    }
                    className="rounded-xl bg-white/5 border border-white/10 py-2.5 text-white/75 text-xs"
                  >
                    {contact.activo
                      ? 'Ocultar'
                      : 'Mostrar'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteContact(contact)
                    }
                    className="rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-red-200 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
      <p className="font-display text-3xl text-pr-gold">
        {value}
      </p>

      <p className="text-white/30 text-[10px] uppercase tracking-[0.16em] mt-1">
        {label}
      </p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  inputMode,
}) {
  return (
    <label className="block">
      <span className="text-white/40 text-xs">
        {label}
      </span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />
    </label>
  )
}
