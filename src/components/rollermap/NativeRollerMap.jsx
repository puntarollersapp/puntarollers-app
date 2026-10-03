import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLocations } from '../../../apps/rollermap/src/hooks/useLocations'
import { useMapState } from '../../../apps/rollermap/src/hooks/useMapState'
import { loadMapboxToken } from '../../../apps/rollermap/src/lib/mapbox'
import MapView from '../../../apps/rollermap/src/components/Map/MapView'
import LocationCard from '../../../apps/rollermap/src/components/Sidebar/LocationCard'
import RegisterForm from '../../../apps/rollermap/src/components/Register/RegisterForm'
import AdminPanel from '../../../apps/rollermap/src/components/Admin/AdminPanel'
import LocationDetail from '../../../apps/rollermap/src/components/Detail/LocationDetail'
import { SplashScreen } from '../../../apps/rollermap/src/App'
import '../../../apps/rollermap/src/styles/global.css'
import './native.css'

function Directory({ basePath, mapReady, mapError }) {
  const { locations, loading, error } = useLocations()
  const state = useMapState(locations)
  const [view, setView] = useState('lista')
  const [register, setRegister] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const map = useRef(null)
  const navigate = useNavigate()
  function locate() {
    if (!navigator.geolocation) { setGeoError('Tu navegador no permite obtener la ubicación.'); return }
    setLocating(true); setGeoError('')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      state.setUserLocation({ lat: coords.latitude, lng: coords.longitude })
      map.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 11 })
      setLocating(false)
    }, () => { setGeoError('No se pudo obtener tu ubicación. Podés buscar por ciudad.'); setLocating(false) }, { timeout: 10000 })
  }
  function openPlace(loc) {
    const slug = loc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    navigate(`${basePath}/lugar/${slug}`)
  }
  return <div className="pr-rm-directory">
    <section className="pr-rm-intro"><div><p className="pr-rm-eyebrow">PUNTA ROLLERS · ALIANZA ROLLER</p><h1>RollerMap</h1><p>Escuelas y grupos de patinaje en Uruguay.</p></div><img src="/rollermap/logo.png" alt="RollerMap" /></section>
    <button className="rm-btn rm-btn--primary pr-rm-register" onClick={() => setRegister(true)}>Registrar escuela o grupo <span aria-hidden="true">→</span></button>
    <section className="pr-rm-filters" aria-label="Buscar escuelas y grupos">
      <label htmlFor="pr-rm-search">Buscar por nombre o ciudad</label><input id="pr-rm-search" className="rm-input" placeholder="Nombre de la escuela o ciudad…" value={state.search} onChange={e => state.setSearch(e.target.value)} />
      <div className="pr-rm-chips">{[[null, 'Todos'], ['escuela', 'Escuelas'], ['grupo', 'Grupos']].map(([type, title]) => <button key={title} className={`rm-chip ${state.filterType === type ? 'rm-chip--active' : ''}`} aria-pressed={state.filterType === type} onClick={() => state.setFilterType(type)}>{title}</button>)}{state.hasActiveFilters && <button className="rm-chip" onClick={state.clearFilters}>Limpiar filtros</button>}</div>
      <label htmlFor="pr-rm-city">Ciudad</label><select id="pr-rm-city" className="rm-select" value={state.filterCity || ''} onChange={e => state.setFilterCity(e.target.value || null)}><option value="">Todas las ciudades</option>{state.cities.map(city => <option key={city}>{city}</option>)}</select>
      <div className="pr-rm-actions"><div className="pr-rm-view" aria-label="Vista del directorio">{['lista', 'mapa'].map(mode => <button key={mode} className={`rm-chip ${view === mode ? 'rm-chip--active' : ''}`} aria-pressed={view === mode} onClick={() => setView(mode)}>{mode === 'lista' ? 'Ver lista' : 'Ver mapa'}</button>)}</div><button className="rm-chip" disabled={locating} onClick={locate}>{locating ? 'Buscando…' : state.userLocation ? 'Actualizar ubicación' : 'Cerca de mí'}</button></div>
    </section>
    {(error || geoError) && <p className="rm-alert rm-alert--error" role="alert">{error || geoError}</p>}
    {view === 'mapa' && <section className="pr-rm-map" aria-label="Mapa de escuelas y grupos">{mapReady ? <MapView locations={state.filtered} allLocations={locations} loading={loading} onMarkerClick={openPlace} onMapReady={value => { map.current = value }} paddingBottom={20} /> : <p role="status">{mapError || 'Cargando mapa…'}</p>}</section>}
    <p className="pr-rm-results" role="status">{loading ? 'Cargando lugares…' : `${state.filtered.length} lugares`}</p>
    <section className="pr-rm-list" aria-label="Escuelas y grupos">{state.filtered.map(loc => <LocationCard key={loc.id} loc={loc} basePath={basePath} onClick={() => {}} />)}{!loading && !error && !state.filtered.length && <p className="rm-empty">No hay resultados. Probá otra ciudad o limpiá los filtros.</p>}</section>
    {register && <RegisterForm onClose={() => setRegister(false)} isDesktop={false} />}
  </div>
}
export default function NativeRollerMap({ admin, publicView }) {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const basePath = publicView ? '/rollermap' : '/app/rollermap'
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [splash, setSplash] = useState(!slug && !admin)
  useEffect(() => { let active = true; loadMapboxToken().then(() => { if (active) setMapReady(true) }).catch(err => { if (active) setMapError(err.message) }); return () => { active = false } }, [])
  const finishSplash = useRef(() => setSplash(false)).current
  return <div className="pr-rollermap" key={pathname}>
    {splash && <SplashScreen onDone={finishSplash} embedded />}
    {admin ? <AdminPanel /> : slug ? <LocationDetail backPath={basePath} publicBasePath="/rollermap" /> : <Directory basePath={basePath} mapReady={mapReady} mapError={mapError} />}
    {admin && mapError && <p role="alert">{mapError}</p>}
  </div>
}
