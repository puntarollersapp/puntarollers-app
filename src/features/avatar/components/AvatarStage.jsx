import {
  AVATAR_CLOTHING,
  AVATAR_HAIR,
  AVATAR_SCENES,
  AVATAR_HELMETS,
  AVATAR_PROTECTION,
  AVATAR_SKATES,
  AVATAR_STICKERS,
  PREMIUM_MASTER_PRESET,
  layerForBody,
  premiumPresetForBody,
  orderedLayers,
} from '../avatarCatalog'
import { clampAvatarEnergy } from '../avatarEnergy'

export default function AvatarStage({
  preset,
  body = 'feminine',
  energy = 0,
  className = '',
  showHud = true,
  helmet = 'none',
  hair = 'soft',
  clothing = 'orange',
  protection = 'orange',
  skates = 'fitness-orange',
  sticker = 'gold',
}) {
  const safeEnergy = clampAvatarEnergy(energy)
  const resolvedPreset = preset || premiumPresetForBody(body)
  const scene =
    AVATAR_SCENES[resolvedPreset.scene] || AVATAR_SCENES['locker-room-v1']
  const selectedLayers = [
    layerForBody(AVATAR_CLOTHING[clothing], body),
    AVATAR_HAIR[hair],
    AVATAR_PROTECTION[protection],
    AVATAR_SKATES[skates],
  ].filter(Boolean)
  const layers = orderedLayers({
    ...(resolvedPreset || PREMIUM_MASTER_PRESET),
    layers: [...(resolvedPreset.layers || []), ...selectedLayers],
  })
  const helmetLayer = AVATAR_HELMETS[helmet] || null
  const stickerLayer = AVATAR_STICKERS[sticker] || null

  return (
    <section
      className={`relative isolate aspect-[2/3] w-full overflow-hidden rounded-[32px] bg-[#080808] ${className}`}
      aria-label="Vista previa de PR Roller Avatar"
    >
      <picture>
        <source srcSet={scene.src} type="image/webp" />
        <img
          src={scene.fallbackSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </picture>

      <div
        className="pointer-events-none absolute left-1/2 top-[17%] z-10 h-[54%] w-[24%] -translate-x-1/2 bg-orange-400 blur-3xl transition-opacity duration-700"
        style={{ opacity: 0.025 + safeEnergy / 650 }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[18%] z-10 h-[43%] w-[15%] -translate-x-1/2 bg-gradient-to-b from-amber-200 via-orange-400 to-orange-600 blur-md transition-opacity duration-700"
        style={{
          clipPath:
            'polygon(55% 0, 100% 0, 62% 43%, 91% 43%, 23% 100%, 43% 54%, 8% 54%)',
          opacity: 0.02 + safeEnergy / 500,
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-20" aria-hidden="true">
        {layers.map((layer) => (
          <picture key={layer.id}>
            <source srcSet={layer.src} type="image/webp" />
            <img
              src={layer.fallbackSrc}
              alt=""
              className="absolute left-1/2 top-[3.8%] h-[78%] w-[78%] -translate-x-1/2 object-contain"
              loading="eager"
              decoding="async"
            />
          </picture>
        ))}

        {stickerLayer && (
          <div
            className="absolute left-1/2 top-[22.4%] h-[6.4%] w-[9.6%] -translate-x-1/2 overflow-hidden"
            title={stickerLayer.label}
          >
            <img
              src="/logo.png"
              alt=""
              className={`h-auto w-full object-contain ${stickerLayer.imageClass}`}
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {helmetLayer && (
          <picture>
            <source srcSet={helmetLayer.src} type="image/webp" />
            <img
              src={helmetLayer.fallbackSrc}
              alt=""
              className="absolute left-1/2 -translate-x-1/2 object-contain"
              style={{
                top: helmetLayer.top || '4%',
                width: helmetLayer.width || '15.625%',
              }}
              loading="eager"
              decoding="async"
            />
          </picture>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-black/20 via-transparent to-black/20" />

      {showHud && (
        <div className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/45 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.18em] text-orange-200/70">
              PR Roller Locker
            </p>
            <p className="mt-1 text-[9px] font-semibold text-white/48">
              Sistema modular v1
            </p>
          </div>

          <div className="min-w-[88px] rounded-2xl border border-orange-300/20 bg-black/50 px-3 py-2.5 text-right shadow-xl backdrop-blur-md">
            <p className="text-[7px] font-black uppercase tracking-[.14em] text-orange-200/65">
              Energía PR
            </p>
            <p className="mt-0.5 font-display text-2xl leading-none text-white">
              {Math.round(safeEnergy)}
              <span className="ml-0.5 text-[9px] text-white/35">%</span>
            </p>
          </div>
        </div>
      )}

      {showHud && (
        <div className="absolute inset-x-4 bottom-4 z-40 rounded-2xl border border-white/10 bg-black/55 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[.12em]">
            <span className="text-white/45">Energía vinculada a Strava</span>
            <span className="text-orange-200">{Math.round(safeEnergy)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-700 via-orange-400 to-amber-200 shadow-[0_0_18px_rgba(251,146,60,.55)] transition-[width] duration-700"
              style={{ width: `${Math.max(4, safeEnergy)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
