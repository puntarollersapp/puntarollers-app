import{useState}from'react'
import{supabase}from'../../lib/supabase'
const TYPES=[
 ['pavimento_roto','Pavimento roto'],
 ['obras','Obras / calle cortada'],
 ['arena_piedras','Arena o piedras'],
 ['transito','Cambió el tránsito'],
 ['iluminacion','Problema de iluminación'],
 ['otro','Otro cambio']
]
export default function ExplorerStatusReport({routeId,user}){
 const[open,setOpen]=useState(false),[kind,setKind]=useState('pavimento_roto'),[detail,setDetail]=useState(''),[sending,setSending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('')
 async function send(){
   if(!user?.id||sending)return
   setSending(true);setError('')
   const{error:e}=await supabase.from('pr_rollermap_route_reports').insert({route_id:routeId,created_by:user.id,guest_name:null,kind,detail:detail.trim()||null,status:'pending'})
   setSending(false)
   if(e){setError(e.message);return}
   setSent(true);setOpen(false);setDetail('')
 }
 if(sent)return <div className="rx-report-sent"><span>✓</span><div><b>Reporte recibido</b><small>Quedó pendiente de revisión por Punta Rollers.</small></div></div>
 return <div className="rx-report">{!open?<button onClick={()=>setOpen(true)}>⚠ Reportar un cambio en este tramo</button>:<div className="rx-report-form"><div className="rx-report-title"><div><small>ACTUALIZAR EL MAPA</small><b>¿Qué cambió?</b></div><button onClick={()=>setOpen(false)}>×</button></div><select value={kind} onChange={e=>setKind(e.target.value)}>{TYPES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select><textarea rows="3" maxLength="500" value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Contanos dónde está el problema o qué cambió…"/><div className="rx-report-actions"><small>{detail.length}/500</small><button disabled={sending} onClick={send}>{sending?'Enviando…':'Enviar reporte'}</button></div>{error&&<p className="rx-submiterror">{error}</p>}</div>}</div>
}
