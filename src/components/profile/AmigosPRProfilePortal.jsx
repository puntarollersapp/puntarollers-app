import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

export default function AmigosPRProfilePortal() {
  const { user } = useAuth()
  const [stack, setStack] = useState(null)

  useEffect(() => {
    let cancelled = false
    let observer = null
    let attempts = 0

    function arrangeProfile() {
      if (cancelled) return false

      const profileStack = document.querySelector('.pr-page')
      if (!profileStack) return false

      if (!stack) setStack(profileStack)

      const directChildren = Array.from(profileStack.children)
      const profilePanel = directChildren.find(
        (node) => node.matches?.('section.pr-panel')
      )
      if (!profilePanel) return false

      // AMIGOS PR es un hijo React real del stack (portal), no un nodo manual.
      // Solo lo reubicamos visualmente para que quede inmediatamente después
      // del bloque principal de perfil sin que React pueda eliminarlo al rerenderizar.
      const amigosNode = profileStack.querySelector(':scope > [data-amigos-pr="true"]')
      if (amigosNode && profilePanel.nextElementSibling !== amigosNode) {
        profileStack.insertBefore(amigosNode, profilePanel.nextElementSibling)
      }

      // Si ya existe "Mi PR Roller", el acceso grande "Modificar mi PR Roller"
      // es redundante: el bloque principal ya tiene su botón Modificar.
      const avatarLinks = Array.from(profilePanel.querySelectorAll('a[href="/app/avatar-premium"]'))
      avatarLinks.forEach((link) => {
        const text = (link.textContent || '').replace(/\s+/g, ' ').trim()
        if (text.includes('Modificar mi PR Roller')) {
          link.remove()
        }
      })

      // La Placa Virtual PR queda como función secundaria al final real del perfil.
      const storyCard = Array.from(profileStack.children).find(
        (child) => (child.textContent || '').includes('Tu Placa Virtual PR')
      )
      const logoutButton = Array.from(profileStack.children).find(
        (child) => child.tagName === 'BUTTON' && (child.textContent || '').includes('Cerrar sesión')
      )

      if (storyCard) {
        if (logoutButton) {
          if (storyCard.nextElementSibling !== logoutButton) {
            profileStack.insertBefore(storyCard, logoutButton)
          }
        } else if (storyCard !== profileStack.lastElementChild) {
          profileStack.appendChild(storyCard)
        }
      }

      return true
    }

    const retry = window.setInterval(() => {
      attempts += 1
      const ready = arrangeProfile()
      if (ready || attempts >= 40) {
        window.clearInterval(retry)
        const profileStack = document.querySelector('.pr-page')
        if (profileStack && !observer) {
          observer = new MutationObserver(() => {
            window.requestAnimationFrame(arrangeProfile)
          })
          observer.observe(profileStack, { childList: true, subtree: true })
        }
      }
    }, 150)

    arrangeProfile()

    return () => {
      cancelled = true
      window.clearInterval(retry)
      observer?.disconnect()
    }
  }, [stack])

  if (!stack || !user?.id) return null

  return createPortal(
    <div data-amigos-pr="true" className="w-full">
      <AmigosPRCard profileId={user.id} />
    </div>,
    stack
  )
}
