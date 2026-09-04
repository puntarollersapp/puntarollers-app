import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import mfLogo from '../assets/mfLogoData'
import './ClinicaMiguelOct2026.css'

const MAX_CUPOS = 30
const PRICE = 2000
const niveles = ['Primera vez', 'Principiante', 'Intermedio', 'Avanzado', 'Competitivo']
const initialForm = { nombre_completo:'', edad:'', nivel:'', telefono:'', email:'', asistencia_completa:false, opcion_pago:'' }

const trainingBlocks = [
  { n:'01', title:'Técnica de base', text:'Fundamentos, postura, centro de gravedad y eficiencia del movimiento.' },
  { n:'02', title:'Frenado + control', text:'Recursos de frenado, estabilidad, dominio del cuerpo y seguridad sobre ruedas.' },
  { n:'03', title:'Curvas + trayectoria', text:'Entrada, salida, inclinación, transferencia de peso y lectura de línea.' },
  { n:'04', title:'Progresión técnica', text:'Correcciones para que cada patinador avance desde su nivel actual.' },
  { n:'05', title:'SlideBoards', text:'Trabajo específico de empuje lateral, transferencia de peso, coordinación y estabilidad fuera del patín.' },
  { n:'06', title:'Aplicación real', text:'Ejercicios progresivos en pista y situaciones concretas de patinaje.' },
  { n:'07', title:'Corrección personalizada', text:'Observación, devolución técnica y ajustes individuales durante la clínica.' },
  { n:'08', title:'Puesta a punto pre-carrera', text:'Ajustes finales de técnica, economía de movimiento y sensaciones de cara a Shifter.' },
]

