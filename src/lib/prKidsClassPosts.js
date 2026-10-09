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
  if (Array.isArray(draft?.skills) && draft.skills.length > 20) errors.push('Hay demasiadas habilidades.')
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

// Local draft-only backup: no photographs, student identifiers or access tokens.
export function serializeLocalClassDraft(draft) {
  if (validateClassDraft(draft).some(e => e.includes('demasiado'))) return null
  return JSON.stringify({version:1,date:normalizeClassDate(draft?.date),title:String(draft?.title||'').slice(0,100),summary:String(draft?.summary||'').slice(0,2000),teacherNote:String(draft?.teacherNote||'').slice(0,500),skills:normalizeSkills(draft?.skills)})
}
export function parseLocalClassDraft(raw) {
  try {
    const data=JSON.parse(raw)
    if (data?.version!==1 || !data.date || !normalizeClassDate(data.date)) return null
    return {date:data.date,title:String(data.title||'').slice(0,100),summary:String(data.summary||'').slice(0,2000),teacherNote:String(data.teacherNote||'').slice(0,500),skills:normalizeSkills(data.skills)}
  } catch { return null }
}

// Canonical client-side shape for an eventual server-provided timeline.
// Do not use this helper to determine authorization: the server must filter first.
export function normalizeFamilyClassPost(post) {
  if (!post || !isSaturday(post.class_date || post.date)) return null
  const status=post.status
  if (status && status!=='published') return null
  return {
    id:String(post.id||''),
    date:post.class_date||post.date,
    title:String(post.title||'').slice(0,100),
    detail:String(post.summary||post.detail||'').slice(0,2000),
    skills:normalizeSkills(post.skills),
    teacher:String(post.author_display_name||post.teacherName||'Profesor/a'),
    note:String(post.teacher_note||post.note||'').slice(0,500),
    avatar:typeof post.teacher_avatar_url==='string'?post.teacher_avatar_url:null,
    photos:[] // Images require a separate, consent-checked signed URL request.
  }
}
