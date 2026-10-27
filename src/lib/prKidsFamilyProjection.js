import {normalizeFamilyClassPost} from './prKidsClassPosts.js'
// PR Kids: accept only the minimal fields needed for the family UI.
// Server-side authorization is mandatory; this function is defense-in-depth,
// never a substitute for verifying a guardian-child relationship on the API.
export function projectFamilyHome(payload) {
 if (!payload || payload.ok !== true || !payload.guardian || !Array.isArray(payload.children)) return null
 const guardianName=String(payload.guardian.nombre||'').trim().slice(0,100)
 const ids=new Set()
 const children=payload.children.filter(c=>{
  if(!c || typeof c.id!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id) || ids.has(c.id))return false
  ids.add(c.id)
  return true
 }).slice(0,12).map(c=>({
  id:c.id,
  nombre:String(c.nombre||c.nombre_confirmado||'').trim().slice(0,120),
  fecha_nacimiento:typeof c.fecha_nacimiento==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(c.fecha_nacimiento)?c.fecha_nacimiento:null,
  foto_url:typeof c.foto_url==='string' && c.foto_url.startsWith('https://')?c.foto_url:null,
  class_posts:Array.isArray(c.class_posts)?c.class_posts.filter(p=>p?.status==='published').slice(0,100).map(normalizeFamilyClassPost).filter(Boolean):[],
  achievements:Array.isArray(c.achievements)?c.achievements.slice(0,100).map(a=>({id:String(a.id||''),title:String(a.title||'').slice(0,100),description:String(a.description||'').slice(0,500),icon:String(a.icon||'🏅').slice(0,12),awarded_at:a.awarded_at})):[],
  memories:Array.isArray(c.memories)?c.memories.slice(0,60).map(m=>({id:String(m.id||''),title:String(m.title||'').slice(0,100),caption:String(m.caption||'').slice(0,500),media_type:m.media_type||null,created_at:m.created_at})):[]
 }))
 return {guardian:{nombre:guardianName||'Familia roller'},children}
}
