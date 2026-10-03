import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

export default function LocationDetail({ backPath="/", publicBasePath="" }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loc, setLoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('pr_rollermap_locations')
        .select('*')
        .eq('status', 'approved')
      if (!data) { setNotFound(true); setLoading(false); return }
      const match = data.find(l => slugify(l.name) === slug)
      if (!match) { setNotFound(true); setLoading(false); return }
      setLoc(match)
      setLoading(false)
    }
    fetch()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100dvh', background:'#0A0A16', display:'flex', alignItems:'center', justifyContent:'center', gap:12, color:'#8888AA', fontFamily:'Barlow, sans-serif' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.15)', borderTopColor:'#00E5CC', animation:'spin 0.7s linear infinite' }}/>
      Cargando…
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100dvh', background:'#0A0A16', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Barlow, sans-serif', padding:24 }}>
      <span style={{ fontSize:48 }}>🛼</span>
      <p style={{ color:'#E8E8F0', fontSize:18, fontWeight:700 }}>Ubicación no encontrada</p>
      <button onClick={() => navigate(backPath)} style={{ background:'linear-gradient(135deg,#00E5CC,#9B4DFF)', color:'#000', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:14 }}>
        ← Volver al mapa
      </button>
    </div>
  )

  const isEscuela = loc.type === 'escuela'
  const accentColor = isEscuela ? '#00E5CC' : '#9B4DFF'
  const initials = loc.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const waHref = loc.whatsapp ? `https://wa.me/${loc.whatsapp.replace(/\D/g,'')}` : null
  const igHref = loc.instagram ? `https://instagram.com/${loc.instagram.replace('@','')}` : null
  const mapUrl = loc.lat && loc.lng
    ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    : null
  const shareUrl = publicBasePath ? `${window.location.origin}${publicBasePath}/lugar/${slug}` : window.location.href

  return (
    <div style={{ minHeight:'100dvh', background:'#0A0A16', fontFamily:'Barlow, sans-serif', color:'#E8E8F0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700&display=swap');
        @keyframes spin { to { transform:rotate(360deg) } }
        .pr-rollermap *, .pr-rollermap *::before, .pr-rollermap *::after { box-sizing:border-box; }
      `}</style>

      {/* Header con imagen o color */}
      <div style={{ position:'relative', width:'100%', height:220, background: loc.image_url ? 'transparent' : `linear-gradient(135deg, ${accentColor}22, #0A0A16)`, overflow:'hidden' }}>
        {loc.image_url && (
          <img src={loc.image_url} alt={loc.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.5)' }} />
        )}
        {/* Overlay gradiente abajo */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, #0A0A16 100%)' }}/>

        {/* Botón volver */}
        <button onClick={() => navigate(backPath)}
          style={{ position:'absolute', top:16, left:16, background:'rgba(10,10,22,0.8)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#E8E8F0', padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:6 }}>
          ← Mapa
        </button>

        {/* Botón compartir */}
        <button onClick={() => { navigator.clipboard?.writeText(shareUrl); alert('¡Link copiado!') }}
          style={{ position:'absolute', top:16, right:16, background:'rgba(10,10,22,0.8)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#E8E8F0', padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}>
          🔗 Compartir
        </button>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:560, margin:'0 auto', padding:'0 16px 48px' }}>

        {/* Avatar + nombre */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginTop:-40, marginBottom:20, position:'relative', zIndex:2 }}>
          {loc.image_url ? (
            <div style={{ width:72, height:72, borderRadius:14, overflow:'hidden', border:`3px solid ${accentColor}`, flexShrink:0, boxShadow:`0 0 20px ${accentColor}44` }}>
              <img src={loc.image_url} alt={loc.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
          ) : (
            <div style={{ width:72, height:72, borderRadius:14, background:`${accentColor}22`, border:`3px solid ${accentColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed, sans-serif', fontSize:24, fontWeight:800, color:accentColor, flexShrink:0 }}>
              {initials}
            </div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:24, fontWeight:700, color:'#FFFFFF', lineHeight:1.2 }}>
                {loc.name}
              </h1>
              {loc.verified && (
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18, borderRadius:'50%', background:'#00E5CC', fontSize:10, fontWeight:900, color:'#000', flexShrink:0 }}>✓</span>
              )}
              {loc.featured && <span style={{ fontSize:16 }}>⭐</span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:700, fontFamily:'Barlow Condensed, sans-serif', textTransform:'uppercase', letterSpacing:'0.5px', background:`${accentColor}22`, color:accentColor, border:`1px solid ${accentColor}44` }}>
                {isEscuela ? 'Escuela' : 'Grupo'}
              </span>
              <span style={{ fontSize:12, color:'#8888AA' }}>📍 {loc.city}{loc.department ? `, ${loc.department}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {loc.description && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16, marginBottom:12 }}>
            <p style={{ fontSize:14, color:'#C4C4D4', lineHeight:1.65 }}>{loc.description}</p>
          </div>
        )}

        {/* Info rápida */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16, marginBottom:12, display:'flex', flexDirection:'column', gap:10 }}>
          {loc.schedule && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>🕐</span>
              <div>
                <div style={{ fontSize:11, color:'#6666AA', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700, marginBottom:2 }}>Horario</div>
                <div style={{ fontSize:14, color:'#E8E8F0' }}>{loc.schedule}</div>
              </div>
            </div>
          )}
          {loc.address && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>📍</span>
              <div>
                <div style={{ fontSize:11, color:'#6666AA', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700, marginBottom:2 }}>Dirección</div>
                <div style={{ fontSize:14, color:'#E8E8F0' }}>{loc.address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de contacto */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:12 }}>
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, background:'#22C55E', color:'white', fontWeight:700, fontSize:15, textDecoration:'none' }}>
              💬 Contactar por WhatsApp
            </a>
          )}
          {igHref && (
            <a href={igHref} target="_blank" rel="noopener"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, background:'rgba(255,255,255,0.06)', color:'#E8E8F0', fontWeight:700, fontSize:15, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
              📸 Ver en Instagram
            </a>
          )}
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', borderRadius:12, background:'rgba(255,255,255,0.06)', color:'#E8E8F0', fontWeight:700, fontSize:15, textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
              🗺 Ver en Google Maps
            </a>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:32, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:12, color:'#6666AA' }}>Encontrá más escuelas y grupos en</p>
          <button onClick={() => navigate(backPath)}
            style={{ background:'none', border:'none', color:'#00E5CC', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
            RollerMap · Punta Rollers
          </button>
        </div>
      </div>
    </div>
  )
      }
