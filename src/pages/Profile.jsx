import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import {
  supabase,
  uploadPublicImage,
} from '../lib/supabase'
import { mockUser } from '../data/mockData'
import TreasuryPanel from '../components/treasury/TreasuryPanel'

const DAY_MS = 24 * 60 * 60 * 1000

const BADGE_IMAGES = {
  'primer evento pr': '/insignias-pr/primer-evento-pr.png',
  'rodador frecuente': '/insignias-pr/rodador-frecuente.png',
  'espiritu pr': '/insignias-pr/espiritu-pr.png',
  'primeros 6k': '/insignias-pr/primeros-6k.png',
  'primeros 10k': '/insignias-pr/primeros-10k.png',
  'ya frena en t': '/insignias-pr/frena-en-t.png',
  'frena en t': '/insignias-pr/frena-en-t.png',
  'ya frena con taco': '/insignias-pr/frena-con-taco.png',
  'frena con taco': '/insignias-pr/frena-con-taco.png',
  'buen companero': '/insignias-pr/buen-companero.png',
  'actitud positiva': '/insignias-pr/actitud-positiva.png',
  'entrenador potencial': '/insignias-pr/entrenador-potencial.png',
}

function normalizeBadgeTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getBadgeImage(title) {
  return BADGE_IMAGES[normalizeBadgeTitle(title)] || ''
}

function loadSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem('pr_user') || '{}'
    )
  } catch {
    return {}
  }
}

