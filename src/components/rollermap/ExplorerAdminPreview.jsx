import {useEffect,useMemo,useState} from 'react'
import {supabase} from '../../lib/supabase'
import {useAuth} from '../../lib/auth'
import ExplorerRoutesMap from './ExplorerRoutesMap'

const labels={calle:'Calle',rambla:'Rambla',ciclovia:'Ciclovía',parque:'Parque',pista:'Pista',circuito:'Circuito',inicial:'Inicial',intermedio:'Intermedio',avanzado:'Avanzado',excelente:'Excelente',buena:'Bueno',irregular:'Irregular',mala:'Malo',bajo:'Bajo',medio:'Medio',alto:'Alto',si:'Buena',parcial:'Parcial',no:'Sin iluminación'}
export default function ExplorerAdminPreview({onBack}){
 const{user}=useAuth(),[routes,setRoutes]=useState([]),[profiles,setProfiles]=useState({}),[photos,setPhotos]=useState({}),[loading,setLoading]=useState(true),[filter,setFilter]=useState('pending'),[busy,setBusy]=useState(''),[selected,setSelected]=useState('')
 async function load(){
   setLoading(true)
   const{data,error}=await supabase.from('pr_rollermap_routes').select('*').order('created_at',{ascending:false})
   if(error){setLoading(false);return}
   const list=data||[],ids=[...new Set(list.map(x=>x.created_by).filter(Boolean))]
   let pmap={}
   if(ids.length){const{data:ps}=await supabase.from('profiles').select('id,nombre,apellido,foto').in('id',ids);pmap=Object.fromEntries((ps||[]).map(p=>[p.id,p]))}
   const routeIds=list.map(x=>x.id);let grouped={}
   if(routeIds.length){const{data:imgs}=await supabase.from('pr_rollermap_route_photos').select('*').in('route_id',routeIds).order('sort_order');for(const img of imgs||[])(grouped[img.route_id]??=[]).push(img)}
   setRoutes(list);setProfiles(pmap);setPhotos(grouped);setLoading(false)
 }
 useEffect(()=>{load()},[])
 async function moderate(route,status){
   setBusy(route.id)
   const payload={status,moderation_note:null}
   if(status==='approved'){payload.approved_at=new Date().toISOString();payload.approved_by=user.id;payload.last_confirmed_at=new Date().toISOString()}
   const{error}=await supabase.from('pr_rollermap_routes').update(payload).eq('id',route.id)
   if(!error&&(photos[route.id]||[]).length)await supabase.from('pr_rollermap_route_photos').update({status:status==='approved'?'approved':'rejected'}).eq('route_id',route.id)
   setBusy('');await load()
 }
 const visible=useMemo(()=>routes.filter(r=>filter==='all'||r.status===filter),[routes,filter])
 useEffect(()=>{if(visible.length&&!visible.some(r=>r.id===selected))setSelected(visible[0].id);if(!visible.length)setSelected('')},[visible,selected])
 const counts=useMemo(()=>Object.fromEntries(['pending','approved','rejected','archived'].map(s=>[s,routes.filter(r=>r.status===s).length])),[routes])
 return <div className="rx-admin">
   <header className="rx-admin-top"><button onClick={onBack}>← RollerMap Admin</button><div><small>ROLLERMAP · EXPLORER</small><h1>Moderación</h1></div><span>PREVIEW PRIVADA</span></header>
   <section className="rx-admin-stats">{[['pending','Pendientes'],['approved','Publicados'],['rejected','Rechazados'],['archived','Archivados']].map(([s,l])=><button className={filter===s?'on':''} onClick={()=>setFilter(s)} key={s}><b>{counts[s]||0}</b><small>{l}</small></button>)}</section>
   <div className="rx-admin-filter"><button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Ver todo</button><span>{visible.length} aporte{visible.length!==1?'s':''}</span></div>{visible.length>0&&<div className="rx-admin-map"><ExplorerRoutesMap routes={visible} selectedId={selected} onSelect={setSelected}/><p>Seleccioná una línea para revisar su ficha antes de aprobar.</p></div>}
   {loading?<div className="rx-admin-empty">Cargando aportes…</div>:visible.length===0?<div className="rx-admin-empty">No hay aportes en este estado.</div>:<div className="rx-admin-list">{visible.map(r=>{const p=profiles[r.created_by],imgs=photos[r.id]||[];return <article className={`rx-admin-card ${selected===r.id?'selected':''}`} key={r.id} onClick={()=>setSelected(r.id)}><div className="rx-admin-cardhead"><div className="rx-admin-avatar">{p?.foto?<img src={p.foto} alt=""/>:(p?.nombre||'?').slice(0,1)}</div><div><small>{r.status.toUpperCase()} · {new Date(r.created_at).toLocaleDateString('es-UY')}</small><h2>{r.name}</h2><p>{p?[p.nombre,p.apellido].filter(Boolean).join(' '):r.guest_name||'Invitado'} · {r.city||'Sin ciudad'}</p></div><b>{r.distance_m>=1000?(r.distance_m/1000).toFixed(2)+' km':r.distance_m+' m'}</b></div><div className="rx-admin-meta"><span>{labels[r.route_type]||r.route_type}</span><span>{labels[r.level]||r.level}</span><span>Piso {labels[r.surface]||r.surface}</span><span>Tránsito {labels[r.traffic]||r.traffic}</span><span>Luz {labels[r.lighting]||r.lighting}</span><span>{Array.isArray(r.path)?r.path.length:0} puntos</span></div>{imgs.length>0&&<div className="rx-admin-photos">{imgs.map(i=><img key={i.id} src={i.image_url} alt="Foto aportada"/>)}</div>}{r.description&&<p className="rx-admin-description">{r.description}</p>}{r.hazards?.length>0&&<div className="rx-warning"><b>Alertas</b>{r.hazards.join(' · ')}</div>}<div className="rx-admin-actions">{r.status!=='approved'&&<button disabled={busy===r.id} className="approve" onClick={()=>moderate(r,'approved')}>✓ Aprobar y publicar</button>}{r.status!=='rejected'&&<button disabled={busy===r.id} onClick={()=>moderate(r,'rejected')}>Rechazar</button>}{r.status==='approved'&&<button disabled={busy===r.id} onClick={()=>moderate(r,'archived')}>Archivar</button>}</div></article>})}</div>}
 </div>
}
