import{useEffect,useMemo,useState}from'react'
import{supabase}from'../../lib/supabase'
import{useAuth}from'../../lib/auth'
import ExplorerRoutesMap from'./ExplorerRoutesMap'
import ExplorerPreview from'./ExplorerPreview'
const L={calle:'Calle',rambla:'Rambla',ciclovia:'Ciclovía',parque:'Parque',pista:'Pista',circuito:'Circuito',inicial:'Inicial',intermedio:'Intermedio',avanzado:'Avanzado',excelente:'Excelente',buena:'Bueno',irregular:'Irregular',mala:'Malo'}
const FILTERS=[['all','Todos'],['surface','Mejor piso'],['traffic','Bajo tránsito'],['beginner','Inicial'],['light','Con luz']]
export default function ExplorerHubPreview({onClose}){
 const{user}=useAuth()
 const[routes,setRoutes]=useState([]),[profiles,setProfiles]=useState({}),[photos,setPhotos]=useState({}),[selected,setSelected]=useState(''),[creating,setCreating]=useState(false),[loading,setLoading]=useState(true),[filter,setFilter]=useState('all'),[actions,setActions]=useState({}),[myRatings,setMyRatings]=useState({}),[ratingStats,setRatingStats]=useState({})
 async function load(){
   setLoading(true)
   const{data}=await supabase.from('pr_rollermap_routes').select('*').eq('status','approved').order('created_at',{ascending:false})
   const list=data||[],ids=[...new Set(list.map(x=>x.created_by).filter(Boolean))],routeIds=list.map(x=>x.id);let pm={},gm={},am={},mr={},rs={}
   if(ids.length){const{data:ps}=await supabase.from('profiles').select('id,nombre,apellido,foto').in('id',ids);pm=Object.fromEntries((ps||[]).map(p=>[p.id,p]))}
   if(routeIds.length){
     const[{data:imgs},{data:ratings},{data:acts}]=await Promise.all([
       supabase.from('pr_rollermap_route_photos').select('*').in('route_id',routeIds).eq('status','approved').order('sort_order'),
       supabase.from('pr_rollermap_route_ratings').select('id,route_id,created_by,score').in('route_id',routeIds),
       user?.id?supabase.from('pr_rollermap_route_actions').select('id,route_id,action').eq('created_by',user.id).in('route_id',routeIds):Promise.resolve({data:[]})
     ])
     for(const i of imgs||[])(gm[i.route_id]??=[]).push(i)
     for(const a of acts||[])(am[a.route_id]??={})[a.action]=a.id
     const buckets={}
     for(const rr of ratings||[]){(buckets[rr.route_id]??=[]).push(Number(rr.score));if(rr.created_by===user?.id)mr[rr.route_id]={id:rr.id,score:Number(rr.score)}}
     for(const[id,scores]of Object.entries(buckets))rs[id]={avg:scores.reduce((a,b)=>a+b,0)/scores.length,count:scores.length}
   }
   setRoutes(list);setProfiles(pm);setPhotos(gm);setActions(am);setMyRatings(mr);setRatingStats(rs);setLoading(false)
 }
 useEffect(()=>{load()},[user?.id]) // eslint-disable-line
 const visible=useMemo(()=>routes.filter(r=>filter==='all'||filter==='surface'&&['excelente','buena'].includes(r.surface)||filter==='traffic'&&r.traffic==='bajo'||filter==='beginner'&&r.level==='inicial'||filter==='light'&&r.lighting==='si'),[routes,filter])
 useEffect(()=>{if(visible.length&&!visible.some(r=>r.id===selected))setSelected(visible[0].id);if(!visible.length)setSelected('')},[filter,routes]) // eslint-disable-line
 const route=useMemo(()=>visible.find(x=>x.id===selected)||null,[visible,selected])
 async function toggleAction(routeId,action){
   if(!user?.id)return
   const existing=actions[routeId]?.[action]
   if(existing){const{error}=await supabase.from('pr_rollermap_route_actions').delete().eq('id',existing);if(!error)setActions(v=>({...v,[routeId]:{...v[routeId],[action]:null}}))}
   else{const{data,error}=await supabase.from('pr_rollermap_route_actions').insert({route_id:routeId,created_by:user.id,action}).select('id').single();if(!error)setActions(v=>({...v,[routeId]:{...v[routeId],[action]:data.id}}))}
 }
 async function rate(routeId,score){
   if(!user?.id)return
   const current=myRatings[routeId]
   let error,data
   if(current){({error}=await supabase.from('pr_rollermap_route_ratings').update({score}).eq('id',current.id));data={id:current.id}}
   else{({data,error}=await supabase.from('pr_rollermap_route_ratings').insert({route_id:routeId,created_by:user.id,score}).select('id').single())}
   if(!error){setMyRatings(v=>({...v,[routeId]:{id:data.id,score}}));load()}
 }
 if(creating)return <ExplorerPreview onClose={()=>{setCreating(false);load()}}/>
 const stat=route?ratingStats[route.id]:null
 return <div className="rx-shell rx-hub"><header className="rx-top"><button onClick={onClose}>←</button><div><small>ROLLERMAP</small><strong>EXPLORER <i>✦</i></strong></div><span>PREVIEW PRIVADA</span></header>
 <section className="rx-hubhero"><div><small>CALLES Y RECORRIDOS RECOMENDADOS</small><h1>Encontrá por dónde<br/>vale la pena patinar.</h1><p>Información creada por rollers y revisada por Punta Rollers.</p></div><button onClick={()=>setCreating(true)}>＋ Recomendar tramo</button></section>
 <section className="rx-hubfilters">{FILTERS.map(([id,label])=><button className={filter===id?'on':''} onClick={()=>setFilter(id)} key={id}>{label}</button>)}</section>
 <ExplorerRoutesMap routes={visible} selectedId={selected} onSelect={setSelected}/>
 {route?<section className="rx-route-focus"><div className="rx-route-focus-head"><div><small>SELECCIONADO</small><h2>{route.name}</h2></div><b>{route.distance_m>=1000?(route.distance_m/1000).toFixed(2)+' km':route.distance_m+' m'}</b></div>{(photos[route.id]||[]).length>0&&<div className="rx-focusphotos">{photos[route.id].slice(0,3).map(i=><img src={i.image_url} key={i.id} alt="Foto del recorrido"/>)}</div>}<div className="rx-previewmeta"><span>{L[route.route_type]||route.route_type}</span><span>{L[route.level]||route.level}</span><span>Piso {L[route.surface]||route.surface}</span><span>{route.city||'Uruguay'}</span>{stat&&<span>★ {stat.avg.toFixed(1)} · {stat.count}</span>}</div>{route.description&&<p>{route.description}</p>}{route.hazards?.length>0&&<div className="rx-warning"><b>Atención</b>{route.hazards.join(' · ')}</div>}<div className="rx-social-actions"><button className={actions[route.id]?.save?'on':''} onClick={()=>toggleAction(route.id,'save')}>{actions[route.id]?.save?'✓ Guardado':'＋ Guardar'}</button><button className={actions[route.id]?.done?'on':''} onClick={()=>toggleAction(route.id,'done')}>{actions[route.id]?.done?'✓ Lo hice':'Lo hice'}</button><div className="rx-stars"><small>Tu valoración</small><span>{[1,2,3,4,5].map(n=><button className={(myRatings[route.id]?.score||0)>=n?'on':''} onClick={()=>rate(route.id,n)} key={n}>★</button>)}</span></div></div><small>Recomendado por {profiles[route.created_by]?.nombre||route.guest_name||'Comunidad Roller'} · Revisado por Punta Rollers</small></section>:<section className="rx-route-focus rx-route-focus-empty"><span>✦</span><h2>{routes.length?'No hay recorridos con este filtro.':'Este mapa lo construimos desde cero.'}</h2><p>{routes.length?'Probá otro filtro o recomendá un tramo que cumpla estas condiciones.':'Cuando aprobemos el primer tramo recomendado, acá va a aparecer la primera línea dorada de Explorer.'}</p><button onClick={()=>setCreating(true)}>Recomendar un tramo</button></section>}
 <section className="rx-hublist"><div className="rx-hublist-title"><small>RECORRIDOS VISIBLES</small><b>{loading?'…':visible.length}</b></div>{visible.map(r=><button className={selected===r.id?'on':''} onClick={()=>setSelected(r.id)} key={r.id}><div><b>{r.name}</b><span>{L[r.route_type]||r.route_type} · {L[r.level]||r.level} · {r.city||'Uruguay'}</span></div><strong>{r.distance_m>=1000?(r.distance_m/1000).toFixed(1)+' km':r.distance_m+' m'}</strong></button>)}</section>
 </div>
}
