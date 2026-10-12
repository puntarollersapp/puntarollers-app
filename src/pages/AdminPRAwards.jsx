import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TABLES=[
 ['categories','pr_awards_categories','Categorías'],
 ['suggestions','pr_awards_suggestions','Propuestas'],
 ['nominations','pr_awards_nominations','Postulaciones'],
 ['candidates','pr_awards_candidates','Candidatos'],
 ['finalists','pr_awards_finalists','Finalistas'],
 ['votes','pr_awards_votes','Votos'],
 ['settings','pr_awards_settings','Configuración'],
]
const friendlyError=e=>e?.code==='42P01'?'Las tablas de PR Awards todavía no están instaladas.':e?.code==='42501'?'El servidor no autorizó la consulta. Revisá los permisos administrativos.':'No fue posible consultar los datos de PR Awards.'
export default function AdminPRAwards(){
 const [data,setData]=useState({})
 const [errors,setErrors]=useState({})
 const [loading,setLoading]=useState(true)
 const [active,setActive]=useState('nominations')
 const refresh=async()=>{setLoading(true);const results=await Promise.all(TABLES.map(async([key,table])=>{const {data,error}=await supabase.from(table).select('*').limit(500);return {key,data,error}}));setData(Object.fromEntries(results.map(r=>[r.key,r.data||[]])));setErrors(Object.fromEntries(results.filter(r=>r.error).map(r=>[r.key,friendlyError(r.error)])));setLoading(false)}
 useEffect(()=>{refresh()},[])
 const tabs=useMemo(()=>TABLES.filter(([key])=>key!=='settings'),[])
 const rows=data[active]||[]
 const publicFields={categories:['title','section','description','is_active','is_automatic'],suggestions:['proposed_title','description','moderation_status','created_at'],nominations:['category_id','candidate_id','manual_name','created_at'],candidates:['display_name','is_public','created_at'],finalists:['category_id','candidate_id','finalist_position'],votes:['finalist_id','created_at']}
 return <main className="min-h-screen bg-[#0f0e0c] px-4 py-8 text-[#f2e9d9] sm:px-8">
  <div className="mx-auto max-w-6xl">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><Link to="/admin" className="text-xs font-bold text-[#d5b371]">← Centro de Control</Link><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#c6a46d]">Punta Rollers · Administración</p><h1 className="mt-2 text-3xl font-black">PR Awards 2026</h1><p className="mt-2 text-sm text-[#c9bca7]">Centro de seguimiento privado. Los votos y las postulaciones no se publican aquí para visitantes.</p></div><button type="button" disabled={loading} onClick={refresh} className="rounded-xl border border-[#bda478]/40 px-5 py-3 text-sm font-bold text-[#e4c58d] disabled:opacity-40">Actualizar datos</button></div>
   <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Categorías','categories'],['Postulaciones','nominations'],['Propuestas','suggestions'],['Votos','votes']].map(([label,key])=><div key={key} className="rounded-2xl border border-[#bda478]/20 bg-[#1d1914] p-5"><p className="text-xs text-[#c6b89f]">{label}</p><p className="mt-3 text-3xl font-black text-[#e1bd77]">{errors[key]?'—':loading?'…':data[key]?.length??0}</p><p className="mt-2 text-[11px] text-[#a99a82]">{errors[key]?'No disponible':'Hasta 500 registros consultados'}</p></div>)}</div>
   {Object.keys(errors).length>0&&<div role="alert" className="mt-5 rounded-2xl border border-[#d2b478]/35 bg-[#2a2115] p-5 text-sm leading-6 text-[#e9ce9b]"><strong>Conexión administrativa incompleta.</strong> {Object.values(errors)[0]} No se modificó ningún dato. Este panel no permite cambios hasta verificar la seguridad del backend.</div>}
   <div className="mt-8 flex flex-wrap gap-2">{tabs.map(([key,,label])=><button key={key} type="button" onClick={()=>setActive(key)} className={`rounded-full px-4 py-2 text-xs font-bold ${active===key?'bg-[#d5b371] text-[#15110b]':'border border-[#bda478]/25 text-[#c9bda8]'}`}>{label}</button>)}</div>
   <section className="mt-5 overflow-hidden rounded-2xl border border-[#bda478]/20 bg-[#1d1914]"><div className="border-b border-[#bda478]/20 p-5"><h2 className="font-bold">{TABLES.find(x=>x[0]===active)?.[2]}</h2><p className="mt-2 text-xs text-[#b9ad98]">Vista de consulta. Las acciones de aprobación, selección de finalistas y configuración requieren permisos verificados del servidor.</p></div>{errors[active]?<p className="p-5 text-sm text-[#d8bd8c]">{errors[active]}</p>:loading?<p className="p-5 text-sm">Consultando…</p>:rows.length===0?<p className="p-5 text-sm text-[#b9ad98]">No hay registros para mostrar.</p>:<div className="max-h-[32rem] overflow-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead className="sticky top-0 bg-[#30291f]"><tr>{(publicFields[active]||[]).map(k=><th key={k} className="p-3 font-bold">{k.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i} className="border-t border-[#bda478]/10">{(publicFields[active]||[]).map(k=><td key={k} className="max-w-60 break-words p-3 text-[#d6c7ad]">{r[k]===null?'—':typeof r[k]==='boolean'?(r[k]?'Sí':'No'):String(r[k]??'—')}</td>)}</tr>)}</tbody></table></div>}</section>
   <p className="mt-6 text-xs leading-6 text-[#ad9e87]">Solo para personal autorizado. El acceso a esta ruta está protegido por el guardián de administración de Punta Rollers y debe complementarse con permisos RLS en Supabase.</p>
  </div>
 </main>
}
