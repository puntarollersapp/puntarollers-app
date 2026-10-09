// PR Kids passport arithmetic. All inputs must come from a server-authorized
// attendance ledger; never trust client-provided counts for redemption.
export function calculatePassportBalance({attendance=[],redemptions=[]}={}) {
 const seen=new Set()
 const valid=attendance.filter(event=>{
  if (!event || event.voided_at || !event.source_event_id) return false
  const key=String(event.attendance_source||'scanner')+':'+String(event.source_event_id)
  if(seen.has(key))return false
  seen.add(key)
  return true
 })
 const used=redemptions.filter(r=>r && r.counts_as_spent===true).reduce((n,r)=>n+Math.max(0,Math.floor(Number(r.stamps_used)||0)),0)
 return {earned:valid.length,used,available:Math.max(0,valid.length-used),inconsistent:used>valid.length}
}
export function normalizeRewardCatalog(items=[]) {
 if(!Array.isArray(items))return []
 return items.filter(r=>r && r.activo===true && Number.isInteger(Number(r.sellos)) && Number(r.sellos)>0)
  .map(r=>({id:String(r.id),title:String(r.nombre||'').trim().slice(0,100),requiredStamps:Number(r.sellos),stockAvailable:Math.max(0,(Number(r.stock_total)||0)-(Number(r.stock_reservado)||0)-(Number(r.stock_entregado)||0)),level:String(r.nivel||'')}))
  .sort((a,b)=>a.requiredStamps-b.requiredStamps||a.title.localeCompare(b.title,'es'))
}
