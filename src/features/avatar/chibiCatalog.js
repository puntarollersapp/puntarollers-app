export const CHIBI_ASSET_VERSION = 2

export const DEFAULT_CHIBI_SELECTION = {
  version: CHIBI_ASSET_VERSION,
  head: 'masculine',
  accessory: 'none',
  jersey: 'orange',
  sticker: 'none',
  shorts: 'orange',
  hands: 'orange',
  skates: 'orange',
}

const colorFilters = {
  orange: 'none',
  violet: 'hue-rotate(225deg) saturate(1.15)',
  cyan: 'hue-rotate(145deg) saturate(1.12) brightness(1.08)',
  ice: 'grayscale(1) brightness(1.42) contrast(.82)',
}

export const CHIBI_HEADS = {
  masculine: {
    id: 'masculine',
    label: 'Masculino',
    description: 'Corte deportivo',
    src: '/avatar/v3/parts/head-masculine-v1.webp',
    stageWidth: '51%',
    stageTop: '1.9%',
    portraitWidth: '96%',
    portraitTop: '-6.6%',
  },
  feminine: {
    id: 'feminine',
    label: 'Femenino',
    description: 'Bob deportivo',
    src: '/avatar/v3/parts/head-feminine-v1.webp',
    stageWidth: '43%',
    stageTop: '6%',
    portraitWidth: '81%',
    portraitTop: '5%',
  },
  curly: {
    id: 'curly',
    label: 'Rulos',
    description: 'Rulos y sonrisa',
    src: '/avatar/v3/parts/head-curly-v1.webp',
    stageWidth: '51%',
    stageTop: '2.3%',
    portraitWidth: '96%',
    portraitTop: '-5.3%',
  },
  bun: {
    id: 'bun',
    label: 'Rodete',
    description: 'Rodete y pecas',
    src: '/avatar/v3/parts/head-bun-v1.webp',
    stageWidth: '49%',
    stageTop: '2.4%',
    portraitWidth: '93%',
    portraitTop: '-5.6%',
    unlockAt: 15,
  },
  silver: {
    id: 'silver',
    label: 'Silver',
    description: 'Corte plateado',
    src: '/avatar/v3/parts/head-silver-v1.webp',
    stageWidth: '44%',
    stageTop: '5.5%',
    portraitWidth: '84%',
    portraitTop: '3%',
    unlockAt: 30,
  },
}

const glassesSrc = '/avatar/v3/accessories/glasses-sport-v1.webp'

export const CHIBI_ACCESSORIES = {
  none: {
    id: 'none',
    label: 'Sin accesorio',
    description: 'Cara libre',
    kind: 'none',
  },
  sport: {
    id: 'sport',
    label: 'Sport Orange',
    description: 'Lentes roller',
    src: glassesSrc,
    filter: 'none',
  },
  violet: {
    id: 'violet',
    label: 'Sport Violet',
    description: 'Lentes violetas',
    src: glassesSrc,
    filter: colorFilters.violet,
    unlockAt: 20,
  },
  cyan: {
    id: 'cyan',
    label: 'Sport Cyan',
    description: 'Lentes cyan',
    src: glassesSrc,
    filter: colorFilters.cyan,
    unlockAt: 35,
  },
}

function coloredOption(id, label, color, src, unlockAt = 0) {
  return {
    id,
    label,
    color,
    src,
    unlockAt,
    filter: colorFilters[id] || 'none',
  }
}

const jerseySrc = '/avatar/v3/parts/jersey-orange-v1.webp'
const shortsSrc = '/avatar/v3/parts/short-orange-v1.webp'
const handsSrc = '/avatar/v3/parts/hands-orange-v1.webp'
const skatesSrc = '/avatar/v3/parts/skates-orange-v1.webp'

export const CHIBI_JERSEYS = {
  orange: coloredOption('orange', 'PR Orange', '#ff7417', jerseySrc),
  violet: coloredOption('violet', 'PR Violet', '#8b5cf6', jerseySrc, 15),
  cyan: coloredOption('cyan', 'PR Cyan', '#22d3ee', jerseySrc, 30),
  ice: coloredOption('ice', 'PR Ice', '#f2f4f7', jerseySrc, 45),
}

export const CHIBI_STICKERS = {
  none: {
    id: 'none',
    label: 'Sin sticker',
    description: 'Jersey limpio',
    kind: 'none',
  },
  pr: {
    id: 'pr',
    label: 'Sticker PR',
    description: 'Escudo PR chico',
    kind: 'logo',
  },
  bolt: {
    id: 'bolt',
    label: 'Doble rayo',
    description: 'Energía PR',
    kind: 'bolt',
    unlockAt: 20,
  },
}

export const CHIBI_SHORTS = {
  orange: coloredOption('orange', 'PR Orange', '#ff7417', shortsSrc),
  violet: coloredOption('violet', 'PR Violet', '#8b5cf6', shortsSrc, 15),
  cyan: coloredOption('cyan', 'PR Cyan', '#22d3ee', shortsSrc, 30),
}

export const CHIBI_HANDS = {
  orange: {
    id: 'orange',
    label: 'Muñequeras PR',
    description: 'Protección roller',
    src: handsSrc,
    filter: 'none',
  },
}

export const CHIBI_SKATES = {
  orange: coloredOption('orange', 'Orange 4W', '#ff7417', skatesSrc),
  violet: coloredOption('violet', 'Violet 4W', '#8b5cf6', skatesSrc, 15),
  cyan: coloredOption('cyan', 'Cyan 4W', '#22d3ee', skatesSrc, 30),
  ice: coloredOption('ice', 'Ice 4W', '#f2f4f7', skatesSrc, 45),
}

export const CHIBI_CATEGORIES = [
  {
    id: 'head',
    label: 'Cabeza',
    icon: '●',
    eyebrow: 'Personaje',
    options: CHIBI_HEADS,
  },
  {
    id: 'accessory',
    label: 'Accesorio',
    icon: '◉',
    eyebrow: 'Lentes roller',
    options: CHIBI_ACCESSORIES,
  },
  {
    id: 'jersey',
    label: 'Remera',
    icon: '◆',
    eyebrow: 'Equipación',
    options: CHIBI_JERSEYS,
  },
  {
    id: 'sticker',
    label: 'Sticker',
    icon: 'PR',
    eyebrow: 'Identidad',
    options: CHIBI_STICKERS,
  },
  {
    id: 'shorts',
    label: 'Short',
    icon: '▰',
    eyebrow: 'Parte inferior',
    options: CHIBI_SHORTS,
  },
  {
    id: 'hands',
    label: 'Protección',
    icon: '✦',
    eyebrow: 'Muñequeras',
    options: CHIBI_HANDS,
  },
  {
    id: 'skates',
    label: 'Rollers',
    icon: '⚡',
    eyebrow: 'Cuatro ruedas',
    options: CHIBI_SKATES,
  },
]

export function resolveChibiSelection(value = {}) {
  return CHIBI_CATEGORIES.reduce(
    (selection, category) => {
      const requested = value?.[category.id]
      const fallback = DEFAULT_CHIBI_SELECTION[category.id]
      selection[category.id] = category.options[requested]
        ? requested
        : fallback
      return selection
    },
    { version: CHIBI_ASSET_VERSION }
  )
}

export function chibiOption(categoryId, optionId) {
  const category = CHIBI_CATEGORIES.find((item) => item.id === categoryId)
  return category?.options?.[optionId] || null
}
