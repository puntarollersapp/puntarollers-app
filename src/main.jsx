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
    const isPreviewHost = window.location.hostname.endsWith('.vercel.app')
    if (isPreviewHost) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration => registration.unregister()))
        const cacheKeys = 'caches' in window ? await caches.keys() : []
        await Promise.all(cacheKeys.filter(key => key.startsWith('punta-rollers-')).map(key => caches.delete(key)))
      } catch (error) {
        console.warn('No se pudo limpiar la PWA del preview:', error)
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
