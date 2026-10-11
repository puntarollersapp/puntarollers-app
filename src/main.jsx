import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Beta/preview must never run the production PWA service worker.
    // A stale SW/cache can serve an old bundle and leave the SPA black.
    const host = window.location.hostname
    const isBetaHost = host === 'beta.puntarollers.com'
    const isPreviewHost = host.endsWith('.vercel.app')
    const shouldIsolatePwa = isBetaHost || isPreviewHost

    if (shouldIsolatePwa) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration => registration.unregister()))

        if ('caches' in window) {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map(key => caches.delete(key)))
        }
      } catch (error) {
        console.warn('No se pudo limpiar la PWA del entorno beta:', error)
      }
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Punta Rollers PWA activa:', registration.scope)
    } catch (error) {
      console.error('No se pudo registrar la PWA:', error)
    }
  })
}
