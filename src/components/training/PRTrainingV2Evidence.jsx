import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const bucket = 'pr-training-v2-evidence'
const accepted = ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
export default function PRTrainingV2Evidence({ profileId, assignmentDutyId, onSubmitted }) {
 const [files,setFiles]=useState([])
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function submit(event){
  event.preventDefault()
  if(busy)return
  if(!profileId||!assignmentDutyId){setMessage('Falta identificar el deber.');return}
  if(files.length<1||files.length>3||files.some(f=>!accepted.includes(f.type)||f.size>104857600)){setMessage('Elegí entre 1 y 3 fotos o videos, de hasta 100 MB cada uno.');return}
  setBusy(true);setMessage('')
  try{
   const paths=[]
   for(const file of files){
    const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase()
    const path=profileId+'/'+assignmentDutyId+'/'+crypto.randomUUID()+'.'+ext
    const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type})
    if(error)throw error
    paths.push(path)
   }
   const {data,error}=await supabase.rpc('pr_training_v2_submit_evidence',{p_assignment_duty_id:assignmentDutyId,p_paths:paths})
   if(error||!data?.ok)throw error||new Error('No se pudo registrar la entrega.')
   setFiles([]);setMessage('Evidencia enviada para revisión.');onSubmitted?.(data)
  }catch(error){setMessage(error.message||'Error al enviar la evidencia.')}
  finally{setBusy(false)}
 }
 return <form onSubmit={submit} className="rounded-2xl border border-white/15 p-5">
  <h3 className="text-lg font-bold">Enviar evidencia</h3>
  <p className="mt-2 text-sm opacity-70">Adjuntá de una a tres fotos o videos para que el profesor los revise.</p>
  <input type="file" multiple accept={accepted.join(',')} disabled={busy} onChange={e=>{setFiles(Array.from(e.target.files||[]));setMessage('')}} className="mt-4 block w-full text-sm" aria-label="Seleccionar evidencias"/>
  {files.length>3&&<p role="alert" className="mt-2 text-xs text-[#FF0055]">Máximo tres archivos por entrega.</p>}
  {files.length>0&&<p className="mt-2 text-xs opacity-70">{files.length} archivo{files.length===1?'':'s'} seleccionado{files.length===1?'':'s'}</p>}
  <button type="submit" disabled={busy||files.length<1||files.length>3} className="mt-4 rounded-full bg-[#BBFF1F] px-5 py-3 font-bold text-[#0D0303] disabled:opacity-40">{busy?'Enviando…':'Enviar evidencia'}</button>
  {message&&<p role="status" className="mt-3 text-sm">{message}</p>}
 </form>
}
