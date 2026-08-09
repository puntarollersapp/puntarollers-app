import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarStage from '../features/avatar/components/AvatarStage'
import { calculateAvatarProgress } from '../features/avatar/avatarEnergy'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const EMPTY_PROGRESS = calculateAvatarProgress([])

const BODY_OPTIONS = [
  ['feminine', 'Femenino', '#d8a27f'],
  ['masculine', 'Masculino', '#8c6048'],
]

const FACE_OPTIONS = [
  ['pr-visor', 'Visor PR', '#111217'],
  ['none', 'Rostro base', '#a66d50'],
]

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
  ['ice', 'Ice Racing', '#f1f1f1', 15],
  ['electric', 'Electric Racing', '#1760df', 30],
]

const PROTECTION_OPTIONS = [
  ['none', 'Sin protección', '#25252b'],
  ['orange', 'PR Orange', '#f36b18'],
  ['carbon', 'Carbon', '#25262b', 10],
  ['ice', 'Ice', '#e6e6e6', 20],
  ['electric', 'Electric', '#174bcc', 30],
]

const SKATE_OPTIONS = [
  ['none', 'Sin patines', '#25252b'],
  ['fitness-orange', 'Fitness 4W Orange', '#f36b18'],
  ['fitness-carbon', 'Fitness 4W Carbon', '#34353a', 15],
  ['fitness-ice', 'Urban 4W Ice', '#e8edf6', 25],
  ['speed-orange', 'Speed 3W Orange', '#ff7a1a', 40],
]

const HELMET_OPTIONS = [
  ['none', 'Sin casco', '#32323a'],
  ['orange', 'PR Orange', '#ff6b1a'],
  ['carbon', 'Carbon', '#24252a', 15],
  ['white', 'Ice', '#f1f1f1', 25],
  ['blue', 'Electric', '#174bcc', 35],
  ['aero', 'Aero Carbon', '#1f2025', 50],
  ['urban', 'Urban Ice', '#f1f1f1', 20],
]

const STICKER_OPTIONS = [
  ['none', 'Sin sticker', '#25252b'],
  ['gold', 'PR Gold', '#f5d36a'],
  ['carbon', 'PR Carbon', '#3a3b40', 10],
  ['electric', 'PR Electric', '#2563eb', 25],
  ['fire', 'PR Fire', '#f97316', 45],
]

