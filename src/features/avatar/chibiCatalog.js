export const CHIBI_ASSET_VERSION = 7

export const DEFAULT_CHIBI_SELECTION = {
  version: CHIBI_ASSET_VERSION,
  head: 'masculine',
  headwear: 'none',
  helmet: 'none',
  eyewear: 'none',
  earrings: 'none',
  piercing: 'none',
  jersey: 'orange',
  sticker: 'none',
  shorts: 'orange',
  protection: 'flex',
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
  bucket: {
    id: 'bucket',
    label: 'Bucket Street',
    description: 'Piluso técnico',
    src: '/avatar/v3/accessories/headwear-bucket-v1.webp',
    stageWidth: '44%',
    stageTop: '-3%',
    portraitWidth: '80%',
    portraitTop: '-14%',
    unlockAt: 20,
  },
  backwards: {
    id: 'backwards',
    label: 'Backwards',
    description: 'Gorra hacia atrás',
    src: '/avatar/v3/accessories/headwear-backwards-v1.webp',
    stageWidth: '50%',
    stageTop: '-4%',
    portraitWidth: '90%',
    portraitTop: '-19%',
    unlockAt: 25,
  },
}

export const CHIBI_EYEWEAR = {
  none: {
    id: 'none',
    label: 'Sin lentes',
    description: 'Cara libre',
    kind: 'none',
  },
  round: {
    id: 'round',
    label: 'Round Street',
    description: 'Redondos y abiertos',
    src: '/avatar/v3/accessories/glasses-round-v1.webp',
    stageWidth: '30%',
    stageTop: '11.4%',
    portraitWidth: '52%',
    portraitTop: '23%',
  },
  halfrim: {
    id: 'halfrim',
    label: 'Aero Half',
    description: 'Media montura técnica',
    src: '/avatar/v3/accessories/glasses-halfrim-v1.webp',
    stageWidth: '31%',
    stageTop: '12.2%',
    portraitWidth: '54%',
    portraitTop: '25%',
    unlockAt: 15,
  },
  retro: {
    id: 'retro',
    label: 'Retro Amber',
    description: 'Rectangulares translúcidos',
    src: '/avatar/v3/accessories/glasses-retro-v1.webp',
    stageWidth: '25%',
    stageTop: '12.4%',
    portraitWidth: '44%',
    portraitTop: '25%',
    unlockAt: 25,
  },
}

export const CHIBI_HELMETS = {
  none: {
    id: 'none',
    label: 'Sin casco',
    description: 'Peinado o gorro libre',
    kind: 'none',
  },
  punk: {
    id: 'punk',
    label: 'Punk Spike',
    description: 'Casco roller con cresta',
    src: '/avatar/v3/accessories/helmet-punk-v1.webp',
    stageWidth: '60%',
    stageTop: '-6.5%',
    portraitWidth: '108%',
    portraitTop: '-21.5%',
    unlockAt: 20,
  },
  street: {
    id: 'street',
    label: 'Street Splash',
    description: 'Casco roller urbano',
    src: '/avatar/v3/accessories/helmet-street-v1.webp',
    stageWidth: '56%',
    stageTop: '-5.8%',
    portraitWidth: '100%',
    portraitTop: '-19%',
    unlockAt: 30,
  },
  retro: {
    id: 'retro',
    label: 'Retro Bolt',
    description: 'Casco roller ventilado',
    src: '/avatar/v3/accessories/helmet-retro-v1.webp',
    stageWidth: '58%',
    stageTop: '-6%',
    portraitWidth: '105%',
    portraitTop: '-20%',
    unlockAt: 40,
  },
}

// Alias temporal: evita romper imports o avatares de la versión 2.
export const CHIBI_ACCESSORIES = CHIBI_EYEWEAR

