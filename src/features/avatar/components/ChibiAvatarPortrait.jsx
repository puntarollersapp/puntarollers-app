import {
  CHIBI_EARRINGS,
  CHIBI_EYEWEAR,
  CHIBI_HEADS,
  CHIBI_HEADWEAR,
  CHIBI_JERSEYS,
  CHIBI_PIERCINGS,
  CHIBI_TATTOOS,
  DEFAULT_CHIBI_SELECTION,
} from '../chibiCatalog'

function PortraitAsset({ option, className, style }) {
  if (!option?.src) return null

  return (
    <img
      src={option.src}
      alt=""
      className={`pointer-events-none absolute left-1/2 h-auto -translate-x-1/2 object-contain ${className}`}
      style={{ filter: option.filter || 'none', ...style }}
      loading="eager"
      decoding="async"
      draggable="false"
    />
  )
}

function PortraitFaceDetails({ piercing, tattoo }) {
  return (
    <>
      {piercing?.kind === 'nose-stud' && (
        <span className="pointer-events-none absolute left-[58%] top-[50%] z-[48] aspect-square w-[2.4%] rounded-full border border-white/70 bg-slate-300 shadow-[0_0_4px_rgba(255,255,255,.8)]" />
      )}
      {piercing?.kind === 'brow-stud' && (
        <span className="pointer-events-none absolute left-[36.5%] top-[39%] z-[48] h-[3.4%] w-[4.4%] -rotate-12 rounded-full border-2 border-slate-300/90 border-l-transparent" />
      )}
      {tattoo?.kind === 'face-bolt' && (
        <span className="pointer-events-none absolute left-[35%] top-[49%] z-[47] -rotate-12 text-[10px] font-black text-[#38251d]/75">
          ϟ
        </span>
      )}
      {tattoo?.kind === 'face-lines' && (
        <span className="pointer-events-none absolute left-[34%] top-[51%] z-[47] -rotate-12 text-[9px] font-black tracking-[-.16em] text-[#38251d]/70">
          ╱╱
        </span>
      )}
    </>
  )
}

function headwearGeometry(headwear, headId) {
  const override = headwear?.portraitByHead?.[headId]

  return {
    top: override?.top || headwear?.portraitTop,
    width: override?.width || headwear?.portraitWidth,
  }
}

export default function ChibiAvatarPortrait({
  selection = DEFAULT_CHIBI_SELECTION,
  className = '',
}) {
  const head = CHIBI_HEADS[selection.head] || CHIBI_HEADS.masculine
  const headwear =
    CHIBI_HEADWEAR[selection.headwear] || CHIBI_HEADWEAR.none
  const eyewear = CHIBI_EYEWEAR[selection.eyewear] || CHIBI_EYEWEAR.none
  const earrings =
    CHIBI_EARRINGS[selection.earrings] || CHIBI_EARRINGS.none
  const piercing =
    CHIBI_PIERCINGS[selection.piercing] || CHIBI_PIERCINGS.none
  const tattoo = CHIBI_TATTOOS[selection.tattoo] || CHIBI_TATTOOS.none
  const jersey = CHIBI_JERSEYS[selection.jersey] || CHIBI_JERSEYS.orange
  const headwearPortrait = headwearGeometry(headwear, head.id)

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
      <PortraitAsset option={earrings} className="top-[7.5%] z-[29] w-[85%]" />
      <PortraitAsset
        option={head}
        className="z-30"
        style={{
          top: head.portraitTop || '-2%',
          width: head.portraitWidth || '90%',
        }}
      />
      <PortraitAsset
        option={headwear}
        className="z-[46]"
        style={{
          top: headwearPortrait.top || '-15%',
          width: headwearPortrait.width || '70%',
        }}
      />
      <PortraitAsset option={eyewear} className="top-[26%] z-40 w-[46%]" />
      <PortraitFaceDetails piercing={piercing} tattoo={tattoo} />

      <span className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

      <img
        src="/avatar/v3/brand/pr-logo-official-v1.png"
        alt=""
        className="pointer-events-none absolute bottom-[4%] right-[5%] z-50 w-[12%] opacity-65 drop-shadow-[0_0_8px_rgba(249,115,22,.7)]"
      />
    </span>
  )
}
