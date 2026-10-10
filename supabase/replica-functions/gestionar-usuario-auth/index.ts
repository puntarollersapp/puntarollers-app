import { createClient } from 'npm:@supabase/supabase-js@2';
const BETA='https://azheisnfaedjqcuhiylo.supabase.co';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const allowed=new Set(['role','nombre','apellido','documento','pin','email','ciudad','instagram','fecha_nacimiento','miembro_desde','estado','verificado','prcard_activa','tracking_activo']);
const digits=(v:unknown)=>String(v??'').replace(/\D/g,'');
Deno.serve(async(req)=>{
if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
if(req.method!=='POST')return reply({error:'Método no permitido'},405);
if(Deno.env.get('SUPABASE_URL')!==BETA)return reply({error:'Proyecto beta no verificado'},503);
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
if(!key||!anon)return reply({error:'Configuración incompleta'},503);
const authorization=req.headers.get('Authorization')||'';
if(!authorization.startsWith('Bearer '))return reply({error:'Sin sesión'},401);
const admin=createClient(BETA,key,{auth:{persistSession:false,autoRefreshToken:false}});
const client=createClient(BETA,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:authorization}}});
const {data:identity,error:authError}=await client.auth.getUser(authorization.slice(7));
if(authError||!identity.user)return reply({error:'Sesión inválida'},401);
const {data:actor,error:actorError}=await admin.from('profiles').select('id,role,documento,auth_user_id').eq('auth_user_id',identity.user.id).maybeSingle();
if(actorError||!actor||actor.role!=='admin')return reply({error:'Solo administradores autorizados'},403);
let body:any;try{body=await req.json()}catch{return reply({error:'JSON inválido'},400)}
const action=String(body?.action||'');
if(!['create','update','delete'].includes(action))return reply({error:'Acción inválida'},400);
const input=action==='create'?body.profile:body.updates;
if(action!=='delete'&&(!input||typeof input!=='object'||Array.isArray(input)))return reply({error:'Perfil inválido'},400);
const patch:Record<string,unknown>={};
if(input)for(const [k,v] of Object.entries(input))if(allowed.has(k))patch[k]=v;
if('documento'in patch)patch.documento=digits(patch.documento);
if(action==='update' && patch.pin==='') delete patch.pin;
if('pin'in patch&&patch.pin!==null&&!/^\d{4,8}$/.test(String(patch.pin)))return reply({error:'PIN inválido'},400);
if('role'in patch&&!['admin','profesor','alumno'].includes(String(patch.role)))return reply({error:'Rol inválido'},400);
if(patch.role==='admin'&&digits(actor.documento)!=='48036677')return reply({error:'Sin autorización para asignar administradores'},403);
try{
if(action==='create'){
const doc=String(patch.documento||''),pin=String(patch.pin||'');
if(doc.length<6||!/^\d{4,8}$/.test(pin)||!String(patch.nombre||'').trim())return reply({error:'Nombre, documento o PIN inválido'},400);
const {data:existing,error:lookupError}=await admin.from('profiles').select('id').eq('documento',doc).maybeSingle();
if(lookupError)return reply({error:'Error verificando documento'},500);
if(existing)return reply({error:'Documento ya registrado'},409);
const {data:created,error:createError}=await admin.auth.admin.createUser({email:doc+'@usuarios.puntarollers.app',password:'PR-'+pin+'-'+doc,email_confirm:true});
if(createError||!created.user)return reply({error:createError?.message||'No se pudo crear acceso'},400);
const id=crypto.randomUUID();
const {error:insertError}=await admin.from('profiles').insert({...patch,id,auth_user_id:created.user.id,auth_migrado:true,auth_migrado_en:new Date().toISOString()});
if(insertError){await admin.auth.admin.deleteUser(created.user.id);return reply({error:'No se pudo crear perfil: '+insertError.message},400)}
return reply({success:true,profile_id:id});
}
const id=String(body.profile_id||'');
if(!id)return reply({error:'Falta perfil'},400);
const {data:target,error:targetError}=await admin.from('profiles').select('*').eq('id',id).maybeSingle();
if(targetError||!target)return reply({error:'Perfil no encontrado'},404);
if(target.id===actor.id&&(action==='delete'||(patch.role&&patch.role!=='admin')))return reply({error:'No podés eliminar ni quitar tu propio rol administrador'},403);
if(target.role==='admin'&&digits(actor.documento)!=='48036677')return reply({error:'Sin autorización para gestionar administradores'},403);
if(action==='delete'){
// Delete profile first: if relational constraints reject it, preserve the auth account.
const {error:delProfile}=await admin.from('profiles').delete().eq('id',id);
if(delProfile)return reply({error:'No se puede eliminar el perfil con registros vinculados: '+delProfile.message},409);
if(target.auth_user_id){const {error:delAuth}=await admin.auth.admin.deleteUser(target.auth_user_id);if(delAuth)return reply({error:'Perfil eliminado pero falló eliminación de acceso: '+delAuth.message},500)}
return reply({success:true});
}
if('documento'in patch&&String(patch.documento).length<6)return reply({error:'Documento inválido'},400);
const doc=String(patch.documento??target.documento??''),pin=String(patch.pin??target.pin??'');
if(('pin'in patch||('documento'in patch&&doc!==target.documento))&&!/^\d{4,8}$/.test(pin))return reply({error:'Para cambiar el documento o PIN necesitás ingresar un PIN válido de 4 a 8 dígitos'},400);
if('documento'in patch&&doc!==target.documento){const {data:dupe}=await admin.from('profiles').select('id').eq('documento',doc).maybeSingle();if(dupe&&dupe.id!==id)return reply({error:'Documento ya registrado'},409)}
// Update profile first; if auth update fails, attempt restoring prior fields.
const prior:Record<string,unknown>={};for(const k of Object.keys(patch))prior[k]=(target as any)[k];
const {error:updated}=await admin.from('profiles').update(patch).eq('id',id);
if(updated)return reply({error:updated.message},400);
if(target.auth_user_id&&('pin'in patch||('documento'in patch&&doc!==target.documento))){
const {error:authUpdated}=await admin.auth.admin.updateUserById(target.auth_user_id,{email:doc+'@usuarios.puntarollers.app',password:'PR-'+pin+'-'+doc,email_confirm:true});
if(authUpdated){await admin.from('profiles').update(Object.fromEntries(Object.entries(prior).filter(([,v])=>v!==undefined))).eq('id',id);return reply({error:'Falló actualización de acceso: '+authUpdated.message},500)}
}
return reply({success:true});
}catch(e){return reply({error:e instanceof Error?e.message:'Error inesperado'},500)}
});