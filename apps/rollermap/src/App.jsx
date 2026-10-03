import { useRef, useCallback, useState, useEffect } from 'react'
import { useLocations }   from './hooks/useLocations'
import { useMapState }    from './hooks/useMapState'
import MapView            from './components/Map/MapView'
import Sidebar            from './components/Sidebar'
import BottomSheet        from './components/BottomSheet'
import RegisterForm       from './components/Register/RegisterForm'

const DESKTOP_BP = 768

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BP)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BP}px)`)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function SplashScreen({ onDone, embedded = false }) {
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3500)
    const t2 = setTimeout(() => onDone(), 4200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className={embedded ? "rm-splash" : undefined} style={{
      position:'fixed', inset:0, zIndex:999,
      background:'#0A0A16',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:24,
      opacity: fading ? 0 : 1,
      transition:'opacity 0.7s ease',
      pointerEvents:'none',
    }}>
      <img src="/rollermap/logo.png" alt="RollerMap"
        style={{ width:220, height:'auto', objectFit:'contain', animation:'rm-pop 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
      <div style={{ width:180, height:3, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg, #00E5CC, #9B4DFF)', borderRadius:2, animation:'rm-loading-bar 3s ease forwards' }}/>
      </div>
      <span style={{ fontSize:11, color:'var(--muted2)', letterSpacing:2, textTransform:'uppercase' }}>
        by Alianza Roller
      </span>
      <style>{`@keyframes rm-loading-bar { from { width:0% } to { width:100% } }`}</style>
    </div>
  )
}

export default function App() {
  const isDesktop = useIsDesktop()
  const mapInstanceRef = useRef(null)
  const [sheetState, setSheetState] = useState('mid')
  const [showRegister, setShowRegister] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const finishSplash=useCallback(()=>setShowSplash(false),[])
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(null)

  const { locations: allLocations, loading, error } = useLocations()

  const {
    selectedId, filterType, filterCity, search, userLocation,
    filtered, cities, hasActiveFilters,
    setSelectedId, setFilterType, setFilterCity, setSearch,
    setUserLocation, clearFilters,
  } = useMapState(allLocations)

  const handleMarkerClick = useCallback((loc) => {
    setSelectedId(loc.id)
    if (!isDesktop) setSheetState('closed')
  }, [setSelectedId, isDesktop])

  const handleCardClick = useCallback((loc) => {
    setSelectedId(loc.id)
    mapInstanceRef.current?.flyTo({
      center: [loc.lng, loc.lat],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 13),
      speed: 1.4, curve: 1.2,
    })
  }, [setSelectedId])

  const handleMapReady = useCallback((map) => {
    mapInstanceRef.current = map
  }, [])

  const handleUserLocated = useCallback((coords) => {
    setUserLocation({ lat: coords.latitude, lng: coords.longitude })
  }, [setUserLocation])

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('No disponible'); return }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude })
        mapInstanceRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 11, speed: 1.6, curve: 1.4, essential: true,
        })
        setSheetState('mid')
        setLocating(false)
      },
      (err) => {
        const msgs = { 1:'Permiso denegado', 2:'No se pudo obtener', 3:'Tiempo agotado' }
        setGeoError(msgs[err.code] ?? 'Error')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [setUserLocation])

  const sharedProps = {
    filtered, cities, loading, hasActiveFilters, userLocation,
    selectedId, filterType, filterCity, search,
    onCardClick: handleCardClick,
    onTypeChange: setFilterType,
    onCityChange: setFilterCity,
    onSearchChange: setSearch,
    onClearFilters: clearFilters,
    onRegisterClick: () => setShowRegister(true),
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={finishSplash} />}

      <div className="rm-app">
        {isDesktop && <Sidebar {...sharedProps} />}

        <div style={{ flex:1, position:'relative', height:'100%' }}>
          {(error || geoError) && (
            <div className="rm-alert rm-alert--error"
              style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', zIndex:30, whiteSpace:'nowrap' }}>
              ⚠️ {error || geoError}
            </div>
          )}

          <MapView
            locations={filtered}
            allLocations={allLocations}
            selectedId={selectedId}
            loading={loading}
            onMarkerClick={handleMarkerClick}
            onMapReady={handleMapReady}
            onUserLocated={handleUserLocated}
          />

          {!isDesktop && (
            <div className="rm-mobile-header">
              <img src="/rollermap/logo.png" alt="RollerMap" style={{ height:44, width:'auto', objectFit:'contain' }} />
              <div style={{ display:'flex', gap:8, pointerEvents:'all', alignItems:'center' }}>

                {/* Botón ubicación con texto */}
                <button
                  onClick={handleGeolocate}
                  disabled={locating}
                  style={{
                    display:'flex', alignItems:'center', gap:5,
                    padding:'0 12px', height:34, borderRadius:'var(--r-full)',
                    background: userLocation
                      ? 'rgba(0,229,204,0.15)'
                      : 'rgba(10,10,22,0.85)',
                    border: `1px solid ${userLocation
                      ? 'rgba(0,229,204,0.6)'
                      : 'rgba(255,255,255,0.2)'}`,
                    color: userLocation ? '#00E5CC' : '#ffffff',
                    fontSize:12, fontWeight:700,
                    cursor:'pointer',
                    backdropFilter:'blur(8px)',
                    transition:'all 0.18s ease',
                    opacity: locating ? 0.6 : 1,
                    whiteSpace:'nowrap',
                    fontFamily:'var(--font-body)',
                  }}
                >
                  <span style={{ fontSize:14 }}>
                    {locating ? '⟳' : '📍'}
                  </span>
                  <span>
                    {locating
                      ? 'Buscando…'
                      : userLocation
                        ? 'Cerca mío'
                        : 'Ubicarme'
                    }
                  </span>
                </button>

                <button
                  className="rm-btn rm-btn--primary rm-btn--sm"
                  style={{ borderRadius:'var(--r-full)' }}
                  onClick={() => setShowRegister(true)}
                >
                  + Registrar
                </button>

                <button
                  className="rm-btn rm-btn--sm"
                  style={{
                    borderRadius:'var(--r-full)',
                    background:'rgba(10,10,22,0.85)',
                    border:'1px solid rgba(0,229,204,0.3)',
                    color:'var(--brand)',
                    backdropFilter:'blur(8px)',
                  }}
                  onClick={() => setSheetState(s => s === 'closed' ? 'mid' : 'closed')}
                >
                  {sheetState === 'closed' ? `🛼 ${filtered.length}` : '✕'}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isDesktop && (
          <BottomSheet
            {...sharedProps}
            sheetState={sheetState}
            onStateChange={setSheetState}
          />
        )}

        {showRegister && (
          <RegisterForm
            onClose={() => setShowRegister(false)}
            isDesktop={isDesktop}
          />
        )}
      </div>
    </>
  )
}
