import {useState} from 'react'
import './PRKidsFamilyDashboard.css'

const sample={
 clases:[{date:'SÁBADO · CLASE DE EJEMPLO',title:'Equilibrio y frenadas',detail:'Circuito de conos, postura de seguridad y frenada controlada.',teacher:'Mensaje de ejemplo: ¡Muy buen trabajo en equipo!'},{date:'MIÉRCOLES · CLASE DE EJEMPLO',title:'Primeros giros',detail:'Giros amplios, coordinación y desplazamiento seguro.',teacher:'Mensaje de ejemplo: Seguimos practicando con confianza.'}],
 skills:[{name:'Equilibrio',detail:'Mantener postura y estabilidad',done:true},{name:'Primeros giros',detail:'Control de dirección',done:true},{name:'Frenada en T',detail:'Aprender a detenerse con seguridad',done:false},{name:'Trabajo en equipo',detail:'Compartir el circuito',done:true}],
 passport:['Primer encuentro','Equilibrio','Primeros giros','Frenadas','Gran recorrido','Desafío final']
}
const tabs=[['clases','Qué hicimos hoy'],['pasaporte','Pasaporte'],['logros','Mis logros'],['recuerdos','Recuerdos']]
export default function PRKidsFamilyDashboard({child,demo=false,onBack}){
 const [tab,setTab]=useState('clases')
 const [showTeacher,setShowTeacher]=useState(true)
 return <section className="prk-dashboard" aria-label={'Perfil infantil de '+child.nombre}>
  <div className="prk-dashboard-top"><button type="button" className="prk-dashboard-back" onClick={onBack}>← Mi familia</button><span className="prk-dashboard-chip">{demo?'VISTA DEMO · FICTICIA':'PERFIL PRIVADO'}</span></div>
  <div className="prk-dashboard-hero"><div className="prk-dashboard-avatar" aria-hidden="true">✦</div><div><p className="prk-dashboard-eyebrow">MI AVENTURA SOBRE RUEDAS</p><h2>{child.nombre}</h2><p>{demo?'Un ejemplo de cómo la familia acompañará cada avance.':'Mi espacio familiar de PR Kids.'}</p></div></div>
  {demo&&<div className="prk-dashboard-stats"><div><strong>2</strong><span>Clases de ejemplo</span></div><div><strong>3</strong><span>Logros de ejemplo</span></div><div><strong>3/6</strong><span>Sellos de ejemplo</span></div></div>}
  <div className="prk-dashboard-tabs" role="tablist" aria-label="Secciones del perfil infantil">{tabs.map(([id,name])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{name}</button>)}</div>
  <div className="prk-dashboard-panel" role="tabpanel">
  {tab==='clases'&&<><h3>Qué hicimos hoy</h3><p className="prk-dashboard-muted">Un resumen para que las familias conozcan lo que se practica en clase.</p>{demo?sample.clases.map((c,i)=><article key={i} className="prk-dashboard-entry"><span>{c.date}</span><h4>{c.title}</h4><p>{c.detail}</p>{showTeacher&&<div className="prk-dashboard-teacher">{c.teacher}</div>}</article>):<p className="prk-dashboard-empty">Todavía no hay clases publicadas para este perfil.</p>}{demo&&<button type="button" className="prk-dashboard-secondary" onClick={()=>setShowTeacher(v=>!v)}>{showTeacher?'Ocultar':'Mostrar'} mensajes de ejemplo</button>}</>}
  {tab==='pasaporte'&&<><h3>Mi pasaporte roller</h3><p className="prk-dashboard-muted">Cada sello será otorgado cuando el equipo registre el avance correspondiente.</p><div className="prk-dashboard-progress"><div style={{width:demo?'50%':'0%'}}/></div><div className="prk-dashboard-stamps">{sample.passport.map((name,i)=><div key={name} className={'prk-dashboard-stamp '+(demo&&i<3?'is-earned':'')}><span aria-hidden="true">{demo&&i<3?'★':'☆'}</span><small>{name}</small></div>)}</div>{!demo&&<p className="prk-dashboard-empty">Aún no hay sellos registrados.</p>}</>}
  {tab==='logros'&&<><h3>Mis logros</h3><p className="prk-dashboard-muted">Insignias asociadas a habilidades verificadas por el equipo de PR Kids.</p><div className="prk-dashboard-skills">{sample.skills.map((skill,i)=><div key={skill.name} className={'prk-dashboard-skill '+(demo&&skill.done?'is-earned':'')}><span aria-hidden="true">{demo&&skill.done?'✦':'◇'}</span><div><strong>{skill.name}</strong><small>{skill.detail}</small></div><em>{demo&&skill.done?'Ejemplo conseguido':demo?'Por conseguir':'Sin registrar'}</em></div>)}</div></>}
  {tab==='recuerdos'&&<><h3>Mis recuerdos</h3><p className="prk-dashboard-muted">Un álbum privado. Solo aparecerán fotografías y videos autorizados y publicados para esta familia.</p><div className="prk-dashboard-gallery"><div><span aria-hidden="true">▧</span><strong>Momentos de clase</strong><small>{demo?'Espacio de foto ficticio':'Sin fotos publicadas'}</small></div><div><span aria-hidden="true">▷</span><strong>Videos de progreso</strong><small>{demo?'Espacio de video ficticio':'Sin videos publicados'}</small></div></div></>}
  </div>
  {demo&&<p className="prk-dashboard-disclaimer">DEMOSTRACIÓN · Todos los nombres, actividades, sellos y logros son ficticios. No se muestran datos de alumnos reales.</p>}
 </section>
}
