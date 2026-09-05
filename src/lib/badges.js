const BADGE_IMAGES = {
  'travesia la barra 19k': '/insignias-pr/travesia-la-barra-19k-1.png?v=4',
  'primer evento pr': '/insignias-pr/primer-evento-pr.png',
  'rodador frecuente': '/insignias-pr/rodador-frecuente.png',
  'espiritu pr': '/insignias-pr/espiritu-pr.png',
  'primeros 6k': '/insignias-pr/primeros-6k.png',
  'primeros 10k': '/insignias-pr/primeros-10k.png',
  'ya frena en t': '/insignias-pr/frena-en-t.png',
  'frena en t': '/insignias-pr/frena-en-t.png',
  'ya frena con taco': '/insignias-pr/frena-con-taco.png',
  'frena con taco': '/insignias-pr/frena-con-taco.png',
  'buen companero': '/insignias-pr/buen-companero.png',
  'actitud positiva': '/insignias-pr/actitud-positiva.png',
  'entrenador potencial': '/insignias-pr/entrenador-potencial.png',
  'primera clinica 2026': '/insignias-pr/primera-clinica-2026.webp?v=1',
}

export function normalizeBadgeTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function getBadgeImage(title) {
  const normalizedTitle = normalizeBadgeTitle(title)

  if (
    normalizedTitle.includes('travesia') &&
    normalizedTitle.includes('la barra') &&
    (normalizedTitle.includes('19k') ||
      normalizedTitle.includes('19 km') ||
      normalizedTitle.includes('19 kilometros'))
  ) {
    return BADGE_IMAGES['travesia la barra 19k']
  }

  return BADGE_IMAGES[normalizedTitle] || ''
}
