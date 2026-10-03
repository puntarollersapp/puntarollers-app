import { mapboxToken } from '../../lib/mapbox'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = mapboxToken

const URUGUAY_CENTER = [-56.1645, -34.9011]
const COLORS = {
  escuela: { fill:'#00E5CC', glow:'rgba(0,229,204,0.35)' },
  grupo:   { fill:'#9B4DFF', glow:'rgba(155,77,255,0.35)' },
  user:    { fill:'#0EA5E9', glow:'rgba(14,165,233,0.35)' },
}

function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function createMarkerEl(type, featured = false, name = '') {
  const c = COLORS[type] ?? COLORS.escuela
  const size = featured ? 44 : 36
  const h = Math.round(size * 44 / 36)
  const solid = type === 'escuela'

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;`
  wrapper.dataset.type = type

  // SVG pin
  const pinEl = document.createElement('div')
  pinEl.style.cssText = `width:${size}px;height:${h}px;filter:drop-shadow(0 2px 8px ${c.glow});transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),filter 0.18s ease,opacity 0.2s ease;will-change:transform,opacity;`
  pinEl.innerHTML = `<svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}">
    <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 26 14 26S32 26 32 16C32 8.268 25.732 2 18 2z"
      fill="${solid ? c.fill : 'rgba(10,10,22,0.9)'}"
      stroke="${solid ? 'none' : c.fill}"
      stroke-width="${solid ? 0 : 2}"/>
    <circle cx="18" cy="16" r="5.5"
      fill="${solid ? 'rgba(0,0,0,0.6)' : c.fill}"/>
    ${featured ? `<circle cx="18" cy="16" r="13" fill="none" stroke="${c.fill}" stroke-width="1.5" stroke-dasharray="3.5 3" opacity="0.6"/>` : ''}
  </svg>`

  // Label con nombre + "Ver →"
  const shortName = name.length > 14 ? name.slice(0, 13) + '…' : name
  const label = document.createElement('div')
  label.style.cssText = `
    display:flex;align-items:center;gap:4px;
    background:rgba(10,10,22,0.85);
    border:1px solid ${c.fill}44;
    border-radius:20px;
    padding:2px 7px 2px 6px;
    backdrop-filter:blur(6px);
    white-space:nowrap;
    pointer-events:none;
  `
  label.innerHTML = `
    <span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;color:#FFFFFF;letter-spacing:0.2px;">${escapeHTML(shortName)}</span>
    <span style="font-size:9px;font-weight:700;color:${c.fill};letter-spacing:0.3px;">Ver →</span>
  `

  wrapper.appendChild(pinEl)
  wrapper.appendChild(label)

  wrapper.addEventListener('mouseenter', () => {
    pinEl.style.filter = `drop-shadow(0 5px 18px ${c.glow})`
    pinEl.style.transform = 'scale(1.18) translateY(-2px)'
  })
  wrapper.addEventListener('mouseleave', () => {
    pinEl.style.filter = `drop-shadow(0 2px 8px ${c.glow})`
    pinEl.style.transform = ''
  })

  return wrapper
}

function createUserMarkerEl() {
  const el = document.createElement('div')
  el.style.cssText = `width:16px;height:16px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 2px 8px rgba(14,165,233,0.35);`
  return el
}

function buildPopupHTML(raw) {
  const loc=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,typeof v==='string'?escapeHTML(v):v]))
  const initials = loc.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const waHref = loc.whatsapp ? `https://wa.me/${loc.whatsapp.replace(/\D/g,'')}` : null
  const igHref = loc.instagram ? `https://instagram.com/${loc.instagram.replace('@','')}` : null
  const desc = loc.description ? `${loc.description.slice(0,110)}${loc.description.length>110?'…':''}` : null
  return `<div class="rm-popup">
    <div class="rm-popup__header">
      ${loc.image_url
        ? `<div style="width:40px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="${loc.image_url}" style="width:100%;height:100%;object-fit:cover;"/></div>`
        : `<div class="rm-avatar rm-avatar--${loc.type} rm-avatar--sm" style="width:38px;height:38px;font-size:13px;border-radius:9px;">${initials}</div>`
      }
      <div class="rm-popup__title-col">
        <div class="rm-popup__name">${loc.name}</div>
        <div class="rm-popup__meta">
          <span class="rm-badge rm-badge--${loc.type}">${loc.type==='escuela'?'Escuela':'Grupo'}</span>
          <span class="rm-popup__city">📍 ${loc.city}</span>
        </div>
      </div>
      ${loc.verified ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#00E5CC;font-size:9px;font-weight:900;color:#000;box-shadow:0 0 8px rgba(0,229,204,0.5);flex-shrink:0;">✓</span>` : ''}
    </div>
    ${desc ? `<p class="rm-popup__desc">${desc}</p>` : ''}
    ${loc.schedule ? `<div class="rm-popup__schedule">🕐 ${loc.schedule}</div>` : ''}
    <div class="rm-popup__actions">
      ${waHref ? `<a href="${waHref}" target="_blank" rel="noopener" class="rm-popup__btn rm-popup__btn--wa">💬 WhatsApp</a>` : ''}
      ${igHref ? `<a href="${igHref}" target="_blank" rel="noopener" class="rm-popup__btn rm-popup__btn--ig">📸 Instagram</a>` : ''}
    </div>
  </div>`
}

export default function MapView({ locations=[], allLocations=[], selectedId=null, loading=false, onMarkerClick, onMapReady, onUserLocated }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef({})
  const activePopup  = useRef(null)
  const userMarker   = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (mapRef.current) return
    markersRef.current = {}
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: URUGUAY_CENTER,
      zoom: 8,
      minZoom: 5,
      maxZoom: 18,
      pitchWithRotate: false,
      maxBounds: [[-62,-36],[-52,-28]],
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass:false }), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit:'metric' }), 'bottom-left')
    map.on('load', () => {
      map.setPadding({ bottom: 380, top: 60, left: 0, right: 0 })
      setMapReady(true)
      onMapReady?.(map)
    })
    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    allLocations.forEach(loc => {
      if (markersRef.current[loc.id]) return
      const el = createMarkerEl(loc.type, loc.featured, loc.name)
      const popup = new mapboxgl.Popup({ offset:52, closeButton:true, maxWidth:'300px' })
        .setHTML(buildPopupHTML(loc))
      const marker = new mapboxgl.Marker({ element:el, anchor:'bottom' })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map)
      el.addEventListener('click', () => {
        if (activePopup.current && activePopup.current !== popup) activePopup.current.remove()
        activePopup.current = popup
        onMarkerClick?.(loc)
      })
      markersRef.current[loc.id] = { marker, el, popup }
    })
  }, [mapReady, allLocations, onMarkerClick])

  useEffect(() => {
    const filteredIds = new Set(locations.map(l => l.id))
    const hasFilter = allLocations.length !== locations.length
    Object.entries(markersRef.current).forEach(([id, { el }]) => {
      const visible = !hasFilter || filteredIds.has(id)
      el.style.opacity = visible ? '1' : '0.15'
      el.style.pointerEvents = visible ? 'auto' : 'none'
    })
  }, [locations, allLocations])

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { el }]) => {
      const type = el.dataset.type
      const c = COLORS[type] ?? COLORS.escuela
      const isSel = id === String(selectedId)
      const pinEl = el.firstChild
      if (pinEl) {
        pinEl.style.transform = isSel ? 'scale(1.25) translateY(-3px)' : ''
        pinEl.style.filter = `drop-shadow(${isSel ? '0 6px 20px' : '0 2px 8px'} ${c.glow})`
      }
      el.style.zIndex = isSel ? '5' : ''
    })
  }, [selectedId])

  useEffect(() => {
    if (!onUserLocated) return
    window.__rmLocate = (coords) => {
      userMarker.current?.remove()
      userMarker.current = new mapboxgl.Marker({ element: createUserMarkerEl() })
        .setLngLat([coords.longitude, coords.latitude])
        .addTo(mapRef.current)
      mapRef.current?.flyTo({ center:[coords.longitude, coords.latitude], zoom:11, speed:1.6, curve:1.4, essential:true })
      onUserLocated(coords)
    }
    return () => { delete window.__rmLocate }
  }, [onUserLocated])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
      {(loading || !mapReady) && (
        <div className="rm-map-loading">
          <div className="rm-spinner rm-spinner--brand" /> Cargando mapa…
        </div>
      )}
    </div>
  )
}
