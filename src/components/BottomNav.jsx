import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function NavIcon({ type }) {
  const common={width:23,height:23,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round',strokeLinejoin:'round'}
  if(type==='home')return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h5v-6h4v6h5v-9.5"/></svg>
  if(type==='profile')return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>
  if(type==='performance')return <svg {...common}><path d="M4 18V8"/><path d="M9 18v-5"/><path d="M14 18V5"/><path d="M19 18v-8"/><path d="m4 8 5 5 5-8 5 5"/></svg>
  if(type==='training')return <svg {...common}><path d="M5 19V9"/><path d="M19 19V5"/><path d="M5 15h4l2-5 3 7 2-4h3"/></svg>
  if(type==='feed')return <svg {...common}><path d="M4.5 14.8h9.7a4 4 0 0 0 4-4V8.5"/><path d="m7 12 3.3-3.3 2.5 2.5 4.6-4.6"/><path d="M4.5 14.8h-1.5"/><circle cx="7" cy="18.5" r="1.55"/><circle cx="13.5" cy="18.5" r="1.55"/></svg>
  if(type==='community')return <svg {...common}><circle cx="9" cy="8" r="3.1"/><circle cx="17.2" cy="9.2" r="2.35"/><path d="M2.8 20c.7-4.1 3-6.2 6.2-6.2s5.5 2.1 6.2 6.2"/><path d="M14.4 14.8c3.7-.8 6.1 1 6.8 4.7"/></svg>
  if(type==='treasury')return <svg {...common}><path d="M4 10h16v10H4zM3 7h18v3H3zM12 10v10M9 5l3-2 3 2"/><path d="M9 15h6"/></svg>
  if(type==='ecosystem')return <svg {...common}><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-35 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(35 12 12)"/></svg>
  if(type==='awards')return <svg {...common}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 13v4M9 20h6M10 17h4"/></svg>
  if(type==='mypr')return <svg {...common}><path d="M12 3.5 14.4 8l5 .7-3.6 3.5.9 5-4.7-2.4-4.7 2.4.9-5-3.6-3.5 5-.7L12 3.5Z"/><circle cx="12" cy="12" r="9" opacity=".28"/></svg>
  return <svg {...common}><path d="M5 6h14v12H5z"/><path d="M9 10h6M9 14h6"/></svg>
}

function isActive(pathname,item){
  if(item.path==='/app/perfil')return pathname==='/app/perfil'||pathname==='/app/perfil-clasico'
  if(item.path==='/app/entrenamiento')return pathname==='/app/entrenamiento'||pathname==='/app/evolucion'
  if(item.path==='/app/ecosistema')return pathname==='/app/ecosistema'||pathname.startsWith('/app/ecosistema/')
  if(item.path==='/app/actividad')return pathname==='/app/actividad'||pathname==='/app/rollerfeed'
  if(item.path==='/app/mi-pr')return pathname==='/app/mi-pr'||pathname==='/app/rollermap'||pathname==='/app/insignias'||pathname==='/app/musica'||pathname==='/app/prcard'||pathname==='/app/tracking'||pathname==='/app/avatar'||pathname==='/app/avatar-premium'
  if(item.path==='/app/comunidad')return pathname==='/app/comunidad'||pathname==='/app/mensajes'
  if(item.path==='/tesoreria')return pathname==='/tesoreria'||pathname==='/admin/tesoreria'
  if(item.path==='/admin')return pathname.startsWith('/admin')||pathname==='/tesoreria'
  return pathname===item.path
}

export default function BottomNav(){
 const{pathname}=useLocation(),{user}=useAuth(),[communityBadge,setCommunityBadge]=useState(0),isStaff=user?.role==='admin'||user?.role==='profesor'
 useEffect(()=>{let alive=true;async function refresh(){if(!user?.id)return;const[{data:community},{data:inbox},{count:socialUnread}]=await Promise.all([supabase.rpc('community_get_dashboard'),supabase.rpc('pr_dm_inbox'),supabase.from('community_notifications').select('id',{count:'exact',head:true}).is('read_at',null)]);const requests=Array.isArray(community?.incoming_requests)?community.incoming_requests.length:0;const unread=Array.isArray(inbox)?inbox.reduce((sum,item)=>sum+Number(item.unread_count||0),0):0;if(alive)setCommunityBadge(requests+unread+Number(socialUnread||0))}refresh();const timer=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{alive=false;window.clearInterval(timer);window.removeEventListener('focus',refresh)}},[user?.id,pathname])
 const nav=[{path:'/app/perfil',label:'Perfil',icon:'profile'},{path:'https://www.puntarollers.com/pr-awards',label:'PR Awards',icon:'awards'},{path:'/app/ecosistema',label:'Ecosistema',icon:'ecosystem'},{path:'/app/actividad',label:'RollerFeed',icon:'feed',feed:true},{path:'/app/mi-pr',label:'Mi PR',icon:'mypr'},{path:'/app/comunidad',label:'Comunidad',icon:'community',badge:communityBadge}]
 if(user?.esTesoreria && !isStaff)nav.push({path:'/tesoreria',label:'Tesorería',icon:'treasury'})
 if(isStaff)nav.push({path:'/admin',label:'Admin',icon:'admin'})
 const activeIndex=Math.max(0,nav.findIndex(item=>isActive(pathname,item)))
 const count=nav.length
 const activeItem=nav[activeIndex]
 return <nav aria-label="Navegación principal" className="fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2" style={{paddingBottom:'env(safe-area-inset-bottom, 0px)'}}>
   <style>{`
     .pr-island-bar{position:relative;isolation:isolate;background:linear-gradient(180deg,#17151e 0%,#09090e 100%);border:1px solid rgba(255,255,255,.1);border-radius:24px 24px 0 0;box-shadow:0 -12px 38px rgba(0,0,0,.5)}
     .pr-island-indicator{position:absolute;z-index:3;top:-29px;left:calc((100% / var(--pr-count)) * (var(--pr-active) + .5));width:57px;height:57px;transform:translateX(-50%);border:5px solid #09090e;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ff3c83,#ff0055 65%,#a60043);color:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 8px 26px rgba(255,0,85,.36);transition:left .38s cubic-bezier(.22,1,.36,1)}
     .pr-island-indicator:before,.pr-island-indicator:after{content:'';position:absolute;bottom:8px;width:17px;height:17px;border-radius:0 0 100% 0;pointer-events:none}
     .pr-island-indicator:before{right:calc(100% + 2px);border-radius:0 0 100% 0;box-shadow:6px 6px 0 #09090e}
     .pr-island-indicator:after{left:calc(100% + 2px);border-radius:0 0 0 100%;box-shadow:-6px 6px 0 #09090e}
     .pr-island-link{display:flex;flex:1 1 0;min-width:0;height:62px;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;padding:3px 1px 7px;color:rgba(255,255,255,.45);text-decoration:none;transition:color .25s}
     .pr-island-link[aria-current=page]{color:#ff82ad}
     .pr-island-link[aria-current=page] .pr-island-icon{opacity:0;transform:translateY(-8px)}
     .pr-island-icon{height:24px;display:grid;place-items:center;transition:opacity .2s,transform .25s}
     .pr-island-label{font-size:clamp(7px,1.75vw,10px);font-weight:700;line-height:1;white-space:nowrap;letter-spacing:-.025em}
     .pr-island-link[aria-current=page] .pr-island-label{color:#fff}
     @media(max-width:359px){.pr-island-indicator{width:49px;height:49px;top:-24px}.pr-island-label{font-size:7px}.pr-island-link{height:60px}}
     @media(prefers-reduced-motion:reduce){.pr-island-indicator,.pr-island-link,.pr-island-icon{transition:none!important}}
   `}</style>
   <div className="pr-island-bar mx-auto" style={{'--pr-count':count,'--pr-active':activeIndex}}>
     <div className="pr-island-indicator" aria-hidden="true"><NavIcon type={activeItem.icon}/></div>
     <div className="flex items-end justify-between px-1 pt-3">
       {nav.map(item=>{
         const active=isActive(pathname,item)
         return <Link key={item.path} to={item.path} aria-current={active?'page':undefined} aria-label={item.label} className="pr-island-link active:scale-95">
           <span className="pr-island-icon"><NavIcon type={item.icon}/></span>
           <span className="pr-island-label">{item.label}</span>
           {item.badge>0&&<span className="absolute mt-[-42px] ml-7 grid h-4 min-w-4 place-items-center rounded-full border border-[#09090e] bg-[#BEFF37] px-1 text-[8px] font-black text-black">{item.badge>9?'9+':item.badge}</span>}
         </Link>
       })}
     </div>
   </div>
 </nav>
}
