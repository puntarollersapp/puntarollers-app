import WelcomeEmailSettings from './WelcomeEmailSettings'
import { mapboxToken } from '../../lib/mapbox'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, getPRAdmin }          from '../../lib/supabase'
import { useAdminLocations } from '../../hooks/useAdminLocations'
import EditModal             from './EditModal'

const STATUS_CONFIG = {
  pending : { label:'Pendiente',   dot:'#F59E0B' },
  approved: { label:'Aprobada',    dot:'#00E5CC' },
  disabled: { label:'Desactivada', dot:'#6666AA' },
}

async function geocodeLocation(loc) {
  const query = [loc.address, loc.city, loc.department, 'Uruguay'].filter(Boolean).join(', ')
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=UY&limit=1&access_token=${mapboxToken}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.features?.length > 0) {
    const [lng, lat] = data.features[0].center
    return { lat, lng }
  }
  return null
}

function SkeletonCard() {
  return (
    <div className="rm-card" style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <div className="rm-skeleton" style={{width:42,height:42,borderRadius:10,flexShrink:0}}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
          <div className="rm-skeleton" style={{height:14,borderRadius:6,width:'60%'}}/>
          <div className="rm-skeleton" style={{height:11,borderRadius:6,width:'40%'}}/>
        </div>
      </div>
      <div style={{display:'flex',gap:6}}>
        <div className="rm-skeleton" style={{height:28,borderRadius:8,flex:1}}/>
        <div className="rm-skeleton" style={{height:28,borderRadius:8,flex:1}}/>
      </div>
    </div>
  )
}

