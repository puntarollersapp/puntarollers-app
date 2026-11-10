import {useEffect,useMemo,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../lib/supabase'
import './AdminEquipmentLibrary.css'
const empty={tipo:'patines',codigo:'',marca:'',modelo:'',talle:'',numero:'',estado:'disponible',notas:''}
export default function AdminEquipmentLibrary(){
 const go=useNavigate(),[items,setItems]=useState([]),[holds,setHolds]=useState([]),[requests,setRequests]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[photo,setPhoto]=useState(null),[photos,setPhotos]=useState({}),[filter,setFilter]=useState('todos'),[search,setSearch]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('')
 async function refresh(){const [a,b,d]=await Promise.all([supabase.from('pr_equipment_items').select('*').order('created_at',{ascending:false}),supabase.from('pr_equipment_holds').select('*').in('status',['held','paid']),supabase.from('pr_prestamo_patines_espera').select('id,nombre_alumno,talle_calzado,estado,creado_en').in('estado',['pendiente','contactado'])]);if(a.error||b.error||d.error)setError(a.error?.message||b.error?.message||d.error?.message);else{setItems(a.data||[]);setHolds(b.data||[]);setRequests(d.data||[])}}
 useEffect(()=>{refresh()},[])
 useEffect(()=>{let active=true;Promise.all(items.filter(i=>i.foto_path).map(async i=>{const {data}=await supabase.storage.from('pr-equipment-private').createSignedUrl(i.foto_path,3600);return [i.id,data?.signedUrl]})).then(pairs=>{if(active)setPhotos(Object.fromEntries(pairs))});return()=>{active=false}},[items])
 const activeHold=id=>holds.find(h=>h.equipment_id===id&&(h.status==='paid'||new Date(h.expires_at)>new Date()))
 const demand=useMemo(()=>{const m=new Map();for(const req of requests){const key=String(req.talle_calzado||'').trim();if(!key)continue;if(!m.has(key))m.set(key,[]);m.get(key).push(req)}return [...m.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([size,people])=>({size,people,available:items.filter(i=>i.tipo==='patines'&&i.talle.trim()===size&&i.estado==='disponible'&&!activeHold(i.id)).length}))},[requests,items,holds])
 const shown=items.filter(i=>(filter==='todos'||i.tipo===filter)&&[i.codigo,i.marca,i.modelo,i.talle,i.numero].join(' ').toLowerCase().includes(search.toLowerCase()))
 const stats={total:items.length,libres:items.filter(i=>i.estado==='disponible'&&!activeHold(i.id)).length,reservados:items.filter(i=>activeHold(i.id)).length}
 const activeReservations=holds.filter(h=>h.status==='paid'||new Date(h.expires_at)>new Date())
 async function cancelHold(h){if(h.status!=='held'||!window.confirm('¿Liberar este artículo? Esta acción cancela la reserva temporal y vuelve a ponerlo disponible.'))return;setBusy(true);setError('');try{const {data,error}=await supabase.rpc('pr_admin_cancel_equipment_hold',{p_hold_id:h.id});if(error)throw error;if(!data)throw Error('La reserva ya no estaba pendiente.');setSuccess('Reserva temporal liberada correctamente.');await refresh()}catch(e){setError(e.message||'No se pudo liberar.')}finally{setBusy(false)}}
 const set=(key,value)=>setForm(f=>({...f,[key]:value}))
 async function save(e){e.preventDefault();setBusy(true);setError('');setSuccess('');try{
 if(!form.codigo.trim()||!form.talle.trim())throw Error('Completá el código y el talle.')
 let path=editing?.foto_path||null
 if(photo){if(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>5242880)throw Error('La foto debe ser JPG, PNG o WebP de hasta 5 MB.')
 const extension=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg'
 const name=`${crypto.randomUUID()}.${extension}`
 const upload=await supabase.storage.from('pr-equipment-private').upload(name,photo,{contentType:photo.type})
 if(upload.error)throw upload.error
 path=name}
 const payload={...form,codigo:form.codigo.trim(),talle:form.talle.trim(),foto_path:path,updated_at:new Date().toISOString()}
 const result=editing?await supabase.from('pr_equipment_items').update(payload).eq('id',editing.id).select().single():await supabase.from('pr_equipment_items').insert(payload).select().single()
 if(result.error)throw result.error
 setSuccess(editing?'Ficha actualizada.':'Artículo agregado al inventario.')
 setForm(empty);setEditing(null);setPhoto(null);const file=document.getElementById('equipment-photo');if(file)file.value='';await refresh()
 }catch(err){setError(err.message||'No se pudo guardar.')}finally{setBusy(false)}}
 function edit(i){setEditing(i);setForm({tipo:i.tipo,codigo:i.codigo,marca:i.marca||'',modelo:i.modelo||'',talle:i.talle,numero:i.numero||'',estado:i.estado,notas:i.notas||''});setPhoto(null);window.scrollTo({top:0,behavior:'smooth'})}
 return <main className="eq-root"><div className="eq-wrap">
 <header className="eq-top"><button onClick={()=>go('/admin/inscripciones-2026')}>← Inscripciones</button><span>PR CONTROL / INVENTARIO PRIVADO</span></header>
 <div className="eq-hero"><div><p>THE GEAR LIBRARY · PUNTA ROLLERS</p><h1>Todo tu equipo.<br/><em>Bajo control.</em></h1><span>Biblioteca privada de patines, cascos y protecciones.</span></div><div className="eq-symbol">PR<span>®</span></div></div>
 <section className="eq-stats"><div><b>{stats.total}</b><span>ARTÍCULOS</span></div><div><b>{stats.libres}</b><span>DISPONIBLES</span></div><div><b>{stats.reservados}</b><span>RESERVADOS</span></div></section>
 <section className="eq-reservations"><div className="eq-heading"><div><small>CONTROL OPERATIVO / 6 HORAS</small><h2>Reservas de equipamiento</h2></div><button className="eq-refresh" onClick={refresh}>↻ Actualizar</button></div>
 {!activeReservations.length?<p className="eq-muted">No hay artículos bloqueados ni asignados. Cuando existan reservas, aparecerán acá con su vencimiento.</p>:<div className="eq-reservation-list">{activeReservations.map(h=>{const i=items.find(x=>x.id===h.equipment_id);return <div className="eq-reservation-row" key={h.id}><div><strong>{i?.codigo||'Artículo'} · Talle {i?.talle||'—'}</strong><p>{h.status==='paid'?'Asignación confirmada':`Retención temporal · vence ${new Date(h.expires_at).toLocaleString('es-UY',{timeZone:'America/Montevideo',dateStyle:'short',timeStyle:'short'})}`}</p></div>{h.status==='held'&&<button disabled={busy} onClick={()=>cancelHold(h)}>Liberar</button>}</div>})}</div>}
 <p className="eq-muted">Las reservas pagadas no se liberan automáticamente. La liberación manual solo está disponible para retenciones sin confirmar.</p></section>
 <section className="eq-demand"><div className="eq-heading"><div><small>EN TIEMPO REAL / SOLICITUDES</small><h2>¿Qué talles están esperando?</h2></div><span className="eq-private">{requests.length} personas</span></div>
 {demand.length===0?<p className="eq-muted">No hay solicitudes de préstamo pendientes.</p>:<div className="eq-demand-grid">{demand.map(d=><article key={d.size}><div className="eq-demand-head"><strong>TALLE {d.size}</strong><span>{d.people.length} esperando</span></div><div className={d.available>=d.people.length?'eq-demand-ok':'eq-demand-low'}>{d.available} pares libres · {d.available>=d.people.length?'stock suficiente':`faltan ${d.people.length-d.available}`}</div><p>{d.people.map(p=>p.nombre_alumno).join(' · ')}</p></article>)}</div>}
 <p className="eq-muted">La disponibilidad se calcula a partir de las fichas individuales, no del stock manual anterior. Las solicitudes aún no reservan artículos automáticamente.</p></section>
 <section className="eq-editor"><div className="eq-heading"><div><small>01 / CATÁLOGO</small><h2>{editing?'Editar ficha':'Nueva ficha de equipo'}</h2></div><span className="eq-private">🔒 Solo administradores</span></div>
 <form onSubmit={save}><div className="eq-fields">
 <label>TIPO<select value={form.tipo} onChange={e=>set('tipo',e.target.value)}><option value="patines">🛼 Patines</option><option value="casco">⛑️ Casco</option><option value="protecciones">🛡️ Protecciones</option></select></label>
 <label>CÓDIGO / ID<input required placeholder="PR-PAT-001" value={form.codigo} onChange={e=>set('codigo',e.target.value)}/></label>
 <label>MARCA<input placeholder="Rollerblade" value={form.marca} onChange={e=>set('marca',e.target.value)}/></label>
 <label>MODELO<input placeholder="Macroblade" value={form.modelo} onChange={e=>set('modelo',e.target.value)}/></label>
 <label>TALLE<input required placeholder="38 / M / L" value={form.talle} onChange={e=>set('talle',e.target.value)}/></label>
 <label>NÚMERO / SERIE<input placeholder="N.º de identificación" value={form.numero} onChange={e=>set('numero',e.target.value)}/></label>
 <label>ESTADO<select value={form.estado} onChange={e=>set('estado',e.target.value)}><option value="disponible">Disponible</option><option value="mantenimiento">En mantenimiento</option><option value="retirado">Fuera de servicio</option></select></label>
 <label>FOTO PRIVADA<input id="equipment-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
 <label className="eq-full">OBSERVACIONES<input placeholder="Estado, ubicación, detalles..." value={form.notas} onChange={e=>set('notas',e.target.value)}/></label></div>
 {error&&<p role="alert" className="eq-error">{error}</p>}{success&&<p role="status" className="eq-success">{success}</p>}
 <div className="eq-buttons"><button className="eq-save" disabled={busy}>{busy?'Guardando…':editing?'Guardar cambios':'＋ Agregar al inventario'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty);setPhoto(null)}}>Cancelar</button>}</div></form></section>
 <section className="eq-library"><div className="eq-heading"><div><small>02 / TU COLECCIÓN</small><h2>Biblioteca de equipamiento</h2></div><strong>{shown.length} fichas</strong></div>
 <div className="eq-filters"><input type="search" placeholder="Buscar talle, código, modelo…" value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todo el equipo</option><option value="patines">Patines</option><option value="casco">Cascos</option><option value="protecciones">Protecciones</option></select></div>
 <div className="eq-grid">{shown.map(i=>{const hold=activeHold(i.id);return <article className="eq-card" key={i.id}><div className="eq-photo">{photos[i.id]?<img src={photos[i.id]} alt={`${i.tipo} ${i.modelo||''}`}/>:<span>{i.tipo==='patines'?'🛼':i.tipo==='casco'?'⛑️':'🛡️'}</span>}<small>{i.codigo}</small></div><div className="eq-card-body"><div className="eq-card-top"><span>{i.tipo.toUpperCase()}</span><span className={hold?'eq-held':i.estado==='disponible'?'eq-available':'eq-off'}>{hold?'RESERVADO':i.estado==='disponible'?'DISPONIBLE':i.estado.toUpperCase()}</span></div><h3>{i.marca||'Punta Rollers'} {i.modelo||''}</h3><p>Talle <b>{i.talle}</b>{i.numero?' · N.º '+i.numero:''}</p><button onClick={()=>edit(i)}>Editar ficha →</button></div></article>})}</div>
 {!shown.length&&<div className="eq-empty">Todavía no hay fichas para esta búsqueda. Agregá tu primer equipo arriba.</div>}
 </section><p className="eq-footnote">INVENTARIO INTERNO · Las fotos, modelos y códigos no se muestran a los alumnos. Las reservas automáticas aún no están habilitadas.</p>
 </div></main>
}