import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_AVATAR = {
  skin: '#D7A17D',
  hair: '#171310',
  hairStyle: 'texture',
  face: 'soft',
  top: 'pr-black',
  bottom: 'black',
  helmet: 'orange',
  protection: 'black',
  skateType: '4w',
  skateModel: 'fitness',
  skateColor: '#17181D',
  wheelColor: '#FF6B1A',
}

const SKINS = ['#F4D5C0', '#E9BC9A', '#D7A17D', '#B97854', '#8A563D', '#5A392D']
const HAIR_COLORS = ['#15110F', '#3A241A', '#70432A', '#B57B45', '#C3A06C', '#D9D9D9']

const HAIRS = [
  { id: 'texture', label: 'Textura' },
  { id: 'crop', label: 'Corto' },
  { id: 'wave', label: 'Ondas' },
  { id: 'fade', label: 'Fade' },
  { id: 'long', label: 'Largo' },
  { id: 'bun', label: 'Rodete' },
]

const FACES = [
  { id: 'soft', label: 'Relax' },
  { id: 'focus', label: 'Focus' },
  { id: 'smile', label: 'Sonrisa' },
  { id: 'cool', label: 'Cool' },
]

const TOPS = [
  { id: 'pr-black', label: 'PR Black', body: '#101116', detail: '#E9B949' },
  { id: 'racing', label: 'Racing', body: '#141416', detail: '#FF6B1A' },
  { id: 'pr-red', label: 'PR Red', body: '#A91D24', detail: '#FFFFFF' },
  { id: 'pr-blue', label: 'PR Blue', body: '#175D8D', detail: '#FFFFFF' },
  { id: 'pr-pink', label: 'PR Pink', body: '#A73472', detail: '#FFFFFF' },
  { id: 'pr-white', label: 'PR White', body: '#EFEFEF', detail: '#171717' },
]

const HELMETS = [
  { id: 'orange', label: 'PR Orange', color: '#FF6B1A' },
  { id: 'black', label: 'Carbon', color: '#15171A' },
  { id: 'white', label: 'Ice', color: '#F1F1F1' },
  { id: 'blue', label: 'Electric', color: '#2563EB' },
  { id: 'pink', label: 'Pink', color: '#D9468A' },
  { id: 'none', label: 'Sin casco', color: 'transparent' },
]

const PROTECTIONS = [
  { id: 'black', label: 'Carbon', color: '#16181C' },
  { id: 'orange', label: 'Orange', color: '#FF6B1A' },
  { id: 'white', label: 'Ice', color: '#ECECEC' },
  { id: 'none', label: 'Minimal', color: 'transparent' },
]

const SKATES = [
  { id: 'fitness', type: '4w', label: 'Fitness 4', desc: 'Bota alta · control', wheels: 4, low: false },
  { id: 'urban4', type: '4w', label: 'Urban 4', desc: 'Calle · maniobra', wheels: 4, low: false },
  { id: 'speed4', type: '4w', label: 'Speed 4', desc: 'Bota baja · pista', wheels: 4, low: true },
  { id: 'triskate', type: '3w', label: 'Tri Skate', desc: '3 ruedas · versátil', wheels: 3, low: false },
  { id: 'endurance3', type: '3w', label: 'Endurance 3', desc: 'Ruta · distancia', wheels: 3, low: false },
  { id: 'speed3', type: '3w', label: 'Speed 3', desc: 'Bota baja · racing', wheels: 3, low: true },
]

const CATEGORIES = [
  { id: 'skin', label: 'Piel' },
  { id: 'hair', label: 'Pelo' },
  { id: 'face', label: 'Rostro' },
  { id: 'top', label: 'Ropa' },
  { id: 'helmet', label: 'Casco' },
  { id: 'protection', label: 'Protección' },
  { id: 'skates', label: 'Patines' },
]

function savedUser() {
  try { return JSON.parse(localStorage.getItem('pr_user') || '{}') } catch { return {} }
}

