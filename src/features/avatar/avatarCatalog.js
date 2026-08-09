export const AVATAR_ASSET_VERSION = 3

export const AVATAR_BODIES = {
  feminine: {
    id: 'body-master-v1',
    label: 'Femenino',
    kind: 'body',
    order: 30,
    src: '/avatar/v2/base/body-master-v1.webp',
    fallbackSrc: '/avatar/v2/base/body-master-v1.webp',
    alt: 'Patinadora femenina completa y alineada de PR Roller Avatar',
  },
  masculine: {
    id: 'body-masculine-v1',
    label: 'Masculino',
    kind: 'body',
    order: 30,
    src: '/avatar/v2/base/body-masculine-v1.webp',
    fallbackSrc: '/avatar/v2/base/body-masculine-v1.webp',
    alt: 'Patinador masculino con short, protecciones y rollers alineados',
  },
}

export function premiumPresetForBody(body = 'feminine') {
  const bodyLayer = AVATAR_BODIES[body] || AVATAR_BODIES.feminine

  return {
    version: AVATAR_ASSET_VERSION,
    id: `pr-master-${bodyLayer.id}`,
    scene: 'locker-room-v1',
    body: bodyLayer.id,
    layers: [bodyLayer],
  }
}

export const PREMIUM_MASTER_PRESET = premiumPresetForBody('feminine')

export const AVATAR_SCENES = {
  'locker-room-v1': {
    id: 'locker-room-v1',
    label: 'PR Roller Locker',
    src: '/avatar/v2/scenes/locker-room/background-v1.webp',
    fallbackSrc: '/avatar/v2/scenes/locker-room/background-v1.webp',
  },
}

export const AVATAR_STICKERS = {
  gold: {
    id: 'pr-gold',
    label: 'PR Gold',
    imageClass: 'drop-shadow-[0_0_7px_rgba(251,191,36,.42)]',
  },
  carbon: {
    id: 'pr-carbon',
    label: 'PR Carbon',
    imageClass: 'grayscale contrast-150 brightness-75',
  },
  electric: {
    id: 'pr-electric',
    label: 'PR Electric',
    imageClass:
      'hue-rotate-[175deg] saturate-[1.8] drop-shadow-[0_0_7px_rgba(59,130,246,.52)]',
  },
  fire: {
    id: 'pr-fire',
    label: 'PR Fire',
    imageClass:
      'sepia saturate-[2.2] drop-shadow-[0_0_8px_rgba(249,115,22,.55)]',
  },
}

export const AVATAR_CLOTHING = {
  orange: clothingLayer('orange', 'PR Orange'),
  ice: clothingLayer('ice', 'Ice Racing'),
  electric: clothingLayer('electric', 'Electric Racing'),
}

export function layerForBody(option, body = 'feminine') {
  if (!option?.assets) return option || null

  const bodyAsset = option.assets[body] || option.assets.feminine
  if (!bodyAsset) return null

  return {
    ...option,
    ...bodyAsset,
    id: `${option.id}-${body}`,
  }
}

function clothingLayer(variant, label) {
  return {
    id: `jersey-${variant}-v1`,
    label,
    order: 40,
    assets: {
      feminine: {
        src: `/avatar/v2/clothing/jersey-${variant}-feminine-v1.webp`,
        fallbackSrc: `/avatar/v2/clothing/jersey-${variant}-feminine-v1.webp`,
      },
      masculine: {
        src: `/avatar/v2/clothing/jersey-${variant}-masculine-v1.webp`,
        fallbackSrc: `/avatar/v2/clothing/jersey-${variant}-masculine-v1.webp`,
      },
    },
  }
}

export function orderedLayers(preset = PREMIUM_MASTER_PRESET) {
  return [...(preset.layers || [])].sort(
    (first, second) => Number(first.order || 0) - Number(second.order || 0)
  )
}
