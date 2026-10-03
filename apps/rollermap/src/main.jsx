import { loadMapboxToken } from './lib/mapbox'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './styles/global.css'

import App            from './App'
import AdminPanel     from './components/Admin/AdminPanel'
import LocationDetail from './components/Detail/LocationDetail'

const root=createRoot(document.getElementById('root'))
root.render(<div style={{minHeight:'100dvh',display:'grid',placeItems:'center',background:'#0A0A16'}}><img src="/rollermap/logo.png" alt="Cargando RollerMap" style={{width:220}}/></div>)
loadMapboxToken().then(()=>root.render(
  <StrictMode>
    <BrowserRouter basename="/rollermap">
      <Routes>
        <Route path="/"          element={<App />} />
        <Route path="/admin"     element={<AdminPanel />} />
        <Route path="/lugar/:slug" element={<LocationDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)).catch(error=>root.render(<div style={{padding:24,color:'#e8e8f0'}} role="alert">{error.message}<button onClick={()=>window.location.reload()}>Reintentar</button></div>))
