import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

const LUCIA_PROFILE_ID='alumno-48812609'

function LuciaTreasuryAccess(){
  return <Link to="/tesoreria" className="group relative mb-3 block overflow-hidden rounded-[28px] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/[.14] via-[#0b1511] to-[#08090c] p-4 shadow-[0_20px_55px_rgba(0,0,0,.28)] transition active:scale-[.985]">
    <div className="absolute -right-10 -top-12 h-36 w-36 animate-pulse rounded-full bg-emerald-300/10 blur-3xl"/>
    <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent"/>
    <div className="relative flex items-center gap-3">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-emerald-200/20 bg-emerald-300/[.08] text-2xl text-emerald-200">
        <span className="absolute inset-1 animate-pulse rounded-[16px] border border-emerald-300/10"/>
        <span aria-hidden="true">$</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"/><p className="text-[8px] font-black uppercase tracking-[.2em] text-emerald-300">ACCESO DE TESORERÍA</p></div>
        <h3 className="mt-1 text-[18px] font-black text-white">PR Tesorería</h3>
        <p className="mt-1 text-[10px] leading-4 text-white/40">Pagos, vencimientos, gastos y gestión mensual.</p>
      </div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.045] text-lg text-white/65 transition-transform group-active:translate-x-1">→</div>
    </div>
    <div className="relative mt-3 flex items-center justify-between rounded-[16px] border border-emerald-300/10 bg-black/20 px-3 py-2"><span className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">Panel privado · solo Lucía</span><span className="text-[8px] font-black uppercase tracking-[.14em] text-emerald-300">ENTRAR ↗</span></div>
  </Link>
}

export default function AmigosPRProfilePortal() {
  const { user } = useAuth()
  const [host,setHost]=useState(null)
  const [compact,setCompact]=useState(false)

  useEffect(()=>{
    let cancelled=false,attempts=0
    function arrangeProfile(){
      if(cancelled)return false
      const explicit=document.querySelector('[data-amigos-pr-host="2026"]')
      if(explicit){setHost(explicit);setCompact(true);return true}
      const stack=document.querySelector('.pr-page')
      if(!stack)return false
      const profilePanel=Array.from(stack.children).find(node=>node.matches?.('section.pr-panel'))
      if(!profilePanel)return false
      let amigosNode=stack.querySelector(':scope > [data-amigos-pr="true"]')
      if(!amigosNode){amigosNode=document.createElement('div');amigosNode.setAttribute('data-amigos-pr','true');amigosNode.className='w-full';profilePanel.insertAdjacentElement('afterend',amigosNode)}else if(profilePanel.nextElementSibling!==amigosNode)profilePanel.insertAdjacentElement('afterend',amigosNode)
      setHost(amigosNode);setCompact(false)
      const duplicate=Array.from(profilePanel.querySelectorAll('a[href="/app/avatar-premium"]')).find(link=>(link.textContent||'').replace(/\s+/g,' ').includes('Modificar mi PR Roller'));duplicate?.remove()
      const storyCard=Array.from(stack.children).find(child=>(child.textContent||'').includes('Tu Placa Virtual PR')),logoutButton=Array.from(stack.children).find(child=>child.tagName==='BUTTON'&&(child.textContent||'').includes('Cerrar sesión'))
      if(storyCard&&logoutButton&&storyCard.nextElementSibling!==logoutButton)stack.insertBefore(storyCard,logoutButton)
      return true
    }
    arrangeProfile();const retry=window.setInterval(()=>{attempts+=1;const ready=arrangeProfile();if(ready||attempts>=30)window.clearInterval(retry)},200)
    return()=>{cancelled=true;window.clearInterval(retry);document.querySelector('[data-amigos-pr="true"]')?.remove()}
  },[])

  if(!host||!user?.id)return null
  const isLucia=String(user.id)===LUCIA_PROFILE_ID
  return createPortal(<>{isLucia&&<LuciaTreasuryAccess/>}<AmigosPRCard profileId={user.id} compact={compact}/></>,host)
}
