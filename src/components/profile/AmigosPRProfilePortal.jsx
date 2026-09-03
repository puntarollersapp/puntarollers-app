import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

export default function AmigosPRProfilePortal() {
  const { user } = useAuth()
  const [host, setHost] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const main = document.querySelector('.app-shell > main')
      const stack = main?.querySelector('.space-y-4') || main?.firstElementChild
      if (!stack) return
      const node = document.createElement('div')
      node.setAttribute('data-amigos-pr', 'true')
      node.className = 'px-[18px]'
      stack.appendChild(node)
      setHost(node)
    }, 120)
    return () => {
      window.clearTimeout(timer)
      document.querySelector('[data-amigos-pr="true"]')?.remove()
    }
  }, [])

  if (!host || !user?.id) return null
  return createPortal(<AmigosPRCard profileId={user.id} />, host)
}
