import React from 'react'

const styles = {
  card: { margin:'22px 0', padding:'22px', borderRadius:22, background:'linear-gradient(135deg,#191a20,#292a39)', border:'1px solid #ff005566', color:'#f3f1ec', boxShadow:'0 12px 28px #0002' },
  title: {fontSize:23,fontWeight:850,margin:'0 0 8px'},
  label: {display:'flex',alignItems:'center',gap:12,padding:'13px',background:'#ffffff12',borderRadius:12,cursor:'pointer',marginTop:16},
  input: {width:'100%',maxWidth:260,marginTop:8,padding:12,borderRadius:10,border:'1px solid #aaa',fontSize:16,color:'#191a20',background:'#fff'},
  note: {marginTop:15,padding:15,borderRadius:14,background:'#ff00551a',border:'1px solid #ff005588',lineHeight:1.55}
}
export default function SkateLoanRequest({value,onChange,lang='es'}){
 const en=lang==='en'
 return <section style={styles.card} aria-label={en?'Skate loan':'Préstamo de patines'}>
  <p style={{fontSize:12,letterSpacing:2,fontWeight:800,color:'#ff79a3',margin:'0 0 8px'}}>PUNTA ROLLERS · EQUIPAMIENTO</p>
  <h2 style={styles.title}>{en?'🛼 Need skates?':'🛼 ¿No tenés patines?'}</h2>
  <p style={{margin:0,lineHeight:1.6}}>{en?'We can lend you a pair so you can get started!':'¡Te prestamos el equipo para que puedas empezar!'}</p>
  <p style={{fontSize:13,opacity:.85,lineHeight:1.5}}>{en?'Free loan, subject to availability, only during your class.':'Préstamo gratuito sujeto a disponibilidad, únicamente durante el horario de tu clase.'}</p>
  <label style={styles.label}><input type="checkbox" checked={Boolean(value.necesita_patines)} onChange={e=>onChange({...value,necesita_patines:e.target.checked,talle_calzado:e.target.checked?value.talle_calzado:''})}/><strong>{en?'Yes, I need to borrow skates':'Sí, necesito patines prestados'}</strong></label>
  {value.necesita_patines&&<div style={{marginTop:16}}>
    <label style={{fontWeight:700}}>{en?'Your usual shoe size (EU)':'¿Qué talle de calzado usás habitualmente?'}
     <select style={styles.input} required value={value.talle_calzado||''} onChange={e=>onChange({...value,talle_calzado:e.target.value})}>
      <option value="">{en?'Select size':'Seleccioná tu talle'}</option>
      {Array.from({length:29},(_,i)=>i+22).map(n=><option key={n} value={String(n)}>{n}</option>)}
     </select>
    </label>
    <p style={{fontSize:13,opacity:.85}}>{en?'Skates may require 1–2 sizes above your usual shoes. We will confirm the fit.':'Como referencia, los patines pueden requerir 1 o 2 talles más que tu calzado habitual. Confirmaremos el ajuste adecuado.'}</p>
    {value.talle_calzado&&<div style={styles.note}><strong>✅ {en?'We will review your request':'¡Recibimos tu solicitud de patines!'}</strong><p>{en?'We will contact you to confirm availability in your size and arrange your first class. If no equipment is available, you will remain on our waiting list until a pair becomes available, and we will get in touch. We can’t wait to see you on wheels!':'Te contactaremos para confirmar si tenemos disponibilidad de patines en tu talle y coordinar tu primera clase. Si por el momento no contamos con un equipo disponible, quedarás en nuestra lista de espera. Apenas se liberen patines adecuados para vos, nos pondremos en contacto. ¡Estamos deseando verte sobre ruedas! 💗'}</p><small>{en?'Submit the form to register your request. No payment will be collected until availability is confirmed.':'Continuá con el formulario para registrar tu solicitud. No se cobrará hasta confirmar disponibilidad.'}</small></div>}
  </div>}
 </section>
}
