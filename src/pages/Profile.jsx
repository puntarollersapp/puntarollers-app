import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase, uploadPublicImage } from '../lib/supabase'
import {
  mockUser,
  insignias,
  observaciones,
  participaciones,
  notificaciones,
  contactosPR,
  professores,
} from '../data/mockData'

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
  const { user, logout, updateUser } = useAuth()

  const savedUser = loadSavedUser()
  const baseProfile = { ...mockUser, ...savedUser, ...user }
  const profileId = baseProfile.id || 'alumno-001'

  const [open, setOpen] = useState('insignias')
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
    banner: baseProfile.banner || '/banner-prcard.png',
  })

  useEffect(() => {
    async function loadProfileFromSupabase() {
      setLoadingProfile(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      if (!error && data) {
        const loaded = {
          nombre: data.nombre || baseProfile.nombre || '',
          ciudad: data.ciudad || baseProfile.ciudad || '',
          instagram: data.instagram || baseProfile.instagram || '',
          email: data.email || baseProfile.email || '',
          fechaNacimiento: data.fecha_nacimiento || baseProfile.fechaNacimiento || '',
          sobreMi: data.sobre_mi || baseProfile.sobreMi || '',
          pin: baseProfile.pin || '',
          foto: data.foto || baseProfile.foto || '',
          banner: data.banner || baseProfile.banner || '/banner-prcard.png',
        }

        setForm(loaded)

        const updatedUser = {
          ...baseProfile,
          ...loaded,
        }

        localStorage.setItem('pr_user', JSON.stringify(updatedUser))
        updateUser?.(updatedUser)
      }

      setLoadingProfile(false)
    }

    loadProfileFromSupabase()
  }, [profileId])

  const profile = {
    ...baseProfile,
    ...form,
  }

  const earned = insignias.filter(i => i.desbloqueada)
  const nextBadges = insignias.filter(i => !i.desbloqueada).slice(0, 3)
  const lastBadge = earned[earned.length - 1]
  const userObservations = observaciones.filter(o => o.alumnoId === 'alumno-001')
  const userParticipations = participaciones.filter(p => p.alumnoId === 'alumno-001')
  const unread = notificaciones.filter(n => !n.leida).length

  const professorById = useMemo(
    () => Object.fromEntries(professores.map(p => [p.id, p])),
    []
  )

  function previewImage(file, field) {
    if (!file) return

    const localPreview = URL.createObjectURL(file)

    if (field === 'foto') setFotoFile(file)
    if (field === 'banner') setBannerFile(file)

    setForm(prev => ({
      ...prev,
      [field]: localPreview,
    }))

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

      const { error } = await supabase
        .from('profiles')
        .upsert(dataToSave, { onConflict: 'id' })

      if (error) throw new Error(error.message)

      const updatedUser = {
        ...baseProfile,
        nombre: form.nombre,
        ciudad: form.ciudad,
        instagram: form.instagram,
        email: form.email,
        fechaNacimiento: form.fechaNacimiento,
        sobreMi: form.sobreMi,
        pin: form.pin,
        foto: fotoUrl,
        banner: bannerUrl,
      }

      localStorage.setItem('pr_user', JSON.stringify(updatedUser))
      updateUser?.(updatedUser)

      setForm(prev => ({
        ...prev,
        foto: fotoUrl,
        banner: bannerUrl,
      }))

      setFotoFile(null)
      setBannerFile(null)
      setEditing(false)
      setSavedMsg('Cambios guardados en Supabase correctamente.')
    } catch (error) {
      console.error(error)
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
          <div className="h-40 relative bg-gradient-to-br from-pr-gold/25 via-pr-navy to-black">
            {profile.banner && (
              <img src={profile.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-black/25 to-transparent" />

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
                    <span className="font-display text-3xl text-pr-gold">{initials(profile.nombre)}</span>
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

            <div className="mt-4 flex flex-wrap gap-2">
              {(profile.grupos || []).map(g => (
                <span key={g} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  {g}
                </span>
              ))}
            </div>

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
          <section className={`${panelBase} p-4 space-y-3`}>
            <p className="section-label">Personalizar perfil</p>

            <EditInput label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
            <EditInput label="Instagram" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />
            <EditInput label="Ciudad" value={form.ciudad} onChange={v => setForm({ ...form, ciudad: v })} />
            <EditInput label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
            <EditInput label="Cumpleaños" type="date" value={form.fechaNacimiento} onChange={v => setForm({ ...form, fechaNacimiento: v })} />
            <EditInput label="PIN de ingreso" value={form.pin} onChange={v => setForm({ ...form, pin: v })} />

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

        {unread > 0 && (
          <section className="rounded-2xl bg-pr-gold/10 border border-pr-gold/20 p-4">
            <p className="text-pr-gold text-xs uppercase tracking-[0.18em] font-bold">Novedades</p>
            <p className="text-white mt-1 font-semibold">Tenés {unread} novedades</p>
            <p className="text-white/45 text-xs mt-1">Se muestran agrupadas para evitar avisos superpuestos en móvil.</p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3">
          <SummaryCard title="Última insignia" icon="🏅" main={lastBadge?.nombre} detail={lastBadge?.descripcion} />
          <SummaryCard title="Última observación" icon="📝" main={userObservations[0]?.titulo} detail={userObservations[0]?.descripcion} />
        </section>

        <Accordion title="Mis servicios PR" open={open === 'servicios'} onClick={() => setOpen(open === 'servicios' ? '' : 'servicios')}>
          <div className="grid grid-cols-1 gap-3">
            <ServiceState title="PR Card" active={profile.prcard?.activa} action="Abrir plataforma" href={profile.prcard?.link} />
            <ServiceState title="PR Tracking" active={profile.tracking?.activo} action="Ver información" href="/app/tracking" />
          </div>
        </Accordion>

        <Accordion title={`Insignias (${earned.length})`} open={open === 'insignias'} onClick={() => setOpen(open === 'insignias' ? '' : 'insignias')}>
          <div className="grid grid-cols-2 gap-3">
            {earned.map(badge => (
              <BadgeCard key={badge.id} badge={badge} professor={professorById[badge.otorgadaPor]} />
            ))}
          </div>

          <div className="mt-5">
            <p className="section-label mb-3">Próximas por desbloquear</p>
            <div className="space-y-2">
              {nextBadges.map(b => (
                <div key={b.id} className="rounded-2xl bg-black/25 border border-white/5 p-3 opacity-70">
                  <p className="text-white/65 text-sm">🔒 {b.nombre}</p>
                  <p className="text-white/35 text-xs mt-1">{b.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </Accordion>

        <Accordion title={`Eventos en los que participaste (${userParticipations.length})`} open={open === 'participaciones'} onClick={() => setOpen(open === 'participaciones' ? '' : 'participaciones')}>
          <div className="space-y-3">
            {userParticipations.map(p => <EventCard key={p.id} item={p} />)}
          </div>
        </Accordion>

        <Accordion title={`Observaciones de tus entrenadores (${userObservations.length})`} subtitle="Tu evolución" open={open === 'observaciones'} onClick={() => setOpen(open === 'observaciones' ? '' : 'observaciones')}>
          <div className="space-y-3">
            {userObservations.map(obs => (
              <ObservationCard key={obs.id} obs={obs} professor={professorById[obs.profesorId]} />
            ))}
          </div>
        </Accordion>

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

function initials(name = 'PR') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-3 text-center">
      <p className="text-pr-gold text-xl font-display font-bold">{value}</p>
      <p className="text-white/35 text-[10px] uppercase tracking-[0.18em]">{label}</p>
    </div>
  )
}

function SummaryCard({ icon, title, main, detail }) {
  return (
    <div className={`${panelBase} p-4`}>
      <p className="section-label">{icon} {title}</p>
      <p className="text-white font-semibold mt-2">{main || 'Sin registros todavía'}</p>
      <p className="text-white/45 text-xs mt-1 line-clamp-2">{detail || 'Cuando se agregue información, aparecerá acá.'}</p>
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

function BadgeCard({ badge, professor }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-pr-gold/20 to-black/20 border border-pr-gold/20 p-4 min-h-[150px]">
      <div className="w-12 h-12 rounded-2xl bg-pr-gold/15 border border-pr-gold/20 flex items-center justify-center text-2xl">{badge.emoji}</div>
      <p className="text-white font-semibold mt-3 leading-tight">{badge.nombre}</p>
      <p className="text-white/40 text-[11px] mt-1">{badge.descripcion}</p>
      <p className="text-emerald-400 text-[10px] mt-3">Ganada · {badge.fecha}</p>
      {professor && <p className="text-white/30 text-[10px] mt-1">Otorgada por {professor.nombre}</p>}
    </div>
  )
}

function EventCard({ item }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
      <div className="flex justify-between gap-3">
        <p className="text-white font-semibold">{item.nombre}</p>
        <span className="text-pr-gold text-[10px] uppercase">{item.tipo}</span>
      </div>
      <p className="text-white/35 text-xs mt-1">{item.fecha}</p>
      <p className="text-white/50 text-sm mt-2">{item.descripcion}</p>
    </div>
  )
}

function ObservationCard({ obs, professor }) {
  return (
    <div className="rounded-2xl bg-black/25 border border-white/5 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pr-gold/10 border border-pr-gold/20 flex items-center justify-center text-pr-gold text-xs font-bold">
          {professor?.iniciales || 'PR'}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{obs.titulo}</p>
          <p className="text-white/35 text-xs">{professor?.nombre} · {obs.tipo} · {obs.fecha}</p>
          <p className="text-white/55 text-sm mt-3">{obs.descripcion}</p>
        </div>
      </div>
    </div>
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
      <Link to={href} className="text-pr-gold text-xs">{action}</Link>
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
