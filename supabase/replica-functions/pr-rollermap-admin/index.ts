function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ORIGIN = 'https://www.puntarollers.com';
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const slugify = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');

export function welcomeEmail(location: {name:string,slug:string}, config: {intro:string}) {
  const url = `${ORIGIN}/rollermap/lugar/${encodeURIComponent(location.slug)}`;
  const text = `Hola, equipo de ${location.name}.\n\n¡Bienvenidos a RollerMap! Su registro fue aprobado y su escuela o grupo ya está publicado en el mapa.\n\n${config.intro}\n\nDesde su ficha, las personas pueden conocer su propuesta, consultar dónde patinan y contactarlos por WhatsApp o Instagram según los datos que registraron.\n\nRevisen su ficha: ${url}\n\nSi necesitan corregir información o actualizar su propuesta, respondan a este correo.\n\nGracias por formar parte.\nRollerMap · Punta Rollers`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenidos a RollerMap</title></head><body style="margin:0;background:#0a0a16;font-family:Arial,Helvetica,sans-serif;color:#e8e8f0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#14142a;border-radius:20px"><tr><td style="padding:32px"><img src="${ORIGIN}/rollermap/logo.png" alt="RollerMap" width="180" style="display:block;width:180px;height:auto"><p style="margin:28px 0 12px;font-size:12px;letter-spacing:2px;color:#00e5cc;font-weight:bold">REGISTRO APROBADO</p><h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;color:#ffffff">Bienvenidos a RollerMap</h1><p style="font-size:16px;line-height:1.65">Hola, equipo de <strong>${esc(location.name)}</strong>.</p><p style="font-size:16px;line-height:1.65">Su registro fue aprobado y su escuela o grupo ya está publicado en el mapa.</p><p style="font-size:16px;line-height:1.65">${esc(config.intro)}</p><p style="font-size:16px;line-height:1.65">Desde su ficha, las personas pueden conocer su propuesta, consultar dónde patinan y contactarlos por WhatsApp o Instagram según los datos que registraron.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="background:#00e5cc;border-radius:10px"><a href="${url}" style="display:inline-block;padding:15px 24px;color:#081b19;font-size:15px;font-weight:bold;text-decoration:none">Ver nuestra ficha en RollerMap</a></td></tr></table><p style="margin-top:28px;font-size:14px;line-height:1.65;color:#c4c4d4">Si necesitan corregir información o actualizar su propuesta, respondan a este correo.</p><p style="font-size:14px;line-height:1.65;color:#c4c4d4">Gracias por formar parte.<br><strong>RollerMap · Punta Rollers</strong></p></td></tr></table></td></tr></table></body></html>`;
  return {html,text};
}

function headers(req: Request) {
  const origin=req.headers.get('origin')||'';
  const allowed=isReplicaOrigin(origin)||origin==='https://puntarollers.com'||origin===ORIGIN||origin==='https://puntarollers-app.vercel.app'||/^https:\/\/puntarollers-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin)||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  return {'Content-Type':'application/json','Access-Control-Allow-Origin':allowed?origin:ORIGIN,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
}

