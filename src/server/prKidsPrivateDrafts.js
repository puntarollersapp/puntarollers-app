// Private PR Kids publication storage adapter.
// Server-only: pass an authenticated, role-checked database client.
// No browser imports and no service credentials in this module.
import {validatePrivatePost} from '../lib/prKidsPrivatePublishing.js'
import {postInsertFromValidated,audienceInsertRows,classPostAudit} from '../lib/prKidsPublishingContract.js'
export async function createPrivateClassDraft({db,input,author,authorized=false}={}){
 if(!authorized||!db||!author?.id)return {ok:false,error:'Acceso no autorizado'}
 const validated=validatePrivatePost(input)
 if(!validated.valid)return {ok:false,error:'Publicación inválida',details:validated.errors}
 const row=postInsertFromValidated({...validated,teacherNote:input.teacher_note},author)
 if(!row)return {ok:false,error:'Autor inválido'}
 const {data:post,error:postError}=await db.from('pr_kids_class_posts').insert(row).select('id,status').single()
 if(postError||!post?.id)return {ok:false,error:'No se pudo guardar el borrador'}
 const audience=audienceInsertRows(post.id,input.audience_child_ids)
 const {error:audienceError}=await db.from('pr_kids_class_post_audience').insert(audience)
 if(audienceError){
  const {error:cleanupError}=await db.from('pr_kids_class_posts').delete().eq('id',post.id).eq('status','draft')
  return {ok:false,error:cleanupError?'Guardado parcial; requiere revisión':'No se pudieron guardar destinatarios'}
 }
 const audit=classPostAudit({postId:post.id,actorId:author.id,action:'created'})
 const {error:auditError}=await db.from('pr_kids_class_post_audit').insert(audit)
 if(auditError)return {ok:false,error:'Borrador creado sin auditoría; requiere revisión',post_id:post.id}
 return {ok:true,post_id:post.id,status:'draft'}
}
