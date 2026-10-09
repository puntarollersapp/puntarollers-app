// PR Kids family activation — pure validation; the server must re-check all
// permissions and database links in a transaction. No auth credentials here.
export function assessFamilyActivation({request,guardian,children=[],links=[],review}={}) {
 const blockers=[]
 if(!request || request.estado!=='pendiente')blockers.push('Solicitud pendiente inexistente')
 if(!review || review.identity_verified!==true)blockers.push('Identidad del adulto sin verificar')
 if(!review || review.relationship_verified!==true)blockers.push('Vínculo familiar sin verificar')
 if(!review || review.enrollment_verified!==true)blockers.push('Inscripción PR Kids sin verificar')
 if(!review || review.privacy_acknowledged!==true)blockers.push('Condiciones de privacidad pendientes')
 if(!guardian || !guardian.documento || !guardian.nombre)blockers.push('Datos del responsable incompletos')
 if(!Array.isArray(children)||!children.length)blockers.push('No hay perfiles infantiles verificados')
 const ids=new Set()
 for(const child of children){
  if(!child?.id||!child?.treasury_profile_id)blockers.push('Perfil infantil sin vínculo verificado con Tesorería')
  if(child?.id&&ids.has(child.id))blockers.push('Perfil infantil duplicado')
  ids.add(child?.id)
 }
 for(const child of children){
  if(!links.some(link=>link?.child_id===child.id && link?.guardian_id===guardian?.id && Boolean(link?.approved_at)))
   blockers.push('Falta aprobar el vínculo de un niño')
 }
 if(guardian?.adult_profile_id && guardian?.auth_user_id && guardian?.auth_profile_user_id && guardian.auth_user_id!==guardian.auth_profile_user_id)
  blockers.push('La identidad de autenticación no coincide con el perfil adulto')
 return {ready:blockers.length===0,blockers:[...new Set(blockers)]}
}
export function sanitizeFamilyHome({guardian,children=[]}={}) {
 if(!guardian || !Array.isArray(children))return null
 return {guardian:{nombre:String(guardian.nombre||'').slice(0,100)},children:children.filter(c=>c?.id&&c?.approved===true).map(c=>({id:String(c.id),nombre:String(c.nombre_confirmado||'').slice(0,120)}))}
}
