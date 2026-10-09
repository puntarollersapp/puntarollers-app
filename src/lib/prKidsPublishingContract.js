// PR Kids staging-only database access contract.
// The authenticated service must use these operations after checking roles.
// Never call the service-role client from a browser.
export const PR_KIDS_POST_STATUS=Object.freeze({DRAFT:'draft',PUBLISHED:'published',ARCHIVED:'archived'})
export function postInsertFromValidated(validated,author){
 if(!validated?.valid||!author?.id||!author?.displayName)return null
 return {...validated.post,teacher_note:String(validated.teacherNote||'').slice(0,500),author_auth_user_id:author.id,author_display_name:String(author.displayName).slice(0,100),status:'draft',published_at:null}
}
export function audienceInsertRows(postId,childIds=[]){
 if(!postId||!Array.isArray(childIds))return []
 return [...new Set(childIds)].map(child_id=>({post_id:postId,child_id}))
}
export function publishTransition({post,ready,now}={}){
 if(!ready?.ready||post?.status!=='draft'||!now)return null
 return {status:'published',published_at:now}
}
export function archiveTransition(post){
 return post?.status==='published'?{status:'archived'}:null
}
export function classPostAudit({postId,actorId,action}={}){
 const allowed=new Set(['created','updated','published','archived','restored','media_added','media_removed','audience_changed'])
 if(!postId||!actorId||!allowed.has(action))return null
 return {post_id:postId,actor_auth_user_id:actorId,action,details:{}}
}