export default function ClinicaMiguelOct2026(){
  const [step,setStep]=useState(0)
  const [form,setForm]=useState(initialForm)
  const [cupos,setCupos]=useState({ocupados:0,total:MAX_CUPOS,disponibles:MAX_CUPOS,lista_espera:0})
  const [loadingCupos,setLoadingCupos]=useState(true)
  const [sending,setSending]=useState(false)
  const [error,setError]=useState('')
  const [done,setDone]=useState(null)
  const waitlistActive=!loadingCupos&&cupos.disponibles<=0
  const percent=useMemo(()=>Math.min(100,Math.round((Math.min(cupos.ocupados,cupos.total)/cupos.total)*100)),[cupos])
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}))

  const loadCupos=async()=>{const{data,error:seatsError}=await supabase.rpc('clinica_oct_2026_cupos');if(!seatsError&&data?.[0])setCupos(data[0]);setLoadingCupos(false)}
  useEffect(()=>{loadCupos()},[])

  const validateData=()=>{
    if(!form.nombre_completo.trim()||!form.edad||!form.nivel||!form.telefono.trim()){setError('Completá nombre, edad, nivel y WhatsApp para continuar.');return false}
    const age=Number(form.edad);if(!Number.isInteger(age)||age<5||age>100){setError('Ingresá una edad válida.');return false}
    setError('');return true
  }
  const validateFinal=()=>{
    if(!form.asistencia_completa){setError('Confirmá que participás de las tres jornadas para continuar.');return false}
    if(!form.opcion_pago){setError('Elegí una modalidad para registrar tu lugar.');return false}
    setError('');return true
  }

  const submit=async()=>{
    if(!validateFinal())return
    setSending(true);setError('')
    const{data,error:submitError}=await supabase.rpc('registrar_clinica_oct_2026_v1',{
      p_nombre_completo:form.nombre_completo.trim(),p_edad:Number(form.edad),p_nivel:form.nivel,p_telefono:form.telefono.trim(),p_email:form.email.trim(),p_asistencia_completa:true,p_opcion_pago:form.opcion_pago,
    })
    setSending(false)
    if(submitError){setError('No pudimos guardar la inscripción. Probá nuevamente o escribinos por WhatsApp.');await loadCupos();return}
    if(data?.id){supabase.functions.invoke('notificar-clinica-oct-2026',{body:{id:data.id}}).catch(()=>{})}
    setDone({id:data?.id,payment:form.opcion_pago,waitlist:Boolean(data?.lista_espera),estado:data?.estado,numeroRegistro:data?.numero_registro})
    await loadCupos();setStep(3);window.scrollTo({top:0,behavior:'smooth'})
  }

  return <main className="oct-shell"><div className="oct-noise" aria-hidden="true"/><section className="oct-wrap">
    <header className="oct-nav"><img src="/logo.png" alt="Punta Rollers"/><span>CLÍNICA 02 · OCTUBRE 2026</span><img className="oct-mf" src={mfLogo} alt="Patin's Club Miguel Flores"/></header>
    {step<3&&<div className="oct-progress"><div><span>{loadingCupos?'—':cupos.disponibles}</span><small>lugares disponibles</small></div><div className="oct-progress-track"><i style={{width:`${percent}%`}}/></div><b>{loadingCupos?'Cargando':waitlistActive?'Lista de espera abierta':`${cupos.ocupados}/${cupos.total}`}</b></div>}

    {step===0&&<div className="oct-hero">
      <div className="oct-hero-copy"><p className="oct-overline">PUNTA ROLLERS × MIGUEL FLORES</p><h1><span>CLÍNICA</span><strong>02</strong></h1><h2>Más técnica.<br/>Más control.<br/><em>Más nivel.</em></h2><p className="oct-intro">La segunda parte de una experiencia intensiva de tres jornadas junto a Miguel Ángel Flores, entrenador argentino y Subcampeón Mundial Máster con más de 40 años dentro del patinaje. No es repetir la primera clínica: es profundizar, corregir y llevar cada herramienta un paso más allá.</p></div>
      <aside className="oct-date-card"><span>OCT</span><div><b>28</b><small>MIÉRCOLES</small></div><div><b>29</b><small>JUEVES</small></div><div><b>30</b><small>VIERNES</small></div><p>2026 · MALDONADO / PUNTA DEL ESTE</p></aside>
      <div className="oct-manifesto"><div><b>3</b><span>jornadas</span></div><div><b>6H</b><span>de trabajo</span></div><div><b>30</b><span>cupos</span></div><div><b>ALL</b><span>niveles</span></div></div>

      <section className="oct-shifter">
        <div className="oct-shifter-kicker">FINAL PRE-RACE BLOCK</div>
        <div className="oct-shifter-main"><div><p className="oct-overline">PREVIA OFICIAL · SHIFTER MARATHON</p><h3>Tu último gran entrenamiento antes de la carrera.</h3><p>La Clínica 02 fue ubicada estratégicamente el <b>miércoles 28, jueves 29 y viernes 30 de octubre</b>, justo antes de Shifter. La idea es tomar estas tres jornadas como una puesta a punto final: ajustar técnica, sensaciones, eficiencia y confianza antes de competir.</p></div><div className="oct-shifter-timeline"><div><b>28</b><span>MIÉ</span></div><i>→</i><div><b>29</b><span>JUE</span></div><i>→</i><div><b>30</b><span>VIE</span></div><i>→</i><div className="rest"><b>31</b><span>SÁB · RECUPERACIÓN</span></div><i>→</i><div className="race"><b>01</b><span>DOM · SHIFTER</span></div></div></div>
        <div className="oct-shifter-bottom"><span>ENTRENAR</span><b>→</b><span>AJUSTAR</span><b>→</b><span>RECUPERAR</span><b>→</b><span>COMPETIR</span></div>
      </section>

      <section className="oct-program">
        <div className="oct-program-head"><div><p className="oct-overline">CONTENIDO · CLÍNICA 02</p><h3>Lo que vas a trabajar</h3></div><p>Una progresión pensada para transformar correcciones en herramientas concretas y llegar a Shifter con una puesta a punto técnica final.</p></div>
        <div className="oct-program-grid">{trainingBlocks.map(item=><article key={item.n} className={item.title==='SlideBoards'?'featured':''}><span>{item.n}</span><div><h4>{item.title}</h4><p>{item.text}</p></div></article>)}</div>
        <div className="oct-slideboard"><div className="oct-slideboard-mark">SB</div><div><b>ENTRENAMIENTO EN SLIDEBOARDS</b><p>Por primera vez dentro de la clínica incorporamos trabajo específico fuera del patín para sentir y mejorar el empuje lateral, la transferencia de peso, la estabilidad y la coordinación. Después, llevamos esas sensaciones nuevamente a los patines.</p></div><strong>OFF SKATE → ON SKATE</strong></div>
      </section>

      <div className="oct-value-strip"><span>PARA PRINCIPIANTES</span><span>INTERMEDIOS</span><span>AVANZADOS</span><span>COMPETITIVOS</span><span>NIÑOS + ADULTOS</span></div>
      <div className="oct-price-strip"><div><small>EXPERIENCIA COMPLETA</small><strong>${PRICE.toLocaleString('es-UY')}</strong></div><p>3 jornadas · puesta a punto pre-Shifter · seguimiento técnico · SlideBoards</p></div>
      {waitlistActive&&<Notice text="Los 30 lugares principales están completos. Podés registrarte y quedar en lista de espera sin realizar un nuevo pago hasta que PR confirme disponibilidad."/>}
      <button className="oct-cta" onClick={()=>setStep(1)}><span>{waitlistActive?'QUIERO ENTRAR EN LISTA DE ESPERA':'QUIERO SER PARTE'}</span><b>→</b></button>
    </div>}

    {step===1&&<div className="oct-stage"><button className="oct-back" onClick={()=>setStep(0)}>← Volver</button><p className="oct-overline">01 · TU LUGAR</p><h2 className="oct-title">¿Quién se suma?</h2><p className="oct-stage-copy">No necesitás tener cuenta en PuntaRollers.com. Completá tus datos y seguí al último paso.</p>
      <div className="oct-fields"><label className="wide"><span>Nombre completo</span><input value={form.nombre_completo} onChange={e=>update('nombre_completo',e.target.value)} autoComplete="name" placeholder="Tu nombre y apellido"/></label><label><span>Edad</span><input type="number" inputMode="numeric" value={form.edad} onChange={e=>update('edad',e.target.value)} placeholder="Ej. 32"/></label><label><span>Nivel actual</span><select value={form.nivel} onChange={e=>update('nivel',e.target.value)}><option value="">Elegí tu nivel</option>{niveles.map(n=><option key={n}>{n}</option>)}</select></label><label><span>WhatsApp</span><input type="tel" inputMode="tel" value={form.telefono} onChange={e=>update('telefono',e.target.value)} autoComplete="tel" placeholder="09X XXX XXX"/></label><label><span>Email <small>opcional</small></span><input type="email" inputMode="email" value={form.email} onChange={e=>update('email',e.target.value)} autoComplete="email" placeholder="tu@email.com"/></label></div>
      <div className="oct-topics">{['Técnica de base','Centro de gravedad','Frenado','Curvas','Control','SlideBoards','Transferencia de peso','Puesta a punto Shifter','Corrección personalizada','Aplicación a tu nivel'].map(item=><span key={item}>+ {item}</span>)}</div>{error&&<p className="oct-error">{error}</p>}<button className="oct-cta" onClick={()=>validateData()&&setStep(2)}><span>CONTINUAR</span><b>→</b></button>
    </div>}

    {step===2&&<div className="oct-stage"><button className="oct-back" onClick={()=>setStep(1)}>← Volver a mis datos</button><p className="oct-overline">02 · CONFIRMACIÓN</p><h2 className="oct-title">Reservá la experiencia.</h2>
      <div className="oct-summary"><div><span>CLÍNICA 02 · PREVIA SHIFTER</span><b>28 · 29 · 30 OCT</b><small>Entrenamiento final · sábado de recuperación · carrera el domingo</small></div><strong>${PRICE.toLocaleString('es-UY')}</strong></div>
      <label className={`oct-check ${form.asistencia_completa?'active':''}`}><input type="checkbox" checked={form.asistencia_completa} onChange={e=>update('asistencia_completa',e.target.checked)}/><i>{form.asistencia_completa?'✓':''}</i><div><b>Confirmo mi participación en las tres jornadas</b><small>Miércoles 28 · jueves 29 · viernes 30 de octubre</small></div></label>
      <div className="oct-payment-grid"><Choice active={form.opcion_pago==='pagar_ahora'} onClick={()=>update('opcion_pago','pagar_ahora')} index="01" title="Transferencia" text={waitlistActive?'Quedo registrado en espera. No transfiero hasta recibir confirmación de PR.':`Transfiero $${PRICE.toLocaleString('es-UY')} y PR valida mi pago.`}/><Choice active={form.opcion_pago==='bonificacion_rifa'} onClick={()=>update('opcion_pago','bonificacion_rifa')} index="02" title="Bonificación PR" text="Soy alumno PR y corresponde validar mi modalidad de bonificación de rifa."/><Choice active={form.opcion_pago==='ya_pague'} onClick={()=>update('opcion_pago','ya_pague')} index="03" title="Ya pagué" text="Ya realicé el pago previamente y quiero registrar mi lugar."/></div>
      {!waitlistActive&&form.opcion_pago==='pagar_ahora'&&<div className="oct-bank"><span>DATOS DE TRANSFERENCIA</span><div><b>PREX · Claudio Facelli</b><strong>70658</strong></div><small>El registro se guarda ahora. El cupo se confirma cuando Punta Rollers verifica la acreditación.</small></div>}
      <p className="oct-no-coupon">Esta inscripción no utiliza códigos ni cupones de descuento.</p>{error&&<p className="oct-error">{error}</p>}<button className="oct-cta" disabled={sending} onClick={submit}><span>{sending?'GUARDANDO…':waitlistActive?'ENTRAR EN LISTA DE ESPERA':'CONFIRMAR INSCRIPCIÓN'}</span><b>→</b></button>
    </div>}
    {step===3&&done&&<Success result={done}/>} 
  </section></main>
}

