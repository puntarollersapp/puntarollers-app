import '../pages/Personalizadas.css'

export default function PassCard({ student, pass, reservedCredits = 0, bookableCredits = 0, paymentPending = false, inactive = false }) {
  const total = Math.max(0, Number(pass?.clases_cargadas || 0))
  const used = Math.min(total, Math.max(0, Number(pass?.clases_utilizadas || 0)))
  const left = Math.max(0, Number(pass?.clases_disponibles || 0))
  const reserved = Math.min(Math.max(0, total-used), Math.max(0, Number(reservedCredits)||0))
  const available = Math.max(0, Number(bookableCredits)||0)
  const progress = total ? used / total * 100 : 0
  return <section className="pr-pass-v3 pr-pass-enter" aria-label="Tu cuponera digital PR Pass">
    <div className="pr-pass-v3-orbit" aria-hidden="true"/><div className="pr-pass-v3-shine" aria-hidden="true"/>
    <header className="pr-pass-v3-head"><div className="pr-pass-v3-brand"><img src="/logo.png" alt="Punta Rollers"/><div><p>PR PERSONAL</p><strong>PR PASS</strong></div></div><span className="pr-pass-v3-status">{paymentPending?'PAGO PENDIENTE':inactive?'NO VIGENTE':left>0?'ACTIVA':'COMPLETA'}</span></header>
    <div className="pr-pass-v3-identity"><div><small>TITULAR</small><h2>{student?.nombre || 'Alumno'} {student?.apellido || ''}</h2><p>{pass?.nombre_cuponera || 'Cuponera de '+total+' clases'}</p></div><div className="pr-pass-v3-balance"><small>TE QUEDAN</small><strong>{left}<em>/{total}</em></strong><span>clases</span></div></div>
    <div className="pr-pass-v3-stats"><div><b>{used}</b><small>Realizadas</small></div><div><b>{reservedCredits}</b><small>Reservadas</small></div><div><b>{available}</b><small>Para reservar</small></div></div>
    <div className="pr-pass-v3-progress"><span>Tu progreso</span><strong>{used} de {total}</strong><div role="progressbar" aria-label="Clases realizadas" aria-valuemin={0} aria-valuemax={Math.max(1,total)} aria-valuenow={used}><i style={{width:progress+'%'}}/></div></div>
    <div className="pr-pass-v3-tickets">{Array.from({length:total},(_,index)=>{const state=index<used?'done':index<used+reserved?'reserved':'open';return <div key={index} className={'pr-pass-v3-ticket '+state}><small>{String(index+1).padStart(2,'0')}</small><div className={state==='done'?'pr-pass-v3-stamped':''}>{state==='done'?<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 4 4L19 6"/></svg>:state==='reserved'?<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v5m8-5v5M4 10h16"/></svg>:<span aria-hidden="true">+</span>}</div><b>{state==='done'?'Realizada':state==='reserved'?'Reservada':'Pendiente'}</b></div>})}</div>
    <footer className="pr-pass-v3-footer"><span>PRIVATE TRAINING · 1:1</span><span>PUNTA ROLLERS</span></footer>
  </section>
}

