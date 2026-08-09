import {
  CHIBI_ACCESSORIES,
  CHIBI_HEADS,
  CHIBI_JERSEYS,
  DEFAULT_CHIBI_SELECTION,
} from '../chibiCatalog'

function PortraitAsset({ option, className }) {
  if (!option?.src) return null

  return (
    <img
      src={option.src}
      alt=""
      className={`pointer-events-none absolute left-1/2 h-auto -translate-x-1/2 object-contain ${className}`}
      style={{ filter: option.filter || 'none' }}
      loading="eager"
      decoding="async"
      draggable="false"
    />
  )
}

export default function ChibiAvatarPortrait({
  selection = DEFAULT_CHIBI_SELECTION,
  className = '',
}) {
  const head = CHIBI_HEADS[selection.head] || CHIBI_HEADS.masculine
  const accessory =
    CHIBI_ACCESSORIES[selection.accessory] || CHIBI_ACCESSORIES.none
  const jersey = CHIBI_JERSEYS[selection.jersey] || CHIBI_JERSEYS.orange

  return (
    <span
      className={`relative isolate block aspect-square overflow-hidden bg-[#0b0a10] ${className}`}
      aria-label="Retrato de mi PR Roller"
    >
      <img
        src="/avatar/v3/scenes/pr-locker-chibi-v1.jpg"
        alt=""
        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70"
      />

      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="pointer-events-none absolute left-1/2 top-[24%] z-10 w-[66%] -translate-x-1/2 opacity-[.07] drop-shadow-[0_0_16px_rgba(249,115,22,.9)]"
      />

      <span className="pointer-events-none absolute left-1/2 top-[22%] z-10 h-[58%] w-[58%] -translate-x-1/2 rounded-full bg-orange-400/10 blur-2xl" />

      <PortraitAsset option={jersey} className="top-[44%] z-20 w-[84%]" />
      <PortraitAsset option={head} className="top-[-2%] z-30 w-[90%]" />
      <PortraitAsset option={accessory} className="top-[3%] z-40 w-[90%]" />

      <span className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="pointer-events-none absolute bottom-[4%] right-[5%] z-50 w-[18%] opacity-85 drop-shadow-[0_0_8px_rgba(249,115,22,.9)]"
      />
    </span>
  )
}