function Choice({active,onClick,index,title,text}){return <button type="button" className={`oct-choice ${active?'active':''}`} onClick={onClick}><span>{index}</span><div><b>{title}</b><p>{text}</p></div><i>{active?'✓':'→'}</i></button>}
function Notice({text}){return <div className="oct-notice"><b>LISTA DE ESPERA</b><p>{text}</p></div>}
function Success({result}){const wait=result.waitlist||result.estado==='lista_espera';const paid=result.payment==='ya_pague'&&!wait;const raffle=result.payment==='bonificacion_rifa'&&!wait;return <div className="oct-success"><p className="oct-overline">REGISTRO #{result.numeroRegistro||'—'}</p><div className="oct-success-mark">{wait?'…':'✓'}</div><h1>{wait?'Estás en espera.':'Ya sos parte.'}</h1><p>{wait?'Guardamos tu registro. Punta Rollers te contactará si se libera o amplía un lugar.':paid?'Tu inscripción quedó registrada como pago realizado.':raffle?'Tu lugar quedó registrado y ahora validaremos la bonificación PR.':'Tu lugar quedó pre-reservado. Confirmaremos el cupo al verificar la transferencia.'}</p><div className="oct-success-date"><b>28 · 29 · 30 OCT</b><span>CLÍNICA 02 · PUESTA A PUNTO PRE-SHIFTER</span></div><a href="/" className="oct-cta"><span>VOLVER A PUNTA ROLLERS</span><b>→</b></a></div>}
