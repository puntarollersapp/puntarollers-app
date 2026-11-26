import {supabase} from './supabase'
const pending=new Map()
export function readCommunityCounts(profileId){
 if(!profileId)return Promise.resolve({data:{notifications:0,messages:0,requests:0,total:0},error:null})
 if(pending.has(profileId))return pending.get(profileId)
 const task=Promise.resolve(supabase.rpc('pr_community_badge_counts')).finally(()=>{if(pending.get(profileId)===task)pending.delete(profileId)})
 pending.set(profileId,task)
 return task
}
