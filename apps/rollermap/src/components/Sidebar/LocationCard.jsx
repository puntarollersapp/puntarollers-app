import { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

function formatDistance(km) {
  if (km === null || km === undefined) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

const LocationCard = forwardRef(function LocationCard({ loc, selected, onClick }, ref) {
  const navigate = useNavigate()
  const initials = loc.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const isEscuela = loc.type === 'escuela'
  const accentColor = isEscuela ? '#00E5CC' : '#9B4DFF'
  const distance = formatDistance(loc.distanceKm)

  function handleClick() {
    onClick(loc)
    navigate(`/lugar/${slugify(loc.name)}`)
  }

  return (
    <div
      ref={ref}
      className={`rm-card rm-loc-card ${selected ? 'rm-loc-card--selected' : ''}`}
      onClick={handleClick}
      style={{
        borderLeft: `3px solid ${selected ? accentColor : 'transparent'}`,
        transition: 'all 0.18s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ padding:'12px 14px 12px 12px', display:'flex', alignItems:'center', gap:12 }}>

        {/* Avatar */}
        {loc.image_url ? (
          <div style={{
            width:48, height:48, borderRadius:10, overflow:'hidden',
            flexShrink:0, border:'1px solid rgba(255,255,255,0.1)'
          }}>
            <img src={loc.image_url} alt={loc.name}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        ) : (
          <div style={{
            width:48, height:48, borderRadius:10, flexShrink:0,
            background: isEscuela ? 'rgba(0,229,204,0.12)' : 'rgba(155,77,255,0.12)',
            border: `1px solid ${isEscuela ? 'rgba(0,229,204,0.25)' : 'rgba(155,77,255,0.25)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Barlow Condensed', sans-serif",
            fontSize:16, fontWeight:800,
            color: accentColor,
          }}>
            {initials}
          </div>
        )}

        {/* Contenido */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Nombre + íconos */}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
            <span style={{
              fontFamily:"'Barlow Condensed', sans-serif",
              fontSize:16, fontWeight:700, color:'#FFFFFF',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              maxWidth:165, lineHeight:1.2
            }}>
              {loc.name}
            </span>
            {loc.verified && (
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:15, height:15, borderRadius:'50%',
                background:'#00E5CC', flexShrink:0,
                fontSize:8, fontWeight:900, color:'#000', lineHeight:1
              }}>✓</span>
            )}
            {loc.featured && <span style={{ fontSize:11, flexShrink:0 }}>⭐</span>}
          </div>

          {/* Badge + ciudad + distancia */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{
              display:'inline-flex', alignItems:'center',
              padding:'2px 8px', borderRadius:9999,
              fontSize:10, fontWeight:700,
              fontFamily:"'Barlow Condensed', sans-serif",
              textTransform:'uppercase', letterSpacing:'0.5px',
              background: isEscuela ? 'rgba(0,229,204,0.12)' : 'rgba(155,77,255,0.12)',
              color: accentColor,
              border: `1px solid ${isEscuela ? 'rgba(0,229,204,0.25)' : 'rgba(155,77,255,0.25)'}`,
            }}>
              {isEscuela ? 'Escuela' : 'Grupo'}
            </span>
            <span style={{ fontSize:11, color:'#8888AA' }}>📍 {loc.city}</span>
            {distance && (
              <span style={{
                fontSize:11, fontWeight:700,
                color:'#00E5CC',
                background:'rgba(0,229,204,0.08)',
                padding:'1px 7px', borderRadius:9999,
                border:'1px solid rgba(0,229,204,0.2)',
              }}>
                📏 {distance}
              </span>
            )}
          </div>

        </div>

        {/* Chevron */}
        <span style={{
          fontSize:20, fontWeight:300,
          color: selected ? accentColor : 'rgba(255,255,255,0.12)',
          flexShrink:0, lineHeight:1
        }}>›</span>

      </div>
    </div>
  )
})

export default LocationCard
