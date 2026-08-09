import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarStage from '../features/avatar/components/AvatarStage'
import { calculateAvatarProgress } from '../features/avatar/avatarEnergy'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const EMPTY_PROGRESS = calculateAvatarProgress([])

const HAIR_OPTIONS = [
  ['none', 'Corte base', '#25252b'],
  ['soft', 'Soft Pixie', '#251b18'],
  ['wave', 'Urban Wave', '#4b2418'],
  ['bun', 'Performance Bun', '#301b16'],
  ['crop', 'Speed Crop', '#211713'],
]

const CLOTHING_OPTIONS = [
  ['none', 'Base técnica', '#19191d'],
  ['orange', 'PR Orange', '#f36b18'],
  ['ice', 'Ice Racing', '#f1f1f1'],
  ['electric', 'Electric Racing', '#1760df'],
]

const PROTECTION_OPTIONS = [
  ['none', 'Sin protección', '#25252b'],
  ['orange', 'PR Orange', '#f36b18'],
  ['carbon', 'Carbon', '#25262b'],
  ['ice', 'Ice', '#e6e6e6'],
  ['electric', 'Electric', '#174bcc'],
]

const SKATE_OPTIONS = [
  ['none', 'Sin patines', '#25252b'],
  ['fitness-orange', 'Fitness 4W Orange', '#f36b18'],
  ['fitness-carbon', 'Fitness 4W Carbon', '#34353a'],
  ['fitness-ice', 'Urban 4W Ice', '#e8edf6'],
  ['speed-orange', 'Speed 3W Orange', '#ff7a1a'],
]

const HELMET_OPTIONS = [
  ['none', 'Sin casco', '#32323a'],
  ['orange', 'PR Orange', '#ff6b1a'],
  ['carbon', 'Carbon', '#24252a'],
  ['white', 'Ice', '#f1f1f1'],
  ['blue', 'Electric', '#174bcc'],
  ['aero', 'Aero Carbon', '#1f2025'],
  ['urban', 'Urban Ice', '#f1f1f1'],
]

const STICKER_OPTIONS = [
  ['none', 'Sin sticker', '#25252b'],
  ['gold', 'PR Gold', '#f5d36a'],
  ['carbon', 'PR Carbon', '#3a3b40'],
  ['electric', 'PR Electric', '#2563eb'],
  ['fire', 'PR Fire', '#f97316'],
]

const DEFAULT_PREMIUM_SELECTION = {
  version: 3,
  body: 'feminine',
  hair: 'soft',
  clothing: 'orange',
  helmet: 'none',
  protection: 'orange',
  skates: 'fitness-orange',
  sticker: 'gold',
}

function validOption(options, value, fallback) {
  return options.some(([id]) => id === value) ? value : fallback
}

function avatarObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export default function AvatarPremiumPreview() {
  const { user, updateUser } = useAuth()
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarReady, setAvatarReady] = useState(false)
  const [storedAvatar, setStoredAvatar] = useState({})
  const [body, setBody] = useState(DEFAULT_PREMIUM_SELECTION.body)
  const [helmet, setHelmet] = useState(DEFAULT_PREMIUM_SELECTION.helmet)
  const [hair, setHair] = useState(DEFAULT_PREMIUM_SELECTION.hair)
  const [clothing, setClothing] = useState(DEFAULT_PREMIUM_SELECTION.clothing)
  const [protection, setProtection] = useState(
    DEFAULT_PREMIUM_SELECTION.protection
  )
  const [skates, setSkates] = useState(DEFAULT_PREMIUM_SELECTION.skates)
  const [sticker, setSticker] = useState(DEFAULT_PREMIUM_SELECTION.sticker)

  useEffect(() => {
    let active = true

    async function loadAvatarAndProgress() {
      setLoading(true)
      setAvatarReady(false)
      const [profileResult, activityResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('pr_avatar')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('pr_activities')
          .select('distancia_metros')
          .eq('alumno_id', user.id)
          .eq('fuente', 'strava')
          .eq('eliminada', false)
          .limit(1000),
      ])

      if (!active) return

      if (!profileResult.error) {
        const avatar = avatarObject(profileResult.data?.pr_avatar)
        const savedPremium = avatarObject(avatar.premium)
        const premium = Object.keys(savedPremium).length
          ? savedPremium
          : DEFAULT_PREMIUM_SELECTION

        setStoredAvatar(avatar)
        setAvatarReady(true)
        setBody(
          premium.body === 'masculine' ? 'masculine' : 'feminine'
        )
        setHair(
          validOption(
            HAIR_OPTIONS,
            premium.hair,
            DEFAULT_PREMIUM_SELECTION.hair
          )
        )
        setClothing(
          validOption(
            CLOTHING_OPTIONS,
            premium.clothing,
            DEFAULT_PREMIUM_SELECTION.clothing
          )
        )
        setHelmet(
          validOption(
            HELMET_OPTIONS,
            premium.helmet,
            DEFAULT_PREMIUM_SELECTION.helmet
          )
        )
        setProtection(
          validOption(
            PROTECTION_OPTIONS,
            premium.protection,
            DEFAULT_PREMIUM_SELECTION.protection
          )
        )
        setSkates(
          validOption(
            SKATE_OPTIONS,
            premium.skates,
            DEFAULT_PREMIUM_SELECTION.skates
          )
        )
        setSticker(
          validOption(
            STICKER_OPTIONS,
            premium.sticker,
            DEFAULT_PREMIUM_SELECTION.sticker
          )
        )
      } else {
        setMessage(
          'No pudimos leer tu avatar actual. El guardado queda bloqueado para proteger tus datos.'
        )
      }

      if (!activityResult.error) {
        setProgress(calculateAvatarProgress(activityResult.data || []))
      }
      setLoading(false)
    }

    if (user?.id) loadAvatarAndProgress()
    else setLoading(false)

    return () => {
      active = false
    }
  }, [user?.id])

  async function savePremiumAvatar() {
    if (!user?.id || !avatarReady) return

    const premium = {
      version: 3,
      body,
      hair,
      clothing,
      helmet,
      protection,
      skates,
      sticker,
    }
    const nextAvatar = {
      ...avatarObject(storedAvatar),
      premium,
    }

    try {
      setSaving(true)
      setMessage('Guardando tu Avatar Premium…')
      const { data, error } = await supabase
        .from('profiles')
        .update({
          pr_avatar: nextAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data?.id) throw new Error('No encontramos el perfil para guardar.')

      setStoredAvatar(nextAvatar)
      updateUser?.({ pr_avatar: nextAvatar })
      setMessage('✓ Tu Avatar Premium quedó guardado.')
    } catch (error) {
      setMessage(`No pudimos guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Avatar Premium" showBack>
      <div className="pr-page space-y-4 animate-page-enter pb-10">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">
            PR Roller Avatar · Fase 3
          </p>
          <h1 className="mt-2 font-display text-[34px] leading-none text-white">
            El nuevo personaje maestro.
          </h1>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Prueba real del sistema modular femenino y masculino. Esta vista no
            reemplaza todavía el editor actual.
          </p>
        </div>

        <AvatarStage
          energy={progress.energy}
          body={body}
          helmet={helmet}
          hair={hair}
          clothing={clothing}
          protection={protection}
          skates={skates}
          sticker={sticker}
        />

        <button
          type="button"
          onClick={savePremiumAvatar}
          disabled={saving || loading || !avatarReady}
          className="w-full rounded-[20px] bg-gradient-to-b from-orange-300 to-orange-500 py-4 text-xs font-black uppercase tracking-[.05em] text-black shadow-[0_16px_38px_rgba(249,115,22,.2)] disabled:opacity-45"
        >
          {saving ? 'Guardando…' : '✓ Guardar Avatar Premium'}
        </button>

        {message && (
          <div className="rounded-[20px] border border-orange-300/15 bg-orange-400/[.07] p-3 text-xs text-orange-100/65">
            {message}
          </div>
        )}

        <section className="rounded-[24px] border border-white/[.08] bg-[#0d0d12] p-4">
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-orange-300">
            Base corporal
          </p>
          <h2 className="mt-1 font-display text-[24px] text-white">Tu patinador</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['feminine', 'Femenino'],
              ['masculine', 'Masculino'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setBody(id)}
                className={`rounded-[18px] border px-3 py-3 text-left text-xs font-bold ${
                  body === id
                    ? 'border-orange-300/35 bg-orange-400/[.1] text-orange-100'
                    : 'border-white/[.07] bg-white/[.025] text-white/42'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <OptionSection
          eyebrow="Estilo personal"
          title="Pelo"
          value={hair}
          onChange={setHair}
          options={HAIR_OPTIONS}
        />

        <OptionSection
          eyebrow="Equipación PR"
          title="Camiseta"
          value={clothing}
          onChange={setClothing}
          options={CLOTHING_OPTIONS}
        />

        <OptionSection
          eyebrow="Identidad Punta Rollers"
          title="Sticker PR"
          value={sticker}
          onChange={setSticker}
          options={STICKER_OPTIONS}
        />

        <OptionSection
          eyebrow="Seguridad"
          title="Protecciones"
          value={protection}
          onChange={setProtection}
          options={PROTECTION_OPTIONS}
        />

        <OptionSection
          eyebrow="Setup de rodaje"
          title="Patines"
          value={skates}
          onChange={setSkates}
          options={SKATE_OPTIONS}
        />

        <OptionSection
          eyebrow="Seguridad y estilo"
          title="Casco"
          value={helmet}
          onChange={setHelmet}
          options={HELMET_OPTIONS}
        />

        <section className="grid grid-cols-3 gap-2">
          <Metric
            value={progress.kilometers.toLocaleString('es-UY', {
              maximumFractionDigits: 1,
            })}
            label="Km Strava"
          />
          <Metric value={progress.sessions} label="Entrenos" />
          <Metric value={`${Math.round(progress.energy)}%`} label="Energía" />
        </section>

        <section className="rounded-[24px] border border-orange-300/15 bg-orange-400/[.06] p-4">
          <p className="text-[8px] font-black uppercase tracking-[.15em] text-orange-200/70">
            {loading ? 'Calculando progreso…' : progress.level}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/42">
            Fondo, cuerpo, pelo, camiseta, casco, protecciones y patines se
            guardan sin borrar el formato anterior. La energía sigue
            calculándose con los entrenamientos reales de Strava.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/app/avatar"
            className="rounded-2xl border border-white/10 bg-white/[.035] py-4 text-center text-xs font-bold text-white/55"
          >
            Editor actual
          </Link>
          <Link
            to="/app/perfil"
            className="rounded-2xl bg-orange-400 py-4 text-center text-xs font-black text-black"
          >
            Volver al perfil
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}

function OptionSection({ eyebrow, title, value, onChange, options }) {
  return (
    <section className="rounded-[24px] border border-white/[.08] bg-[#0d0d12] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-orange-300">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-[24px] text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-emerald-300/15 bg-emerald-400/[.08] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-emerald-200">
          Activo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map(([id, label, color]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex min-w-0 items-center gap-2 rounded-[18px] border px-3 py-3 text-left text-xs font-bold ${
              value === id
                ? 'border-orange-300/35 bg-orange-400/[.1] text-orange-100'
                : 'border-white/[.07] bg-white/[.025] text-white/42'
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-white/15 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/[.07] bg-white/[.03] px-2 py-4 text-center">
      <p className="truncate font-display text-[24px] leading-none text-white">
        {value}
      </p>
      <p className="mt-2 text-[7px] font-black uppercase tracking-[.1em] text-white/28">
        {label}
      </p>
    </div>
  )
}