function AdminCard({ loc, onStatusChange, onEdit, onDelete, onGeocode, onRetryWelcome }) {
  const sc = STATUS_CONFIG[loc.status] ?? STATUS_CONFIG.disabled
  const initials = loc.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const createdAt = new Date(loc.created_at).toLocaleDateString('es-UY',{day:'2-digit',month:'short',year:'numeric'})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const actions = {
    pending : [{label:'✓ Aprobar',newStatus:'approved',cls:'rm-btn--success-soft'},{label:'✕ Desactivar',newStatus:'disabled',cls:'rm-btn--danger-soft'}],
    approved: [{label:'✕ Desactivar',newStatus:'disabled',cls:'rm-btn--danger-soft'}],
    disabled: [{label:'↺ Reactivar',newStatus:'approved',cls:'rm-btn--success-soft'}],
  }[loc.status] ?? []

  const handleGeocode = async () => {
    setGeocoding(true)
    const coords = await geocodeLocation(loc)
    if (coords) {
      await onGeocode(loc.id, coords)
    } else {
      alert(`No se encontraron coordenadas para "${loc.city}". Editá la ubicación manualmente.`)
    }
    setGeocoding(false)
  }

  const hasCoords = loc.lat && loc.lng

  return (
    <div className="rm-card">
      <div style={{height:3,background:sc.dot,borderRadius:'12px 12px 0 0'}}/>
      <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:11}}>

        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          {loc.image_url ? (
            <div style={{width:42,height:42,borderRadius:10,overflow:'hidden',flexShrink:0,border:'1px solid rgba(255,255,255,0.1)'}}>
              <img src={loc.image_url} alt={loc.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          ) : (
            <div className={`rm-avatar rm-avatar--${loc.type} rm-avatar--md`}>{initials}</div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{loc.name}</span>
              {loc.verified && <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:16,height:16,borderRadius:'50%',background:'var(--brand)',fontSize:9,fontWeight:900,color:'#000',boxShadow:'0 0 8px rgba(0,229,204,0.5)'}}>✓</span>}
              {loc.featured && <span className="rm-badge rm-badge--featured">⭐</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4,flexWrap:'wrap'}}>
              <span className={`rm-badge rm-badge--${loc.type}`}>{loc.type==='escuela'?'Escuela':'Grupo'}</span>
              <span style={{fontSize:11,color:'var(--muted)'}}>📍 {loc.city}{loc.department?`, ${loc.department}`:''}</span>
            </div>
          </div>
          <span className={`rm-badge rm-badge--${loc.status}`}>{sc.label}</span>
        </div>

        {/* Coordenadas */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {hasCoords ? (
            <span style={{fontSize:11,color:'var(--brand)'}}>✓ Coordenadas: {parseFloat(loc.lat).toFixed(4)}, {parseFloat(loc.lng).toFixed(4)}</span>
          ) : (
            <span style={{fontSize:11,color:'var(--danger)'}}>⚠ Sin coordenadas — no aparece en el mapa</span>
          )}
        </div>

        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'var(--muted2)'}}>📅 {createdAt}</span>
          {loc.instagram && <a href={`https://instagram.com/${loc.instagram}`} target="_blank" rel="noopener" style={{fontSize:11,color:'var(--brand)'}}>@{loc.instagram}</a>}
          {loc.whatsapp  && <a href={`https://wa.me/${loc.whatsapp}`} target="_blank" rel="noopener" style={{fontSize:11,color:'var(--grupo-text)'}}>💬 {loc.whatsapp}</a>}
        </div>

        {loc.email && (
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'rgba(0,229,204,0.06)',borderRadius:'var(--r-sm)',border:'1px solid rgba(0,229,204,0.15)'}}>
            <span style={{fontSize:11}}>✉️</span>
            <span style={{fontSize:11,color:'var(--brand)',fontWeight:600}}>{loc.email}</span>
          </div>
        )}

        <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
          {actions.map(a=>(
            <button key={a.newStatus} className={`rm-btn rm-btn--sm ${a.cls}`} onClick={()=>onStatusChange(loc.id,a.newStatus)}>{a.label}</button>
          ))}
          <button className="rm-btn rm-btn--sm rm-btn--secondary" onClick={()=>onEdit(loc)}>✎ Editar</button>

          {/* Botón geocodificar — solo si no tiene coordenadas */}
          {!hasCoords && (
            <button
              className="rm-btn rm-btn--sm"
              style={{background:'rgba(0,229,204,0.12)',color:'var(--brand)',border:'1px solid rgba(0,229,204,0.3)'}}
              onClick={handleGeocode}
              disabled={geocoding}
            >
              {geocoding ? '⟳ Buscando…' : '📍 Auto-ubicar'}
            </button>
          )}

          {loc.welcome&&<div style={{fontSize:11,color:'var(--muted)',width:'100%'}}>Bienvenida: {({sent:'aceptada por Resend',pending:'pendiente',failed:'requiere reintento',sending:'en proceso',missing_email:'falta un email válido'})[loc.welcome.status]||loc.welcome.status}{loc.welcome.last_error&&<p>{loc.welcome.last_error}</p>}{['failed','pending','missing_email'].includes(loc.welcome.status)&&<button className="rm-btn rm-btn--sm rm-btn--secondary" onClick={()=>onRetryWelcome(loc.id)}>Reintentar bienvenida</button>}</div>}
          {!confirmDelete ? (
            <button className="rm-btn rm-btn--sm rm-btn--danger-soft" style={{marginLeft:'auto'}} onClick={()=>setConfirmDelete(true)}>🗑</button>
          ) : (
            <div style={{display:'flex',gap:6,marginLeft:'auto',alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--danger)'}}>¿Eliminar?</span>
              <button className="rm-btn rm-btn--sm rm-btn--danger-soft" onClick={()=>onDelete(loc.id)}>Sí</button>
              <button className="rm-btn rm-btn--sm rm-btn--secondary" onClick={()=>setConfirmDelete(false)}>No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatsBar({ stats }) {
  return (
    <div className="rm-stats">
      {[{label:'Total',val:stats.total,color:'var(--ink)'},{label:'Pendientes',val:stats.pending,color:'#FCD34D'},{label:'Aprobadas',val:stats.approved,color:'var(--brand)'},{label:'Sin coords',val:stats.noCoords,color:'var(--danger)'}].map(({label,val,color})=>(
        <div key={label} className="rm-stat">
          <div className="rm-stat__val" style={{color}}>{val}</div>
          <div className="rm-stat__label">{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function AdminPanel() {
  const [user,         setUser]         = useState(null)
  const [authReady,    setAuthReady]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [geocodingAll, setGeocodingAll] = useState(false)

  const { locations, loading, error, notice, retryWelcome, updateStatus, updateLocation, deleteLocation } = useAdminLocations()

  useEffect(()=>{
    let active=true
    async function check(){const {data:{session}}=await supabase.auth.getSession();const admin=await getPRAdmin(session?.user);if(active){setUser(admin);setAuthReady(true)}}
    check()
    const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{setTimeout(check,0)})
    return ()=>{active=false;subscription.unsubscribe()}
  },[])
  const handleLogout=()=>{window.top.location.href='/app/mi-pr'}

  const handleGeocode = useCallback(async (id, coords) => {
    await updateLocation(id, { lat: coords.lat, lng: coords.lng })
  }, [updateLocation])

  const handleGeocodeAll = async () => {
    const noCoords = locations.filter(l => !l.lat || !l.lng)
    if (noCoords.length === 0) { alert('Todas las ubicaciones ya tienen coordenadas.'); return }
    setGeocodingAll(true)
    for (const loc of noCoords) {
      const coords = await geocodeLocation(loc)
      if (coords) await updateLocation(loc.id, { lat: coords.lat, lng: coords.lng })
      await new Promise(r => setTimeout(r, 300))
    }
    setGeocodingAll(false)
    alert(`✓ Proceso completado para ${noCoords.length} ubicaciones.`)
  }

  const stats = useMemo(()=>({
    total:locations.length,
    pending:locations.filter(l=>l.status==='pending').length,
    approved:locations.filter(l=>l.status==='approved').length,
    noCoords:locations.filter(l=>!l.lat||!l.lng).length,
  }),[locations])

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase()
    return locations.filter(l=>{
      if (filterStatus!=='all'&&l.status!==filterStatus) return false
      if (filterType!=='all'&&l.type!==filterType) return false
      if (q&&!l.name.toLowerCase().includes(q)&&!l.city.toLowerCase().includes(q)) return false
      return true
    })
  },[locations,filterStatus,filterType,search])

  if (!authReady) return null
  if (!user) return <div className="rm-admin" style={{padding:24}}>Ingresá con tu cuenta administradora de Punta Rollers. <a href="/login" target="_top">Iniciar sesión</a></div>

  return (
    <div className="rm-admin">
      <header className="rm-admin__header">
        <img src="/rollermap/logo.png" alt="RollerMap" style={{height:32,width:'auto',objectFit:'contain'}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:700,color:'var(--ink)'}}>Panel Admin</div>
          <div style={{fontSize:10,color:'var(--muted2)'}}>{user.email}</div>
        </div>
        <button className="rm-btn rm-btn--sm rm-btn--secondary" onClick={handleLogout}>Salir</button>
      </header>
      <WelcomeEmailSettings/>
      {notice&&<div className="rm-alert" style={{margin:16}} role="status">{notice}</div>}

      <main className="rm-admin__main">
        {!loading && <StatsBar stats={stats}/>}

        {/* Botón geocodificar todas */}
        {!loading && stats.noCoords > 0 && (
          <button
            className="rm-btn rm-btn--full"
            style={{background:'rgba(0,229,204,0.12)',color:'var(--brand)',border:'1px solid rgba(0,229,204,0.3)',borderRadius:'var(--r-sm)',padding:'11px'}}
            onClick={handleGeocodeAll}
            disabled={geocodingAll}
          >
            {geocodingAll ? '⟳ Geocodificando…' : `📍 Auto-ubicar todas (${stats.noCoords} sin coordenadas)`}
          </button>
        )}

        <div className="rm-input-wrap">
          <span className="rm-input-wrap__icon">🔍</span>
          <input className="rm-input" placeholder="Buscar por nombre o ciudad…" value={search} onChange={(e)=>setSearch(e.target.value)}/>
        </div>

        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[{val:'all',label:'Todos'},{val:'pending',label:'⏳ Pendientes'},{val:'approved',label:'✓ Aprobadas'},{val:'disabled',label:'— Inactivas'}].map(({val,label})=>(
            <button key={val} className={`rm-chip ${filterStatus===val?'rm-chip--active':''}`} onClick={()=>setFilterStatus(val)}>{label}</button>
          ))}
        </div>

        <div style={{display:'flex',gap:6}}>
          {[{val:'all',label:'Todos los tipos'},{val:'escuela',label:'🏫 Escuelas'},{val:'grupo',label:'👥 Grupos'}].map(({val,label})=>(
            <button key={val} className={`rm-chip ${filterType===val?'rm-chip--brand':''}`} onClick={()=>setFilterType(val)}>{label}</button>
          ))}
        </div>

        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted2)'}}>
          {loading?'Cargando…':`${filtered.length} resultado${filtered.length!==1?'s':''}`}
        </div>

        {error&&<div className="rm-alert rm-alert--error">⚠️ {error}</div>}

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {loading&&[1,2,3].map(i=><SkeletonCard key={i}/>)}
          {!loading&&filtered.length===0&&(
            <div className="rm-empty"><span style={{fontSize:32}}>🛼</span><div style={{fontSize:14}}>Sin resultados.</div></div>
          )}
          {!loading&&filtered.map(loc=>(
            <AdminCard
              key={loc.id}
              loc={loc}
              onStatusChange={updateStatus}
              onEdit={setEditTarget}
              onDelete={deleteLocation}
              onGeocode={handleGeocode}
              onRetryWelcome={retryWelcome}
            />
          ))}
        </div>
      </main>

      {editTarget&&(
        <EditModal loc={editTarget} onSave={updateLocation} onClose={()=>setEditTarget(null)} isDesktop={window.innerWidth>=768}/>
      )}
    </div>
  )
}
