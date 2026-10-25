/** Name matching is advisory only. Never use a score to approve family access or merge financial records. */
export function normalizeKidsTreasuryName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
    .replace(/^(?:(?:pr|punta rollers)\s*)?kids?\s+/,'').trim()
}
export function rankKidsTreasuryCandidates(childName, candidates, limit=6) {
  const target=normalizeKidsTreasuryName(childName)
  const words=target.split(' ').filter(Boolean)
  if(words.length<2)return []
  return (Array.isArray(candidates)?candidates:[]).map(candidate=>{
    const display=String(candidate?.nombre||'').trim()
    const normalized=normalizeKidsTreasuryName(display)
    const parts=normalized.split(' ').filter(Boolean)
    let score=0
    if(normalized===target)score=100
    else if(normalized&&target&&(normalized.includes(target)||target.includes(normalized))&&Math.min(normalized.length,target.length)>=7)score=80
    else if(parts.length>1&&words[0]===parts[0]&&words.some(w=>w.length>3&&parts.includes(w)))score=70
    else if(parts.length>1&&words[0]===parts[0])score=35
    return {...candidate,score,reason:score===100?'Nombre exacto normalizado':score>=80?'Nombre contenido':score>=70?'Nombre y apellido parcialmente coincidentes':'Coincidencia débil'}
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(0,Math.min(limit,20)))
}

/** Only suggest reuse when exactly one unique existing profile matches the full normalized name.
 * This is a UI convenience, not authorization or permission to merge.
 */
export function suggestUniqueTreasuryProfile(childName,candidates=[]){
 const target=normalizeKidsTreasuryName(childName)
 if(target.split(' ').length<2)return null
 const exact=(Array.isArray(candidates)?candidates:[]).filter(c=>c?.profile_id&&normalizeKidsTreasuryName(c.nombre)===target)
 const ids=[...new Set(exact.map(c=>String(c.profile_id)))]
 return ids.length===1?ids[0]:null
}
export function validateKidsTreasuryAssignments(children=[],assignments={}){
 const ids=children.map((child,index)=>String(assignments[index]||''))
 const problems=[]
 if(ids.some(id=>!id))problems.push('Seleccioná un perfil existente o creá uno nuevo para cada niño.')
 if(new Set(ids.filter(Boolean)).size!==ids.filter(Boolean).length)problems.push('Un perfil de Tesorería no puede asignarse a dos niños.')
 children.forEach((child,index)=>{
  if(ids[index]&&ids[index]!=='NEW:'+(index+1)&&!(child?.matches||[]).some(candidate=>String(candidate.profile_id)===ids[index]))problems.push('Hay un perfil seleccionado que no figura entre los candidatos.')
 })
 return {valid:problems.length===0,problems}
}
