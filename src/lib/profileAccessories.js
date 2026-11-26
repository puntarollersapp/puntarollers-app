import {useEffect,useState} from 'react'
import {supabase} from './supabase'
export const ACCESSORY_RELEASE=Date.parse('2026-12-01T00:00:00-03:00')
export function accessoryUrl(file){
 if(typeof file!=='string'||!/^[^/\\]+\.png$/i.test(file))return ''
 return '/profile-accessories/'+encodeURIComponent(file)
}
export function accessoryAccess(user,now=Date.now()){
 return Boolean(user?.id&&user.role!=='familiar'&&(now>=ACCESSORY_RELEASE||(user.id==='admin-claudio'&&user.role==='admin')))
}
// Permanent visual refresh: owner preview until Dec 1, then all signed-in profiles.
export function useProfileVisualRefresh(user){
 const owner=user?.id==='admin-claudio'&&user?.role==='admin'
 const [released,setReleased]=useState(()=>Date.now()>=ACCESSORY_RELEASE)
 useEffect(()=>{
  if(released)return
  const check=()=>setReleased(Date.now()>=ACCESSORY_RELEASE)
  check()
  const t=setInterval(check,15000)
  window.addEventListener('focus',check)
  return()=>{clearInterval(t);window.removeEventListener('focus',check)}
 },[released])
 return Boolean(user?.id&&(owner||released))
}
const cache=new Map(),listeners=new Map(),queue=new Set()
let timer=null
function broadcast(id,value){cache.set(id,{value,time:Date.now()});listeners.get(id)?.forEach(fn=>fn(value))}
function enqueue(id,force=false){
 if(!id)return
 const item=cache.get(id)
 if(!force&&item&&Date.now()-item.time<60000)return
 queue.add(id)
 if(timer===null)timer=setTimeout(flush,25)
}
async function flush(){
 timer=null
 const ids=[...queue];queue.clear()
 for(let i=0;i<ids.length;i+=100){
  const batch=ids.slice(i,i+100)
  try{
   const {data,error}=await supabase.from('pr_accessory_equipped').select('profile_id,accessory_code,pr_accessory_catalog!inner(title,asset_file)').in('profile_id',batch)
   if(error)continue
   const rows=new Map((data||[]).map(r=>[r.profile_id,{code:r.accessory_code,...r.pr_accessory_catalog}]))
   batch.forEach(id=>broadcast(id,rows.get(id)||null))
  }catch{}
 }
}
export function refreshAccessory(id){cache.delete(id);enqueue(id,true)}
export function useEquippedAccessory(profileId){
 const id=profileId?String(profileId):''
 const [state,setState]=useState({id:'',value:null})
 useEffect(()=>{
  if(!id)return
  const apply=value=>setState({id,value})
  const existing=cache.get(id)
  apply(existing?.value||null)
  if(!listeners.has(id))listeners.set(id,new Set())
  listeners.get(id).add(apply)
  const refresh=()=>{if(Date.now()>=ACCESSORY_RELEASE||id==='admin-claudio')enqueue(id)}
  refresh()
  const interval=setInterval(refresh,60000)
  window.addEventListener('focus',refresh)
  return()=>{clearInterval(interval);window.removeEventListener('focus',refresh);const set=listeners.get(id);set?.delete(apply);if(set?.size===0)listeners.delete(id)}
 },[id])
 return state.id===id?state.value:null
}
