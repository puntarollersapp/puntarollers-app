import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_AVATAR = {
  skin: '#D8A47F',
  hair: '#161616',
  hairStyle: 'crop',
  face: 'classic',
  top: 'pr-black',
  bottom: 'black',
  helmet: 'orange',
  protection: 'black',
  skateType: '4w',
  skateModel: 'fitness',
  skateColor: '#111111',
  wheelColor: '#FF6B1A',
  accent: '#FF6B1A',
}

const CATEGORIES = [
  { id: 'skin', icon: '🙂', label: 'Piel' },
  { id: 'hair', icon: '✂️', label: 'Pelo' },
  { id: 'face', icon: '😎', label: 'Cara' },
  { id: 'top', icon: '👕', label: 'Ropa' },
  { id: 'helmet', icon: '⛑️', label: 'Casco' },
  { id: 'protection', icon: '🛡️', label: 'Protección' },
  { id: 'skates', icon: '🛼', label: 'Patines' },
]

const SKINS = ['#F2D3BD', '#D8A47F', '#B9774C', '#8A5435', '#5D3829', '#3A241C']
const HAIRS = [
  { id: 'crop', label: 'Corto', emoji: '✦' },
  { id: 'wave', label: 'Ondas', emoji: '〰' },
  { id: 'long', label: 'Largo', emoji: '⌇' },
  { id: 'fade', label: 'Fade', emoji: '◢' },
  { id: 'bun', label: 'Rodete', emoji: '●' },
]
const HAIR_COLORS = ['#111111', '#4B2E20', '#8C5B32', '#D0A15D', '#B04A3B', '#D9D9D9']
const FACES = [
  { id: 'classic', label: 'Clásica', icon: '•ᴗ•' },
  { id: 'focus', label: 'Focus', icon: '•⌣•' },
  { id: 'happy', label: 'Happy', icon: '◕‿◕' },
  { id: 'cool', label: 'Cool', icon: '⌐■_■' },
]
const TOPS = [
  { id: 'pr-black', label: 'PR Black', color: '#0B0B0E', accent: '#F5C451' },
  { id: 'pr-red', label: 'PR Red', color: '#B91C1C', accent: '#FFFFFF' },
  { id: 'pr-blue', label: 'PR Blue', color: '#0F4C81', accent: '#FFFFFF' },
  { id: 'pr-pink', label: 'PR Pink', color: '#B83280', accent: '#FFFFFF' },
  { id: 'pr-white', label: 'PR White', color: '#F3F4F6', accent: '#111111' },
  { id: 'racing', label: 'Racing', color: '#121212', accent: '#FF6B1A' },
]
const HELMETS = [
  { id: 'orange', label: 'Orange', color: '#FF6B1A' },
  { id: 'black', label: 'Black', color: '#111111' },
  { id: 'white', label: 'White', color: '#F5F5F5' },
  { id: 'blue', label: 'Blue', color: '#2563EB' },
  { id: 'pink', label: 'Pink', color: '#EC4899' },
  { id: 'none', label: 'Sin casco', color: 'transparent' },
]
const PROTECTIONS = [
  { id: 'black', label: 'Black', color: '#111111' },
  { id: 'orange', label: 'Orange', color: '#FF6B1A' },
  { id: 'white', label: 'White', color: '#E5E7EB' },
  { id: 'none', label: 'Minimal', color: 'transparent' },
]
const SKATE_MODELS = [
  { id: 'fitness', type: '4w', label: 'Fitness 4', desc: 'Estable · clásico', wheels: 4 },
  { id: 'urban4', type: '4w', label: 'Urban 4', desc: 'Calle · maniobra', wheels: 4 },
  { id: 'speed4', type: '4w', label: 'Speed 4', desc: 'Bota baja · pista', wheels: 4 },
  { id: 'triskate', type: '3w', label: 'Tri Skate', desc: '3 ruedas · velocidad', wheels: 3 },
  { id: 'endurance3', type: '3w', label: 'Endurance 3', desc: 'Ruta · distancia', wheels: 3 },
  { id: 'speed3', type: '3w', label: 'Speed 3', desc: 'Bota baja · racing', wheels: 3 },
]

