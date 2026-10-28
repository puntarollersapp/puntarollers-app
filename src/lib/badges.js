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

// Shared official PR insignia catalog. Reuse existing artwork for PR Kids.
export const PR_KIDS_BADGE_CATALOG = [
 {title:'Primer evento PR',description:'Participó en su primer evento de Punta Rollers.'},
 {title:'Rodador frecuente',description:'Reconocimiento a su constancia sobre ruedas.'},
 {title:'Espíritu PR',description:'Representa los valores de Punta Rollers.'},
 {title:'Primeros 6K',description:'Completó sus primeros 6 kilómetros.'},
 {title:'Primeros 10K',description:'Completó sus primeros 10 kilómetros.'},
 {title:'Ya frena en T',description:'Aprendió a frenar en T.'},
 {title:'Ya frena con taco',description:'Aprendió a frenar con taco.'},
 {title:'Buen compañero',description:'Se destacó por acompañar a sus compañeros.'},
 {title:'Actitud positiva',description:'Se destacó por su actitud positiva.'},
 {title:'Entrenador potencial',description:'Demostró iniciativa y espíritu de colaboración.'},
].map(item=>({...item,image:getBadgeImage(item.title)}))
