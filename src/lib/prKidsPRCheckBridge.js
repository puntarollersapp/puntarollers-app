// PR Check -> PR Kids: read-only candidate reconciliation.
// This does not write stamps or confer guardian access.
// Only server-verified scans and explicit child/profile mappings are eligible.
export function reconcileKidsCheckIns({scans=[],childProfiles=[]}={}) {
 const profileToChild=new Map()
 for(const link of childProfiles){
  if(!link?.child_id||!link?.profile_id||link.verified!==true)continue
  const key=String(link.profile_id)
  if(profileToChild.has(key)&&profileToChild.get(key)!==link.child_id)profileToChild.set(key,null)
  else if(!profileToChild.has(key))profileToChild.set(key,String(link.child_id))
 }
 const seen=new Set(),eligible=[],skipped={unverified:0,unmapped:0,duplicate:0,invalid:0}
 for(const scan of Array.isArray(scans)?scans:[]){
  const eventId=scan?.id,profileId=scan?.profile_id
  if(eventId===null||eventId===undefined||!profileId||!scan?.scanned_at){skipped.invalid++;continue}
  if(scan.confirmed!==true||scan.voided_at){skipped.unverified++;continue}
  const childId=profileToChild.get(String(profileId))
  if(!childId){skipped.unmapped++;continue}
  const key='pr_check:'+String(eventId)
  if(seen.has(key)){skipped.duplicate++;continue}
  seen.add(key)
  eligible.push({child_id:childId,attendance_source:'scanner',source_event_id:key,attended_at:scan.scanned_at})
 }
 return {eligible,skipped}
}
