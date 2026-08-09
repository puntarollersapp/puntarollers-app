import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChibiAvatarStage from '../features/avatar/components/ChibiAvatarStage'
import {
  CHIBI_CATEGORIES,
  DEFAULT_CHIBI_SELECTION,
  resolveChibiSelection,
} from '../features/avatar/chibiCatalog'
import { calculateAvatarProgress } from '../features/avatar/avatarEnergy'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const EMPTY_PROGRESS = calculateAvatarProgress([])

function avatarObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function scrollRail(ref, direction) {
  const rail = ref.current
  if (!rail) return

  rail.scrollBy({
    left: direction * Math.max(220, rail.clientWidth * 0.78),
    behavior: 'smooth',
  })
}

function RailArrow({ direction, onClick, label }) {
  const isLeft = direction === 'left'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute ${
        isLeft ? 'left-1' : 'right-1'
      } top-1/2 z-20 grid h-9 w-7 -translate-y-1/2 place-items-center rounded-xl border border-orange-200/20 bg-[#09090d]/95 text-[22px] font-black leading-none text-orange-200 shadow-[0_6px_18px_rgba(0,0,0,.45)] backdrop-blur-md active:scale-95`}
    >
      {isLeft ? '‹' : '›'}
    </button>
  )
}

function OptionArtwork({ categoryId, option }) {
  if (option.kind === 'none') {
    return <span className="text-[22px] font-light text-white/22">×</span>
  }

  if (categoryId === 'piercing') {
    return option.kind === 'brow-stud' ? (
      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[28px] text-slate-200">
        ◔
      </span>
    ) : (
      <span className="h-4 w-4 rounded-full border-2 border-white/80 bg-slate-300 shadow-[0_0_12px_rgba(255,255,255,.65)]" />
    )
  }

  if (categoryId === 'sticker') {
    if (option.kind === 'bolt') {
      return <span className="text-[24px] text-orange-300">⚡</span>
    }

    return (
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-amber-100/40 bg-black/25">
        <img
          src="/avatar/v3/brand/pr-logo-official-v1.png"
          alt=""
          className="h-auto w-[145%] max-w-none"
        />
      </span>
    )
  }

  if (!option.src) {
    return <span className="text-[22px] text-white/35">•</span>
  }

  return (
    <img
      src={option.src}
      alt=""
      className="h-[76px] w-[76px] object-contain"
      style={{ filter: option.filter || 'none' }}
      loading="eager"
      decoding="async"
    />
  )
}

