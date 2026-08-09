import {
  CHIBI_ACCESSORIES,
  CHIBI_HANDS,
  CHIBI_HEADS,
  CHIBI_JERSEYS,
  CHIBI_SHORTS,
  CHIBI_SKATES,
  CHIBI_STICKERS,
  DEFAULT_CHIBI_SELECTION,
} from '../chibiCatalog'
import { clampAvatarEnergy } from '../avatarEnergy'

const SLOT_CLASS =
  'pointer-events-none absolute left-1/2 h-auto -translate-x-1/2 object-contain transition-[filter,transform] duration-300'

function Asset({ option, className, alt = '' }) {
  if (!option?.src) return null

  return (
    <img
      src={option.src}
      alt={alt}
      className={`${SLOT_CLASS} ${className}`}
      style={{ filter: option.filter || 'none' }}
      loading="eager"
      decoding="async"
      draggable="false"
    />
  )
}

function JerseySticker({ sticker }) {
  if (!sticker || sticker.kind === 'none') return null

  if (sticker.kind === 'bolt') {
    return (
      <span
        className="pointer-events-none absolute left-[45.5%] top-[38.5%] z-30 grid h-[4.2%] w-[5.8%] -translate-x-1/2 place-items-center rounded-full border border-orange-200/55 bg-[#141417]/85 text-[7px] text-orange-300 shadow-[0_0_10px_rgba(249,115,22,.3)]"
        aria-hidden="true"
      >
        ⚡
      </span>
    )
  }

  return (
    <span
      className="pointer-events-none absolute left-[45.5%] top-[37.9%] z-30 h-[5.2%] w-[7.2%] -translate-x-1/2 overflow-hidden rounded-full border border-amber-100/50 bg-black/30 shadow-[0_0_10px_rgba(250,204,21,.25)]"
      aria-hidden="true"
    >
      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="absolute left-1/2 top-0 h-auto w-[145%] max-w-none -translate-x-1/2"
      />
    </span>
  )
}

export default function ChibiAvatarStage({
  selection = DEFAULT_CHIBI_SELECTION,
  energy = 0,
  className = '',
  showHud = true,
}) {
  const safeEnergy = clampAvatarEnergy(energy)
  const head = CHIBI_HEADS[selection.head] || CHIBI_HEADS.masculine
  const accessory =
    CHIBI_ACCESSORIES[selection.accessory] || CHIBI_ACCESSORIES.none
  const jersey = CHIBI_JERSEYS[selection.jersey] || CHIBI_JERSEYS.orange
  const sticker = CHIBI_STICKERS[selection.sticker] || CHIBI_STICKERS.none
  const shorts = CHIBI_SHORTS[selection.shorts] || CHIBI_SHORTS.orange
  const hands = CHIBI_HANDS[selection.hands] || CHIBI_HANDS.orange
  const skates = CHIBI_SKATES[selection.skates] || CHIBI_SKATES.orange

  return (
    <section
      className={`relative isolate aspect-[2/3] w-full overflow-hidden rounded-[30px] border border-orange-200/10 bg-[#09090d] shadow-[0_22px_60px_rgba(0,0,0,.5)] ${className}`}
      aria-label="Vista previa del avatar modular Punta Rollers"
    >
      <img
        src="/avatar/v3/scenes/pr-locker-chibi-v1.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />

      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="pointer-events-none absolute left-1/2 top-[26%] z-10 w-[48%] -translate-x-1/2 opacity-[.055] mix-blend-screen drop-shadow-[0_0_24px_rgba(249,115,22,.9)]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[14%] z-10 h-[57%] w-[42%] -translate-x-1/2 rounded-full bg-orange-400 blur-[52px] transition-opacity duration-500"
        style={{ opacity: 0.025 + safeEnergy / 1200 }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-20" aria-hidden="true">
        <Asset option={head} className="top-[1%] z-30 w-[56%]" />
        <Asset option={accessory} className="top-[4%] z-[35] w-[56%]" />
        <Asset option={jersey} className="top-[21%] z-20 w-[53%]" />
        <Asset option={hands} className="top-[27%] z-30 w-[70%]" />
        <JerseySticker sticker={sticker} />
        <Asset option={shorts} className="top-[43%] z-20 w-[44%]" />
        <Asset option={skates} className="top-[55%] z-30 w-[56%]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-black/20 via-transparent to-black/25" />

      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="pointer-events-none absolute bottom-[6.3%] left-1/2 z-40 w-[13%] -translate-x-1/2 opacity-80 drop-shadow-[0_0_10px_rgba(249,115,22,.95)]"
        aria-hidden="true"
      />

      {showHud && (
        <div className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/55 px-3 py-2 shadow-xl backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.18em] text-orange-200/75">
              PR Roller Locker
            </p>
            <p className="mt-0.5 text-[8px] font-semibold text-white/45">
              Modular chibi v2
            </p>
          </div>

          <div className="rounded-2xl border border-orange-300/20 bg-black/55 px-3 py-2 text-right shadow-xl backdrop-blur-md">
            <p className="text-[6px] font-black uppercase tracking-[.12em] text-white/35">
              Energía PR
            </p>
            <p className="font-display text-[20px] leading-none text-orange-200">
              {Math.round(safeEnergy)}%
            </p>
          </div>
        </div>
      )}

      {showHud && (
        <div className="absolute inset-x-5 bottom-3 z-40">
          <div className="h-1 overflow-hidden rounded-full bg-white/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-300 to-amber-100 transition-[width] duration-500"
              style={{ width: `${Math.max(4, safeEnergy)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
