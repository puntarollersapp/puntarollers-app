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
    let attempts = 0

    function arrangeProfile() {
      if (cancelled) return false

      const stack = document.querySelector('.pr-page')
      if (!stack) return false

      const directChildren = Array.from(stack.children)
      const profilePanel = directChildren.find(
        (node) => node.matches?.('section.pr-panel')
      )
      if (!profilePanel) return false

      // 1) AMIGOS PR: bloque independiente inmediatamente después del perfil principal.
      let amigosNode = stack.querySelector(':scope > [data-amigos-pr="true"]')
      if (!amigosNode) {
        amigosNode = document.createElement('div')
        amigosNode.setAttribute('data-amigos-pr', 'true')
        amigosNode.className = 'w-full'
      }
      if (profilePanel.nextElementSibling !== amigosNode) {
        profilePanel.insertAdjacentElement('afterend', amigosNode)
      }
      if (!cancelled) setHost(amigosNode)

      // 2) PR ROLLER: si ya existe el bloque "Mi PR Roller", quitamos el acceso duplicado
      // "Modificar mi PR Roller". El botón Modificar del bloque principal sigue funcionando.
      const avatarLinks = Array.from(profilePanel.querySelectorAll('a[href="/app/avatar-premium"]'))
      avatarLinks.forEach((link) => {
        const text = (link.textContent || '').replace(/\s+/g, ' ').trim()
        if (text.includes('Modificar mi PR Roller')) {
          link.remove()
        }
      })

      // 3) PLACA VIRTUAL: función secundaria. La movemos al final real del contenido,
      // justo antes de "Cerrar sesión" para que no compita con las herramientas principales.
      const storyCard = Array.from(stack.children).find(
        (child) => (child.textContent || '').includes('Tu Placa Virtual PR')
      )
      const logoutButton = Array.from(stack.children).find(
        (child) => child.tagName === 'BUTTON' && (child.textContent || '').includes('Cerrar sesión')
      )

      if (storyCard) {
        if (logoutButton) {
          if (storyCard.nextElementSibling !== logoutButton) {
            stack.insertBefore(storyCard, logoutButton)
          }
        } else if (storyCard !== stack.lastElementChild) {
          stack.appendChild(storyCard)
        }
      }

      return true
    }

    // El perfil puede terminar de montarse después del layout/loading screen.
    // Reintentamos durante unos segundos en vez de depender de un único timeout.
    const retry = window.setInterval(() => {
      attempts += 1
      const ready = arrangeProfile()
      if (ready || attempts >= 40) {
        window.clearInterval(retry)
        const stack = document.querySelector('.pr-page')
        if (stack && !observer) {
          observer = new MutationObserver(() => {
            window.requestAnimationFrame(arrangeProfile)
          })
          observer.observe(stack, { childList: true, subtree: true })
        }
      }
    }, 150)

    arrangeProfile()

    return () => {
      cancelled = true
      window.clearInterval(retry)
      observer?.disconnect()
      document.querySelector('[data-amigos-pr="true"]')?.remove()
    }
  }, [])

  if (!host || !user?.id) return null
  return createPortal(<AmigosPRCard profileId={user.id} />, host)
}
