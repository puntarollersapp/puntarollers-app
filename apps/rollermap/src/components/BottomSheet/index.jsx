import { useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import LocationCard from '../Sidebar/LocationCard'

const HANDLE_H  = 112
const TOP_INSET = 10

function getSnapY() {
  const vh = window.innerHeight
  return { closed:vh-HANDLE_H, mid:Math.round(vh*0.5), full:TOP_INSET }
}

export default function BottomSheet({ sheetState, onStateChange, filtered, cities, loading, hasActiveFilters, selectedId, filterType, filterCity, search, onCardClick, onTypeChange, onCityChange, onSearchChange, onClearFilters, onRegisterClick }) {
  const sheetRef     = useRef(null)
  const dragRef      = useRef({dragging:false,startY:0,startTranslate:0,lastY:0,velocity:0})
  const translateRef = useRef(0)
  const cardRefs     = useRef({})

  useLayoutEffect(()=>{
    const snap=getSnapY()
    translateRef.current=snap[sheetState]??snap.closed
    if (sheetRef.current) sheetRef.current.style.transform=`translateY(${translateRef.current}px)`
    const resize=()=>{translateRef.current=getSnapY()[sheetState]??getSnapY().closed;if(sheetRef.current)sheetRef.current.style.transform=`translateY(${translateRef.current}px)`}
    window.addEventListener('resize',resize)
    return()=>window.removeEventListener('resize',resize)
  },[sheetState])

  useEffect(()=>{
    if (!selectedId) return
    const el=cardRefs.current[selectedId]
    if (el) el.scrollIntoView({behavior:'smooth',block:'nearest'})
  },[selectedId])

  const startDrag=useCallback((clientY)=>{
    const d=dragRef.current
    d.dragging=true;d.startY=clientY;d.startTranslate=translateRef.current;d.lastY=clientY;d.velocity=0
    if (sheetRef.current) sheetRef.current.style.transition='none'
  },[])

  const moveDrag=useCallback((clientY)=>{
    const d=dragRef.current
    if (!d.dragging) return
    d.velocity=clientY-d.lastY;d.lastY=clientY
    const snap=getSnapY()
    const clamped=Math.max(snap.full,Math.min(snap.closed,d.startTranslate+(clientY-d.startY)))
    translateRef.current=clamped
    if (sheetRef.current) sheetRef.current.style.transform=`translateY(${clamped}px)`
  },[])

  const endDrag=useCallback(()=>{
    const d=dragRef.current
    if (!d.dragging) return
    d.dragging=false
    const snap=getSnapY()
    const vel=d.velocity
    if (vel<-8){onStateChange('full');return}
    if (vel>8){onStateChange(sheetState==='full'?'mid':'closed');return}
    const current=translateRef.current
    const nearest=Object.entries({closed:Math.abs(current-snap.closed),mid:Math.abs(current-snap.mid),full:Math.abs(current-snap.full)}).sort((a,b)=>a[1]-b[1])[0][0]
    onStateChange(nearest)
  },[sheetState,onStateChange])

  const onTouchStart=useCallback((e)=>startDrag(e.touches[0].clientY),[startDrag])
  const onTouchMove=useCallback((e)=>moveDrag(e.touches[0].clientY),[moveDrag])
  const onTouchEnd=useCallback(()=>endDrag(),[endDrag])
  const onMouseDown=useCallback((e)=>{
    startDrag(e.clientY)
    const onMove=(ev)=>moveDrag(ev.clientY)
    const onUp=()=>{endDrag();window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseup',onUp)
  },[startDrag,moveDrag,endDrag])

  const setCardRef=useCallback((id,el)=>{if(el) cardRefs.current[id]=el},[])
  const controlsVisible=sheetState!=='closed'

  return (
    <div ref={sheetRef} className="rm-sheet" style={{transition:'transform 0.38s cubic-bezier(0.32,0.72,0,1)'}}>
      <div className="rm-sheet__handle-zone" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown}>
        <div className="rm-sheet__handle"/>
        <div className="rm-sheet__header">
          <button className="rm-btn rm-btn--primary" style={{minHeight:44,fontSize:13,padding:"8px 12px",whiteSpace:"normal"}} onPointerDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} onClick={onRegisterClick}>Registrar escuela o grupo</button>
          <img src="/rollermap/logo.png" alt="RollerMap" style={{height:36,width:'auto',objectFit:'contain'}}/>
          <span style={{fontSize:11,fontWeight:700,color:'var(--muted2)',background:'var(--line2)',padding:'3px 10px',borderRadius:'var(--r-full)'}}>
            {loading?'…':`${filtered.length} lugar${filtered.length!==1?'es':''}`}
          </span>
        </div>
      </div>

      <div className="rm-sheet__controls" style={{maxHeight:controlsVisible?'160px':'0px',opacity:controlsVisible?1:0}}>
        <div className="rm-input-wrap">
          <span className="rm-input-wrap__icon">🔍</span>
          <input className="rm-input" placeholder="Buscar por nombre o ciudad..." value={search} onChange={(e)=>onSearchChange(e.target.value)}/>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[{value:null,label:'Todos'},{value:'escuela',label:'🏫 Escuelas'},{value:'grupo',label:'👥 Grupos'}].map(({value,label})=>(
            <button key={String(value)} className={`rm-chip ${filterType===value?(value==='grupo'?'rm-chip--grupo':'rm-chip--active'):''}`} onClick={()=>onTypeChange(filterType===value?null:value)}>
              {label}
            </button>
          ))}
          {hasActiveFilters&&<button className="rm-chip" onClick={onClearFilters} style={{color:'var(--brand)'}}>✕ Limpiar</button>}
        </div>
      </div>

      <div className="rm-sheet__list">
        {!loading&&filtered.length===0&&(
          <div className="rm-empty"><span style={{fontSize:28}}>🛼</span><p style={{fontSize:13}}>Sin resultados.<br/>Probá otros filtros.</p></div>
        )}
        {filtered.map(loc=>(
          <LocationCard key={loc.id} ref={(el)=>setCardRef(loc.id,el)} loc={loc} selected={loc.id===selectedId}
            onClick={(l)=>{onCardClick(l);onStateChange('closed')}}/>
        ))}
      </div>


    </div>
  )
}
