import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

export default function AmigosPRProfilePortal() {
  const { user } = useAuth()
  const [host, setHost] = useState(null)

  useEffect(() => {
    let cancelled = false
    let observer = null

    function arrangeProfile() {
      if (cancelled) return false

      const stack = document.querySelector('.pr-page')
      if (!stack) return false

      const profilePanel = Array.from(stack.children).find(
        (node) => node.matches?.('section.pr-panel') && node.textContent?.includes('Mi espacio personal')
      ) || stack.querySelector(':scope > section.pr-panel')

      if (!profilePanel) return false

      let node = stack.querySelector(':scope > [data-amigos-pr="true"]')
      if (!node) {
        node = document.createElement('div')
        node.setAttribute('data-amigos-pr', 'true')
        node.className = 'w-full'
      }

      if (profilePanel.nextSibling !== node) {
        profilePanel.insertAdjacentElement('afterend', node)
      }
      if (!cancelled) setHost(node)

      // Cuando el alumno ya tiene un PR Roller guardado, el acceso grande
      // "Modificar mi PR Roller" repetía exactamente la función del bloque
      // "Mi PR Roller" que ya incluye su botón Modificar.
      profilePanel.querySelectorAll('a[href="/app/avatar-premium"]').forEach((link) => {
        const text = (link.textContent || '').replace(/\s+/g, ' ').trim()
        if (text.includes('Modificar mi PR Roller')) {
          link.style.display = 'none'
          link.setAttribute('aria-hidden', 'true')
        }
      })

      // La Placa Virtual sigue existiendo, pero queda como función secundaria
      // al final del perfil en lugar de competir con los accesos principales.
      const storyCard = Array.from(stack.children).find(
        (child) => child.textContent?.includes('Tu Placa Virtual PR')
      )
      const logoutButton = Array.from(stack.children).find(
        (child) => child.tagName === 'BUTTON' && child.textContent?.includes('Cerrar sesión')
      )

      if (storyCard && logoutButton && storyCard.nextSibling !== logoutButton) {
        stack.insertBefore(storyCard, logoutButton)
      }

      return true
    }

    const timer = window.setTimeout(() => {
      arrangeProfile()
      const stack = document.querySelector('.pr-page')
      if (stack) {
        observer = new MutationObserver(() => arrangeProfile())
        observer.observe(stack, { childList: true, subtree: true })
      }
    }, 80)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      observer?.disconnect()
      document.querySelector('[data-amigos-pr="true"]')?.remove()
    }
  }, [])

  if (!host || !user?.id) return null
  return createPortal(<AmigosPRCard profileId={user.id} />, host)
}
