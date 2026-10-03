import { useState, useMemo } from 'react'

function degToRad(deg) { return deg * (Math.PI / 180) }

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = degToRad(lat2 - lat1)
  const dLng = degToRad(lng2 - lng1)
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const searchable = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function useMapState(locations = [], initial = {}) {
  const [selectedId,   setSelectedId]  = useState(null)
  const [filterType,   setFilterType]  = useState(initial.type || null)
  const [filterCity,   setFilterCity]  = useState(initial.city || null)
  const [search,       setSearch]      = useState(initial.q || '')
  const [userLocation, setUserLocation] = useState(null) // { lat, lng }

  const cities = useMemo(() => {
    const set = new Set(locations.map((l) => l.city))
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'es'))
  }, [locations])

  const filtered = useMemo(() => {
    const q = searchable(search)

    let result = locations.filter((l) => {
      if (filterType && l.type !== filterType) return false
      if (filterCity && l.city !== filterCity) return false
      if (q && !searchable(l.name).includes(q) &&
               !searchable(l.city).includes(q)) return false
      return true
    })

    // Si hay ubicación del usuario, agregar distancia y ordenar
    if (userLocation) {
      result = result
        .map(l => ({
          ...l,
          distanceKm: (Number.isFinite(l.lat) && Number.isFinite(l.lng))
            ? getDistanceKm(userLocation.lat, userLocation.lng, l.lat, l.lng)
            : null
        }))
        .sort((a, b) => {
          if (a.distanceKm === null) return 1
          if (b.distanceKm === null) return -1
          return a.distanceKm - b.distanceKm
        })
    }

    return result
  }, [locations, filterType, filterCity, search, userLocation])

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedId) ?? null,
    [locations, selectedId]
  )

  function clearFilters() {
    setFilterType(null)
    setFilterCity(null)
    setSearch('')
    setUserLocation(null)
  }

  const hasActiveFilters = filterType !== null || filterCity !== null || search !== '' || userLocation !== null

  return {
    selectedId, filterType, filterCity, search, userLocation,
    filtered, cities, selectedLocation, hasActiveFilters,
    setSelectedId, setFilterType, setFilterCity, setSearch,
    setUserLocation, clearFilters,
  }
}