function savedUser() {
  try { return JSON.parse(localStorage.getItem('pr_user') || '{}') } catch { return {} }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function mergeAvatar(value) {
  return { ...DEFAULT_AVATAR, ...(value && typeof value === 'object' ? value : {}) }
}

function ColorDot({ color, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative h-14 rounded-[18px] border transition active:scale-[.97] ${
        selected ? 'border-orange-300/60 bg-orange-400/10' : 'border-white/[.08] bg-white/[.025]'
      }`}>
      <span className="mx-auto block h-8 w-8 rounded-full border border-white/10 shadow-inner" style={{ background: color }} />
      {selected && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-orange-400 text-[10px] font-black text-black">✓</span>}
    </button>
  )
}

export default function RollerAvatar() {
  const { user, updateUser } = useAuth()
  const base = { ...savedUser(), ...user }
  const profileId = base.id

  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const [category, setCategory] = useState('skin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({ km: 0, sessions: 0 })

  useEffect(() => {
    let alive = true
    async function load() {
      const [profileResponse, activityResponse] = await Promise.all([
        supabase.from('profiles').select('pr_avatar').eq('id', profileId).maybeSingle(),
        supabase.from('pr_activities')
          .select('distancia_metros')
          .eq('alumno_id', profileId)
          .eq('fuente', 'strava')
          .eq('eliminada', false)
          .limit(1000),
      ])

      if (!alive) return

      if (!profileResponse.error) {
        setAvatar(mergeAvatar(profileResponse.data?.pr_avatar))
      }

      if (!activityResponse.error) {
        const rows = activityResponse.data || []
        const km = rows.reduce((sum, row) => sum + (Number(row.distancia_metros) || 0) / 1000, 0)
        setStats({ km, sessions: rows.length })
      }

      setLoading(false)
    }
    if (profileId) load()
    return () => { alive = false }
  }, [profileId])

  const energy = useMemo(() => {
    const kmScore = Math.min(80, stats.km / 3)
    const sessionScore = Math.min(20, stats.sessions * 0.8)
    return clamp(kmScore + sessionScore)
  }, [stats])

  const level = useMemo(() => {
    if (stats.km >= 500) return 'Leyenda PR'
    if (stats.km >= 250) return 'Motor PR'
    if (stats.km >= 100) return 'Ritmo PR'
    if (stats.km >= 25) return 'En movimiento'
    return 'Primeras vueltas'
  }, [stats.km])

  async function save() {
    try {
      setSaving(true)
      setMessage('Guardando tu patinador…')
      const { error } = await supabase
        .from('profiles')
        .update({ pr_avatar: avatar, updated_at: new Date().toISOString() })
        .eq('id', profileId)

      if (error) throw error

      const next = { ...base, pr_avatar: avatar }
      localStorage.setItem('pr_user', JSON.stringify(next))
      updateUser?.({ pr_avatar: avatar })
      setMessage('✓ Tu patinador PR quedó guardado.')
    } catch (error) {
      setMessage(`No pudimos guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  function patch(value) {
    setAvatar((current) => ({ ...current, ...value }))
  }

  const selectedSkate = SKATE_MODELS.find((x) => x.id === avatar.skateModel) || SKATE_MODELS[0]

  return (
    <AppLayout title="Mi patinador">
      <div className="pr-page space-y-4 animate-page-enter pb-10">
        <section className="relative overflow-hidden rounded-[34px] border border-orange-300/20 bg-gradient-to-br from-[#261007] via-[#100d10] to-[#050508] shadow-[0_28px_90px_rgba(249,115,22,.12)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/14 blur-3xl" />

          <div className="relative flex items-center justify-between px-5 pt-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">PR Roller Avatar</p>
              <h1 className="mt-2 font-display text-[30px] leading-none text-white">Creá tu patinador.</h1>
              <p className="mt-2 text-[11px] text-white/35">Tu identidad sobre ruedas dentro de PR.</p>
            </div>
            <button type="button" disabled={saving} onClick={save}
              className="rounded-2xl bg-orange-400 px-4 py-3 text-xs font-black text-black shadow-[0_12px_30px_rgba(249,115,22,.22)] disabled:opacity-50">
              {saving ? 'Guardando…' : '✓ Guardar'}
            </button>
          </div>

          <div className="relative mt-4 min-h-[390px] overflow-hidden border-y border-white/[.06] bg-gradient-to-b from-orange-400/[.05] via-transparent to-black/20">
            {/* Energy lightning */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="absolute text-[240px] font-black leading-none transition-all duration-700"
                style={{
                  color: `rgba(255,107,26,${0.05 + energy / 600})`,
                  filter: `drop-shadow(0 0 ${12 + energy / 2}px rgba(255,107,26,${0.10 + energy / 350}))`,
                  transform: `scale(${0.92 + energy / 500}) rotate(-8deg)`
                }}
              >
                ⚡
              </div>
            </div>

            <div className="absolute left-4 top-5 z-10 rounded-2xl border border-orange-300/15 bg-black/35 px-3 py-2 backdrop-blur">
              <p className="text-[8px] font-black uppercase tracking-[.14em] text-orange-200/70">Energía PR</p>
              <p className="mt-1 font-display text-[24px] text-white">{Math.round(energy)}<span className="text-xs text-white/25">%</span></p>
            </div>

            <div className="absolute right-4 top-5 z-10 rounded-2xl border border-white/[.08] bg-black/35 px-3 py-2 text-right backdrop-blur">
              <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">{level}</p>
              <p className="mt-1 text-xs font-bold text-orange-200">{stats.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
            </div>

            <AvatarStage avatar={avatar} />

            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex items-center justify-between text-[9px] font-bold text-white/35">
                <span>⚡ Energía construida con tu Strava</span>
                <span>{stats.sessions} entrenos</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 transition-all duration-700"
                  style={{ width: `${Math.max(4, energy)}%` }} />
              </div>
            </div>
          </div>

          <div className="relative p-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((item) => (
                <button key={item.id} type="button" onClick={() => setCategory(item.id)}
                  className={`min-w-[70px] rounded-[18px] border px-3 py-3 text-center transition active:scale-[.97] ${
                    category === item.id
                      ? 'border-orange-300/30 bg-orange-400/12 text-white'
                      : 'border-white/[.07] bg-white/[.025] text-white/38'
                  }`}>
                  <span className="block text-xl">{item.icon}</span>
                  <span className="mt-1 block text-[8px] font-black uppercase tracking-[.08em]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/[.08] bg-[#0d0d12] p-4">
          <Editor category={category} avatar={avatar} patch={patch} />
        </section>

        <section className="rounded-[28px] border border-orange-300/15 bg-gradient-to-br from-orange-500/[.08] to-white/[.02] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-400/10 text-xl">⚡</div>
            <div>
              <p className="text-sm font-black text-white">Tu avatar también entrena.</p>
              <p className="mt-1 text-[11px] leading-5 text-white/38">
                El rayo y la barra de Energía PR crecen con tu historial real sincronizado desde Strava. Más kilómetros y constancia = más energía visual.
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-[22px] border border-orange-300/15 bg-orange-400/[.08] p-4 text-sm text-orange-100/70">{message}</div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link to="/app/perfil" className="rounded-2xl border border-white/[.08] bg-white/[.03] py-4 text-center text-xs font-bold text-white/55">
            Volver al perfil
          </Link>
          <button type="button" disabled={saving} onClick={save}
            className="rounded-2xl bg-orange-400 py-4 text-xs font-black text-black disabled:opacity-50">
            Guardar patinador
          </button>
        </div>

        {loading && <p className="text-center text-xs text-white/25">Preparando tu vestuario PR…</p>}
      </div>
    </AppLayout>
  )
}

function Editor({ category, avatar, patch }) {
  if (category === 'skin') {
    return <EditorShell title="Tono de piel" subtitle="Elegí el que mejor te represente.">
      <div className="grid grid-cols-3 gap-2">{SKINS.map((color) =>
        <ColorDot key={color} color={color} selected={avatar.skin === color} onClick={() => patch({ skin: color })} />
      )}</div>
    </EditorShell>
  }

  if (category === 'hair') {
    return <EditorShell title="Pelo" subtitle="Estilo y color por separado.">
      <div className="grid grid-cols-3 gap-2">
        {HAIRS.map((item) => <Choice key={item.id} active={avatar.hairStyle === item.id} onClick={() => patch({ hairStyle: item.id })} icon={item.emoji} label={item.label} />)}
      </div>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[.14em] text-white/25">Color</p>
      <div className="mt-2 grid grid-cols-3 gap-2">{HAIR_COLORS.map((color) =>
        <ColorDot key={color} color={color} selected={avatar.hair === color} onClick={() => patch({ hair: color })} />
      )}</div>
    </EditorShell>
  }

  if (category === 'face') {
    return <EditorShell title="Expresión" subtitle="Que tenga actitud PR.">
      <div className="grid grid-cols-2 gap-2">
        {FACES.map((item) => <Choice key={item.id} active={avatar.face === item.id} onClick={() => patch({ face: item.id })} icon={item.icon} label={item.label} />)}
      </div>
    </EditorShell>
  }

  if (category === 'top') {
    return <EditorShell title="Ropa PR" subtitle="Versiones inspiradas en nuestra identidad.">
      <div className="grid grid-cols-2 gap-2">
        {TOPS.map((item) => (
          <button key={item.id} type="button" onClick={() => patch({ top: item.id })}
            className={`rounded-[20px] border p-3 text-left ${avatar.top === item.id ? 'border-orange-300/35 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
            <div className="h-14 rounded-2xl border border-white/[.06]" style={{ background: item.color }}>
              <div className="mx-auto mt-5 h-1.5 w-10 rounded-full" style={{ background: item.accent }} />
            </div>
            <p className="mt-2 text-xs font-bold text-white">{item.label}</p>
          </button>
        ))}
      </div>
    </EditorShell>
  }

  if (category === 'helmet') {
    return <EditorShell title="Casco" subtitle="Protección también puede tener estilo.">
      <div className="grid grid-cols-3 gap-2">
        {HELMETS.map((item) => <Choice key={item.id} active={avatar.helmet === item.id} onClick={() => patch({ helmet: item.id })} icon="⛑️" label={item.label} swatch={item.color} />)}
      </div>
    </EditorShell>
  }

  if (category === 'protection') {
    return <EditorShell title="Protecciones" subtitle="Muñequeras y rodilleras del look.">
      <div className="grid grid-cols-2 gap-2">
        {PROTECTIONS.map((item) => <Choice key={item.id} active={avatar.protection === item.id} onClick={() => patch({ protection: item.id })} icon="🛡️" label={item.label} swatch={item.color} />)}
      </div>
    </EditorShell>
  }

  return <EditorShell title="Patines" subtitle="Nada de zapatillas: 3 ruedas, 4 ruedas y distintos estilos.">
    <div className="mb-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => {
        const first = SKATE_MODELS.find((x) => x.type === '3w')
        patch({ skateType: '3w', skateModel: first.id })
      }} className={`rounded-[20px] border p-4 ${avatar.skateType === '3w' ? 'border-orange-300/35 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
        <p className="font-display text-3xl text-white">3</p><p className="text-[9px] uppercase text-white/35">ruedas</p>
      </button>
      <button type="button" onClick={() => {
        const first = SKATE_MODELS.find((x) => x.type === '4w')
        patch({ skateType: '4w', skateModel: first.id })
      }} className={`rounded-[20px] border p-4 ${avatar.skateType === '4w' ? 'border-orange-300/35 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
        <p className="font-display text-3xl text-white">4</p><p className="text-[9px] uppercase text-white/35">ruedas</p>
      </button>
    </div>

    <div className="space-y-2">
      {SKATE_MODELS.filter((x) => x.type === avatar.skateType).map((item) => (
        <button key={item.id} type="button" onClick={() => patch({ skateModel: item.id })}
          className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left ${avatar.skateModel === item.id ? 'border-orange-300/35 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
          <MiniSkate wheels={item.wheels} boot={avatar.skateColor} wheel={avatar.wheelColor} />
          <div>
            <p className="text-sm font-bold text-white">{item.label}</p>
            <p className="mt-0.5 text-[10px] text-white/30">{item.desc}</p>
          </div>
          {avatar.skateModel === item.id && <span className="ml-auto text-orange-300">✓</span>}
        </button>
      ))}
    </div>

    <p className="mt-5 text-[9px] font-black uppercase tracking-[.14em] text-white/25">Color de bota</p>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {['#111111','#F3F4F6','#B91C1C','#2563EB','#EC4899','#FF6B1A'].map((color) =>
        <ColorDot key={color} color={color} selected={avatar.skateColor === color} onClick={() => patch({ skateColor: color })} />
      )}
    </div>

    <p className="mt-5 text-[9px] font-black uppercase tracking-[.14em] text-white/25">Color de ruedas</p>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {['#FF6B1A','#FACC15','#F3F4F6','#22C55E','#3B82F6','#EC4899'].map((color) =>
        <ColorDot key={color} color={color} selected={avatar.wheelColor === color} onClick={() => patch({ wheelColor: color })} />
      )}
    </div>
  </EditorShell>
}

function EditorShell({ title, subtitle, children }) {
  return <>
    <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">Personalización</p>
    <h2 className="mt-2 font-display text-[27px] text-white">{title}</h2>
    <p className="mt-1 text-[11px] text-white/34">{subtitle}</p>
    <div className="mt-4">{children}</div>
  </>
}

function Choice({ active, onClick, icon, label, swatch }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative min-h-[78px] rounded-[20px] border p-3 text-center transition active:scale-[.97] ${
        active ? 'border-orange-300/40 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'
      }`}>
      <span className="text-xl" style={swatch ? { color: swatch } : {}}>{icon}</span>
      <p className="mt-2 text-[10px] font-bold text-white/70">{label}</p>
      {active && <span className="absolute right-2 top-2 text-orange-300">✓</span>}
    </button>
  )
}

function AvatarStage({ avatar }) {
  const top = TOPS.find((x) => x.id === avatar.top) || TOPS[0]
  const helmet = HELMETS.find((x) => x.id === avatar.helmet) || HELMETS[0]
  const protection = PROTECTIONS.find((x) => x.id === avatar.protection) || PROTECTIONS[0]
  const skate = SKATE_MODELS.find((x) => x.id === avatar.skateModel) || SKATE_MODELS[0]

  return (
    <div className="absolute inset-0 flex items-center justify-center pt-7">
      <div className="relative h-[320px] w-[220px]">
        <div className="absolute bottom-7 left-1/2 h-8 w-[180px] -translate-x-1/2 rounded-[50%] border border-orange-300/15 bg-orange-400/[.08] blur-[1px]" />
        <div className="absolute bottom-9 left-1/2 h-4 w-[150px] -translate-x-1/2 rounded-[50%] bg-black/55 shadow-[0_0_45px_rgba(249,115,22,.25)]" />

        {/* Head */}
        <div className="absolute left-1/2 top-8 h-[104px] w-[94px] -translate-x-1/2 rounded-[44%_44%_48%_48%] border border-black/10 shadow-[inset_0_-10px_18px_rgba(0,0,0,.08)]"
          style={{ background: avatar.skin }}>
          <Hair styleId={avatar.hairStyle} color={avatar.hair} />
          {avatar.helmet !== 'none' && (
            <div className="absolute -left-2 -right-2 -top-6 h-12 rounded-[45px_45px_18px_18px] border border-black/20 shadow-lg"
              style={{ background: helmet.color }} />
          )}
          <Face id={avatar.face} />
        </div>

        {/* Neck */}
        <div className="absolute left-1/2 top-[117px] h-7 w-8 -translate-x-1/2 rounded-b-xl" style={{ background: avatar.skin }} />

        {/* Body */}
        <div className="absolute left-1/2 top-[130px] h-[94px] w-[104px] -translate-x-1/2 rounded-[28px_28px_18px_18px] border border-black/15 shadow-xl"
          style={{ background: top.color }}>
          <div className="absolute left-1/2 top-5 h-1.5 w-12 -translate-x-1/2 rounded-full" style={{ background: top.accent }} />
          <div className="absolute left-1/2 top-9 -translate-x-1/2 text-[11px] font-black tracking-[.18em]" style={{ color: top.accent }}>PR</div>
        </div>

        {/* Arms */}
        <div className="absolute left-[40px] top-[145px] h-[82px] w-8 rotate-[7deg] rounded-full border border-black/10" style={{ background: avatar.skin }} />
        <div className="absolute right-[40px] top-[145px] h-[82px] w-8 -rotate-[7deg] rounded-full border border-black/10" style={{ background: avatar.skin }} />

        {avatar.protection !== 'none' && <>
          <div className="absolute left-[36px] top-[185px] h-6 w-10 rotate-[7deg] rounded-xl border border-black/20" style={{ background: protection.color }} />
          <div className="absolute right-[36px] top-[185px] h-6 w-10 -rotate-[7deg] rounded-xl border border-black/20" style={{ background: protection.color }} />
        </>}

        {/* legs */}
        <div className="absolute left-[72px] top-[214px] h-[60px] w-8 rounded-b-2xl bg-[#15151a]" />
        <div className="absolute right-[72px] top-[214px] h-[60px] w-8 rounded-b-2xl bg-[#15151a]" />

        {/* skates */}
        <div className="absolute bottom-[25px] left-[34px]"><MiniSkate wheels={skate.wheels} boot={avatar.skateColor} wheel={avatar.wheelColor} large /></div>
        <div className="absolute bottom-[25px] right-[34px] scale-x-[-1]"><MiniSkate wheels={skate.wheels} boot={avatar.skateColor} wheel={avatar.wheelColor} large /></div>
      </div>
    </div>
  )
}

function Hair({ styleId, color }) {
  if (styleId === 'bun') return <>
    <div className="absolute left-1/2 -top-5 h-9 w-9 -translate-x-1/2 rounded-full" style={{ background: color }} />
    <div className="absolute -left-1 -right-1 -top-3 h-10 rounded-[45px_45px_16px_16px]" style={{ background: color }} />
  </>
  if (styleId === 'long') return <div className="absolute -left-3 -right-3 -top-3 h-[92px] rounded-[46px_46px_28px_28px]" style={{ background: color, zIndex: -1 }} />
  if (styleId === 'wave') return <div className="absolute -left-2 -right-2 -top-5 h-12 rounded-[45px_45px_20px_20px]" style={{ background: color, clipPath: 'polygon(0 30%,15% 5%,30% 22%,45% 0,60% 18%,78% 4%,100% 30%,100% 100%,0 100%)' }} />
  if (styleId === 'fade') return <div className="absolute left-1/2 -top-3 h-8 w-[76px] -translate-x-1/2 rounded-[40px_40px_12px_12px]" style={{ background: color }} />
  return <div className="absolute -left-1 -right-1 -top-3 h-9 rounded-[45px_45px_14px_14px]" style={{ background: color }} />
}

function Face({ id }) {
  const face = FACES.find((x) => x.id === id)?.icon || '•ᴗ•'
  return <div className="absolute inset-x-0 top-[46px] text-center text-[18px] font-black tracking-[.08em] text-[#1b1716]">{face}</div>
}

function MiniSkate({ wheels = 4, boot = '#111', wheel = '#FF6B1A', large = false }) {
  const width = large ? 58 : 48
  return (
    <div className="relative" style={{ width, height: large ? 42 : 36 }}>
      <div className="absolute left-0 top-0 h-6 w-[70%] rounded-[14px_18px_7px_7px] border border-black/20"
        style={{ background: boot }} />
      <div className="absolute left-[18%] top-[19px] h-1.5 w-[72%] rounded-full bg-[#777]" />
      <div className="absolute left-[15%] top-[23px] flex w-[78%] justify-between">
        {Array.from({ length: wheels }).map((_, i) => (
          <span key={i} className={`${large ? 'h-3.5 w-3.5' : 'h-3 w-3'} rounded-full border border-black/30`} style={{ background: wheel }} />
        ))}
      </div>
    </div>
  )
                                            }
