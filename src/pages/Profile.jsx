import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import {
  supabase,
  uploadPublicImage,
} from '../lib/supabase'
import { mockUser } from '../data/mockData'

function loadSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem('pr_user') || '{}'
    )
  } catch {
    return {}
  }
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function Profile() {
  const location = useLocation()
  const { user, logout, updateUser } = useAuth()

  const base = {
    ...mockUser,
    ...loadSavedUser(),
    ...user,
  }

  const profileId = base.id || 'alumno-001'

  const [open, setOpen] = useState('servicios')
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fotoFile, setFotoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [contactos, setContactos] = useState([])
  const [activity, setActivity] = useState([])

  const [form, setForm] = useState({
    nombre: base.nombre || '',
    ciudad: base.ciudad || '',
    instagram: base.instagram || '',
    email: base.email || '',
    fechaNacimiento: base.fechaNacimiento || '',
    sobreMi: base.sobreMi || '',
    pin: base.pin || '',
    foto: base.foto || '',
    banner: base.banner || '',
    miembroDesde: base.miembroDesde || '2026',
    verificado: false,
    prcardActiva: false,
    trackingActivo: false,
    gruposInfo: [],
  })

  useEffect(() => {
    if (location.hash === '#observaciones') {
      setOpen('observaciones')

      setTimeout(() => {
        document
          .getElementById('observaciones')
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 250)
    }

    if (location.hash === '#editar') {
      setEditing(true)

      setTimeout(() => {
        document
          .getElementById('editar-perfil')
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }, 250)
    }
  }, [location.hash])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)

      const [
        profileResponse,
        contactsResponse,
        activityResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle(),

        supabase
          .from('contactos_pr')
          .select('*')
          .eq('activo', true)
          .order('orden', {
            ascending: true,
          }),

        supabase
          .from('actividad_pr')
          .select('*')
          .eq('alumno_id', profileId)
          .order('fecha', {
            ascending: false,
          }),
      ])

      if (profileResponse.error) {
        setMessage(
          `Error cargando perfil: ${profileResponse.error.message}`
        )
      }

      if (profileResponse.data) {
        const data = profileResponse.data

        const loadedProfile = {
          nombre: data.nombre || base.nombre || '',
          ciudad: data.ciudad || '',
          instagram: data.instagram || '',
          email: data.email || '',
          fechaNacimiento:
            data.fecha_nacimiento || '',
          sobreMi: data.sobre_mi || '',
          pin: data.pin || '',
          foto: data.foto || '',
          banner: data.banner || '',
          miembroDesde:
            data.miembro_desde || '2026',
          verificado: Boolean(data.verificado),
          prcardActiva: Boolean(
            data.prcard_activa
          ),
          trackingActivo: Boolean(
            data.tracking_activo
          ),
          gruposInfo: Array.isArray(
            data.grupos_info
          )
            ? data.grupos_info
            : [],
        }

        setForm(loadedProfile)

        const nextUser = {
          ...base,
          ...loadedProfile,
        }

        localStorage.setItem(
          'pr_user',
          JSON.stringify(nextUser)
        )

        updateUser?.(nextUser)
      }

      if (!contactsResponse.error) {
        setContactos(contactsResponse.data || [])
      }

      if (!activityResponse.error) {
        setActivity(activityResponse.data || [])
      }

      setLoading(false)
    }

    loadAll()
  }, [profileId])

  const profile = {
    ...base,
    ...form,
  }

  const badges = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Insignia'
      ),
    [activity]
  )

  const events = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Evento'
      ),
    [activity]
  )

  const notes = useMemo(
    () =>
      activity.filter(
        (item) => item.tipo === 'Nota'
      ),
    [activity]
  )

  function previewImage(file, field) {
    if (!file) return

    const preview = URL.createObjectURL(file)

    if (field === 'foto') {
      setFotoFile(file)
    } else {
      setBannerFile(file)
    }

    setForm((previous) => ({
      ...previous,
      [field]: preview,
    }))

    setMessage(
      'Imagen lista. Tocá Guardar cambios para publicarla.'
    )
  }

  async function saveProfile() {
    try {
      setSaving(true)
      setMessage('Guardando cambios…')

      let foto = form.foto
      let banner = form.banner

      if (fotoFile) {
        const result = await uploadPublicImage(
          'avatars',
          fotoFile,
          profileId
        )

        if (result.error) {
          throw new Error(result.error)
        }

        foto = result.url
      }

      if (bannerFile) {
        const result = await uploadPublicImage(
          'banners',
          bannerFile,
          profileId
        )

        if (result.error) {
          throw new Error(result.error)
        }

        banner = result.url
      }

      const payload = {
        nombre: form.nombre,
        ciudad: form.ciudad,
        instagram: form.instagram,
        email: form.email,
        fecha_nacimiento: form.fechaNacimiento,
        sobre_mi: form.sobreMi,
        pin: form.pin,
        foto,
        banner,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profileId)

      if (error) {
        throw new Error(error.message)
      }

      const nextUser = {
        ...base,
        ...form,
        foto,
        banner,
      }

      localStorage.setItem(
        'pr_user',
        JSON.stringify(nextUser)
      )

      updateUser?.(nextUser)

      setForm((previous) => ({
        ...previous,
        foto,
        banner,
      }))

      setFotoFile(null)
      setBannerFile(null)
      setEditing(false)
      setMessage('Cambios guardados correctamente.')
    } catch (error) {
      setMessage(
        `No se pudo guardar: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Mi perfil">
      <div className="pr-page space-y-5 animate-page-enter">
        {loading && (
          <div className="pr-card p-4 text-white/40 text-sm">
            Cargando tu perfil…
          </div>
        )}

        <section className="pr-panel overflow-hidden">
          <div className="h-[180px] relative bg-gradient-to-br from-[#211a0d] via-[#111119] to-[#08080d] overflow-hidden">
            {profile.banner ? (
              <img
                src={profile.banner}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-75"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center px-8">
                <div>
                  <div className="text-4xl">🛼</div>

                  <p className="text-pr-gold text-sm font-semibold mt-2">
                    Tu historia sobre ruedas
                  </p>

                  <p className="text-white/30 text-xs mt-1">
                    Elegí una imagen que te represente.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d13] via-black/5 to-black/15" />

            <label className="absolute top-4 right-4 px-3 py-2 rounded-full bg-black/55 border border-white/10 text-white/65 text-[10px] font-semibold cursor-pointer">
              Cambiar banner

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  previewImage(
                    event.target.files?.[0],
                    'banner'
                  )
                }
              />
            </label>
          </div>

          <div className="px-5 pb-5 relative">
            <label className="absolute -top-14 left-5 w-28 h-28 rounded-[32px] border-[4px] border-[#0d0d13] bg-[#171720] overflow-hidden grid place-items-center shadow-2xl cursor-pointer">
              {profile.foto ? (
                <img
                  src={profile.foto}
                  alt={profile.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-3xl">📷</div>

                  <p className="text-pr-gold text-[9px] mt-1">
                    Subir foto
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  previewImage(
                    event.target.files?.[0],
                    'foto'
                  )
                }
              />
            </label>

            <div className="pt-16 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[34px] leading-none text-white">
                  {profile.nombre}

                  {profile.verificado && (
                    <span className="text-sky-400 text-xl ml-1">
                      ✓
                    </span>
                  )}
                </h1>

                <p className="text-white/38 text-xs mt-2">
                  {profile.ciudad || 'Sin ciudad'} ·
                  Miembro desde {profile.miembroDesde}
                </p>

                {profile.instagram && (
                  <p className="text-pr-gold/75 text-xs mt-1">
                    {profile.instagram}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing((value) => !value)
                }
                className="px-4 py-2.5 rounded-[14px] bg-pr-gold text-black text-xs font-bold"
              >
                {editing ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            <p className="text-white/50 text-sm leading-relaxed mt-5">
              {profile.sobreMi ||
                'Mi espacio personal dentro de Punta Rollers.'}
            </p>

            <div className="grid grid-cols-3 gap-2.5 mt-5">
              <MiniStat
                value={events.length}
                label="Eventos"
              />

              <MiniStat
                value={badges.length}
                label="Insignias"
              />

              <MiniStat
                value={notes.length}
                label="Notas"
              />
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 text-pr-gold text-sm">
            {message}
          </div>
        )}

        {editing && (
          <section
            id="editar-perfil"
            className="pr-panel p-5 space-y-4"
          >
            <div>
              <p className="section-label">
                Personalización
              </p>

              <h2 className="font-display text-2xl text-white mt-1">
                Editá tu información
              </h2>
            </div>

            <EditInput
              label="Nombre"
              value={form.nombre}
              onChange={(value) =>
                setForm({
                  ...form,
                  nombre: value,
                })
              }
            />

            <EditInput
              label="Instagram"
              value={form.instagram}
              onChange={(value) =>
                setForm({
                  ...form,
                  instagram: value,
                })
              }
            />

            <EditInput
              label="Ciudad"
              value={form.ciudad}
              onChange={(value) =>
                setForm({
                  ...form,
                  ciudad: value,
                })
              }
            />

            <EditInput
              label="Email"
              value={form.email}
              onChange={(value) =>
                setForm({
                  ...form,
                  email: value,
                })
              }
            />

            <EditInput
              label="Cumpleaños"
              type="date"
              value={form.fechaNacimiento}
              onChange={(value) =>
                setForm({
                  ...form,
                  fechaNacimiento: value,
                })
              }
            />

            <EditInput
              label="PIN de ingreso"
              value={form.pin}
              onChange={(value) =>
                setForm({
                  ...form,
                  pin: value,
                })
              }
            />

            <label className="block">
              <span className="section-label">
                Sobre mí
              </span>

              <textarea
                rows="4"
                value={form.sobreMi}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sobreMi: event.target.value,
                  })
                }
                className="input-pr mt-2 resize-none"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="btn-gold w-full disabled:opacity-50"
            >
              {saving
                ? 'Guardando…'
                : 'Guardar cambios'}
            </button>
          </section>
        )}

        <section className="pr-panel p-5">
          <div>
            <p className="section-label">
              Comunidad
            </p>

            <h2 className="font-display text-2xl text-white mt-1">
              Tus grupos
            </h2>
          </div>

          {profile.gruposInfo?.length ? (
            <div className="space-y-2 mt-4">
              {profile.gruposInfo.map(
                (group, index) => (
                  <a
                    key={`${group.titulo}-${index}`}
                    href={group.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="pr-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {group.titulo}
                      </p>

                      <p className="text-white/32 text-[11px] mt-1">
                        Grupo asignado por Punta Rollers
                      </p>
                    </div>

                    <span className="text-pr-gold text-xs">
                      Abrir →
                    </span>
                  </a>
                )
              )}
            </div>
          ) : (
            <Empty
              title="Todavía no tenés grupos asignados"
              text="Cuando el equipo PR te agregue a un grupo, aparecerá acá."
            />
          )}
        </section>

        <Accordion
          title="Mis servicios PR"
          subtitle="Accesos activos"
          open={open === 'servicios'}
          onClick={() =>
            setOpen(
              open === 'servicios' ? '' : 'servicios'
            )
          }
        >
          <Service
            title="PR Card"
            active={profile.prcardActiva}
            href="https://puntarollerscard.com/"
            action="Abrir plataforma"
          />

          <Service
            title="PR Tracking"
            active={profile.trackingActivo}
            href="/app/tracking"
            action="Ver información"
          />
        </Accordion>

        <Accordion
          title={`Insignias (${badges.length})`}
          subtitle="Reconocimientos"
          open={open === 'insignias'}
          onClick={() =>
            setOpen(
              open === 'insignias' ? '' : 'insignias'
            )
          }
        >
          <ActivityList
            items={badges}
            empty="Todavía no tenés insignias"
            icon="🏅"
          />
        </Accordion>

        <Accordion
          title={`Eventos (${events.length})`}
          subtitle="Tu participación"
          open={open === 'participaciones'}
          onClick={() =>
            setOpen(
              open === 'participaciones'
                ? ''
                : 'participaciones'
            )
          }
        >
          <ActivityList
            items={events}
            empty="Todavía no hay participaciones"
            icon="🎯"
          />
        </Accordion>

        <section id="observaciones">
          <Accordion
            title={`Observaciones (${notes.length})`}
            subtitle="Tu evolución"
            open={open === 'observaciones'}
            onClick={() =>
              setOpen(
                open === 'observaciones'
                  ? ''
                  : 'observaciones'
              )
            }
          >
            <ActivityList
              items={notes}
              empty="Todavía no hay observaciones"
              icon="📝"
            />
          </Accordion>
        </section>

        <Accordion
          title="Contactos PR"
          subtitle="Estamos para ayudarte"
          open={open === 'contactos'}
          onClick={() =>
            setOpen(
              open === 'contactos' ? '' : 'contactos'
            )
          }
        >
          {contactos.length ? (
            <div className="space-y-2">
              {contactos.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="pr-card p-4 flex justify-between"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {contact.nombre}
                    </p>

                    {contact.detalle && (
                      <p className="text-white/35 text-xs mt-1">
                        {contact.detalle}
                      </p>
                    )}
                  </div>

                  <span className="text-pr-gold text-xs">
                    Abrir →
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <Empty
              title="Sin contactos cargados"
              text="Los contactos del equipo aparecerán acá."
            />
          )}
        </Accordion>

        <button
          type="button"
          onClick={logout}
          className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-4 text-red-200 text-sm font-semibold"
        >
          Cerrar sesión
        </button>
      </div>
    </AppLayout>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="pr-card p-3 text-center">
      <p className="font-display text-[26px] text-pr-gold font-bold">
        {value}
      </p>

      <p className="section-label mt-1">
        {label}
      </p>
    </div>
  )
}

function Empty({ title, text }) {
  return (
    <div className="pr-card p-4 mt-4">
      <p className="text-white font-semibold text-sm">
        {title}
      </p>

      <p className="text-white/38 text-sm mt-1">
        {text}
      </p>
    </div>
  )
}

function Accordion({
  title,
  subtitle,
  open,
  onClick,
  children,
}) {
  return (
    <section className="pr-panel overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <p className="font-display text-[22px] text-white font-bold">
            {title}
          </p>

          {subtitle && (
            <p className="text-white/30 text-[11px] mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <span className="w-8 h-8 rounded-full grid place-items-center bg-pr-gold/10 text-pr-gold text-xs">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  )
}

function Service({
  title,
  active,
  action,
  href,
}) {
  return (
    <div className="pr-card p-4 flex items-center justify-between mb-2">
      <div>
        <p className="text-white font-semibold text-sm">
          {title}
        </p>

        <p
          className={`text-xs mt-1 ${
            active
              ? 'text-emerald-400'
              : 'text-red-300'
          }`}
        >
          {active ? 'Activo' : 'Inactivo'}
        </p>
      </div>

      {active ? (
        <Link
          to={href}
          className="text-pr-gold text-xs"
        >
          {action} →
        </Link>
      ) : (
        <span className="text-white/20 text-xs">
          No disponible
        </span>
      )}
    </div>
  )
}

function ActivityList({
  items,
  empty,
  icon,
}) {
  if (!items.length) {
    return (
      <Empty
        title={empty}
        text="Cuando el equipo PR cargue información, aparecerá acá."
      />
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="pr-card p-4 flex gap-3"
        >
          <div className="text-xl">
            {icon}
          </div>

          <div>
            <p className="text-white font-semibold text-sm">
              {item.titulo}
            </p>

            {item.descripcion && (
              <p className="text-white/42 text-xs mt-1 leading-relaxed">
                {item.descripcion}
              </p>
            )}

            <p className="text-white/25 text-[10px] mt-2">
              {formatDate(item.fecha)}

              {item.creado_por_nombre
                ? ` · ${item.creado_por_nombre}`
                : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EditInput({
  label,
  value,
  onChange,
  type = 'text',
}) {
  return (
    <label className="block">
      <span className="section-label">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="input-pr mt-2"
      />
    </label>
  )
          }