const DEFAULT_PREMIUM_SELECTION = {
  version: 4,
  body: 'feminine',
  face: 'pr-visor',
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

function optionUnlocked(options, value, energy) {
  const option = options.find(([id]) => id === value)
  return !option || Number(option[3] || 0) <= energy
}

function avatarObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export default function AvatarPremiumPreview() {
  const { user, updateUser } = useAuth()
  const previewRef = useRef(null)
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarReady, setAvatarReady] = useState(false)
  const [storedAvatar, setStoredAvatar] = useState({})
  const [activeCategory, setActiveCategory] = useState('face')
  const [body, setBody] = useState(DEFAULT_PREMIUM_SELECTION.body)
  const [face, setFace] = useState(DEFAULT_PREMIUM_SELECTION.face)
  const [helmet, setHelmet] = useState(DEFAULT_PREMIUM_SELECTION.helmet)
  const [hair, setHair] = useState(DEFAULT_PREMIUM_SELECTION.hair)
  const [clothing, setClothing] = useState(DEFAULT_PREMIUM_SELECTION.clothing)
  const [protection, setProtection] = useState(
    DEFAULT_PREMIUM_SELECTION.protection
  )
  const [skates, setSkates] = useState(DEFAULT_PREMIUM_SELECTION.skates)
  const [sticker, setSticker] = useState(DEFAULT_PREMIUM_SELECTION.sticker)
  const canPreviewLocked = user?.role === 'admin'

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
        setBody(premium.body === 'masculine' ? 'masculine' : 'feminine')
        setFace(
          validOption(
            FACE_OPTIONS,
            premium.face,
            DEFAULT_PREMIUM_SELECTION.face
          )
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

  function chooseOption(onChange, value) {
    onChange(value)
    setMessage('')

    if (typeof window !== 'undefined' && window.innerHeight < 640) {
      window.requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  async function savePremiumAvatar() {
    if (!user?.id || !avatarReady) return

    const hasLockedSelection = [
      [CLOTHING_OPTIONS, clothing],
      [STICKER_OPTIONS, sticker],
      [HELMET_OPTIONS, helmet],
      [PROTECTION_OPTIONS, protection],
      [SKATE_OPTIONS, skates],
    ].some(
      ([options, value]) =>
        !optionUnlocked(options, value, progress.energy)
    )

    if (!canPreviewLocked && hasLockedSelection) {
      setMessage('Todavía te falta Energía PR para guardar uno de esos objetos.')
      return
    }

    const premium = {
      version: 4,
      body,
      face,
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

  const categories = [
    {
      id: 'body',
      label: 'Cuerpo',
      eyebrow: 'Base corporal',
      value: body,
      onChange: setBody,
      options: BODY_OPTIONS,
    },
    {
      id: 'face',
      label: 'Rostro',
      eyebrow: 'Identidad neutral',
      value: face,
      onChange: setFace,
      options: FACE_OPTIONS,
    },
    {
      id: 'hair',
      label: 'Pelo',
      eyebrow: 'Estilo personal',
      value: hair,
      onChange: setHair,
      options: HAIR_OPTIONS,
    },
    {
      id: 'clothing',
      label: 'Camiseta',
      eyebrow: 'Equipación PR',
      value: clothing,
      onChange: setClothing,
      options: CLOTHING_OPTIONS,
    },
    {
      id: 'sticker',
      label: 'Sticker',
      eyebrow: 'Identidad Punta Rollers',
      value: sticker,
      onChange: setSticker,
      options: STICKER_OPTIONS,
    },
    {
      id: 'protection',
      label: 'Protección',
      eyebrow: 'Seguridad',
      value: protection,
      onChange: setProtection,
      options: PROTECTION_OPTIONS,
    },
    {
      id: 'skates',
      label: 'Patines',
      eyebrow: 'Setup de rodaje',
      value: skates,
      onChange: setSkates,
      options: SKATE_OPTIONS,
    },
    {
      id: 'helmet',
      label: 'Casco',
      eyebrow: 'Seguridad y estilo',
      value: helmet,
      onChange: setHelmet,
      options: HELMET_OPTIONS,
    },
  ]
  const activeGroup =
    categories.find((category) => category.id === activeCategory) || categories[0]

  return (
    <AppLayout title="Avatar Premium" showBack>
      <div className="pr-page animate-page-enter pb-4">
        <div className="flex h-[calc(100dvh-158px)] min-h-[560px] flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">
                PR Roller Avatar · Fase 4
              </p>
              <h1 className="mt-1 truncate font-display text-[25px] leading-none text-white">
                Diseñá tu identidad PR
              </h1>
            </div>

            <div className="shrink-0 rounded-2xl border border-orange-300/15 bg-orange-400/[.07] px-3 py-2 text-right">
              <p className="text-[7px] font-black uppercase tracking-[.12em] text-white/35">
                Strava
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-orange-200">
                {Math.round(progress.energy)}% · {progress.sessions} entrenos
              </p>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-3 min-[470px]:grid-cols-[minmax(0,1fr)_184px]">
            <div
              ref={previewRef}
              className="flex min-h-0 items-center justify-center rounded-[28px] border border-white/[.06] bg-black/20 p-1.5"
            >
              <AvatarStage
                energy={progress.energy}
                body={body}
                face={face}
                helmet={helmet}
                hair={hair}
                clothing={clothing}
                protection={protection}
                skates={skates}
                sticker={sticker}
                className="w-full max-w-[230px] min-[470px]:max-w-[300px]"
              />
            </div>

            <section className="flex min-h-0 flex-col rounded-[24px] border border-white/[.08] bg-[#0d0d12] p-3 shadow-2xl">
              <div
                className="grid grid-cols-4 gap-1.5 min-[470px]:grid-cols-2"
                aria-label="Categorías del avatar"
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    aria-pressed={activeCategory === category.id}
                    className={`min-w-0 rounded-xl border px-1.5 py-2 text-[7px] font-black uppercase tracking-[.04em] transition-colors ${
                      activeCategory === category.id
                        ? 'border-orange-300/35 bg-orange-400/[.12] text-orange-100'
                        : 'border-white/[.06] bg-white/[.025] text-white/35'
                    }`}
                  >
                    <span className="block truncate">{category.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex min-h-0 flex-1 flex-col">
                <p className="text-[7px] font-black uppercase tracking-[.15em] text-orange-300/70">
                  {activeGroup.eyebrow}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <h2 className="font-display text-[21px] leading-none text-white">
                    {activeGroup.label}
                  </h2>
                  <span className="rounded-full bg-emerald-400/[.08] px-2 py-1 text-[7px] font-black uppercase text-emerald-200/75">
                    En vivo
                  </span>
                </div>

                <OptionChoices
                  value={activeGroup.value}
                  onChange={(value) =>
                    chooseOption(activeGroup.onChange, value)
                  }
                  options={activeGroup.options}
                  energy={progress.energy}
                  canPreviewLocked={canPreviewLocked}
                />
              </div>

              {message && (
                <p className="mt-2 rounded-xl border border-orange-300/10 bg-orange-400/[.06] px-2.5 py-2 text-[9px] leading-4 text-orange-100/65">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={savePremiumAvatar}
                disabled={saving || loading || !avatarReady}
                className="mt-2 w-full rounded-[16px] bg-gradient-to-b from-orange-300 to-orange-500 py-3 text-[9px] font-black uppercase tracking-[.05em] text-black shadow-[0_12px_28px_rgba(249,115,22,.18)] disabled:opacity-45"
              >
                {saving ? 'Guardando…' : '✓ Guardar Avatar'}
              </button>

              <div className="mt-2 flex items-center justify-center gap-3 text-[8px] font-semibold text-white/32">
                <Link to="/app/avatar" className="hover:text-white/60">
                  Editor anterior
                </Link>
                <span aria-hidden="true">·</span>
                <Link to="/app/perfil" className="hover:text-white/60">
                  Volver al perfil
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function OptionChoices({
  value,
  onChange,
  options,
  energy = 0,
  canPreviewLocked = false,
}) {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 min-[470px]:grid min-[470px]:grid-cols-1 min-[470px]:content-start min-[470px]:overflow-y-auto min-[470px]:pr-1">
      {options.map(([id, label, color, unlockAt = 0]) => {
        const locked = !canPreviewLocked && energy < unlockAt

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            disabled={locked}
            className={`flex min-w-[126px] items-center gap-2 rounded-[14px] border px-2.5 py-2.5 text-left text-[9px] font-bold disabled:cursor-not-allowed disabled:opacity-35 min-[470px]:min-w-0 ${
              value === id
                ? 'border-orange-300/35 bg-orange-400/[.1] text-orange-100'
                : 'border-white/[.07] bg-white/[.025] text-white/42'
            }`}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/15 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {locked && (
              <span className="shrink-0 text-[7px] font-black text-orange-200/70">
                🔒 {unlockAt}%
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
