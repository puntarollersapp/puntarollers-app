import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PassCard from '../PRPersonalPassCard'

export function usePersonalMembership(profileId) {
 const [state,setState]=useState(null)
 useEffect(()=>{let alive=true;setState(null);if(!profileId)return;async function load(){const {data,error}=await supabase.rpc('pr_personal_my_membership');if(alive&&!error)setState(data||null)}load();const timer=setInterval(load,60000);const refresh=()=>{if(document.visibilityState==='visible')load()};document.addEventListener('visibilitychange',refresh);return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}},[profileId])
 return state
}
export default function PRPersonalMembership({membership,profile}) {
 if(!membership?.pass)return null
 return <section className="pr-profile-personal-pass" aria-label="Tu PR Pass de clases particulares"><PassCard student={profile} pass={membership.pass} reservedCredits={membership.reservedCredits} bookableCredits={membership.bookableCredits} inactive={!membership.active && Number(membership.pass.clases_disponibles)>0}/><Link to="/personalizadas" className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#a5efdc] px-4 py-3 text-sm font-black text-[#17332c]">Consultar agenda y reservar clases →</Link></section>
}
