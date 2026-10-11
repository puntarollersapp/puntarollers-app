import {isSaturday,normalizeSkills} from './prKidsClassPosts.js'
export function validatePrivatePost(input) {
 const errors=[]
 if(!isSaturday(input?.class_date))errors.push('Fecha de clase inválida')
 const title=String(input?.title||'').trim()
 const summary=String(input?.summary||'').trim()
 if(title.length<4||title.length>100)errors.push('Título inválido')
 if(summary.length<12||summary.length>2000)errors.push('Resumen inválido')
 if(!Array.isArray(input?.audience_child_ids)||!input.audience_child_ids.length||input.audience_child_ids.some(id=>typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))errors.push('Destinatarios inválidos')
 return {valid:errors.length===0,errors,post:{class_date:input?.class_date,title,summary,skills:normalizeSkills(input?.skills)}}
}
export function canPublishPrivatePost({post,media=[],audience=[]}={}) {
 const blockers=[]
 if(post?.status!=='draft'||!isSaturday(post?.class_date))blockers.push('Borrador inválido')
 if(!Array.isArray(audience)||!audience.length||audience.some(a=>!a?.approved_child))blockers.push('Destinatarios no aprobados')
 if(!Array.isArray(media)||media.some(m=>!['image/jpeg','image/png','image/webp'].includes(m?.content_type)||m?.consent_confirmed!==true))blockers.push('Medios no autorizados')
 return {ready:blockers.length===0,blockers}
}
