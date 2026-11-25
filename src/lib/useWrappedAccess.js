import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Fail closed: never infer access from a cached profile, local role or device clock.
export default function useWrappedAccess(userId){
 const [access,setAccess]=useState(null)
 useEffect(()=>{
  let live=true, timer, running=false
  setAccess(null)
  if(!userId)return
  async function check(){
   if(!live||running)return
   running=true;clearTimeout(timer)
   try{
    const {data,error}=await supabase.rpc('pr_wrapped_2026')
    if(!live)return
    const open=!error&&data?.open===true
    setAccess({owner:userId,open,admin:open&&data?.admin===true})
    if(!open)timer=setTimeout(check,60000)
   }catch{if(live){setAccess(null);timer=setTimeout(check,60000)}}
   finally{running=false}
  }
  const onVisible=()=>{if(document.visibilityState==='visible')check()}
  check()
  document.addEventListener('visibilitychange',onVisible)
  window.addEventListener('focus',check)
  return()=>{live=false;clearTimeout(timer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',check)}
 },[userId])
 return access?.owner===userId&&access?.open===true?access:null
}