export async function handleRequest(req: Request) {
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:headers(req)});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(req)});
  if(req.method!=='POST')return reply({error:'Método no permitido'},405);
  try {
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization=req.headers.get('authorization')||'';
    const uc=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const {data:{user},error:authError}=await uc.auth.getUser();
    if(authError||!user)return reply({error:'Iniciá sesión en Punta Rollers'},401);
    const db=createClient(url,service,{auth:{persistSession:false}});
    const {data:actor,error:actorError}=await db.from('profiles').select('id,role').eq('auth_user_id',user.id).maybeSingle();
    if(actorError||actor?.role!=='admin')return reply({error:'Solo administradores'},403);
    const body=await req.json().catch(()=>({}));
    const {data:config,error:configError}=await db.from('pr_rollermap_email_config').select('*').eq('id',1).single();
    if(configError)throw configError;
    if(body.action==='preview')return reply({config,...welcomeEmail({name:'Tu escuela o grupo',slug:'tu-escuela-o-grupo'},config),resend_configured:Boolean((undefined as string | undefined))});
    if(!['approve','retry'].includes(body.action))return reply({error:'Acción no válida'},400);
    const id=String(body.id||'');
    if(!/^[a-f0-9-]{36}$/i.test(id))return reply({error:'Lugar no válido'},400);
    const {data:location,error:locationError}=await db.from('pr_rollermap_locations').select('id,name,status').eq('id',id).single();
    if(locationError)return reply({error:'Lugar no encontrado'},404);
    if(body.action==='approve') {
      const {error}=await uc.rpc('pr_rollermap_approve_location',{location_id:id,slug:slugify(location.name)});
      if(error)throw error;
    } else if(location.status!=='approved')return reply({error:'Primero aprobá este lugar'},409);
    const {data:job,error:jobError}=await db.from('pr_rollermap_welcome').select('*').eq('location_id',id).single();
    if(jobError)return reply({approved:true,email_status:'missing_job',email_error:'No hay un correo de bienvenida pendiente para este lugar.'});
    if(job.status==='sent')return reply({approved:true,email_status:'sent',resend_id:job.resend_id});
    if(job.status==='missing_email') {
      const {data:contact}=await db.from('pr_rollermap_contacts').select('email').eq('id',id).single();
      const email=String(contact?.email||'').trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({approved:true,email_status:'missing_email',email_error:'El contacto no tiene un email válido.'});
      const {error}=await db.from('pr_rollermap_welcome').update({recipient_email:email,status:'pending'}).eq('location_id',id);
      if(error)throw error;job.recipient_email=email;job.status='pending';
    }
    // Never automatically retry an ambiguous attempt after Resend's 24-hour idempotency window.
    if(job.last_attempt_at&&!job.resend_id&&Date.now()-Date.parse(job.last_attempt_at)>23*3600*1000)return reply({approved:true,email_status:'review',email_error:'Revisá el envío en Resend antes de reintentar: venció la ventana segura para evitar duplicados.'});
    const resend=(undefined as string | undefined);
    if(!resend)return reply({approved:true,email_status:'pending',email_error:'Resend no está configurado. El correo quedó pendiente.'});
    if(job.status==='sending')return reply({approved:true,email_status:'sending',email_error:'Hay un envío en curso. Revisá su estado antes de reintentar.'});
    const generated=welcomeEmail({name:job.location_name,slug:job.slug},config);
    const payload={sender:job.sender||config.sender,subject:job.subject||config.subject,html:job.html||generated.html,plain_text:job.plain_text||generated.text};
    const {data:claimed,error:claimError}=await db.from('pr_rollermap_welcome').update({...payload,status:'sending',last_attempt_at:new Date().toISOString(),attempts:job.attempts+1,last_error:null}).eq('location_id',id).in('status',['pending','failed']).select('location_id').maybeSingle();
    if(claimError)throw claimError;
    if(!claimed)return reply({approved:true,email_status:'sending'});
    let result:any;
    try {
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json','Idempotency-Key':`rollermap-welcome-${id}`},body:JSON.stringify({from:payload.sender,to:[job.recipient_email],reply_to:'hola@puntarollers.com',subject:payload.subject,html:payload.html,text:payload.plain_text}),signal:AbortSignal.timeout(20000)});
      result=await response.json();
      if(!response.ok||!result.id)throw new Error(result.message||`Resend: ${response.status}`);
    } catch(error) {
      const message=error instanceof Error?error.message:String(error);
      await db.from('pr_rollermap_welcome').update({status:'failed',last_error:message}).eq('location_id',id);
      return reply({approved:true,email_status:'failed',email_error:message});
    }
    const {error:saveError}=await db.from('pr_rollermap_welcome').update({status:'sent',sent_at:new Date().toISOString(),resend_id:result.id,last_error:null}).eq('location_id',id);
    if(saveError)return reply({approved:true,email_status:'review',email_error:'Resend aceptó el correo, pero falta registrar el resultado. No vuelvas a enviarlo hasta revisar.',resend_id:result.id});
    return reply({approved:true,email_status:'sent',resend_id:result.id});
  } catch(error) {return reply({error:error instanceof Error?error.message:String(error)},500);}
}

if(import.meta.main)Deno.serve(handleRequest);

