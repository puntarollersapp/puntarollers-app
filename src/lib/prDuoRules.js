/** PR DUO: pure validation helpers. No database writes or Strava API calls. */
export const DUO_STATES = Object.freeze(['invited','accepted','submitted','approved','rejected','cancelled'])
export const DUO_TRANSITIONS = Object.freeze({
 invited:['accepted','cancelled'],
 accepted:['submitted','cancelled'],
 submitted:['approved','rejected'],
 rejected:['submitted','cancelled'],
 approved:[],
 cancelled:[]
})
export function canTransitionDuo(from,to){return Boolean(DUO_TRANSITIONS[from]?.includes(to))}
export function validateDuoParticipants(creatorId,partnerId){
 if(typeof creatorId!=='string'||!creatorId.trim())return {ok:false,reason:'missing_creator'}
 if(typeof partnerId!=='string'||!partnerId.trim())return {ok:false,reason:'missing_partner'}
 if(creatorId===partnerId)return {ok:false,reason:'same_profile'}
 return {ok:true}
}
export function duoProgressPercent(approved,total){
 if(!Number.isInteger(total)||total<1)return null
 const n=Math.min(total,Math.max(0,Number(approved)||0))
 return Math.round(100*n/total)
}
/** A review must validate both independently owned Strava activities.
 * Same time window does NOT prove they traveled together.
 * No pace/speed comparison: collaboration, not racing.
 */
export function validateDuoActivityPair(first,second,{minimumMeters=0,maxStartGapMinutes=45}={}){
 if(!first||!second)return {ok:false,reason:'missing_activity'}
 if(!first.profileId||!second.profileId||first.profileId===second.profileId)return {ok:false,reason:'invalid_owners'}
 if(!first.stravaActivityId||!second.stravaActivityId)return {ok:false,reason:'missing_strava_reference'}
 if(!Number.isFinite(first.distanceMeters)||!Number.isFinite(second.distanceMeters)||first.distanceMeters<minimumMeters||second.distanceMeters<minimumMeters)return {ok:false,reason:'distance_below_target'}
 const t1=Date.parse(first.startedAt),t2=Date.parse(second.startedAt)
 if(!Number.isFinite(t1)||!Number.isFinite(t2))return {ok:false,reason:'invalid_dates'}
 if(Math.abs(t1-t2)>maxStartGapMinutes*60000)return {ok:false,reason:'different_time_window'}
 return {ok:true,requiresManualReview:true,reason:'time_and_distance_compatible_not_proof_of_togetherness'}
}