const earringsSrc = '/avatar/v3/accessories/earrings-hoop-small-v1.webp'
const earringsStageByHead = {
  masculine: { width: '55%', top: '4.5%' },
}
const earringsPortraitByHead = {
  masculine: { width: '104%', top: '0%' },
}

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
    stageWidth: '43%',
    stageTop: '9.5%',
    stageByHead: earringsStageByHead,
    portraitByHead: earringsPortraitByHead,
  },
  violet: {
    id: 'violet',
    label: 'Aros Violet',
    description: 'Aros violetas',
    src: earringsSrc,
    stageWidth: '43%',
    stageTop: '9.5%',
    stageByHead: earringsStageByHead,
    portraitByHead: earringsPortraitByHead,
    filter: colorFilters.violet,
    unlockAt: 20,
  },
  cyan: {
    id: 'cyan',
    label: 'Aros Cyan',
    description: 'Aros cyan',
    src: earringsSrc,
    stageWidth: '43%',
    stageTop: '9.5%',
    stageByHead: earringsStageByHead,
    portraitByHead: earringsPortraitByHead,
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
const skatesSrc = '/avatar/v3/parts/skates-orange-v1.webp'

export const CHIBI_JERSEYS = {
  orange: coloredOption('orange', 'PR Orange', '#ff7417', jerseySrc),
  violet: coloredOption('violet', 'PR Violet', '#8b5cf6', jerseySrc, 15),
  cyan: coloredOption('cyan', 'PR Cyan', '#22d3ee', jerseySrc, 30),
  ice: coloredOption('ice', 'PR Ice', '#f2f4f7', jerseySrc, 45),
  hoodie: {
    id: 'hoodie',
    label: 'Street Hoodie',
    description: 'Buzo técnico con cierre',
    src: '/avatar/v3/parts/jersey-hoodie-v1.webp',
    unlockAt: 20,
  },
  racing: {
    id: 'racing',
    label: 'Racing Zip',
    description: 'Jersey de carrera',
    src: '/avatar/v3/parts/jersey-racing-v1.webp',
    unlockAt: 35,
  },
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
  cargo: {
    id: 'cargo',
    label: 'Cargo Street',
    description: 'Bolsillos técnicos',
    src: '/avatar/v3/parts/short-cargo-v1.webp',
    unlockAt: 20,
  },
  racing: {
    id: 'racing',
    label: 'Racing Fit',
    description: 'Calce deportivo',
    src: '/avatar/v3/parts/short-racing-v1.webp',
    unlockAt: 35,
  },
}

export const CHIBI_PROTECTIONS = {
  flex: {
    id: 'flex',
    label: 'PR Flex',
    description: 'Mano y muñequera ligera',
    src: '/avatar/v3/parts/handpack-flex-v2.webp',
    stageWidth: '62%',
    stageTop: '33%',
  },
  street: {
    id: 'street',
    label: 'PR Street',
    description: 'Guante urbano integrado',
    src: '/avatar/v3/parts/handpack-street-v2.webp',
    stageWidth: '62%',
    stageTop: '33%',
    unlockAt: 15,
  },
  pulse: {
    id: 'pulse',
    label: 'PR Pulse',
    description: 'Muñequera técnica integrada',
    src: '/avatar/v3/parts/handpack-pulse-v2.webp',
    stageWidth: '62%',
    stageTop: '33%',
    unlockAt: 30,
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
  aggressive: {
    id: 'aggressive',
    label: 'Park Aggressive',
    description: 'Bota y guía reforzadas',
    src: '/avatar/v3/parts/skates-aggressive-v1.webp',
    stageWidth: '52%',
    stageTop: '58%',
    unlockAt: 25,
  },
  fitness: {
    id: 'fitness',
    label: 'Fitness Flow',
    description: 'Softboot y ruedas cyan',
    src: '/avatar/v3/parts/skates-fitness-v1.webp',
    stageWidth: '52%',
    stageTop: '56.8%',
    unlockAt: 30,
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
    id: 'helmet',
    label: 'Casco',
    icon: '◒',
    eyebrow: 'Protección roller',
    options: CHIBI_HELMETS,
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
      wrist: 'none',
      tattoo: 'none',
    }
  )
}

export function chibiOption(categoryId, optionId) {
  const category = CHIBI_CATEGORIES.find((item) => item.id === categoryId)
  return category?.options?.[optionId] || null
}