function parsePaymentDate(value) {
  if (!value) return null

  const date = new Date(
    `${String(value).slice(0, 10)}T23:59:59`
  )

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
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

function formatPaymentDate(value) {
  const date = parsePaymentDate(value)

  if (!date) {
    return 'Sin fecha registrada'
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getPaymentStatus(
  expirationValue,
  accessEnabled
) {
  if (!expirationValue) {
    return {
      title: 'Sin pago registrado',
      description:
        'Todavía no hay una vigencia cargada para tu mensualidad.',
      detail:
        'Consultá con Tesorería si considerás que esto es un error.',
      icon: '💳',
      containerClass:
        'border-white/[0.08] bg-white/[0.025]',
      badgeClass:
        'border-white/10 bg-white/[0.05] text-white/50',
      badge: 'Sin registrar',
    }
  }

  const expiration =
    parsePaymentDate(expirationValue)

  if (!expiration) {
    return {
      title: 'Información no disponible',
      description:
        'No pudimos interpretar la fecha de tu mensualidad.',
      detail:
        'Comunicate con Tesorería para revisarla.',
      icon: '💳',
      containerClass:
        'border-white/[0.08] bg-white/[0.025]',
      badgeClass:
        'border-white/10 bg-white/[0.05] text-white/50',
      badge: 'Revisar',
    }
  }

  const remainingDays = Math.ceil(
    (expiration.getTime() - Date.now()) /
      DAY_MS
  )

  if (
    remainingDays < 0 ||
    accessEnabled === false
  ) {
    const expiredDays = Math.max(
      1,
      Math.abs(remainingDays)
    )

    return {
      title: 'Mensualidad vencida',
      description: `Venció el ${formatPaymentDate(
        expirationValue
      )}.`,
      detail: `Vencida hace ${expiredDays} día${
        expiredDays === 1 ? '' : 's'
      }.`,
      icon: '⚠️',
      containerClass:
        'border-red-400/20 bg-gradient-to-br from-red-500/10 to-white/[0.02]',
      badgeClass:
        'border-red-400/20 bg-red-400/10 text-red-200',
      badge: 'Vencida',
    }
  }

  if (remainingDays === 0) {
    return {
      title: 'Tu mensualidad vence hoy',
      description: `Vigente hasta el ${formatPaymentDate(
        expirationValue
      )}.`,
      detail:
        'Regularizala para mantener todos tus accesos.',
      icon: '⏳',
      containerClass:
        'border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/[0.02]',
      badgeClass:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
      badge: 'Vence hoy',
    }
  }

  if (remainingDays <= 7) {
    return {
      title: 'Tu mensualidad vence pronto',
      description: `Vigente hasta el ${formatPaymentDate(
        expirationValue
      )}.`,
      detail: `Te quedan ${remainingDays} día${
        remainingDays === 1 ? '' : 's'
      }.`,
      icon: '⏳',
      containerClass:
        'border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/[0.02]',
      badgeClass:
        'border-amber-400/20 bg-amber-400/10 text-amber-200',
      badge: `${remainingDays} día${
        remainingDays === 1 ? '' : 's'
      }`,
    }
  }

  return {
    title: 'Mensualidad vigente',
    description: `Vigente hasta el ${formatPaymentDate(
      expirationValue
    )}.`,
    detail: `Te quedan ${remainingDays} días.`,
    icon: '✓',
    containerClass:
      'border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.08] to-white/[0.02]',
    badgeClass:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    badge: `${remainingDays} días`,
  }
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
  const [savingMedia, setSavingMedia] = useState('')
  const [loading, setLoading] = useState(true)
  const [fotoFile, setFotoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [savedMedia, setSavedMedia] = useState({
    foto: base.foto || '',
    banner: base.banner || '',
  })
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
    ultimoPago: base.ultimoPago || '',
    mensualidadHasta:
      base.mensualidadHasta || '',
    accesoHabilitado:
      typeof base.accesoHabilitado === 'boolean'
        ? base.accesoHabilitado
        : true,
    esTesoreria: Boolean(
      base.esTesoreria ||
        base.es_tesoreria
    ),
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

    if (location.hash === '#mensualidad') {
      setTimeout(() => {
        document
          .getElementById('mensualidad')
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
          ultimoPago:
            data.ultimo_pago || '',
          mensualidadHasta:
            data.mensualidad_hasta || '',
          accesoHabilitado:
            typeof data.acceso_habilitado ===
            'boolean'
              ? data.acceso_habilitado
              : true,
          esTesoreria: Boolean(
            data.es_tesoreria
          ),
        }

        setForm(loadedProfile)
        setSavedMedia({
          foto: loadedProfile.foto,
          banner: loadedProfile.banner,
        })

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

  const paymentStatus =
    getPaymentStatus(
      profile.mensualidadHasta,
      profile.accesoHabilitado
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
      field === 'foto'
        ? 'La foto está lista. Tocá Guardar foto.'
        : 'El banner está listo. Tocá Guardar banner.'
    )
  }

  function cancelMedia(field) {
    if (field === 'foto') {
      setFotoFile(null)
    } else {
      setBannerFile(null)
    }

    setForm((previous) => ({
      ...previous,
      [field]: savedMedia[field] || '',
    }))
  }

  async function saveMedia(field) {
    const file = field === 'foto' ? fotoFile : bannerFile

    if (!file) return

    try {
      setSavingMedia(field)
      setMessage(
        field === 'foto'
          ? 'Guardando foto…'
          : 'Guardando banner…'
      )

      const bucket =
        field === 'foto' ? 'avatars' : 'banners'

      const result = await uploadPublicImage(
        bucket,
        file,
        profileId
      )

      if (result.error) {
        throw new Error(result.error)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          [field]: result.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)

      if (error) {
        throw new Error(error.message)
      }

      const nextUser = {
        ...base,
        ...form,
        [field]: result.url,
      }

      localStorage.setItem(
        'pr_user',
        JSON.stringify(nextUser)
      )

      updateUser?.({ [field]: result.url })

      setForm((previous) => ({
        ...previous,
        [field]: result.url,
      }))

      setSavedMedia((previous) => ({
        ...previous,
        [field]: result.url,
      }))

      if (field === 'foto') {
        setFotoFile(null)
      } else {
        setBannerFile(null)
      }

      setMessage(
        field === 'foto'
          ? 'Foto actualizada correctamente.'
          : 'Banner actualizado correctamente.'
      )
    } catch (error) {
      setMessage(`No se pudo guardar: ${error.message}`)
    } finally {
      setSavingMedia('')
    }
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

      setSavedMedia({ foto, banner })

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
              <div className="absolute inset-0 flex items-start justify-center text-center px-8 pt-5">
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

            {bannerFile && (
              <div className="absolute left-4 right-4 bottom-4 flex gap-2">
                <button
                  type="button"
                  disabled={savingMedia === 'banner'}
                  onClick={() => saveMedia('banner')}
                  className="flex-1 rounded-2xl bg-pr-gold text-black py-3 text-xs font-bold disabled:opacity-50"
                >
                  {savingMedia === 'banner'
                    ? 'Guardando…'
                    : 'Guardar banner'}
                </button>

                <button
                  type="button"
                  disabled={savingMedia === 'banner'}
                  onClick={() => cancelMedia('banner')}
                  className="px-4 rounded-2xl bg-black/60 border border-white/10 text-white/70 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            )}
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

            {fotoFile && (
              <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 mt-4">
                <p className="text-pr-gold text-xs font-semibold">
                  Nueva foto lista
                </p>

                <p className="text-white/40 text-[11px] mt-1">
                  Guardala ahora sin abrir Editar perfil.
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    disabled={savingMedia === 'foto'}
                    onClick={() => saveMedia('foto')}
                    className="rounded-xl bg-pr-gold text-black py-3 text-xs font-bold disabled:opacity-50"
                  >
                    {savingMedia === 'foto'
                      ? 'Guardando…'
                      : 'Guardar foto'}
                  </button>

                  <button
                    type="button"
                    disabled={savingMedia === 'foto'}
                    onClick={() => cancelMedia('foto')}
                    className="rounded-xl bg-white/5 border border-white/10 text-white/65 py-3 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

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

        <section
          id="mensualidad"
          className={`rounded-[26px] border p-5 ${paymentStatus.containerClass}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 bg-black/25 border border-white/[0.06] text-xl">
              {paymentStatus.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">
                    Mensualidad PR
                  </p>

                  <h2 className="font-display text-xl text-white mt-1">
                    {paymentStatus.title}
                  </h2>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${paymentStatus.badgeClass}`}
                >
                  {paymentStatus.badge}
                </span>
              </div>

              <p className="text-white/55 text-sm mt-3 leading-relaxed">
                {paymentStatus.description}
              </p>

              <p className="text-white/30 text-xs mt-1">
                {paymentStatus.detail}
              </p>

              {profile.ultimoPago && (
                <div className="rounded-2xl bg-black/20 border border-white/[0.05] p-3 mt-4">
                  <p className="text-white/25 text-[10px] uppercase tracking-[0.14em]">
                    Último pago registrado
                  </p>

                  <p className="text-white/70 text-sm mt-1">
                    {formatPaymentDate(
                      profile.ultimoPago
                    )}
                  </p>
                </div>
              )}
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
            badgeMode
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


        {form.esTesoreria && (
          <Accordion
            title="Tesorería"
            subtitle="Registrar y consultar pagos"
            open={open === 'tesoreria'}
            onClick={() =>
              setOpen(
                open === 'tesoreria'
                  ? ''
                  : 'tesoreria'
              )
            }
          >
            <TreasuryPanel
              currentUser={{
                ...base,
                ...form,
              }}
              setMessage={setMessage}
            />
          </Accordion>
        )}

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
  badgeMode = false,
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
      {items.map((item) => {
        const badgeImage = badgeMode
          ? getBadgeImage(item.titulo)
          : ''

        return (
          <div
            key={item.id}
            className={`pr-card ${
              badgeMode
                ? 'p-3'
                : 'p-4 flex gap-3'
            }`}
          >
            {badgeMode ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-black/30 border border-pr-gold/15 grid place-items-center">
                  {badgeImage ? (
                    <img
                      src={badgeImage}
                      alt={item.titulo}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">
                      🏅
                    </span>
                  )}
                </div>

                <div className="min-w-0">
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
            ) : (
              <>
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
              </>
            )}
          </div>
        )
      })}
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
