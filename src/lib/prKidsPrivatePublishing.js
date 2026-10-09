import {isSaturday,normalizeSkills} from './prKidsClassPosts.js'
export function validatePrivatePost(input) {
 const errors=[]
 if(!isSaturday(input?.class_date))errors.push('Fecha de clase inválida')
 const title=String(input?.title||'').trim()
 const summary=String(input?.summary||'').trim()
 if(title.length<4||title.length>100)errors.push('Título inválido')
 if(summary.length<12||summary.length>2000)errors.push('Resumen inválido')
 if(!Array.isArray(input?.audience_child_ids)||!input.audience_child_ids.length)errors.push('Sin destinatarios')
 return {valid:errors.length===0,errors,post:{class_date:input?.class_date,title,summary,skills:normalizeSkills(input?.skills)}}
}
export function canPublishPrivatePost({post,media=[],audience=[]}={}) {
 const blockers=[]
 if(post?.status!=='draft'||!isSaturday(post?.class_date))blockers.push('Borrador inválido')
 if(!audience.length||audience.some(a=>!a?.approved_child))blockers.push('Destinatarios no aprobados')
 if(media.some(m=>!['image/jpeg','image/png','image/webp'].includes(m?.content_type)||m?.consent_confirmed!==true))blockers.push('Medios no autorizados')
 return {ready:blockers.length===0,blockers}
}
