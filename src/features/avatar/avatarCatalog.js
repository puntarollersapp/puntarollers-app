export const AVATAR_ASSET_VERSION = 2

export const AVATAR_BODIES = {
  feminine: {
    id: 'foundation-feminine-v1',
    label: 'Femenino',
    kind: 'body',
    order: 30,
    src: '/avatar/v2/base/foundation-feminine-v1.webp',
    fallbackSrc: '/avatar/v2/base/foundation-feminine-v1.webp',
    alt: 'Base técnica femenina de PR Roller Avatar',
  },
  masculine: {
    id: 'foundation-masculine-v1',
    label: 'Masculino',
    kind: 'body',
    order: 30,
    src: '/avatar/v2/base/foundation-masculine-v1.webp',
    fallbackSrc: '/avatar/v2/base/foundation-masculine-v1.webp',
    alt: 'Base técnica masculina con short de PR Roller Avatar',
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

export const AVATAR_HELMETS = {
  orange: {
    id: 'helmet-orange-v1',
    label: 'PR Orange',
    order: 90,
    src: '/avatar/v2/helmets/helmet-orange-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-orange-v1.webp',
  },
  carbon: {
    id: 'helmet-carbon-v1',
    label: 'Carbon',
    order: 90,
    src: '/avatar/v2/helmets/helmet-carbon-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-carbon-v1.webp',
  },
  white: {
    id: 'helmet-white-v1',
    label: 'Ice',
    order: 90,
    src: '/avatar/v2/helmets/helmet-white-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-white-v1.webp',
  },
  blue: {
    id: 'helmet-blue-v1',
    label: 'Electric',
    order: 90,
    src: '/avatar/v2/helmets/helmet-blue-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-blue-v1.webp',
  },
  aero: {
    id: 'helmet-aero-carbon-v1',
    label: 'Aero Carbon',
    order: 90,
    src: '/avatar/v2/helmets/helmet-aero-carbon-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-aero-carbon-v1.webp',
    width: '15.25%',
    top: '4.15%',
  },
  urban: {
    id: 'helmet-urban-ice-v1',
    label: 'Urban Ice',
    order: 90,
    src: '/avatar/v2/helmets/helmet-urban-ice-v1.webp',
    fallbackSrc: '/avatar/v2/helmets/helmet-urban-ice-v1.webp',
    width: '15.5%',
    top: '4.1%',
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

export const AVATAR_HAIR = {
  soft: avatarLayer('hair-soft-v1', 'Soft Pixie', 50, 'hair'),
  wave: avatarLayer('hair-wave-v1', 'Urban Wave', 50, 'hair'),
  bun: avatarLayer('hair-bun-v1', 'Performance Bun', 50, 'hair'),
  crop: avatarLayer('hair-crop-v1', 'Speed Crop', 50, 'hair'),
}

export const AVATAR_CLOTHING = {
  orange: clothingLayer('orange', 'PR Orange'),
  ice: clothingLayer('ice', 'Ice Racing'),
  electric: clothingLayer('electric', 'Electric Racing'),
}

export const AVATAR_PROTECTION = {
  orange: avatarLayer('protection-orange-v1', 'PR Orange', 60, 'protection'),
  carbon: avatarLayer('protection-carbon-v1', 'Carbon', 60, 'protection'),
  ice: avatarLayer('protection-ice-v1', 'Ice', 60, 'protection'),
  electric: avatarLayer('protection-electric-v1', 'Electric', 60, 'protection'),
}

export const AVATAR_SKATES = {
  'fitness-orange': avatarLayer(
    'skates-fitness-orange-v1',
    'Fitness 4W Orange',
    70,
    'skates'
  ),
  'fitness-carbon': avatarLayer(
    'skates-fitness-carbon-v1',
    'Fitness 4W Carbon',
    70,
    'skates'
  ),
  'fitness-ice': avatarLayer(
    'skates-fitness-ice-v1',
    'Urban 4W Ice',
    70,
    'skates'
  ),
  'speed-orange': avatarLayer(
    'skates-speed-orange-v1',
    'Speed 3W Orange',
    70,
    'skates'
  ),
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

function avatarLayer(id, label, order, directory) {
  return {
    id,
    label,
    order,
    src: `/avatar/v2/${directory}/${id}.webp`,
    fallbackSrc: `/avatar/v2/${directory}/${id}.webp`,
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
