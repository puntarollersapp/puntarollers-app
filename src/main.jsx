import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const isBetaHost = window.location.hostname === 'beta.puntarollers.com'
const isBetaPath = window.location.pathname.startsWith('/beta')
const isBetaEnvironment = isBetaHost || isBetaPath

function showBetaBootError(error) {
  if (!isBetaEnvironment) return
  const root = document.getElementById('root')
  if (!root) return
  const message = error?.message || String(error || 'Error desconocido')
  root.innerHTML = `
    <main style="min-height:100vh;background:#08080d;color:#fff;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif">
      <section style="width:min(520px,100%);border:1px solid rgba(217,70,239,.35);border-radius:24px;padding:24px;background:#11111a">
        <div style="font-size:12px;letter-spacing:.16em;color:#e879f9;font-weight:800">PR BETA · DIAGNÓSTICO</div>
        <h1 style="font-size:24px;margin:10px 0">No pudimos iniciar la Beta</h1>
        <p style="color:#d4d4d8;line-height:1.5;margin:0 0 16px">La página ya no quedará negra. Este mensaje identifica el fallo de arranque para poder corregirlo.</p>
        <pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:#09090b;border-radius:14px;padding:14px;color:#fda4af;font-size:12px">${message.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>
        <button onclick="location.reload()" style="margin-top:16px;width:100%;border:0;border-radius:14px;padding:14px;font-weight:800;background:#d946ef;color:white">REINTENTAR</button>
      </section>
    </main>`
}

window.addEventListener('error', event => showBetaBootError(event.error || event.message))
window.addEventListener('unhandledrejection', event => showBetaBootError(event.reason))

class BetaBootBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('PR Beta boot error:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    const message = this.state.error?.message || String(this.state.error)
    return (
      <main style={{minHeight:'100vh',background:'#08080d',color:'#fff',display:'grid',placeItems:'center',padding:24,fontFamily:'system-ui,sans-serif'}}>
        <section style={{width:'min(520px, 100%)',border:'1px solid rgba(217,70,239,.35)',borderRadius:24,padding:24,background:'#11111a'}}>
          <div style={{fontSize:12,letterSpacing:'.16em',color:'#e879f9',fontWeight:800}}>PR BETA · DIAGNÓSTICO</div>
          <h1 style={{fontSize:24,margin:'10px 0'}}>No pudimos iniciar la Beta</h1>
          <p style={{color:'#d4d4d8',lineHeight:1.5}}>La pantalla negra fue reemplazada por un diagnóstico visible.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#09090b',borderRadius:14,padding:14,color:'#fda4af',fontSize:12}}>{message}</pre>
          <button onClick={() => location.reload()} style={{marginTop:16,width:'100%',border:0,borderRadius:14,padding:14,fontWeight:800,background:'#d946ef',color:'#fff'}}>REINTENTAR</button>
        </section>
      </main>
    )
  }
}

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  isBetaEnvironment
    ? <BetaBootBoundary>{app}</BetaBootBoundary>
    : <React.StrictMode>{app}</React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const host = window.location.hostname
    const isPreviewHost = host.endsWith('.vercel.app')
    const shouldIsolatePwa = host === 'beta.puntarollers.com' || isPreviewHost

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
