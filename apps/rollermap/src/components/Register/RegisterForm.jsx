import { useState, useCallback, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../../lib/supabase'

const FORMSPREE_ID = 'mrejezbk'

const STEPS=[{id:1,label:'Básico',icon:'📋'},{id:2,label:'Ubicación',icon:'📍'},{id:3,label:'Contacto',icon:'📲'}]
const INITIAL_FORM={type:'',name:'',city:'',department:'',address:'',lat:'',lng:'',instagram:'',whatsapp:'',email:'',schedule:'',description:'',imageFile:null}
const DEPARTMENTS=['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres']
const FALLBACK_CITIES=['Artigas','Atlántida','Bella Unión','Canelones','Carmelo','Ciudad de la Costa','Colonia del Sacramento','Dolores','Durazno','Florida','Fray Bentos','Juan Lacaze','La Paz','Las Piedras','Maldonado','Melo','Mercedes','Minas','Migues','Montevideo','Nueva Helvecia','Nueva Palmira','Pando','Parque del Plata','Paso Carrasco','Paysandú','Progreso','Punta del Este','Rivera','Rocha','Salinas','Salto','San Jacinto','San José de Mayo','San Ramón','Santa Lucía','Sauce','Soca','Tacuarembó','Tala','Treinta y Tres','Trinidad','Young','Fray Bentos'].sort()

function useCities() {
  const [cities,setCities]=useState(FALLBACK_CITIES)
  useEffect(()=>{
    supabase.from('pr_rollermap_locations').select('city').eq('status','approved').then(({data})=>{
      if (!data?.length) return
      const fromDb=[...new Set(data.map(d=>d.city))]
      setCities([...new Set([...fromDb,...FALLBACK_CITIES])].sort())
    })
  },[])
  return cities
}

function MiniMap({lat,lng,onChange}) {
  const containerRef=useRef(null)
  const mapRef=useRef(null)
  const markerRef=useRef(null)
  const debounceRef=useRef(null)
  const [hasMarker,setHasMarker]=useState(false)
  const [mapUnavailable,setMapUnavailable]=useState(false)

  useEffect(()=>{
    let map
    try {
      if (!mapboxgl.supported()) throw new Error("WebGL unavailable")
      map=new mapboxgl.Map({container:containerRef.current,style:'mapbox://styles/mapbox/dark-v11',center:[-56.1645,-32.5228],zoom:5.5,minZoom:4,maxZoom:17})
    } catch {setMapUnavailable(true);return}
    map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-right')
    map.on('click',(e)=>{
      const {lat:la,lng:ln}=e.lngLat
      onChange('lat',la.toFixed(6));onChange('lng',ln.toFixed(6))
      place(map,[ln,la])
    })
    mapRef.current=map
    return ()=>{map.remove();mapRef.current=null;markerRef.current=null}
  },[]) // eslint-disable-line

  useEffect(()=>{
    clearTimeout(debounceRef.current)
    debounceRef.current=setTimeout(()=>{
      const map=mapRef.current
      const la=parseFloat(lat),ln=parseFloat(lng)
      if (!map||isNaN(la)||isNaN(ln)) return
      if (la<-90||la>90||ln<-180||ln>180) return
      place(map,[ln,la])
      map.flyTo({center:[ln,la],zoom:13,speed:1.5,curve:1.3})
    },400)
    return ()=>clearTimeout(debounceRef.current)
  },[lat,lng])

  function place(map,lngLat) {
    if (markerRef.current){markerRef.current.setLngLat(lngLat)}
    else {
      const el=document.createElement('div')
      el.className='rm-minimap__marker'
      markerRef.current=new mapboxgl.Marker({element:el,anchor:'center'}).setLngLat(lngLat).addTo(map)
    }
    setHasMarker(true)
  }

  return (
    <div className="rm-minimap">
      <div ref={containerRef} style={{width:'100%',height:'100%'}}/>
      {mapUnavailable&&<div className="rm-minimap__hint">Mapa no disponible. Podés ingresar la dirección y las coordenadas abajo.</div>}
      {!mapUnavailable&&!hasMarker&&<div className="rm-minimap__hint">👆 Tocá el mapa para marcar tu ubicación</div>}
    </div>
  )
}

function validate(step,form) {
  const errs={}
  if (step===1){
    if(!form.type) errs.type='Seleccioná un tipo'
    if(!form.name.trim()) errs.name='El nombre es obligatorio'
    if(!form.city.trim()) errs.city='La ciudad es obligatoria'
  }
  if (step===2){
    if(form.lat&&isNaN(parseFloat(form.lat))) errs.lat='Latitud inválida'
    if(form.lng&&isNaN(parseFloat(form.lng))) errs.lng='Longitud inválida'
  }
  if (step===3){
    if(!form.email.trim()) errs.email='El email es obligatorio'
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email='Email inválido'
  }
  return errs
}

async function submitToSupabase(form) {
  const payload={
    type:form.type,
    name:form.name.trim(),
    city:form.city.trim(),
    department:form.department||null,
    address:form.address.trim()||null,
    lat:form.lat?parseFloat(form.lat):null,
    lng:form.lng?parseFloat(form.lng):null,
    instagram:form.instagram.replace('@','').trim()||null,
    whatsapp:form.whatsapp.replace(/\D/g,'')||null,
    email:form.email.trim()||null,
    schedule:form.schedule.trim()||null,
    description:form.description.trim()||null,
    status:'pending'
  }
  const {data,error}=await supabase.rpc('pr_rollermap_submit_location',{payload})
  if (error) throw new Error(error.message)
  return data
}

async function submitToFormspree(form) {
  const body={
    _subject:`[RollerMap] Nueva solicitud: ${form.name}`,
    tipo:form.type,
    nombre:form.name,
    ciudad:form.city,
    departamento:form.department||'-',
    direccion:form.address||'-',
    lat:form.lat||'-',
    lng:form.lng||'-',
    instagram:form.instagram||'-',
    whatsapp:form.whatsapp||'-',
    email:form.email||'-',
    horarios:form.schedule||'-',
    descripcion:form.description||'-',
  }
  const res=await fetch(`https://formspree.io/f/${FORMSPREE_ID}`,{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Formspree error')
}

function Step1({form,errors,onChange,cities}) {
  return (
    <>
      <div className="rm-form-group">
        <label className="rm-label">Tipo <span style={{color:'var(--brand)'}}>*</span></label>
        <div className="rm-type-grid">
          {[{value:'escuela',icon:'🏫',label:'Escuela',desc:'Clases y formación'},{value:'grupo',icon:'👥',label:'Grupo',desc:'Rides y encuentros'}].map(({value,icon,label,desc})=>(
            <div key={value} className={`rm-type-card rm-type-card--${value} ${form.type===value?'rm-type-card--selected':''}`} onClick={()=>onChange('type',value)}>
              <span style={{fontSize:28}}>{icon}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:form.type===value?(value==='escuela'?'var(--brand-text)':'var(--grupo-text)'):'var(--muted)'}}>{label}</span>
              <span style={{fontSize:11,color:'var(--muted2)',textAlign:'center'}}>{desc}</span>
            </div>
          ))}
        </div>
        {errors.type&&<span style={{fontSize:11.5,color:'var(--danger)'}}>⚠ {errors.type}</span>}
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Nombre <span style={{color:'var(--brand)'}}>*</span></label>
        <input className={`rm-input ${errors.name?'rm-input--error':''}`} placeholder="Ej: Punta Rollers" value={form.name} maxLength={80} onChange={(e)=>onChange('name',e.target.value)}/>
        {errors.name&&<span style={{fontSize:11.5,color:'var(--danger)'}}>⚠ {errors.name}</span>}
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Ciudad <span style={{color:'var(--brand)'}}>*</span></label>
        <input className={`rm-input ${errors.city?'rm-input--error':''}`} placeholder="Ej: Las Piedras" value={form.city} onChange={(e)=>onChange('city',e.target.value)} list="rm-cities-list" autoComplete="off"/>
        <datalist id="rm-cities-list">{cities.map(c=><option key={c} value={c}/>)}</datalist>
        {errors.city&&<span style={{fontSize:11.5,color:'var(--danger)'}}>⚠ {errors.city}</span>}
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Departamento</label>
        <select className="rm-select" value={form.department} onChange={(e)=>onChange('department',e.target.value)}>
          <option value="">Seleccioná un departamento</option>
          {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </>
  )
}

function Step2({form,errors,onChange}) {
  const [geoLoading,setGeoLoading]=useState(false)
  const [geoError,setGeoError]=useState(null)
  const handleGeolocate=()=>{
    if (!navigator.geolocation){setGeoError('No disponible.');return}
    setGeoLoading(true);setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({coords})=>{onChange('lat',coords.latitude.toFixed(6));onChange('lng',coords.longitude.toFixed(6));setGeoLoading(false)},
      ()=>{setGeoError('No se pudo obtener.');setGeoLoading(false)},
      {enableHighAccuracy:true,timeout:8000}
    )
  }
  const hasCoords=form.lat&&form.lng&&!isNaN(parseFloat(form.lat))&&!isNaN(parseFloat(form.lng))
  return (
    <>
      <div className="rm-form-group">
        <label className="rm-label">Dirección</label>
        <input className="rm-input" placeholder="Av. Principal 123" value={form.address} onChange={(e)=>onChange('address',e.target.value)}/>
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Ubicación en el mapa</label>
        <MiniMap lat={form.lat} lng={form.lng} onChange={onChange}/>
        <button type="button" className="rm-btn rm-btn--secondary rm-btn--full" style={{marginTop:6}} onClick={handleGeolocate} disabled={geoLoading}>
          {geoLoading?'⟳ Buscando…':'📍 Usar mi ubicación actual'}
        </button>
        {geoError&&<span style={{fontSize:11.5,color:'var(--danger)'}}>⚠ {geoError}</span>}
        <div className="rm-form-row" style={{marginTop:6}}>
          <div className="rm-form-group">
            <label style={{fontSize:10,fontWeight:600,color:'var(--muted2)'}}>Latitud</label>
            <input className={`rm-input ${errors.lat?'rm-input--error':''}`} placeholder="-34.9588" value={form.lat} inputMode="decimal" onChange={(e)=>onChange('lat',e.target.value)}/>
          </div>
          <div className="rm-form-group">
            <label style={{fontSize:10,fontWeight:600,color:'var(--muted2)'}}>Longitud</label>
            <input className={`rm-input ${errors.lng?'rm-input--error':''}`} placeholder="-54.9528" value={form.lng} inputMode="decimal" onChange={(e)=>onChange('lng',e.target.value)}/>
          </div>
        </div>
        {hasCoords&&<p style={{fontSize:11,color:'var(--grupo-text)',fontWeight:600}}>✓ Ubicación marcada correctamente</p>}
      </div>
    </>
  )
}

function Step3({form,errors,onChange}) {
  const fileInputRef=useRef(null)
  const [preview,setPreview]=useState(null)
  const handleFile=(e)=>{
    const file=e.target.files?.[0];if(!file) return
    onChange('imageFile',file)
    const reader=new FileReader();reader.onload=(ev)=>setPreview(ev.target.result);reader.readAsDataURL(file)
  }
  return (
    <>
      <div className="rm-form-group">
        <label className="rm-label">Instagram</label>
        <div className="rm-input-wrap">
          <span className="rm-input-wrap__icon" style={{fontSize:13}}>@</span>
          <input className="rm-input" placeholder="tuescuela" value={form.instagram} onChange={(e)=>onChange('instagram',e.target.value.replace('@',''))}/>
        </div>
      </div>
      <div className="rm-form-group">
        <label className="rm-label">WhatsApp</label>
        <input className="rm-input" placeholder="091 234 567" value={form.whatsapp} inputMode="tel" onChange={(e)=>onChange('whatsapp',e.target.value)}/>
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Email de contacto <span style={{color:'var(--brand)'}}>*</span></label>
        <input className={`rm-input ${errors.email?'rm-input--error':''}`} placeholder="contacto@tuescuela.com" value={form.email} inputMode="email" onChange={(e)=>onChange('email',e.target.value)}/>
        <span style={{fontSize:11,color:'var(--muted2)'}}>Para contactarte cuando aprobemos tu solicitud</span>
        {errors.email&&<span style={{fontSize:11.5,color:'var(--danger)'}}>⚠ {errors.email}</span>}
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Horarios</label>
        <input className="rm-input" placeholder="Lun–Vie 16:00–20:00 · Sáb 9:00–13:00" value={form.schedule} onChange={(e)=>onChange('schedule',e.target.value)}/>
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Descripción</label>
        <textarea className="rm-textarea" placeholder="Contá sobre tu escuela o grupo..." value={form.description} maxLength={400} onChange={(e)=>onChange('description',e.target.value)}/>
        <span style={{fontSize:11,color:'var(--muted2)',textAlign:'right'}}>{form.description.length}/400</span>
      </div>
      <div className="rm-form-group">
        <label className="rm-label">Imagen (opcional)</label>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        <div className={`rm-dropzone ${form.imageFile?'rm-dropzone--filled':''}`} style={{backgroundImage:preview?`url(${preview})`:'none',backgroundSize:'cover',backgroundPosition:'center'}} onClick={()=>fileInputRef.current?.click()}>
          {!preview&&<><span style={{fontSize:24,opacity:0.35}}>🖼</span><span style={{fontSize:13,color:'var(--muted)'}}>Tocá para subir una foto</span><span style={{fontSize:11,color:'var(--muted2)'}}>JPG, PNG · máx 5 MB</span></>}
          {preview&&<span style={{fontSize:12,fontWeight:600,color:'var(--grupo-text)',background:'rgba(255,255,255,0.9)',padding:'4px 12px',borderRadius:20}}>✓ {form.imageFile?.name}</span>}
        </div>
      </div>
    </>
  )
}

function SuccessScreen({form,onClose}) {
  const hasIg=!!form.instagram.trim(),hasWa=!!form.whatsapp.trim()
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>
      <div style={{padding:'28px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(0,229,204,0.15)',border:'2px solid var(--brand)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,animation:'rm-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>✓</div>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:700,color:'var(--ink)'}}>¡Solicitud enviada!</div>
          <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.6,marginTop:6,maxWidth:300}}><strong style={{color:'var(--ink)'}}>{form.name}</strong> está pendiente de revisión.</p>
        </div>
        <div style={{width:'100%',maxWidth:360,background:'rgba(255,255,255,0.04)',borderRadius:14,padding:'16px 18px',border:'1px solid rgba(255,255,255,0.08)',textAlign:'left'}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--muted2)',marginBottom:12}}>¿Qué pasa ahora?</div>
          {[
            {icon:'🔍',text:'El equipo de Alianza Roller revisa tu solicitud.'},
            {icon:'⏱',text:'El proceso tarda entre 24 y 48 horas hábiles.'},
            {icon:'📧',text:`Te contactamos al email ${form.email} cuando esté aprobado.`},
            {icon:'🗺',text:'Una vez aprobada, aparece en el mapa.'}
          ].map(({icon,text},i)=>(
            <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:8}}>
              <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
              <span style={{fontSize:13,color:'var(--ink3)',lineHeight:1.5}}>{text}</span>
            </div>
          ))}
        </div>
        <button className="rm-btn rm-btn--primary" onClick={onClose}>Volver al mapa →</button>
      </div>
    </div>
  )
}

