// PR Kids: accept only the minimal fields needed for the family UI.
// Server-side authorization is mandatory; this function is defense-in-depth,
// never a substitute for verifying a guardian-child relationship on the API.
export function projectFamilyHome(payload) {
 if (!payload || payload.ok !== true || !payload.guardian || !Array.isArray(payload.children)) return null
 const guardianName=String(payload.guardian.nombre||'').trim().slice(0,100)
 const ids=new Set()
 const children=payload.children.filter(c=>{
  if(!c || typeof c.id!=='string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(c.id) || ids.has(c.id))return false
  ids.add(c.id)
  return true
 }).slice(0,12).map(c=>({
  id:c.id,
  nombre:String(c.nombre||c.nombre_confirmado||'').trim().slice(0,120),
  foto_url:typeof c.foto_url==='string' && c.foto_url.startsWith('https://')?c.foto_url:null,
  class_posts:Array.isArray(c.class_posts)?c.class_posts.filter(p=>p?.status==='published').slice(0,100):[]
 }))
 return {guardian:{nombre:guardianName||'Familia roller'},children}
}
