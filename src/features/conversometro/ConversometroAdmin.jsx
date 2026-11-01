import React, {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';

export default function ConversometroAdmin({students=[],marks=[],saving=false,onAdd,onUndo,error=''}) {
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState('');
  const [quantity,setQuantity]=useState(1);
  const candidates=useMemo(()=>students.filter(s=>s.name.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))).sort((a,b)=>a.name.localeCompare(b.name,'es')).slice(0,60),[students,search]);
  const student=students.find(s=>String(s.id)===String(selected));
  const count=student?marks.filter(m=>String(m.student_id)===String(student.id)&&!m.voided_at).length:0;
  const add=()=>{if(student&&!saving)onAdd(student.id,quantity)};
  return <main style={{minHeight:'100vh',padding:'max(20px,env(safe-area-inset-top)) 14px 60px',background:'radial-gradient(circle at 40% 0%,#3a1866,#100c24 55%)',color:'#fff',fontFamily:'system-ui,sans-serif'}}>
    <div style={{maxWidth:700,margin:'auto'}}>
      <Link to="/admin" style={{color:'#d9ff7d',textDecoration:'none'}}>← Volver al panel administrador</Link>
      <h1 style={{fontSize:'clamp(26px,6vw,42px)',lineHeight:1.1,marginBottom:8}}>🗣️ Control del Conversómetro</h1>
      <p style={{color:'#d4c5e5'}}>Sumá bolitas durante la clase. Cada bolita es una llamada de atención por charlar. Sin notas ni textos.</p>
      <section style={{padding:20,background:'#20113c',border:'1px solid #9862d0',borderRadius:22}}>
        <label htmlFor="cm-admin-search" style={{display:'block',marginBottom:8,fontWeight:700}}>Buscar alumno</label>
        <input id="cm-admin-search" type="search" value={search} onChange={e=>{setSearch(e.target.value);setSelected('')}} placeholder="Nombre o apellido" style={{width:'100%',padding:14,fontSize:16,color:'#fff',background:'#100c24',border:'1px solid #8651bc',borderRadius:12}}/>
        <div style={{maxHeight:250,overflowY:'auto',marginTop:12}}>
          {candidates.map(s=><button key={s.id} type="button" onClick={()=>{setSelected(String(s.id));setSearch(s.name)}} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 12px',minHeight:50,background:String(selected)===String(s.id)?'#55318c':'transparent',border:0,borderBottom:'1px solid #ffffff16',color:'#fff',textAlign:'left',cursor:'pointer'}}>
            {s.avatar_url?<img src={s.avatar_url} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover'}}/>:<span style={{fontSize:25}}>🛼</span>}
            <span>{s.name}</span>
          </button>)}
          {!candidates.length&&<p style={{color:'#d4c5e5'}}>No se encontraron alumnos.</p>}
        </div>
        {student&&<div style={{marginTop:22,padding:16,background:'#301d52',borderRadius:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <strong>{student.name}</strong><span style={{fontSize:24,color:'#d9ff7d',fontWeight:900}}>{count} 🟣</span>
          </div>
          <p style={{color:'#d4c5e5',fontSize:13}}>Bolitas acumuladas en el histórico</p>
          <label htmlFor="cm-admin-quantity" style={{display:'block',fontWeight:700,marginBottom:8}}>¿Cuántas bolitas querés sumar?</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[1,2,5,10,25].map(n=><button key={n} type="button" aria-pressed={quantity===n} onClick={()=>setQuantity(n)} style={{minWidth:50,minHeight:46,borderRadius:12,border:quantity===n?'2px solid #d9ff7d':'1px solid #8560b2',background:quantity===n?'#4c287f':'#1c1134',color:'#fff',fontWeight:800,cursor:'pointer'}}>+{n}</button>)}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button type="button" disabled={saving} onClick={add} style={{flex:1,minHeight:52,border:0,borderRadius:12,background:'#d9ff7d',color:'#171024',fontSize:16,fontWeight:900,cursor:'pointer'}}>{saving?'Guardando…':`Sumar ${quantity} ${quantity===1?'bolita':'bolitas'}`}</button>
            <button type="button" disabled={saving||count===0} onClick={()=>onUndo(student.id)} style={{minHeight:52,padding:'0 16px',borderRadius:12,border:'1px solid #e6b2ff',background:'#352049',color:'#fff',fontWeight:700,cursor:'pointer'}}>−1</button>
          </div>
        </div>}
        {error&&<p role="alert" style={{color:'#ffd1d1'}}>{error}</p>}
      </section>
      <p style={{marginTop:18}}><Link to="/app/conversometro" style={{color:'#d9ff7d'}}>Ver frascos, ranking y estadísticas →</Link></p>
    </div>
  </main>;
}
