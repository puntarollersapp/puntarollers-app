import{useEffect,useMemo,useState}from'react'
import{supabase}from'../../lib/supabase'
export default function ExplorerDiscussion({routeId,user}){
 const[comments,setComments]=useState([]),[profiles,setProfiles]=useState({}),[body,setBody]=useState(''),[replyTo,setReplyTo]=useState(null),[sending,setSending]=useState(false),[error,setError]=useState('')
 async function load(){
   if(!routeId)return
   const{data,error}=await supabase.from('pr_rollermap_route_comments').select('id,route_id,created_at,created_by,guest_name,body,parent_id,status').eq('route_id',routeId).eq('status','visible').order('created_at')
   if(error){setError(error.message);return}
   const list=data||[],ids=[...new Set(list.map(x=>x.created_by).filter(Boolean))];let pm={}
   if(ids.length){const{data:ps}=await supabase.from('profiles').select('id,nombre,apellido,foto').in('id',ids);pm=Object.fromEntries((ps||[]).map(p=>[p.id,p]))}
   setComments(list);setProfiles(pm)
 }
 useEffect(()=>{setReplyTo(null);setBody('');setError('');load()},[routeId]) // eslint-disable-line
 const roots=useMemo(()=>comments.filter(c=>!c.parent_id),[comments])
 const replies=useMemo(()=>comments.reduce((m,c)=>{if(c.parent_id)(m[c.parent_id]??=[]).push(c);return m},{}),[comments])
 function who(c){const p=profiles[c.created_by];return p?[p.nombre,p.apellido].filter(Boolean).join(' '):c.guest_name?c.guest_name+' (Invitado)':'Roller'}
 async function send(){
   const clean=body.trim();if(!clean||!user?.id||sending)return
   setSending(true);setError('')
   const{error:e}=await supabase.from('pr_rollermap_route_comments').insert({route_id:routeId,created_by:user.id,guest_name:null,body:clean,parent_id:replyTo,status:'visible'})
   setSending(false);if(e){setError(e.message);return}setBody('');setReplyTo(null);load()
 }
 function Comment({c,child=false}){const p=profiles[c.created_by];return <div className={child?'rx-comment reply':'rx-comment'}><div className="rx-comment-avatar">{p?.foto?<img src={p.foto} alt=""/>:who(c).slice(0,1)}</div><div><div className="rx-comment-meta"><b>{who(c)}</b><span>{new Date(c.created_at).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}</span></div><p>{c.body}</p>{!child&&user?.id&&<button onClick={()=>{setReplyTo(c.id);setBody('')}}>Responder</button>}</div></div>}
 return <section className="rx-discussion"><div className="rx-discussion-head"><div><small>COMUNIDAD</small><h3>Experiencias del tramo</h3></div><b>{comments.length}</b></div>{roots.length===0?<p className="rx-no-comments">Todavía nadie comentó este recorrido.</p>:<div className="rx-comments">{roots.map(c=><div key={c.id}><Comment c={c}/>{(replies[c.id]||[]).map(r=><Comment c={r} child key={r.id}/>)}</div>)}</div>}{user?.id&&<div className="rx-compose">{replyTo&&<div className="rx-replying">Respondiendo comentario <button onClick={()=>setReplyTo(null)}>×</button></div>}<textarea maxLength="800" rows="3" value={body} onChange={e=>setBody(e.target.value)} placeholder={replyTo?'Escribí tu respuesta…':'¿Cómo fue tu experiencia en este tramo?'}/><div><small>{body.length}/800</small><button disabled={!body.trim()||sending} onClick={send}>{sending?'Enviando…':'Publicar'}</button></div>{error&&<p className="rx-submiterror">{error}</p>}</div>}</section>
}
