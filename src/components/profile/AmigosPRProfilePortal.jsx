import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

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
  return createPortal(<AmigosPRCard profileId={user.id} compact={compact}/>,host)
}
