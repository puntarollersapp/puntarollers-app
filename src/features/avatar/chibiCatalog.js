export const CHIBI_ASSET_VERSION = 5

export const DEFAULT_CHIBI_SELECTION = {
  version: CHIBI_ASSET_VERSION,
  head: 'masculine',
  headwear: 'none',
  eyewear: 'none',
  earrings: 'none',
  piercing: 'none',
  tattoo: 'none',
  jersey: 'orange',
  sticker: 'none',
  shorts: 'orange',
  hands: 'base',
  protection: 'standard',
  wrist: 'none',
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
    label: 'Deportivo',
    description: 'Corte deportivo',
    src: '/avatar/v3/parts/head-masculine-v1.webp',
    stageWidth: '51%',
    stageTop: '1.9%',
    portraitWidth: '96%',
    portraitTop: '-6.6%',
  },
  feminine: {
    id: 'feminine',
    label: 'Bob',
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
  buzz: {
    id: 'buzz',
    label: 'Rapado',
    description: 'Corte corto',
    src: '/avatar/v3/parts/head-buzz-v1.webp',
    stageWidth: '47.7%',
    stageTop: '3.6%',
    portraitWidth: '90%',
    portraitTop: '-1.9%',
  },
  wave: {
    id: 'wave',
    label: 'Ondas',
    description: 'Ondas con volumen',
    src: '/avatar/v3/parts/head-wave-v1.webp',
    stageWidth: '45.1%',
    stageTop: '4.1%',
    portraitWidth: '85%',
    portraitTop: '-0.4%',
  },
  ponytail: {
    id: 'ponytail',
    label: 'Cola alta',
    description: 'Ondas y pecas',
    src: '/avatar/v3/parts/head-ponytail-v1.webp',
    stageWidth: '40.9%',
    stageTop: '4.7%',
    portraitWidth: '77%',
    portraitTop: '1.4%',
    unlockAt: 15,
  },
  braids: {
    id: 'braids',
    label: 'Trenzas',
    description: 'Trenzas largas',
    src: '/avatar/v3/parts/head-braids-v1.webp',
    stageWidth: '41.7%',
    stageTop: '4.3%',
    portraitWidth: '78.6%',
    portraitTop: '0%',
    unlockAt: 20,
  },
}

export const CHIBI_HEADWEAR = {
  none: {
    id: 'none',
    label: 'Sin gorro',
    description: 'Peinado libre',
    kind: 'none',
  },
  cap: {
    id: 'cap',
    label: 'Gorra PR',
    description: 'Gorra deportiva',
    src: '/avatar/v3/accessories/cap-orange-v1.webp',
    stageWidth: '39%',
    stageTop: '-2%',
    portraitWidth: '70%',
    portraitTop: '-15.7%',
  },
  beanie: {
    id: 'beanie',
    label: 'Beanie PR',
    description: 'Gorro tejido',
    src: '/avatar/v3/accessories/beanie-orange-v1.webp',
    stageWidth: '38%',
    stageTop: '-1.4%',
    portraitWidth: '70%',
    portraitTop: '-13.8%',
    stageByHead: {
      silver: { width: '43%', top: '-1%' },
      curly: { width: '41%', top: '-1.2%' },
    },
    portraitByHead: {
      silver: { width: '78%', top: '-12%' },
      curly: { width: '75%', top: '-13%' },
    },
    unlockAt: 15,
  },
}

const glassesSrc = '/avatar/v3/accessories/glasses-sport-v1.webp'

