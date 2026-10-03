import { useRef, useEffect, useCallback } from 'react'
import LocationCard from './LocationCard'

export default function Sidebar({ filtered, cities, loading, hasActiveFilters, selectedId, filterType, filterCity, search, onCardClick, onTypeChange, onCityChange, onSearchChange, onClearFilters, onRegisterClick }) {
  const cardRefs = useRef({})

  useEffect(() => {
    if (!selectedId) return
    const el = cardRefs.current[selectedId]
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' })
  }, [selectedId])

  const setCardRef = useCallback((id, el) => { if (el) cardRefs.current[id] = el }, [])

  return (
    <aside className="rm-sidebar">
      <div className="rm-sidebar__header">
        <div className="rm-logo">
          <div className="rm-logo__icon">AR</div>
          <div>
            <div className="rm-logo__name">ROLLERMAP</div>
            <div className="rm-logo__sub">by Alianza Roller</div>
          </div>
        </div>
        <div className="rm-input-wrap">
          <span className="rm-input-wrap__icon">🔍</span>
          <input className="rm-input" placeholder="Buscar por nombre o ciudad..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[{value:null,label:'Todos'},{value:'escuela',label:'🏫 Escuelas'},{value:'grupo',label:'👥 Grupos'}].map(({value,label}) => (
            <button key={String(value)} className={`rm-chip ${filterType===value?(value==='grupo'?'rm-chip--grupo':'rm-chip--active'):''}`} onClick={() => onTypeChange(filterType===value?null:value)}>
              {label}
            </button>
          ))}
          {hasActiveFilters && <button className="rm-chip" onClick={onClearFilters} style={{color:'var(--brand)'}}>✕ Limpiar</button>}
        </div>
        <select className="rm-select" style={{fontSize:12}} value={filterCity??''} onChange={(e) => onCityChange(e.target.value||null)}>
          <option value="">Todas las ciudades</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="rm-sidebar__results">
        <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted2)'}}>
          {loading ? 'Cargando…' : `${filtered.length} resultado${filtered.length!==1?'s':''}`}
        </span>
      </div>
      <div className="rm-sidebar__list">
        {!loading && filtered.length===0 && (
          <div className="rm-empty"><span style={{fontSize:28}}>🛼</span><p style={{fontSize:13}}>Sin resultados.<br/>Probá otros filtros.</p></div>
        )}
        {filtered.map(loc => (
          <LocationCard key={loc.id} ref={(el) => setCardRef(loc.id,el)} loc={loc} selected={loc.id===selectedId} onClick={onCardClick} />
        ))}
      </div>
      <div className="rm-sidebar__banner">
        <div style={{flex:1,fontSize:12,color:'var(--muted)'}}>
          <strong style={{fontSize:12.5,fontWeight:700,color:'var(--ink)',display:'block',marginBottom:2}}>¿Tenés una escuela o grupo?</strong>
          Sumalo al mapa de Uruguay
        </div>
        <button className="rm-btn rm-btn--sm" style={{background:'var(--grupo)',color:'white',flexShrink:0}} onClick={onRegisterClick}>
          Registrar →
        </button>
      </div>
    </aside>
  )
}
