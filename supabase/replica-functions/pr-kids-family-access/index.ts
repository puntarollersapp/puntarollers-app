function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import {createClient} from 'npm:@supabase/supabase-js@2'
const origins=new Set(['https://pr-next-replica-fiel-oahke3cf7-puntarollersapps-projects.vercel.app','https://puntarollers.com','https://www.puntarollers.com','http://localhost:5173'])
function headers(req:Request){const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':(origins.has(o) || isReplicaOrigin(o))?o:'https://www.puntarollers.com','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
function response(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:headers(req)})}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:headers(req)})
 if(req.method!=='POST')return response(req,{error:'Método no permitido'},405)
 const origin=req.headers.get('origin')||'';if(origin&&!(origins.has(origin) || isReplicaOrigin(origin)))return response(req,{error:'Origen no permitido'},403)
 let b:any;try{b=await req.json()}catch{return response(req,{error:'Solicitud inválida'},400)}
 const action=String(b?.action||'request')
 const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
 const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
 if(!key)return response(req,{error:'Servicio no disponible'},503)
 const db=createClient(Deno.env.get('SUPABASE_URL')||'',key)
 if(action==='request'){
  const tutor=String(b.nombre_tutor||'').trim().slice(0,120),doc=String(b.documento_tutor||'').replace(/\D/g,''),email=String(b.email_tutor||'').trim().toLowerCase().slice(0,180),phone=String(b.telefono_tutor||'').trim().slice(0,30),child=String(b.nombre_nino||'').trim().slice(0,120),relation=String(b.vinculo||'').trim(),alumno=b.es_alumno===true
  if(tutor.length<5||!/^[0-9]{6,12}$/.test(doc)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<6||child.length<3||!['madre','padre','tutor'].includes(relation))return response(req,{error:'Revisá los datos obligatorios.'},400)
  const raw=Array.isArray(b.hijos)?b.hijos:[{nombre:child}]
  if(raw.length<1||raw.length>6)return response(req,{error:'Podés registrar entre 1 y 6 niños por solicitud.'},400)
  const hijos=raw.map((h:any)=>({nombre:String(h?.nombre||'').trim().replace(/\s+/g,' ').slice(0,120)}))
  if(hijos.some((h:any)=>h.nombre.length<3)||new Set(hijos.map((h:any)=>h.nombre.toLowerCase())).size!==hijos.length)return response(req,{error:'Ingresá el nombre completo de cada niño, sin repetirlo.'},400)
  // A declaration of adult-student status is not proof of identity.
  // Only bind that status to an authenticated PR profile with matching document.
  const bearer=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
  let verifiedAdult=false
  if(bearer){
   const {data:session}=await db.auth.getUser(bearer)
   if(session?.user?.id){
    const {data:profile}=await db.from('profiles').select('documento').eq('auth_user_id',session.user.id).maybeSingle()
    const profileDoc=String(profile?.documento||'').replace(/\D/g,'')
    if(profileDoc&&profileDoc!==doc)return response(req,{error:'La cédula no coincide con la cuenta autenticada.'},403)
    verifiedAdult=Boolean(profileDoc&&profileDoc===doc)
   }
  }
  const {data:existing,error:existingError}=await db.from('pr_kids_family_requests').select('id').eq('documento_tutor',doc).eq('estado','pendiente').limit(1)
  if(existingError)return response(req,{error:'No pudimos verificar solicitudes existentes.'},500)
  if(existing?.length)return response(req,{ok:true,already_exists:true})
  const {error}=await db.from('pr_kids_family_requests').insert({nombre_tutor:tutor,documento_tutor:doc,email_tutor:email,telefono_tutor:phone,nombre_nino:hijos[0].nombre,hijos,vinculo:relation,es_alumno:alumno&&verifiedAdult})
  if(error)return response(req,{error:'No pudimos registrar la solicitud.'},500)
  return response(req,{ok:true},201)
 }
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
 const {data:auth,error:authError}=await db.auth.getUser(token)
 if(authError||!auth?.user?.id)return response(req,{error:'Sesión inválida'},401)
 if(action==='family-home'){
  const {data:guardian,error:guardianError}=await db.from('pr_kids_guardians').select('id,nombre,estado').eq('auth_user_id',auth.user.id).maybeSingle()
  if(guardianError||!guardian)return response(req,{error:'Acceso familiar no habilitado'},403)
  if(guardian.estado!=='activo')return response(req,{error:'Acceso familiar pendiente de activación'},403)
  const {data:links,error:linkError}=await db.from('pr_kids_guardian_children').select('child_id,vinculo,approved_at').eq('guardian_id',guardian.id).not('approved_at','is',null)
  if(linkError)return response(req,{error:'No se pudieron cargar los vínculos'},500)
  const ids=(links||[]).map((x:any)=>x.child_id)
  const {data:children,error:childrenError}=ids.length?await db.from('pr_kids_children').select('id,nombre_confirmado').in('id',ids):{data:[],error:null}
  if(childrenError)return response(req,{error:'No se pudieron cargar los perfiles'},500)
  return response(req,{ok:true,guardian:{nombre:guardian.nombre},children:(children||[]).map((child:any)=>({id:child.id,nombre:child.nombre_confirmado}))})
 }
 const {data:admin}=await db.from('profiles').select('id,role').eq('auth_user_id',auth.user.id).maybeSingle()
 if(admin?.role!=='admin')return response(req,{error:'Solo administradores'},403)
 if(action==='treasury-candidates'){
  const id=String(b.id||'')
  const {data:family,error:familyError}=await db.from('pr_kids_family_requests').select('hijos,nombre_nino').eq('id',id).maybeSingle()
  if(familyError||!family)return response(req,{error:'Solicitud no encontrada'},404)
  const profiles:any[]=[]
  for(let offset=0;offset<10000;offset+=500){
   const {data:page,error:pageError}=await db.from('profiles').select('id,nombre,apellido').order('id',{ascending:true}).range(offset,offset+499)
   if(pageError)return response(req,{error:'No se pudieron consultar los perfiles'},500)
   profiles.push(...(page||[]))
   if(!page||page.length<500)break
  }
  const profileError=null
  if(profileError)return response(req,{error:'No se pudieron consultar los perfiles'},500)
  const normalize=(v:string)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().replace(/^(?:pr\s*)?kids?\s+/,'')
  const children=Array.isArray(family.hijos)&&family.hijos.length?family.hijos:[{nombre:family.nombre_nino}]
  const candidates=children.map((child:any)=>{
   const wanted=normalize(child.nombre)
   const matches=profiles.map((p:any)=>{
    const full=[p.nombre,p.apellido].filter(Boolean).join(' ')
    const normalized=normalize(full)
    const score=normalized===wanted?100:normalized.includes(wanted)&&wanted.length>=7?80:0
    return {profile_id:p.id,nombre:full,score}
   }).filter((m:any)=>m.score>0).sort((a:any,b:any)=>b.score-a.score).slice(0,6)
   return {nombre:child.nombre,matches}
  })
  const candidateIds=Array.from(new Set(candidates.flatMap((child:any)=>child.matches.map((match:any)=>match.profile_id))))
  const payments:any[]=[]
  for(const candidateId of candidateIds){
   const result=await db.from('pr_mensualidades').select('alumno_id,periodo,estado').eq('alumno_id',candidateId).order('periodo',{ascending:false}).limit(1)
   if(result.error)return response(req,{error:'Error al consultar mensualidades'},500)
   if(result.data?.[0])payments.push(result.data[0])
  }
  const enriched=candidates.map((child:any)=>({...child,matches:child.matches.map((match:any)=>{
   const last=payments.find((p:any)=>p.alumno_id===match.profile_id)
   return {...match,latest_period:last?.periodo||null,latest_payment_status:last?.estado||null}
  })}))
  return response(req,{ok:true,candidates:enriched})
 }
 if(action==='review-save'){
  const requestId=String(b.id||'')
  const allowed=['identity','relation','children','treasury','contact']
  const checks=Object.fromEntries(allowed.map(k=>[k,b.checks?.[k]===true]))
  const note=String(b.note||'').trim().slice(0,1000)
  const {data:request}=await db.from('pr_kids_family_requests').select('id,estado').eq('id',requestId).maybeSingle()
  if(!request)return response(req,{error:'Solicitud no encontrada'},404)
  if(request.estado!=='pendiente')return response(req,{error:'Solo se pueden revisar solicitudes pendientes'},409)
  const {error}=await db.from('pr_kids_family_review_audit').insert({request_id:requestId,admin_auth_user_id:auth.user.id,checks,note})
  if(error)return response(req,{error:'No se pudo guardar la revisión'},500)
  return response(req,{ok:true})
 }
 if(action==='approval-validate'){
  const requestId=String(b.id||'')
  const {data:family,error:familyError}=await db.from('pr_kids_family_requests').select('id,estado,hijos,nombre_nino,documento_tutor').eq('id',requestId).maybeSingle()
  if(familyError||!family)return response(req,{error:'Solicitud no encontrada'},404)
  const children=Array.isArray(family.hijos)&&family.hijos.length?family.hijos:[{nombre:family.nombre_nino}]
  const chosen=Array.isArray(b.profile_ids)?b.profile_ids.map((x:any)=>String(x||'').trim()):[]
  const problems:string[]=[]
  if(family.estado!=='pendiente')problems.push('La solicitud no está pendiente')
  if(chosen.length!==children.length)problems.push('Se necesita un perfil por cada niño')
  if(chosen.some((x:string)=>!x))problems.push('Hay niños sin perfil confirmado')
  if(new Set(chosen).size!==chosen.length)problems.push('Un perfil no puede corresponder a dos niños')
  const {data:review}=await db.from('pr_kids_family_review_audit').select('checks').eq('request_id',requestId).order('created_at',{ascending:false}).limit(1).maybeSingle()
  for(const check of ['identity','relation','children','treasury','contact'])if(review?.checks?.[check]!==true)problems.push('Falta verificación: '+check)
  if(chosen.length&&chosen.every((x:string)=>x)){
   const {data:profiles}=await db.from('profiles').select('id').in('id',chosen)
   const found=new Set((profiles||[]).map((p:any)=>p.id))
   if(chosen.some((x:string)=>!found.has(x)))problems.push('Hay perfiles de Tesorería inexistentes')
   const {data:linked}=await db.from('pr_kids_children').select('treasury_profile_id').in('treasury_profile_id',chosen)
   if(linked?.length)problems.push('Al menos un perfil infantil ya está vinculado')
  }
  const {data:guardian,error:guardianError}=await db.from('pr_kids_guardians').select('id').eq('documento',family.documento_tutor).maybeSingle()
  if(guardianError)return response(req,{error:'No se pudo verificar el responsable'},500)
  if(guardian)problems.push('El tutor ya existe: requiere revisión manual de vínculos')
  return response(req,{ok:true,valid:problems.length===0,problems,approval_enabled:false,children:children.map((child:any,i:number)=>({nombre:child.nombre,profile_id:chosen[i]||null}))})
 }
 if(action==='approval-preview'){
  const requestId=String(b.id||'')
  const {data:family,error}=await db.from('pr_kids_family_requests').select('id,estado,hijos,nombre_nino,documento_tutor').eq('id',requestId).maybeSingle()
  if(error||!family)return response(req,{error:'Solicitud no encontrada'},404)
  const children=Array.isArray(family.hijos)&&family.hijos.length?family.hijos:[{nombre:family.nombre_nino}]
  const {data:review}=await db.from('pr_kids_family_review_audit').select('checks,created_at').eq('request_id',requestId).order('created_at',{ascending:false}).limit(1).maybeSingle()
  const missing=['identity','relation','children','treasury','contact'].filter(k=>review?.checks?.[k]!==true)
  return response(req,{ok:true,request_status:family.estado,children:children.map((child:any)=>({nombre:child.nombre})),missing_checks:missing,can_approve:false,notice:'Se requiere selección individual y confirmación del vínculo; la activación permanece deshabilitada.'})
 }
 if(action==='review-readiness'){
  const requestId=String(b.id||'')
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))return response(req,{error:'Identificador inválido'},400)
  const {data:family,error:familyError}=await db.from('pr_kids_family_requests').select('id,estado,hijos,nombre_nino').eq('id',requestId).maybeSingle()
  if(familyError||!family)return response(req,{error:'Solicitud no encontrada'},404)
  const {data:review,error:reviewError}=await db.from('pr_kids_family_review_audit').select('created_at,checks').eq('request_id',requestId).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(reviewError)return response(req,{error:'No se pudo verificar la revisión'},500)
  const keys=['identity','relation','children','treasury','contact']
  const missing=keys.filter(k=>review?.checks?.[k]!==true)
  const children=Array.isArray(family.hijos)&&family.hijos.length?family.hijos:[{nombre:family.nombre_nino}]
  return response(req,{ok:true,request_status:family.estado,child_count:children.length,review_at:review?.created_at||null,checks_complete:missing.length===0,missing_checks:missing,approval_enabled:false,notice:'La aprobación sigue deshabilitada hasta implementar vinculación y credenciales seguras.'})
 }
 if(action==='review-history'){
  const requestId=String(b.id||'')
  const {data,error}=await db.from('pr_kids_family_review_audit').select('created_at,checks,note').eq('request_id',requestId).order('created_at',{ascending:false}).limit(10)
  if(error)return response(req,{error:'No se pudo consultar el historial'},500)
  return response(req,{ok:true,reviews:data})
 }
 if(action==='request-detail'){
  const id=String(b.id||'')
  const {data,error}=await db.from('pr_kids_family_requests').select('id,created_at,nombre_tutor,documento_tutor,email_tutor,telefono_tutor,nombre_nino,hijos,vinculo,es_alumno,estado,reviewed_at').eq('id',id).maybeSingle()
  if(error||!data)return response(req,{error:'Solicitud no encontrada'},404)
  return response(req,{ok:true,request:data})
 }
 if(action==='list'){const {data,error}=await db.from('pr_kids_family_requests').select('id,created_at,nombre_tutor,documento_tutor,email_tutor,telefono_tutor,nombre_nino,hijos,vinculo,es_alumno,estado').order('created_at',{ascending:false}).limit(200);return error?response(req,{error:'No se pudieron cargar las solicitudes'},500):response(req,{ok:true,requests:data})}
 if(action==='reject'){const {error}=await db.from('pr_kids_family_requests').update({estado:'rechazado',reviewed_at:new Date().toISOString()}).eq('id',String(b.id||'')).eq('estado','pendiente');return error?response(req,{error:'No se pudo rechazar'},500):response(req,{ok:true})}
 return response(req,{error:'Acción no disponible. La aprobación requiere vincular al niño y verificar el tutor.'},400)
})
