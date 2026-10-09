// PR Kids Club: pure functions shared by the staff studio and family timeline.
// This module does not grant access to any record. Authorization belongs on the server.
export function normalizeClassDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = new Date(date + 'T12:00:00')
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(date.slice(0,4)) ||
      parsed.getMonth() + 1 !== Number(date.slice(5,7)) || parsed.getDate() !== Number(date.slice(8,10))) return null
  return date
}
export function isSaturday(date) {
  const value = normalizeClassDate(date)
  return value !== null && new Date(value + 'T12:00:00').getDay() === 6
}
export function nextSaturdayDate(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}
export function formatClassDate(date) {
  if (!normalizeClassDate(date)) return 'Fecha inválida'
  return new Date(date + 'T12:00:00').toLocaleDateString('es-UY', {weekday:'long', day:'numeric', month:'long', year:'numeric'})
}
export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return []
  const seen = new Set()
  return skills.map(s => String(s || '').trim().replace(/\s+/g,' ').slice(0,60))
    .filter(s => {const key = s.toLocaleLowerCase('es-UY'); if (!s || seen.has(key)) return false; seen.add(key); return true})
    .slice(0,20)
}
export function validateClassDraft(draft) {
  const errors = []
  if (!isSaturday(draft?.date)) errors.push('Elegí una fecha de sábado válida.')
  if (String(draft?.title || '').trim().length < 4 || String(draft?.title || '').trim().length > 100) errors.push('El título debe tener entre 4 y 100 caracteres.')
  if (String(draft?.summary || '').trim().length < 12 || String(draft?.summary || '').trim().length > 2000) errors.push('El resumen debe tener entre 12 y 2000 caracteres.')
  if (String(draft?.teacherNote || '').length > 500) errors.push('El mensaje del profesor es demasiado largo.')
  if (normalizeSkills(draft?.skills).length > 20) errors.push('Hay demasiadas habilidades.')
  return errors
}
export function sortClassPosts(posts) {
  return [...(Array.isArray(posts) ? posts : [])].sort((a,b) => {
    const byDate = String(b.class_date || b.date || '').localeCompare(String(a.class_date || a.date || ''))
    return byDate || String(b.created_at || '').localeCompare(String(a.created_at || ''))
  })
}
export function filterClassPosts(posts, {date='all', query=''}={}) {
  const term = String(query).trim().toLocaleLowerCase('es-UY')
  return sortClassPosts(posts).filter(post => {
    if (date !== 'all' && (post.class_date || post.date) !== date) return false
    const text = [post.title, post.summary, post.detail, post.teacherName, post.author_display_name, ...(post.skills || [])].join(' ').toLocaleLowerCase('es-UY')
    return !term || text.includes(term)
  })
}
