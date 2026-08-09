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

function Asset({ option, className, alt = '', style }) {
  if (!option?.src) return null

  return (
    <img
      src={option.src}
      alt={alt}
      className={`${SLOT_CLASS} ${className}`}
      style={{ filter: option.filter || 'none', ...style }}
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
    <img
      src="/avatar/v3/brand/pr-logo-official-v1.png"
      alt=""
      className="pointer-events-none absolute left-1/2 top-[37.2%] z-30 h-auto w-[6%] -translate-x-1/2 opacity-90 drop-shadow-[0_0_7px_rgba(250,204,21,.42)]"
      aria-hidden="true"
    />
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
      className={`relative isolate aspect-[2/3] h-full w-auto max-w-full shrink-0 overflow-hidden rounded-[30px] border border-orange-200/10 bg-[#09090d] shadow-[0_22px_60px_rgba(0,0,0,.5)] ${className}`}
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
        <Asset
          option={head}
          className="z-30"
          style={{
            top: head.stageTop || '2%',
            width: head.stageWidth || '50%',
          }}
        />
        <Asset option={accessory} className="top-[15.5%] z-[35] w-[32%]" />
        <Asset option={jersey} className="top-[21%] z-20 w-[53%]" />
        <Asset option={hands} className="top-[26%] z-30 w-[62%]" />
        <JerseySticker sticker={sticker} />
        <Asset option={shorts} className="top-[43%] z-20 w-[44%]" />
        <Asset option={skates} className="top-[58%] z-30 w-[52%]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-black/20 via-transparent to-black/25" />

      {showHud && (
        <div className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-2">
          <div className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 shadow-xl backdrop-blur-md">
            <p className="text-[6px] font-black uppercase tracking-[.16em] text-orange-200/72">
              PR Locker · chibi v2
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-orange-300/20 bg-black/50 px-2.5 py-1.5 text-right shadow-xl backdrop-blur-md">
            <p className="text-[5px] font-black uppercase tracking-[.1em] text-white/35">
              Energía
            </p>
            <p className="font-display text-[15px] leading-none text-orange-200">
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
