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
    try {
      const registration =
        await navigator.serviceWorker.register('/sw.js')

      // Check for fresh releases when families reopen PR Kids.
      // The service worker already fetches navigation documents network-first.
      // Updating here prevents installed PWAs from staying on an old worker.
      const refreshWorker = () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      }
      window.addEventListener('pageshow', refreshWorker)
      document.addEventListener('visibilitychange', refreshWorker)
      refreshWorker()

      console.log(
        'Punta Rollers PWA activa:',
        registration.scope
      )
    } catch (error) {
      console.error(
        'No se pudo registrar la PWA:',
        error
      )
    }
  })
}
