import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  const { locations, loading, error, retry } = useLocations()
  const [params, setParams] = useSearchParams()
  const state = useMapState(locations, {q:params.get('q'),city:params.get('city'),type:['escuela','grupo'].includes(params.get('type')) ? params.get('type') : null})
  const [view, setView] = useState(params.get('view') === 'mapa' ? 'mapa' : 'lista')
  const [register, setRegister] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const map = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const next = new URLSearchParams(params)
    for (const [key, value] of [['q',state.search],['city',state.filterCity],['type',state.filterType],['view',view === 'mapa' ? view : null]]) {
      if (value) next.set(key,value); else next.delete(key)
    }
    if (next.toString() !== params.toString()) setParams(next,{replace:true})
  },[state.search,state.filterCity,state.filterType,view,params,setParams])

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
    navigate(`${basePath}/lugar/${slug}`, {state:{rollermapReturn:basePath+(params.toString()?'?'+params.toString():'')}})
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
    {(error || geoError) && <div className="pr-rm-error" role="alert"><p>{error ? "No se pudieron cargar los lugares. Revisá la conexión e intentá de nuevo." : geoError}</p>{error && <button className="rm-btn rm-btn--primary" onClick={retry}>Reintentar</button>}</div>}
    {view === 'mapa' && <section className="pr-rm-map" aria-label="Mapa de escuelas y grupos">{mapReady ? <MapView locations={state.filtered} allLocations={locations} loading={loading} onMarkerClick={openPlace} onMapReady={value => { map.current = value }} paddingBottom={20} /> : <p role="status">{mapError || 'Cargando mapa…'}</p>}</section>}
    <p className="pr-rm-results" role="status">{loading ? "Cargando lugares…" : error ? "Directorio temporalmente no disponible" : `${state.filtered.length} lugares${state.userLocation ? " · Ordenados por cercanía" : ""}`}</p>
    <section className="pr-rm-list" aria-label="Escuelas y grupos">{state.filtered.map(loc => <LocationCard key={loc.id} loc={loc} basePath={basePath} onClick={() => {}} />)}{!loading && !error && !state.filtered.length && <div className="pr-rm-empty"><h2>No encontramos lugares con esos filtros</h2><p>Probá otra ciudad o volvé a ver todo el directorio.</p><button className="rm-btn rm-btn--primary" onClick={state.clearFilters}>Ver todos los lugares</button></div>}</section>
    {register && <RegisterForm onClose={() => setRegister(false)} isDesktop={false} />}
  </div>
}
export default function NativeRollerMap({ admin, publicView }) {
  const { slug } = useParams()
  const { pathname, state: navigationState } = useLocation()
  const basePath = publicView ? '/rollermap' : '/app/rollermap'
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [splash, setSplash] = useState(!slug && !admin)
  useEffect(() => { let active = true; loadMapboxToken().then(() => { if (active) setMapReady(true) }).catch(err => { if (active) setMapError(err.message) }); return () => { active = false } }, [])
  const finishSplash = useRef(() => setSplash(false)).current
  return <div className="pr-rollermap" key={pathname}>
    {splash && <SplashScreen onDone={finishSplash} embedded />}
    {admin ? <AdminPanel /> : slug ? <LocationDetail backPath={navigationState?.rollermapReturn?.startsWith(basePath+"?") ? navigationState.rollermapReturn : basePath} publicBasePath="/rollermap" /> : <Directory basePath={basePath} mapReady={mapReady} mapError={mapError} />}
    {admin && mapError && <p role="alert">{mapError}</p>}
  </div>
}