function mergeAvatar(value) {
  return { ...DEFAULT_AVATAR, ...(value && typeof value === 'object' ? value : {}) }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

export default function RollerAvatar() {
  const { user, updateUser } = useAuth()
  const base = { ...savedUser(), ...user }
  const profileId = base.id

  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const [category, setCategory] = useState('skin')
  const [stats, setStats] = useState({ km: 0, sessions: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

      if (!profileResponse.error) setAvatar(mergeAvatar(profileResponse.data?.pr_avatar))

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

  const energy = useMemo(() => clamp(Math.min(82, stats.km / 3) + Math.min(18, stats.sessions * .8)), [stats])
  const level = useMemo(() => {
    if (stats.km >= 500) return 'Leyenda PR'
    if (stats.km >= 250) return 'Motor PR'
    if (stats.km >= 100) return 'Ritmo PR'
    if (stats.km >= 25) return 'En movimiento'
    return 'Primeras vueltas'
  }, [stats.km])

  function patch(next) {
    setAvatar((current) => ({ ...current, ...next }))
  }

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

  return (
    <AppLayout title="Mi patinador">
      <div className="pr-page space-y-4 animate-page-enter pb-9">
        <section className="relative overflow-hidden rounded-[32px] border border-orange-300/20 bg-[#09090d] shadow-[0_28px_90px_rgba(0,0,0,.42)]">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_75%_0%,rgba(249,115,22,.17),transparent_60%)]" />

          <div className="relative flex items-start justify-between gap-4 p-5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,.9)]" />
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">PR Roller Identity</p>
              </div>
              <h1 className="mt-3 font-display text-[34px] leading-[.95] text-white">Tu versión<br/>sobre ruedas.</h1>
              <p className="mt-2 text-[11px] leading-5 text-white/38">Personal, deportiva y conectada con tus kilómetros.</p>
            </div>

            <button type="button" disabled={saving} onClick={save}
              className="rounded-2xl bg-orange-400 px-4 py-3 text-xs font-black text-black shadow-[0_12px_28px_rgba(249,115,22,.22)] disabled:opacity-50">
              {saving ? '…' : 'Guardar'}
            </button>
          </div>

          <div className="relative min-h-[500px] overflow-hidden border-y border-white/[.06] bg-gradient-to-b from-[#121015] via-[#0a0a0e] to-[#07070a]">
            <EnergyBackdrop energy={energy} />

            <div className="absolute left-4 top-4 z-20 rounded-[18px] border border-white/[.08] bg-black/40 px-3 py-2.5 backdrop-blur-md">
              <p className="text-[7px] font-black uppercase tracking-[.15em] text-white/30">Energía PR</p>
              <p className="mt-1 font-display text-[27px] leading-none text-white">{Math.round(energy)}<span className="text-xs text-white/25">%</span></p>
            </div>

            <div className="absolute right-4 top-4 z-20 rounded-[18px] border border-orange-300/15 bg-black/40 px-3 py-2.5 text-right backdrop-blur-md">
              <p className="text-[7px] font-black uppercase tracking-[.15em] text-orange-200/60">{level}</p>
              <p className="mt-1 text-xs font-black text-orange-200">{stats.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
            </div>

            <PremiumAvatar avatar={avatar} />

            <div className="absolute bottom-4 left-4 right-4 z-20 rounded-[18px] border border-white/[.07] bg-black/40 px-3 py-3 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-bold text-white/43">Energía vinculada a tu Strava</p>
                <p className="text-[9px] font-black text-orange-200">{stats.sessions} entrenos</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.07]">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 transition-all duration-700" style={{ width: `${Math.max(4, energy)}%` }} />
              </div>
            </div>
          </div>

          <div className="relative p-3">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((item) => (
                <button key={item.id} type="button" onClick={() => setCategory(item.id)}
                  className={`min-w-[78px] rounded-[17px] border px-3 py-2.5 text-left transition ${
                    category === item.id
                      ? 'border-orange-300/30 bg-orange-400/10'
                      : 'border-transparent bg-white/[.025]'
                  }`}>
                  <CategoryGlyph type={item.id} active={category === item.id} />
                  <p className={`mt-2 text-[8px] font-black uppercase tracking-[.08em] ${category === item.id ? 'text-orange-200' : 'text-white/35'}`}>
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[29px] border border-white/[.08] bg-[#0d0d12] p-4">
          <Editor category={category} avatar={avatar} patch={patch} />
        </section>

        <section className="rounded-[26px] border border-orange-300/12 bg-orange-400/[.05] p-4">
          <p className="text-[9px] font-black uppercase tracking-[.17em] text-orange-300">⚡ No es decorativo</p>
          <p className="mt-2 text-sm font-bold text-white">Tu identidad también refleja tu constancia.</p>
          <p className="mt-1 text-[11px] leading-5 text-white/38">
            El rayo y la Energía PR crecen con el historial real de entrenamientos y kilómetros que sincronizás desde Strava.
          </p>
        </section>

        {message && <div className="rounded-[20px] border border-orange-300/15 bg-orange-400/[.07] p-3 text-xs text-orange-100/65">{message}</div>}

        <div className="grid grid-cols-2 gap-2">
          <Link to="/app/perfil" className="rounded-2xl border border-white/[.08] bg-white/[.03] py-4 text-center text-xs font-bold text-white/55">Volver</Link>
          <button type="button" disabled={saving} onClick={save} className="rounded-2xl bg-orange-400 py-4 text-xs font-black text-black disabled:opacity-50">Guardar patinador</button>
        </div>

        {loading && <p className="text-center text-xs text-white/25">Cargando tu identidad PR…</p>}
      </div>
    </AppLayout>
  )
}

function EnergyBackdrop({ energy }) {
  return (
    <svg viewBox="0 0 360 500" className="absolute inset-0 h-full w-full opacity-90" aria-hidden="true">
      <defs>
        <linearGradient id="bolt" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FF9B45" stopOpacity={0.13 + energy / 600} />
          <stop offset=".5" stopColor="#FF6B1A" stopOpacity={0.05 + energy / 550} />
          <stop offset="1" stopColor="#FACC15" stopOpacity={0.02 + energy / 700} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation={4 + energy / 18} result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M236 28 118 257h83l-67 213 137-255h-86z" fill="url(#bolt)" filter="url(#glow)" />
      <ellipse cx="180" cy="445" rx="118" ry="19" fill="#FF6B1A" opacity=".05" />
    </svg>
  )
}

function PremiumAvatar({ avatar }) {
  const top = TOPS.find((x) => x.id === avatar.top) || TOPS[0]
  const helmet = HELMETS.find((x) => x.id === avatar.helmet) || HELMETS[0]
  const protection = PROTECTIONS.find((x) => x.id === avatar.protection) || PROTECTIONS[0]
  const skate = SKATES.find((x) => x.id === avatar.skateModel) || SKATES[0]

  return (
    <svg viewBox="0 0 320 500" className="absolute inset-x-0 bottom-8 z-10 mx-auto h-[455px] w-[300px]" aria-label="Vista previa de tu patinador PR">
      <defs>
        <linearGradient id="skinShade" x1="0" x2="1">
          <stop offset="0" stopColor={avatar.skin} />
          <stop offset=".55" stopColor={avatar.skin} />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id="jerseyShade" x1="0" x2="1">
          <stop offset="0" stopColor={top.body} />
          <stop offset=".7" stopColor={top.body} />
          <stop offset="1" stopColor="#000" stopOpacity=".24" />
        </linearGradient>
        <filter id="softShadow"><feDropShadow dx="0" dy="8" stdDeviation="9" floodOpacity=".32"/></filter>
      </defs>

      <ellipse cx="160" cy="462" rx="104" ry="17" fill="#000" opacity=".45" />
      <ellipse cx="160" cy="458" rx="78" ry="9" fill="#FF6B1A" opacity=".08" />

      {/* back hair */}
      {avatar.hairStyle === 'long' && <path d="M104 111c3-57 111-60 115 0l-7 110-43-25-52 26z" fill={avatar.hair} opacity=".98" />}
      {avatar.hairStyle === 'bun' && <circle cx="160" cy="55" r="25" fill={avatar.hair} />}

      {/* neck */}
      <path d="M143 174h34v45h-34z" fill="url(#skinShade)" />

      {/* legs: slightly dynamic stance */}
      <path d="M119 322c10-7 29-6 41 0l-9 107-37-2z" fill="#18191D" filter="url(#softShadow)" />
      <path d="M164 322c11-6 30-6 41 2l11 101-38 5z" fill="#15161A" filter="url(#softShadow)" />

      {/* torso - tapered athletic */}
      <path d="M111 211c12-20 86-22 100 0l18 111c-30 17-105 17-137 0z" fill="url(#jerseyShade)" stroke="rgba(255,255,255,.09)" />
      <path d="M118 224c28 10 57 11 87 0" fill="none" stroke={top.detail} strokeWidth="5" strokeLinecap="round" opacity=".95"/>
      <text x="160" y="267" textAnchor="middle" fill={top.detail} fontSize="22" fontWeight="900" letterSpacing="3">PR</text>
      <path d="M105 310c35 10 75 10 113 0" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="3"/>

      {/* arms organic */}
      <path d="M111 225c-21 11-31 37-39 68-5 19 1 43 16 52 12 7 25 0 28-14l13-92z" fill="url(#skinShade)" stroke="rgba(0,0,0,.12)" />
      <path d="M208 225c22 9 34 35 42 66 5 20 0 43-15 52-12 8-25 1-29-13l-15-90z" fill="url(#skinShade)" stroke="rgba(0,0,0,.12)" />

      {/* elbow / wrist protection */}
      {avatar.protection !== 'none' && <>
        <path d="M76 294c10-5 28-1 37 8l-4 25c-10 7-27 6-37-2z" fill={protection.color} stroke="rgba(255,255,255,.12)" />
        <path d="M210 300c10-8 27-12 38-7l6 29c-10 9-27 11-38 4z" fill={protection.color} stroke="rgba(255,255,255,.12)" />
      </>}

      {/* head - smaller, more adult proportions */}
      <path d="M111 105c0-50 98-50 98 0v31c0 42-20 65-49 65s-49-23-49-65z" fill="url(#skinShade)" stroke="rgba(0,0,0,.12)" />

      <HairSvg id={avatar.hairStyle} color={avatar.hair} />

      {/* helmet shell, actual shape */}
      {avatar.helmet !== 'none' && <>
        <path d="M105 110c-1-61 111-66 111 2l-9 12c-31-9-62-10-94 0z" fill={helmet.color} stroke="rgba(0,0,0,.22)" strokeWidth="2" filter="url(#softShadow)" />
        <path d="M116 93c24-16 54-18 82-5" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="5" strokeLinecap="round" />
        <path d="M207 119c8 11 11 23 9 37" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
      </>}

      <FaceSvg id={avatar.face} />

      {/* skates */}
      <g transform="translate(82 411) rotate(-3)">
        <SkateSvg wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor} />
      </g>
      <g transform="translate(167 414) rotate(3)">
        <SkateSvg wheels={skate.wheels} low={skate.low} boot={avatar.skateColor} wheel={avatar.wheelColor} />
      </g>
    </svg>
  )
}

function HairSvg({ id, color }) {
  if (id === 'long') return <path d="M110 111c5-48 95-56 99-5-17-19-37-23-59-20-14 2-27 8-40 25z" fill={color} />
  if (id === 'bun') return <path d="M109 110c8-46 91-51 101-5-20-18-42-21-62-17-14 3-26 9-39 22z" fill={color} />
  if (id === 'wave') return <path d="M107 111c4-47 103-55 107-3-10-12-19-22-33-14-10 6-19-12-32-4-11 6-22-4-42 21z" fill={color} />
  if (id === 'fade') return <path d="M116 99c12-32 76-34 88-1-26-11-61-11-88 1z" fill={color} />
  if (id === 'crop') return <path d="M109 106c8-39 94-45 103-3-30-13-73-13-103 3z" fill={color} />
  return <path d="M108 110c4-43 98-51 105-5-17-16-30-6-43-15-12 13-26 1-62 20z" fill={color} />
}

function FaceSvg({ id }) {
  const smile = id === 'focus' ? 'M148 157c8 2 16 2 24 0' : id === 'cool' ? 'M149 157c7 5 15 5 22 0' : 'M147 155c8 9 18 9 26 0'
  return <>
    {id === 'cool' ? <>
      <path d="M126 131h27l-4 15h-18zM167 131h27l-5 15h-18z" fill="#171717" />
      <path d="M153 135h14" stroke="#171717" strokeWidth="3" />
    </> : <>
      <ellipse cx="139" cy="137" rx="5.5" ry={id === 'focus' ? 4 : 6} fill="#211C1A" />
      <ellipse cx="181" cy="137" rx="5.5" ry={id === 'focus' ? 4 : 6} fill="#211C1A" />
      <circle cx="137" cy="135" r="1.5" fill="#fff" opacity=".8" />
      <circle cx="179" cy="135" r="1.5" fill="#fff" opacity=".8" />
    </>}
    <path d={smile} fill="none" stroke="#211C1A" strokeWidth="3.5" strokeLinecap="round" />
  </>
}

function SkateSvg({ wheels, low, boot, wheel }) {
  const positions = wheels === 3 ? [12, 35, 58] : [8, 25, 42, 59]
  return (
    <g>
      <path d={low ? 'M3 18 10 3h35l19 15-7 18H5z' : 'M3 30 8 0h31l8 16 18 10-8 16H8z'}
        fill={boot} stroke="rgba(255,255,255,.18)" strokeWidth="1.5" />
      <path d="M11 19h32" stroke="#fff" strokeOpacity=".36" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 43h60" stroke="#8A8A8A" strokeWidth="4" strokeLinecap="round"/>
      {positions.map((x) => <g key={x}>
        <circle cx={x} cy="51" r={wheels === 3 ? 9 : 7.5} fill={wheel} stroke="#111" strokeWidth="1.5"/>
        <circle cx={x} cy="51" r="2.2" fill="#303030"/>
      </g>)}
    </g>
  )
}

function CategoryGlyph({ type, active }) {
  const stroke = active ? '#FDBA74' : 'rgba(255,255,255,.42)'
  return (
    <svg viewBox="0 0 32 24" className="h-6 w-8" aria-hidden="true">
      {type === 'skin' && <><circle cx="16" cy="9" r="6" fill="none" stroke={stroke} strokeWidth="1.7"/><path d="M8 23c1-6 15-6 16 0" fill="none" stroke={stroke} strokeWidth="1.7"/></>}
      {type === 'hair' && <path d="M7 14c0-12 18-13 18 0-5-6-12-5-18 0z" fill="none" stroke={stroke} strokeWidth="1.7"/>}
      {type === 'face' && <><circle cx="16" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="1.7"/><circle cx="13" cy="10" r="1" fill={stroke}/><circle cx="19" cy="10" r="1" fill={stroke}/><path d="M13 15c2 2 4 2 6 0" fill="none" stroke={stroke} strokeWidth="1.4"/></>}
      {type === 'top' && <path d="M8 5 13 2h6l5 3 5 7-5 3v8H8v-8l-5-3z" fill="none" stroke={stroke} strokeWidth="1.7"/>}
      {type === 'helmet' && <><path d="M5 15c0-14 22-14 22 0H5z" fill="none" stroke={stroke} strokeWidth="1.7"/><path d="M24 15c2 2 3 4 2 7" fill="none" stroke={stroke} strokeWidth="1.7"/></>}
      {type === 'protection' && <path d="M16 2 27 6v7c0 6-5 9-11 11C10 22 5 19 5 13V6z" fill="none" stroke={stroke} strokeWidth="1.7"/>}
      {type === 'skates' && <><path d="M3 12 8 4h10l4 6 7 3-3 6H5z" fill="none" stroke={stroke} strokeWidth="1.7"/><circle cx="9" cy="21" r="2" fill={stroke}/><circle cx="17" cy="21" r="2" fill={stroke}/><circle cx="25" cy="21" r="2" fill={stroke}/></>}
    </svg>
  )
}

function Editor({ category, avatar, patch }) {
  if (category === 'skin') return <EditorShell eyebrow="Identidad" title="Tono de piel" text="Elegí el que mejor te represente.">
    <div className="grid grid-cols-3 gap-2">{SKINS.map((color) =>
      <ColorChoice key={color} color={color} active={avatar.skin === color} onClick={() => patch({ skin: color })} />
    )}</div>
  </EditorShell>

  if (category === 'hair') return <EditorShell eyebrow="Estilo" title="Pelo" text="Forma y color se editan por separado.">
    <div className="grid grid-cols-3 gap-2">{HAIRS.map((item) =>
      <HairChoice key={item.id} item={item} color={avatar.hair} active={avatar.hairStyle === item.id} onClick={() => patch({ hairStyle: item.id })} />
    )}</div>
    <SubLabel>Color</SubLabel>
    <div className="grid grid-cols-3 gap-2">{HAIR_COLORS.map((color) =>
      <ColorChoice key={color} color={color} active={avatar.hair === color} onClick={() => patch({ hair: color })} />
    )}</div>
  </EditorShell>

  if (category === 'face') return <EditorShell eyebrow="Actitud" title="Rostro" text="Sutil, no caricatura infantil.">
    <div className="grid grid-cols-2 gap-2">{FACES.map((item) =>
      <FaceChoice key={item.id} item={item} active={avatar.face === item.id} onClick={() => patch({ face: item.id })} />
    )}</div>
  </EditorShell>

  if (category === 'top') return <EditorShell eyebrow="Punta Rollers" title="Ropa" text="Looks inspirados en la identidad PR.">
    <div className="grid grid-cols-2 gap-2">{TOPS.map((item) =>
      <TopChoice key={item.id} item={item} active={avatar.top === item.id} onClick={() => patch({ top: item.id })} />
    )}</div>
  </EditorShell>

  if (category === 'helmet') return <EditorShell eyebrow="Protección" title="Casco" text="Ahora sí: silueta real de casco deportivo.">
    <div className="grid grid-cols-3 gap-2">{HELMETS.map((item) =>
      <HelmetChoice key={item.id} item={item} active={avatar.helmet === item.id} onClick={() => patch({ helmet: item.id })} />
    )}</div>
  </EditorShell>

  if (category === 'protection') return <EditorShell eyebrow="Equipamiento" title="Protecciones" text="Que acompañen el look sin parecer guantes de muñeco.">
    <div className="grid grid-cols-2 gap-2">{PROTECTIONS.map((item) =>
      <GearChoice key={item.id} item={item} active={avatar.protection === item.id} onClick={() => patch({ protection: item.id })} />
    )}</div>
  </EditorShell>

  return <SkateEditor avatar={avatar} patch={patch} />
}

function SkateEditor({ avatar, patch }) {
  const available = SKATES.filter((x) => x.type === avatar.skateType)

  function setType(type) {
    const first = SKATES.find((x) => x.type === type)
    patch({ skateType: type, skateModel: first.id })
  }

  return <EditorShell eyebrow="Tu setup" title="Patines" text="3 ruedas o 4 ruedas. Fitness, urban y speed.">
    <div className="grid grid-cols-2 gap-2">
      {['3w','4w'].map((type) => (
        <button key={type} type="button" onClick={() => setType(type)}
          className={`rounded-[20px] border p-4 text-left ${avatar.skateType === type ? 'border-orange-300/30 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
          <p className="font-display text-[30px] text-white">{type === '3w' ? '3' : '4'} <span className="text-sm text-white/35">ruedas</span></p>
          <MiniSkatePreview wheels={type === '3w' ? 3 : 4} boot={avatar.skateColor} wheel={avatar.wheelColor} />
        </button>
      ))}
    </div>

    <SubLabel>Modelo</SubLabel>
    <div className="space-y-2">
      {available.map((item) => (
        <button key={item.id} type="button" onClick={() => patch({ skateModel: item.id })}
          className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left ${avatar.skateModel === item.id ? 'border-orange-300/30 bg-orange-400/10' : 'border-white/[.07] bg-white/[.025]'}`}>
          <MiniSkatePreview wheels={item.wheels} low={item.low} boot={avatar.skateColor} wheel={avatar.wheelColor} compact />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white">{item.label}</p>
            <p className="mt-0.5 text-[10px] text-white/30">{item.desc}</p>
          </div>
          {avatar.skateModel === item.id && <span className="text-orange-300">✓</span>}
        </button>
      ))}
    </div>

    <SubLabel>Bota</SubLabel>
    <div className="grid grid-cols-3 gap-2">{['#17181D','#F1F1F1','#A91D24','#2563EB','#D9468A','#FF6B1A'].map((c) =>
      <ColorChoice key={c} color={c} active={avatar.skateColor === c} onClick={() => patch({ skateColor: c })} />
    )}</div>

    <SubLabel>Ruedas</SubLabel>
    <div className="grid grid-cols-3 gap-2">{['#FF6B1A','#FACC15','#F2F2F2','#22C55E','#3B82F6','#D9468A'].map((c) =>
      <ColorChoice key={c} color={c} active={avatar.wheelColor === c} onClick={() => patch({ wheelColor: c })} />
    )}</div>
  </EditorShell>
}

function EditorShell({ eyebrow, title, text, children }) {
  return <>
    <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">{eyebrow}</p>
    <h2 className="mt-2 font-display text-[27px] leading-none text-white">{title}</h2>
    <p className="mt-2 text-[11px] leading-5 text-white/35">{text}</p>
    <div className="mt-4">{children}</div>
  </>
}

function SubLabel({ children }) {
  return <p className="mb-2 mt-5 text-[8px] font-black uppercase tracking-[.16em] text-white/25">{children}</p>
}

function ColorChoice({ color, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`relative h-16 rounded-[18px] border ${active ? 'border-orange-300/40 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <span className="mx-auto block h-9 w-9 rounded-full border border-white/10 shadow-[inset_0_-5px_10px_rgba(0,0,0,.12)]" style={{ background: color }} />
    {active && <span className="absolute right-2 top-2 text-[10px] font-black text-orange-300">✓</span>}
  </button>
}

function HairChoice({ item, color, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`rounded-[18px] border p-2.5 ${active ? 'border-orange-300/35 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <svg viewBox="0 0 60 48" className="mx-auto h-12 w-full">
      <ellipse cx="30" cy="27" rx="17" ry="18" fill="#C99170" opacity=".65"/>
      <g transform="translate(-130 -60) scale(.95)"><HairSvg id={item.id} color={color} /></g>
    </svg>
    <p className="mt-1 text-[9px] font-bold text-white/55">{item.label}</p>
  </button>
}

function FaceChoice({ item, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`rounded-[18px] border p-3 ${active ? 'border-orange-300/35 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <svg viewBox="0 0 70 52" className="mx-auto h-12">
      <ellipse cx="35" cy="26" rx="22" ry="23" fill="#D7A17D"/>
      <g transform="translate(-125 -112)"><FaceSvg id={item.id}/></g>
    </svg>
    <p className="mt-1 text-[9px] font-bold text-white/55">{item.label}</p>
  </button>
}

function TopChoice({ item, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`rounded-[19px] border p-3 text-left ${active ? 'border-orange-300/35 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <div className="relative h-16 rounded-[16px]" style={{ background: item.body }}>
      <div className="absolute left-1/2 top-5 h-1.5 w-12 -translate-x-1/2 rounded-full" style={{ background: item.detail }}/>
      <span className="absolute inset-x-0 top-8 text-center text-[9px] font-black tracking-[.14em]" style={{ color: item.detail }}>PR</span>
    </div>
    <p className="mt-2 text-[10px] font-bold text-white/60">{item.label}</p>
  </button>
}

function HelmetChoice({ item, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`rounded-[18px] border p-2.5 ${active ? 'border-orange-300/35 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <svg viewBox="0 0 64 48" className="mx-auto h-12">
      {item.id === 'none' ? <path d="M11 36h42" stroke="rgba(255,255,255,.2)" strokeWidth="2"/> : <>
        <path d="M10 34C8 8 55 5 56 34l-6 5c-12-4-24-4-36 0z" fill={item.color} stroke="rgba(255,255,255,.18)" />
        <path d="M18 22c9-7 20-9 30-5" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="3" strokeLinecap="round"/>
      </>}
    </svg>
    <p className="mt-1 truncate text-[8px] font-bold text-white/50">{item.label}</p>
  </button>
}

function GearChoice({ item, active, onClick }) {
  return <button type="button" onClick={onClick}
    className={`rounded-[18px] border p-3 text-left ${active ? 'border-orange-300/35 bg-orange-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <div className="flex h-12 items-center justify-center gap-2">
      <span className="h-8 w-6 rounded-[9px] border border-white/10" style={{ background: item.color }}/>
      <span className="h-8 w-6 rounded-[9px] border border-white/10" style={{ background: item.color }}/>
    </div>
    <p className="mt-1 text-[9px] font-bold text-white/50">{item.label}</p>
  </button>
}

function MiniSkatePreview({ wheels, low = false, boot, wheel, compact = false }) {
  const xs = wheels === 3 ? [24, 47, 70] : [18, 35, 52, 69]
  return <svg viewBox="0 0 90 52" className={`${compact ? 'h-12 w-20' : 'mt-2 h-14 w-full'}`}>
    <path d={low ? 'M10 27 18 10h39l22 15-7 14H13z' : 'M10 35 16 4h35l9 17 21 10-8 12H15z'} fill={boot} stroke="rgba(255,255,255,.16)"/>
    <path d="M13 43h68" stroke="#777" strokeWidth="3" strokeLinecap="round"/>
    {xs.map((x) => <circle key={x} cx={x} cy="48" r={wheels === 3 ? 6 : 5} fill={wheel} stroke="#111" strokeWidth="1"/>)}
  </svg>
      }