export default function AvatarPremiumPreview() {
  const { user, updateUser } = useAuth()
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarReady, setAvatarReady] = useState(false)
  const [storedAvatar, setStoredAvatar] = useState({})
  const [activeCategory, setActiveCategory] = useState('head')
  const [selection, setSelection] = useState(DEFAULT_CHIBI_SELECTION)
  const [useAsProfilePhoto, setUseAsProfilePhoto] = useState(false)
  const previewRef = useRef(null)
  const categoryNavRef = useRef(null)
  const optionNavRef = useRef(null)
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
        const savedChibi = avatarObject(avatar.chibi)
        setStoredAvatar(avatar)
        setSelection(resolveChibiSelection(savedChibi))
        setUseAsProfilePhoto(Boolean(savedChibi.useAsProfilePhoto))
        setAvatarReady(true)
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

  const activeGroup = useMemo(
    () =>
      CHIBI_CATEGORIES.find((category) => category.id === activeCategory) ||
      CHIBI_CATEGORIES[0],
    [activeCategory]
  )

  useEffect(() => {
    const activeButton = categoryNavRef.current?.querySelector(
      `[data-avatar-category="${activeCategory}"]`
    )

    activeButton?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
    optionNavRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory])

  function chooseOption(categoryId, optionId) {
    setSelection((current) => {
      const next = { ...current, [categoryId]: optionId }

      if (categoryId === 'headwear' && optionId !== 'none') {
        next.helmet = 'none'
      }

      if (categoryId === 'helmet' && optionId !== 'none') {
        next.headwear = 'none'
      }

      return next
    })
    setMessage('')

    window.requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  async function saveChibiAvatar() {
    if (!user?.id || !avatarReady) return

    const lockedOption = CHIBI_CATEGORIES.some((category) => {
      const option = category.options[selection[category.id]]
      return !canPreviewLocked && Number(option?.unlockAt || 0) > progress.energy
    })

    if (lockedOption) {
      setMessage('Todavía te falta Energía PR para guardar uno de esos objetos.')
      return
    }

    const chibi = {
      ...avatarObject(storedAvatar.chibi),
      ...resolveChibiSelection(selection),
      useAsProfilePhoto,
    }
    const nextAvatar = {
      ...avatarObject(storedAvatar),
      chibi,
    }

    try {
      setSaving(true)
      setMessage('Guardando tu nuevo PR Roller…')

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
      setMessage('✓ Tu PR Roller quedó guardado.')
    } catch (error) {
      setMessage(`No pudimos guardar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="PR Roller" showBack>
      <div className="animate-page-enter px-3 pb-4 pt-3">
        <div className="flex min-h-[calc(100dvh-150px)] flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-[7px] font-black uppercase tracking-[.2em] text-orange-300/75">
                Avatar modular · prueba privada
              </p>
              <h1 className="mt-0.5 truncate font-display text-[24px] leading-none text-white">
                Armá tu PR Roller
              </h1>
            </div>

            <button
              type="button"
              onClick={saveChibiAvatar}
              disabled={saving || loading || !avatarReady}
              className="shrink-0 rounded-2xl bg-gradient-to-b from-amber-200 via-orange-300 to-orange-500 px-4 py-2.5 text-[9px] font-black uppercase tracking-[.04em] text-black shadow-[0_10px_25px_rgba(249,115,22,.24)] disabled:opacity-45"
            >
              {saving ? 'Guardando…' : '✓ Guardar'}
            </button>
          </div>

          <div
            ref={previewRef}
            className="flex h-[clamp(350px,50dvh,480px)] shrink-0 scroll-mt-[76px] items-center justify-center overflow-hidden rounded-[28px] border border-white/[.06] bg-[radial-gradient(circle_at_center,rgba(249,115,22,.08),transparent_55%),linear-gradient(to_bottom,#17121d,#09090d)] p-1.5"
          >
            <ChibiAvatarStage
              selection={selection}
              energy={progress.energy}
              className="h-full w-auto max-w-full"
            />
          </div>

          <div className="relative shrink-0">
            <RailArrow
              direction="left"
              onClick={() => scrollRail(categoryNavRef, -1)}
              label="Ver categorías anteriores"
            />
            <nav
              ref={categoryNavRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth rounded-[22px] border border-white/[.07] bg-[#15131e] px-9 py-1.5 shadow-xl"
              aria-label="Categorías del PR Roller"
            >
              {CHIBI_CATEGORIES.map((category) => {
                const active = category.id === activeCategory

                return (
                  <button
                    key={category.id}
                    type="button"
                    data-avatar-category={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    aria-pressed={active}
                    className={`flex min-w-[70px] snap-center flex-col items-center justify-center rounded-[16px] border px-2 py-2 transition-colors ${
                      active
                        ? 'border-orange-200/55 bg-gradient-to-b from-orange-300 to-orange-500 text-black shadow-[0_8px_22px_rgba(249,115,22,.2)]'
                        : 'border-transparent bg-white/[.035] text-white/36'
                    }`}
                  >
                    <span className="text-[13px] font-black leading-none">
                      {category.icon}
                    </span>
                    <span className="mt-1 text-[7px] font-black uppercase tracking-[.03em]">
                      {category.label}
                    </span>
                  </button>
                )
              })}
            </nav>
            <RailArrow
              direction="right"
              onClick={() => scrollRail(categoryNavRef, 1)}
              label="Ver categorías siguientes"
            />
          </div>

          <section className="shrink-0 rounded-[24px] border border-white/[.07] bg-[#111018] p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[.16em] text-orange-300/65">
                  {activeGroup.eyebrow}
                </p>
                <h2 className="mt-0.5 font-display text-[19px] leading-none text-white">
                  {activeGroup.label}
                </h2>
              </div>

              <span className="rounded-full border border-white/[.07] bg-white/[.035] px-2.5 py-1 text-[7px] font-bold text-white/38">
                {Object.keys(activeGroup.options).length} opciones
              </span>
            </div>

            <div className="relative mt-2">
              <RailArrow
                direction="left"
                onClick={() => scrollRail(optionNavRef, -1)}
                label="Ver opciones anteriores"
              />
              <div
                ref={optionNavRef}
                className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-8 pb-1"
              >
                {Object.values(activeGroup.options).map((option) => {
                  const active = selection[activeGroup.id] === option.id
                  const locked =
                    !canPreviewLocked && progress.energy < Number(option.unlockAt || 0)

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseOption(activeGroup.id, option.id)}
                      disabled={locked}
                      aria-pressed={active}
                      className={`relative flex h-[112px] w-[104px] min-w-[104px] snap-center flex-col items-center justify-center overflow-hidden rounded-[18px] border px-1.5 py-2 transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
                        active
                          ? 'border-orange-200/70 bg-orange-300/[.1] shadow-[inset_0_0_0_1px_rgba(251,146,60,.18)]'
                          : 'border-white/[.08] bg-white/[.035]'
                      }`}
                    >
                      {active && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-orange-300 text-[10px] font-black text-black">
                          ✓
                        </span>
                      )}

                      <OptionArtwork categoryId={activeGroup.id} option={option} />

                      <span className="mt-auto max-w-full truncate text-[8px] font-black text-white/72">
                        {option.label}
                      </span>

                      {locked && (
                        <span className="absolute inset-x-1.5 bottom-1 rounded-full bg-black/75 px-1 py-0.5 text-[6px] font-black text-orange-200">
                          🔒 {option.unlockAt}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <RailArrow
                direction="right"
                onClick={() => scrollRail(optionNavRef, 1)}
                label="Ver opciones siguientes"
              />
            </div>

            <div className="mt-2 flex min-h-[18px] items-center justify-between gap-3 px-1">
              <p className="truncate text-[8px] text-white/35">
                {message ||
                  (activeGroup.id === 'helmet' || activeGroup.id === 'headwear'
                    ? 'Casco y gorro son excluyentes: al elegir uno se quita el otro.'
                    : 'Combiná lentes, gorro, caravanas y piercing.')}
              </p>
              <Link
                to="/app/perfil"
                className="shrink-0 text-[8px] font-bold text-orange-200/55"
              >
                Perfil →
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setUseAsProfilePhoto((current) => !current)
                setMessage('La preferencia se aplicará cuando guardes el avatar.')
              }}
              aria-pressed={useAsProfilePhoto}
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-white/[.035] px-3 py-2.5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[9px] font-black text-white/78">
                  Usar mi PR Roller en el perfil
                </span>
                <span className="mt-0.5 block truncate text-[7px] text-white/32">
                  Tu foto real queda guardada y podés volver cuando quieras.
                </span>
              </span>

              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  useAsProfilePhoto ? 'bg-orange-400' : 'bg-white/10'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    useAsProfilePhoto ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