export const CHIBI_EYEWEAR = {
  none: {
    id: 'none',
    label: 'Sin lentes',
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

// Alias temporal: evita romper imports o avatares de la versión 2.
export const CHIBI_ACCESSORIES = CHIBI_EYEWEAR

const earringsSrc = '/avatar/v3/accessories/earrings-hoop-small-v1.webp'

export const CHIBI_EARRINGS = {
  none: {
    id: 'none',
    label: 'Sin caravanas',
    description: 'Orejas libres',
    kind: 'none',
  },
  hoops: {
    id: 'hoops',
    label: 'Aros Orange',
    description: 'Aros pequeños',
    src: earringsSrc,
  },
  violet: {
    id: 'violet',
    label: 'Aros Violet',
    description: 'Aros violetas',
    src: earringsSrc,
    filter: colorFilters.violet,
    unlockAt: 20,
  },
  cyan: {
    id: 'cyan',
    label: 'Aros Cyan',
    description: 'Aros cyan',
    src: earringsSrc,
    filter: colorFilters.cyan,
    unlockAt: 35,
  },
}

export const CHIBI_PIERCINGS = {
  none: {
    id: 'none',
    label: 'Sin piercing',
    description: 'Cara libre',
    kind: 'none',
  },
  nose: {
    id: 'nose',
    label: 'Nostril',
    description: 'Punto plateado',
    kind: 'nose-stud',
  },
  brow: {
    id: 'brow',
    label: 'Ceja',
    description: 'Piercing de ceja',
    kind: 'brow-stud',
    unlockAt: 25,
  },
}

export const CHIBI_TATTOOS = {
  none: {
    id: 'none',
    label: 'Sin tattoo',
    description: 'Piel libre',
    kind: 'none',
  },
  bolt: {
    id: 'bolt',
    label: 'Rayo',
    description: 'Rayo facial',
    kind: 'face-bolt',
  },
  lines: {
    id: 'lines',
    label: 'Doble línea',
    description: 'Marca deportiva',
    kind: 'face-lines',
    unlockAt: 20,
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
const handsSrc = '/avatar/v3/parts/hands-base-v1.webp'
const protectionStandardSrc =
  '/avatar/v3/parts/protection-standard-v2.webp'
const protectionShieldSrc = '/avatar/v3/parts/protection-shield-v2.webp'
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
  base: {
    id: 'base',
    label: 'Manos base',
    description: 'Anatomía permanente',
    src: handsSrc,
    stageWidth: '52%',
    stageTop: '30.5%',
  },
}

export const CHIBI_PROTECTIONS = {
  standard: {
    id: 'standard',
    label: 'PR Standard',
    description: 'Muñequera roller esencial',
    src: protectionStandardSrc,
    stageWidth: '43%',
    stageTop: '30.6%',
  },
  standardViolet: {
    id: 'standardViolet',
    label: 'Standard Violet',
    description: 'Muñequera roller violeta',
    src: protectionStandardSrc,
    stageWidth: '43%',
    stageTop: '30.6%',
    filter: colorFilters.violet,
    unlockAt: 15,
  },
  standardCyan: {
    id: 'standardCyan',
    label: 'Standard Cyan',
    description: 'Muñequera roller cyan',
    src: protectionStandardSrc,
    stageWidth: '43%',
    stageTop: '30.6%',
    filter: colorFilters.cyan,
    unlockAt: 30,
  },
  shield: {
    id: 'shield',
    label: 'PR Shield',
    description: 'Protección reforzada',
    src: protectionShieldSrc,
    stageWidth: '43%',
    stageTop: '31.4%',
    unlockAt: 20,
  },
  shieldViolet: {
    id: 'shieldViolet',
    label: 'Shield Violet',
    description: 'Protección reforzada violeta',
    src: protectionShieldSrc,
    stageWidth: '43%',
    stageTop: '31.4%',
    filter: colorFilters.violet,
    unlockAt: 40,
  },
}

export const CHIBI_SKATES = {
  orange: coloredOption('orange', 'Orange 4W', '#ff7417', skatesSrc),
  violet: coloredOption('violet', 'Violet 4W', '#8b5cf6', skatesSrc, 15),
  cyan: coloredOption('cyan', 'Cyan 4W', '#22d3ee', skatesSrc, 30),
  ice: coloredOption('ice', 'Ice 4W', '#f2f4f7', skatesSrc, 45),
  speed3: {
    id: 'speed3',
    label: 'Speed 3W',
    description: 'Tres ruedas grandes',
    src: '/avatar/v3/parts/skates-speed-3w-v1.webp',
    stageWidth: '48%',
    stageTop: '58.4%',
  },
  speed3violet: {
    id: 'speed3violet',
    label: 'Speed Violet',
    description: 'Tres ruedas grandes',
    src: '/avatar/v3/parts/skates-speed-3w-v1.webp',
    stageWidth: '48%',
    stageTop: '58.4%',
    filter: colorFilters.violet,
    unlockAt: 25,
  },
  urban3: {
    id: 'urban3',
    label: 'Urban 3W',
    description: 'Tres ruedas compactas',
    src: '/avatar/v3/parts/skates-urban-3w-v1.webp',
    stageWidth: '48%',
    stageTop: '58.7%',
  },
  urban3cyan: {
    id: 'urban3cyan',
    label: 'Urban Cyan',
    description: 'Tres ruedas compactas',
    src: '/avatar/v3/parts/skates-urban-3w-v1.webp',
    stageWidth: '48%',
    stageTop: '58.7%',
    filter: colorFilters.cyan,
    unlockAt: 35,
  },
}

export const CHIBI_CATEGORIES = [
  {
    id: 'head',
    label: 'Cara',
    icon: '●',
    eyebrow: 'Cara y peinado',
    options: CHIBI_HEADS,
  },
  {
    id: 'headwear',
    label: 'Gorro',
    icon: '⌒',
    eyebrow: 'Cabeza',
    options: CHIBI_HEADWEAR,
  },
  {
    id: 'eyewear',
    label: 'Lentes',
    icon: '◎',
    eyebrow: 'Mirada',
    options: CHIBI_EYEWEAR,
  },
  {
    id: 'earrings',
    label: 'Caravanas',
    icon: '◌',
    eyebrow: 'Orejas',
    options: CHIBI_EARRINGS,
  },
  {
    id: 'piercing',
    label: 'Piercing',
    icon: '•',
    eyebrow: 'Detalles faciales',
    options: CHIBI_PIERCINGS,
  },
  {
    id: 'tattoo',
    label: 'Tattoo',
    icon: 'ϟ',
    eyebrow: 'Tatuajes',
    options: CHIBI_TATTOOS,
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
    id: 'protection',
    label: 'Protección',
    icon: '✦',
    eyebrow: 'Muñequeras',
    options: CHIBI_PROTECTIONS,
  },
  {
    id: 'skates',
    label: 'Rollers',
    icon: '⚡',
    eyebrow: 'Tres y cuatro ruedas',
    options: CHIBI_SKATES,
  },
]

export function resolveChibiSelection(value = {}) {
  return CHIBI_CATEGORIES.reduce(
    (selection, category) => {
      const requested =
        category.id === 'eyewear'
          ? value?.eyewear || value?.accessory
          : value?.[category.id]
      const fallback = DEFAULT_CHIBI_SELECTION[category.id]
      selection[category.id] = category.options[requested]
        ? requested
        : fallback
      return selection
    },
    {
      version: CHIBI_ASSET_VERSION,
      hands: DEFAULT_CHIBI_SELECTION.hands,
      wrist: 'none',
    }
  )
}

export function chibiOption(categoryId, optionId) {
  const category = CHIBI_CATEGORIES.find((item) => item.id === categoryId)
  return category?.options?.[optionId] || null
}
