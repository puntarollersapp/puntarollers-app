function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set(['https://pr-next-replica-fiel-oahke3cf7-puntarollersapps-projects.vercel.app','https://puntarollers.com','https://www.puntarollers.com','http://localhost:5173'])
function cors(req:Request){const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':(ALLOWED_ORIGINS.has(o) || isReplicaOrigin(o))?o:'https://www.puntarollers.com','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'}}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors(req)})}
function buildAuthEmail(documento:string){return `${documento}@usuarios.puntarollers.app`}
function buildAuthPassword(documento:string,pin:string){return `PR-${pin}-${documento}`}

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors(req)})
 if(req.method!=='POST') return json(req,{error:'Method not allowed'},405)
 const origin=req.headers.get('origin')||''; if(origin&&!(ALLOWED_ORIGINS.has(origin) || isReplicaOrigin(origin))) return json(req,{error:'Origin not allowed'},403)
 const authHeader=req.headers.get('Authorization')||''; const token=authHeader.replace(/^Bearer\s+/i,'').trim(); if(!token)return json(req,{error:'No autorizado'},401)
 const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}'); const serviceKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); const supabaseUrl=Deno.env.get('SUPABASE_URL')||''; if(!serviceKey||!supabaseUrl)return json(req,{error:'Servicio no disponible'},503)
 const supabase=createClient(supabaseUrl,serviceKey)
 const {data:userData,error:userError}=await supabase.auth.getUser(token); const authUserId=userData?.user?.id||''; if(userError||!authUserId)return json(req,{error:'Sesión inválida'},401)
 const {data:adminProfile}=await supabase.from('profiles').select('id,role').eq('auth_user_id',authUserId).maybeSingle(); if(!adminProfile||adminProfile.role!=='admin')return json(req,{error:'Solo administradores'},403)
 let body:any; try{body=await req.json()}catch{return json(req,{error:'JSON inválido'},400)} const action=String(body?.action||'list')
 if(action==='list'){
   const {data,error}=await supabase.from('student_access_requests').select('id,nombre,apellido,documento,telefono,email,status,profile_id,created_at,updated_at').order('created_at',{ascending:false}).limit(150); if(error)return json(req,{error:error.message},500)
   const requests=(data||[]).map((r:any)=>({...r,nombre_completo:[r.nombre,r.apellido==='-'?'':r.apellido].filter(Boolean).join(' '),estado:r.status==='pending'?'pendiente':r.status==='profile_created'?'perfil_creado':r.status==='active'?'activo':'rechazado',imported_at:null,activated_at:null}))
   return json(req,{ok:true,requests})
 }
 if(action==='import'){
   const id=String(body?.id||''); const {data:request,error:requestError}=await supabase.from('student_access_requests').select('*').eq('id',id).maybeSingle(); if(requestError||!request)return json(req,{error:'Solicitud no encontrada'},404); if(request.profile_id)return json(req,{ok:true,profile_id:request.profile_id,already_imported:true})
   const {data:existingProfile}=await supabase.from('profiles').select('id').eq('documento',request.documento).maybeSingle(); if(existingProfile){await supabase.from('student_access_requests').update({profile_id:existingProfile.id,status:'profile_created',updated_at:new Date().toISOString()}).eq('id',id);return json(req,{ok:true,profile_id:existingProfile.id,linked_existing:true})}
   const authEmail=buildAuthEmail(request.documento),password=buildAuthPassword(request.documento,request.pin); const {data:createdAuth,error:createAuthError}=await supabase.auth.admin.createUser({email:authEmail,password,email_confirm:true,app_metadata:{role:'alumno',source:'pr_access_onboarding'}}); if(createAuthError||!createdAuth?.user?.id)return json(req,{error:createAuthError?.message||'No se pudo crear la cuenta segura'},500)
   const profileId=`alumno_${crypto.randomUUID()}`; const {error:profileError}=await supabase.from('profiles').insert({id:profileId,nombre:request.nombre,apellido:request.apellido==='-'?'':request.apellido,documento:request.documento,pin:request.pin,telefono:request.telefono,telefono_normalizado:String(request.telefono||'').replace(/\D/g,''),email:request.email,role:'alumno',estado:'Activo',acceso_habilitado:false,verificado:false,prcard_activa:false,tracking_activo:false,miembro_desde:String(new Date().getFullYear()),auth_user_id:createdAuth.user.id,auth_migrado:true,auth_migrado_en:new Date().toISOString()})
   if(profileError){await supabase.auth.admin.deleteUser(createdAuth.user.id);return json(req,{error:'No se pudo crear el perfil del alumno.'},500)}
   await supabase.from('student_access_requests').update({profile_id:profileId,status:'profile_created',updated_at:new Date().toISOString()}).eq('id',id); return json(req,{ok:true,profile_id:profileId})
 }
 if(action==='activate'){
   const id=String(body?.id||''); const {data:request}=await supabase.from('student_access_requests').select('profile_id').eq('id',id).maybeSingle(); if(!request?.profile_id)return json(req,{error:'Primero creá el perfil.'},400)
   const {error:updateError}=await supabase.from('profiles').update({acceso_habilitado:true,estado:'Activo',estado_modificado_por:adminProfile.id,estado_modificado_en:new Date().toISOString()}).eq('id',request.profile_id); if(updateError)return json(req,{error:updateError.message},500)
   await supabase.from('student_access_requests').update({status:'active',updated_at:new Date().toISOString()}).eq('id',id); return json(req,{ok:true})
 }
 return json(req,{error:'Acción no válida'},400)
})
