import { useEffect, useRef, useState } from 'react'
import { downloadOraclePlaque, oracleFilename, renderOraclePlaque, shareOraclePlaque } from '../lib/oraclePlaque'

// The parent keys this component by story and viewer; navigation unmounts it.
export default function OracleShare({slide}){
 const [blob,setBlob]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const generation=useRef(0),locked=useRef(false),live=useRef(false)
 useEffect(()=>{live.current=true;return()=>{live.current=false;generation.current++}},[])
 const filename=oracleFilename(slide)
 async function prepare(){
  if(locked.current)return
  locked.current=true;const token=++generation.current
  setBusy(true);setBlob(null);setNotice('')
  try{
   const image=await renderOraclePlaque(slide)
   if(live.current&&token===generation.current){setBlob(image);setNotice('¡Tu placa está lista!')}
  }catch{if(live.current&&token===generation.current)setNotice('No pudimos generar la placa. Probá de nuevo.')}
  finally{if(live.current&&token===generation.current){locked.current=false;setBusy(false)}}
 }
 function save(){
  if(!blob||locked.current)return
  try{downloadOraclePlaque(blob,filename);setNotice('Elegí el PNG descargado desde tu galería o Archivos para subirlo a Instagram.')}
  catch{setNotice('No pudimos descargar la imagen. Probá de nuevo.')}
 }
 async function share(){
  if(!blob||locked.current)return
  locked.current=true;const token=++generation.current;setBusy(true)
  try{
   const result=await shareOraclePlaque(blob,filename)
   if(live.current&&token===generation.current&&result==='downloaded')setNotice('Tu dispositivo no pudo compartir el archivo directamente. Elegí el PNG descargado desde tu galería o Archivos para subirlo a Instagram.')
  }catch{if(live.current&&token===generation.current)setNotice('No pudimos compartir la placa. Probá guardarla.')}
  finally{if(live.current&&token===generation.current){locked.current=false;setBusy(false)}}
 }
 return <div className="prw-oracle-share">
  {!blob?<button type="button" onClick={prepare} disabled={busy}>{busy?'Generando placa…':'Compartir esta placa'}</button>:<div className="prw-oracle-share-options"><button type="button" onClick={save} disabled={busy}>Guardar para Instagram</button><button type="button" onClick={share} disabled={busy}>{busy?'Compartiendo…':'Compartir en mis redes'}</button></div>}
  {notice&&<p role="status">{notice}</p>}
 </div>
}
