import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { isPRNextPreview } from './lib/prNext'

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

if (isPRNextPreview() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => {})
}
if (!isPRNextPreview() && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration =
        await navigator.serviceWorker.register('/sw.js')

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
