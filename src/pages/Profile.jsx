import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase, uploadPublicImage } from '../lib/supabase'
import { mockUser, contactosPR } from '../data/mockData'

const panelBase = 'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_24px_70px_rgba(0,0,0,0.35)]'

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('pr_user')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export default function Profile() {
  const location = useLocation()
  const { user, logout, updateUser } = useAuth()
  const savedUser = loadSavedUser()

  const baseProfile = { ...mockUser, ...savedUser, ...user, banner: '' }
  const profileId = baseProfile.id || 'alumno-001'

  const [open, setOpen] = useState('servicios')
  const [editing, setEditing] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [fotoFile, setFotoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  const [form, setForm] = useState({
    nombre: baseProfile.nombre || '',
    ciudad: baseProfile.ciudad || '',
    instagram: baseProfile.instagram || '',
    email: baseProfile.email || '',
    fechaNacimiento: baseProfile.fechaNacimiento || '',
    sobreMi: baseProfile.sobreMi || '',
    pin: baseProfile.pin || '',
    foto: baseProfile.foto || '',
    banner: '',
    miembroDesde: baseProfile.miembroDesde || '2026',
    verificado: false,
    prcardActiva: false,
    trackingActivo: false,
    gruposInfo: [],
    estadisticas: { clases: 0, eventos: 0, exp: 0 },
  })

  useEffect(() => {
    if (location.hash === '#observaciones') {
      setOpen('observaciones')
      setTimeout(() => document.getElementById('observaciones')?.scrollIntoView({ behavior: 'smooth' }), 250)
    }

    if (location.hash === '#editar') {
      setEditing(true)
      setTimeout(() => document.getElementById('editar-perfil')?.scrollIntoView({ behavior: 'smooth' }), 250)
    }
  }, [location.hash])

  useEffect(() => {
    async function loadProfileFromSupabase() {
      setLoadingProfile(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      if (error) setSavedMsg(`Error cargando perfil: ${error.message}`)

      if (data) {
        const loaded = {
          nombre: data.nombre || baseProfile.nombre || '',
          ciudad: data.ciudad || baseProfile.ciudad || '',
          instagram: data.instagram || baseProfile.instagram || '',
          email: data.email || baseProfile.email || '',
          fechaNacimiento: data.fecha_nacimiento || baseProfile.fechaNacimiento || '',
          sobreMi: data.sobre_mi || baseProfile.sobreMi || '',
          pin: data.pin || baseProfile.pin || '',
          foto: data.foto || '',
          banner: data.banner || '',
          miembroDesde: data.miembro_desde || '2026',
          verificado: Boolean(data.verificado),
          prcardActiva: Boolean(data.prcard_activa),
          trackingActivo: Boolean(data.tracking_activo),
          gruposInfo: Array.isArray(data.grupos_info) ? data.grupos_info : [],
          estadisticas: data.estadisticas || { clases: 0, eventos: 0, exp: 0 },
        }

        setForm(loaded)

        const updatedUser = { ...baseProfile, ...loaded }
        localStorage.setItem('pr_user', JSON.stringify(updatedUser))
        updateUser?.(updatedUser)
      }

      setLoadingProfile(false)
    }

    loadProfileFromSupabase()
  }, [profileId])

  const profile = { ...baseProfile, ...form }

  const userBadges = []
  const userObservations = []
  const userParticipations = []

  function previewImage(file, field) {
    if (!file) return

    const localPreview = URL.createObjectURL(file)

    if (field === 'foto') setFotoFile(file)
    if (field === 'banner') setBannerFile(file)

    setForm(prev => ({ ...prev, [field]: localPreview }))
    setSavedMsg('Imagen cargada. Tocá Guardar cambios.')
  }

  async function saveProfile() {
    try {
      setSaving(true)
      setSavedMsg('Guardando cambios...')

      let fotoUrl = form.foto
      let bannerUrl = form.banner

      if (fotoFile) {
        const result = await uploadPublicImage('avatars', fotoFile, profileId)
        if (result.error) throw new Error(result.error)
        fotoUrl = result.url
      }

      if (bannerFile) {
        const result = await uploadPublicImage('banners', bannerFile, profileId)
        if (result.error) throw new Error(result.error)
        bannerUrl = result.url
      }

      const dataToSave = {
        id: profileId,
        nombre: form.nombre,
        ciudad: form.ciudad,
        instagram: form.instagram,
        email: form.email,
        fecha_nacimiento: form.fechaNacimiento,
        sobre_mi: form.sobreMi,
        foto: fotoUrl,
        banner: bannerUrl,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle()

      let saveError = null

      if (existing?.id) {
        const { error } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', profileId)

        saveError = error
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert(dataToSave)

        saveError = error
      }

      if (saveError) throw new Error(saveError.message)

      const updatedUser = {
        ...baseProfile,
        nombre: form.nombre,
        ciudad: form.ciudad,
        instagram: form.instagram,
        email: form.email,
        fechaNacimiento: form.fechaNacimiento,
        sobreMi: form.sobreMi,
        foto: fotoUrl,
        banner: bannerUrl,
      }

      localStorage.setItem('pr_user', JSON.stringify(updatedUser))
      updateUser?.(updatedUser)

      setForm(prev => ({ ...prev, foto: fotoUrl, banner: bannerUrl }))
      setFotoFile(null)
      setBannerFile(null)
      setEditing(false)
      setSavedMsg('Cambios guardados correctamente.')
    } catch (error) {
      setSavedMsg(`No se pudo guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Mi Perfil">
      <div className="px-4 py-5 space-y-5 animate-page-enter">

        {loadingProfile && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/50">
            Cargando perfil...
          </div>
        )}

        <section className={`${panelBase} overflow-hidden relative`}>
          <div className="h-40 relative bg-gradient-to-br from-[#19140b] via-[#090910] to-black">
            {profile.banner ? (
              <img src={profile.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="text-3xl mb-2">🛼</div>
                <p className="text-pr-gold font-semibold text-sm">Personalizá tu banner</p>
                <p className="text-white/35 text-xs mt-1">Subí una imagen que represente tu historia sobre ruedas.</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-black/20 to-transparent" />

            <label className="absolute right-3 top-3 text-[10px] px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/70 cursor-pointer">
              Cambiar banner
              <input type="file" accept="image/*" className="hidden" onChange={e => previewImage(e.target.files?.[0], 'banner')} />
            </label>
          </div>

          <div className="px-5 pb-5 -mt-12 relative">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-3">
                <label className="w-24 h-24 rounded-3xl border-2 border-pr-gold/60 bg-[#12121d] shadow-xl overflow-hidden flex items-center justify-center cursor-pointer relative">
                  {profile.foto ? (
                    <img src={profile.foto} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center px-2">
                      <div className="text-2xl mb-1">📸</div>
                      <p className="text-[9px] text-pr-gold leading-tight">Poné tu foto</p>
                    </div>
                  )}

                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-1">
                    Foto
                  </span>

                  <input type="file" accept="image/*" className="hidden" onChange={e => previewImage(e.target.files?.[0], 'foto')} />
                </label>

                <div className="pb-2">
                  <h1 className="font-display text-3xl leading-none text-white">
                    {profile.nombre}
                    {profile.verificado && <span className="text-sky-400 text-xl align-middle"> ✓</span>}
                  </h1>

                  <p className="text-white/45 text-xs mt-1">
                    Miembro desde {profile.miembroDesde || '2026'}
                  </p>

                  {profile.instagram && (
                    <p className="text-pr-gold/70 text-xs mt-1">{profile.instagram}</p>
                  )}
                </div>
              </div>

              <button type="button" onClick={() => setEditing(!editing)} className="mb-2 px-3 py-2 rounded-xl bg-pr-gold text-black text-xs font-bold">
                {editing ? 'Cerrar' : 'Editar'}
              </button>
            </div>

            <p className="text-white/50 text-sm mt-4">
              {profile.sobreMi || 'Mi espacio personal dentro de Punta Rollers.'}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat value={profile.estadisticas?.clases || 0} label="Clases" />
              <MiniStat value={profile.estadisticas?.eventos || 0} label="Eventos" />
              <MiniStat value={profile.estadisticas?.exp || 0} label="Exp. PR" />
            </div>
          </div>
        </section>

        {savedMsg && (
          <div className="rounded-2xl border border-pr-gold/20 bg-pr-gold/10 p-3 text-sm text-pr-gold">
            {savedMsg}
          </div>
        )}

        {editing && (
          <section id="editar-perfil" className={`${panelBase} p-4 space-y-3`}>
            <p className="section-label">Personalizar perfil</p>

            <EditInput label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
            <EditInput label="Instagram" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />
            <EditInput label="Ciudad" value={form.ciudad} onChange={v => setForm({ ...form, ciudad: v })} />
            <EditInput label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
            <EditInput label="Cumpleaños" type="date" value={form.fechaNacimiento} onChange={v => setForm({ ...form, fechaNacimiento: v })} />

            <label className="block">
              <span className="text-white/35 text-xs">Sobre mí</span>
              <textarea
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
                rows="3"
                value={form.sobreMi}
                onChange={e => setForm({ ...form, sobreMi: e.target.value })}
                placeholder="Contá algo sobre tu camino sobre ruedas"
              />
            </label>

            <button type="button" disabled={saving} onClick={saveProfile} className="w-full rounded-2xl bg-pr-gold text-black py-4 text-sm font-bold active:scale-[0.98] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </section>
        )}

        <section className={`${panelBase} p-4`}>
          <p className="section-label">Tus grupos</p>

          {profile.gruposInfo?.length > 0 ? (
            <div className="space-y-2 mt-3">
              {profile.gruposInfo.map((grupo, index) => (
                <a
                  key={`${grupo.titulo}-${index}`}
                  href={grupo.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/5 p-4"
                >
                  <div>
                    <p className="text-white font-semibold">{grupo.titulo}</p>
                    <p className="text-white/35 text-xs mt-1">Grupo asignado por Punta Rollers</p>
                  </div>
                  <span className="text-pr-gold text-xs">Abrir</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-black/25 border border-white/5 p-4 mt-3">
              <p className="text-white font-semibold">Todavía no tenés grupos asignados</p>
              <p className="text-white/45 text-sm mt-1">
                Cuando el equipo PR te agregue a un grupo, aparecerá acá.
              </p>
            </div>
          )}
        </section>

        <Accordion title="Mis servicios PR" open={open === 'servicios'} onClick={() => setOpen(open === 'servicios' ? '' : 'servicios')}>
          <div className="grid grid-cols-1 gap-3">
            <ServiceState title="PR Card" active={profile.prcardActiva} action="Abrir plataforma" href="https://puntarollerscard.com/" />
            <ServiceState title="PR Tracking" active={profile.trackingActivo} action="Ver información" href="/app/tracking" />
          </div>
        </Accordion>

        <Accordion title={`Insignias (${userBadges.length})`} open={open === 'insignias'} onClick={() => setOpen(open === 'insignias' ? '' : 'insignias')}>
          <EmptyState title="Todavía no tenés insignias" text="Cuando un profesor te otorgue una insignia, aparecerá acá." />
        </Accordion>

        <Accordion title={`Eventos en los que participaste (${userParticipations.length})`} open={open === 'participaciones'} onClick={() => setOpen(open === 'participaciones' ? '' : 'participaciones')}>
          <EmptyState title="Todavía no hay participaciones" text="Cuando participes en eventos PR, aparecerán en esta sección." />
        </Accordion>

        <section id="observaciones">
          <Accordion title={`Observaciones de tus entrenadores (${userObservations.length})`} subtitle="Tu evolución" open={open === 'observaciones'} onClick={() => setOpen(open === 'observaciones' ? '' : 'observaciones')}>
            <EmptyState title="Todavía no hay observaciones" text="Cuando un profesor te deje una nota, aparecerá acá." />
          </Accordion>
        </section>

        <Accordion title="Contactos PR" open={open === 'contactos'} onClick={() => setOpen(open === 'contactos' ? '' : 'contactos')}>
          <div className="space-y-3">
            {contactosPR.map(c => (
              <a key={c.id} href={c.link} className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/5 p-4">
                <div>
                  <p className="text-white font-semibold">{c.nombre}</p>
                  <p className="text-white/40 text-xs">{c.detalle}</p>
                </div>
                <span className="text-pr-gold text-xs">Abrir</span>
              </a>
            ))}
          </div>
        </Accordion>

        <button type="button" onClick={logout} className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 py-4 text-red-200 text-sm font-semibold">
          Cerrar sesión
        </button>
      </div>
    </AppLayout>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
      <p className="text-pr-gold text-xl font-display font-bold">{value}</p>
      <p className="text-white/35 text-[10px] uppercase tracking-[0.18em]">{label}</p>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
      <p className="text-white font-semibold">{title}</p>
      <p className="text-white/45 text-sm mt-1">{text}</p>
    </div>
  )
}

function Accordion({ title, subtitle, open, onClick, children }) {
  return (
    <section className={panelBase}>
      <button type="button" onClick={onClick} className="w-full flex items-center justify-between p-4 text-left">
        <div>
          <p className="text-white font-semibold">{title}</p>
          {subtitle && <p className="text-white/35 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-pr-gold">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 animate-fade-in">{children}</div>}
    </section>
  )
}

function ServiceState({ title, active, action, href }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-4 flex items-center justify-between">
      <div>
        <p className="text-white font-semibold">{title}</p>
        <p className={active ? 'text-emerald-400 text-xs' : 'text-red-300 text-xs'}>
          {active ? 'Activo' : 'Inactivo'}
        </p>
      </div>

      {active ? (
        <Link to={href} className="text-pr-gold text-xs">{action}</Link>
      ) : (
        <span className="text-white/25 text-xs">No disponible</span>
      )}
    </div>
  )
}

function EditInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-white/35 text-xs">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none text-white"
      />
    </label>
  )
}
