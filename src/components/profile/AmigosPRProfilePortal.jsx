import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../lib/auth'
import AmigosPRCard from './AmigosPRCard'

export default function AmigosPRProfilePortal() {
  const { user } = useAuth()
  const [host, setHost] = useState(null)

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    function arrangeProfile() {
      if (cancelled) return false

      const stack = document.querySelector('.pr-page')
      if (!stack) return false

      const profilePanel = Array.from(stack.children).find(
        (node) => node.matches?.('section.pr-panel')
      )
      if (!profilePanel) return false

      // AMIGOS PR: un bloque real, independiente y estable inmediatamente
      // después de la tarjeta principal del perfil.
      let amigosNode = stack.querySelector(':scope > [data-amigos-pr="true"]')
      if (!amigosNode) {
        amigosNode = document.createElement('div')
        amigosNode.setAttribute('data-amigos-pr', 'true')
        amigosNode.className = 'w-full'
        profilePanel.insertAdjacentElement('afterend', amigosNode)
      } else if (profilePanel.nextElementSibling !== amigosNode) {
        profilePanel.insertAdjacentElement('afterend', amigosNode)
      }

      if (!cancelled) setHost(amigosNode)

      // Si el PR Roller ya existe, el bloque principal ya tiene "Modificar".
      // Quitamos únicamente el acceso duplicado grande.
      const duplicate = Array.from(
        profilePanel.querySelectorAll('a[href="/app/avatar-premium"]')
      ).find((link) =>
        (link.textContent || '').replace(/\s+/g, ' ').includes('Modificar mi PR Roller')
      )
      duplicate?.remove()

      // La placa virtual sigue disponible, pero queda como función secundaria
      // al final del perfil, antes de cerrar sesión.
      const storyCard = Array.from(stack.children).find(
        (child) => (child.textContent || '').includes('Tu Placa Virtual PR')
      )
      const logoutButton = Array.from(stack.children).find(
        (child) =>
          child.tagName === 'BUTTON' &&
          (child.textContent || '').includes('Cerrar sesión')
      )
      if (storyCard && logoutButton && storyCard.nextElementSibling !== logoutButton) {
        stack.insertBefore(storyCard, logoutButton)
      }

      return true
    }

    // El perfil monta rápido, pero algunos datos llegan después. Reintentamos
    // sin MutationObserver para evitar loops de re-render/reordenamiento.
    arrangeProfile()
    const retry = window.setInterval(() => {
      attempts += 1
      const ready = arrangeProfile()
      if (ready || attempts >= 30) window.clearInterval(retry)
    }, 200)

    return () => {
      cancelled = true
      window.clearInterval(retry)
      document.querySelector('[data-amigos-pr="true"]')?.remove()
    }
  }, [])

  if (!host || !user?.id) return null
  return createPortal(<AmigosPRCard profileId={user.id} />, host)
}