export default function RegisterForm({onClose,isDesktop=false}) {
  const cities=useCities()
  const [step,setStep]=useState(1)
  const [form,setForm]=useState(INITIAL_FORM)
  const [errors,setErrors]=useState({})
  const [submitState,setSubmitState]=useState('idle')
  const [submitError,setSubmitError]=useState(null)

  const onChange=useCallback((key,value)=>{
    setForm(f=>({...f,[key]:value}))
    setErrors(e=>{const n={...e};delete n[key];return n})
  },[])

  const handleNext=async()=>{
    const errs=validate(step,form)
    if (Object.keys(errs).length>0){setErrors(errs);return}
    setErrors({})
    if (step<3){setStep(s=>s+1);return}
    setSubmitState('loading')
    setSubmitError(null)

    let supabaseOk=false
    try {
      await submitToSupabase(form)
      supabaseOk=true
    } catch(supabaseErr) {
      console.error('Supabase error:',supabaseErr.message)
      setSubmitError(`Supabase: ${supabaseErr.message}`)
      setSubmitState('error')
    }

    try { await submitToFormspree(form) } catch(_) {}

    if (supabaseOk) setSubmitState('success')
  }

  const handleBack=()=>{if(step===1){onClose();return}setStep(s=>s-1);setErrors({})}

  useEffect(()=>{
    const fn=(e)=>{if(e.key==='Escape') onClose()}
    window.addEventListener('keydown',fn)
    return ()=>window.removeEventListener('keydown',fn)
  },[onClose])

  const isLoading=submitState==='loading'
  const isSuccess=submitState==='success'

  return (
    <div className="rm-overlay" onClick={(e)=>{if(e.target===e.currentTarget) onClose()}}>
      <div className="rm-modal" style={isDesktop?{borderRadius:'var(--r-xl)',maxHeight:'90dvh',margin:'auto'}:{}}>
        <div className="rm-modal__header">
          <button className="rm-btn rm-btn--icon" onClick={isSuccess?onClose:handleBack}>{step===1||isSuccess?'✕':'←'}</button>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:'var(--ink)'}}>{isSuccess?'¡Todo listo!':'Registrar ubicación'}</div>
            {!isSuccess&&<div style={{fontSize:11,color:'var(--muted2)',marginTop:1}}>{STEPS[step-1].icon} {STEPS[step-1].label} · Paso {step} de {STEPS.length}</div>}
          </div>
        </div>
        {!isSuccess&&(
          <div className="rm-progress">
            {STEPS.map(s=>(
              <div key={s.id} className={`rm-progress__step ${step===s.id?'rm-progress__step--active':''} ${step>s.id?'rm-progress__step--done':''}`}>
                <div className="rm-progress__bar"/>
                <span className="rm-progress__label">{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {isSuccess?<SuccessScreen form={form} onClose={onClose}/>:(
          <>
            <div className="rm-modal__body">
              {submitState==='error'&&<div className="rm-alert rm-alert--error"><span>⚠️</span><span>{submitError}</span></div>}
              {step===1&&<Step1 form={form} errors={errors} onChange={onChange} cities={cities}/>}
              {step===2&&<Step2 form={form} errors={errors} onChange={onChange}/>}
              {step===3&&<Step3 form={form} errors={errors} onChange={onChange}/>}
            </div>
            <div className="rm-modal__footer">
              {step>1&&<button className="rm-btn rm-btn--secondary" onClick={handleBack} disabled={isLoading}>Atrás</button>}
              <button className="rm-btn rm-btn--primary rm-btn--full" onClick={handleNext} disabled={isLoading}>
                {isLoading&&<span className="rm-spinner"/>}
                {isLoading?'Enviando…':step<3?`Continuar → ${STEPS[step].label}`:'✓ Enviar solicitud'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
          }
