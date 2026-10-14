import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const BUCKET='pr-training-v2-demos'
export default function PRTrainingV2DemoUpload({duty,onUploaded}){
 const [file,setFile]=useState(null)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function upload(e){
  e.preventDefault()
  if(!file||!duty?.code)return
  if(!['video/mp4','video/quicktime','video/webm'].includes(file.type)||file.size>104857600){setMessage('Usá un video MP4, MOV o WebM de hasta 100 MB.');return}
  setBusy(true);setMessage('')
  const ext=file.name.split('.').pop().replace(/[^a-z0-9]/gi,'').toLowerCase()
  const path=duty.code+'/'+crypto.randomUUID()+'.'+ext
  try{
   const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false})
   if(uploadError)throw uploadError
   const {error:saveError}=await supabase.rpc('pr_training_v2_admin_attach_demo',{p_code:duty.code,p_path:path})
   if(saveError)throw saveError
   setMessage('Video asociado. Pendiente de validar.');setFile(null);onUploaded?.()
  }catch(error){setMessage(error.message||'No se pudo guardar el video.')}
  finally{setBusy(false)}
 }
 return <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
  <input aria-label={'Video para '+duty.code} type="file" accept="video/mp4,video/quicktime,video/webm" disabled={busy} onChange={e=>setFile(e.target.files?.[0]||null)} className="max-w-[180px] text-xs"/>
  <button disabled={busy||!file} className="rounded-lg bg-[#BBFF1F] px-3 py-2 text-xs font-bold text-[#0D0303] disabled:opacity-40">{busy?'Subiendo…':'Subir video'}</button>
  {message&&<span role="status" className="text-xs text-white/60">{message}</span>}
 </form>
}
