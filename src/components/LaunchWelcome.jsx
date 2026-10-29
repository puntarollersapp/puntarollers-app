import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
const VERSION='pr-renovacion-2026-v1'
const screens=[
 {eyebrow:'PUNTA ROLLERS · NUEVA ERA',title:'Nos renovamos.',body:'Una nueva etapa sobre ruedas. Más conectados, más experiencias y todo Punta Rollers en un solo lugar.',icon:'✦'},
 {eyebrow:'TODO TU UNIVERSO PR',title:'Todo conectado.',body:'Tus clases, logros, amigos, beneficios y experiencias ahora forman parte de un mismo universo.',icon:'◎'},
 {eyebrow:'ESTO RECIÉN EMPIEZA',title:'Explorá lo nuevo.',body:'Descubrí cada espacio a tu ritmo. Tu recorrido en Punta Rollers sigue creciendo con vos.',icon:'↗'}
]
export default function LaunchWelcome(){
 const {user}=useAuth(),navigate=useNavigate(),[step,setStep]=useState(0),[hidden,setHidden]=useState(false)
 const key=VERSION+':'+user?.id
 const [seen,setSeen]=useState(()=>{try{return Boolean(user?.id&&localStorage.getItem(VERSION+':'+user.id))}catch{return true}})
 if(!user?.id||seen||hidden)return null
 const item=screens[step]
 function close(go){try{localStorage.setItem(key,'1')}catch{}setHidden(true);if(go)navigate('/app/perfil')}
 return <div role="dialog" aria-modal="true" aria-label="Bienvenida a la nueva etapa" className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"><div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-lime-300/20 bg-[#101319] p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,.8)]"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(192,255,36,.13),transparent_55%)]"/><div className="relative"><div className="flex items-center justify-between"><span className="text-[9px] font-black tracking-[.2em] text-lime-300">{item.eyebrow}</span><button onClick={()=>close(false)} className="text-[11px] text-white/45">Omitir</button></div><div className="mx-auto mt-12 grid h-36 w-36 place-items-center rounded-full border border-lime-300/20 bg-lime-300/[.05] text-[94px] font-black text-lime-300 shadow-[0_0_70px_rgba(192,255,36,.12)]">{item.icon}</div><h2 className="mt-10 font-display text-5xl leading-none text-white">{item.title}</h2><p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-white/60">{item.body}</p><div className="mt-8 flex justify-center gap-2">{screens.map((_,i)=><span key={i} className={'h-1.5 rounded-full transition-all '+(i===step?'w-8 bg-lime-300':'w-2 bg-white/20')}/>)}</div><button onClick={()=>step===2?close(true):setStep(x=>x+1)} className="mt-8 w-full rounded-2xl bg-lime-300 py-4 text-sm font-black text-black">{step===2?'DESCUBRIR MI UNIVERSO':'CONTINUAR'}</button></div></div></div>
}
