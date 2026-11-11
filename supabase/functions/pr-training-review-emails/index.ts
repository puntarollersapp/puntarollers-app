// PR Training review email dispatcher.
// Deploy as Supabase Edge Function after configuring RESEND_API_KEY.
// Invoke only from a trusted scheduler with service-role authorization.
import { createClient } from 'npm:@supabase/supabase-js@2.49.10';

const cors = { 'content-type': 'application/json' };
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', {status:405});
  const roleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('RESEND_PR_TRAINING_API_KEY');
  if (!roleKey || !apiKey) return Response.json({error:'not_configured'}, {status:503});
  if (req.headers.get('Authorization') !== `Bearer ${roleKey}`) return new Response('Unauthorized', {status:401});
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, roleKey);
  const {data:pending,error} = await supabase.from('pr_training_review_email_outbox')
    .select('id,submission_id,recipient_profile_id,reviewer_profile_id,review_status,recipient_email,reviewer_note,attempts')
    .is('sent_at',null).lt('attempts',5).order('created_at',{ascending:true}).limit(25);
  if(error) return Response.json({error:'database_error'}, {status:500});
  let sent=0,failed=0;
  for(const item of pending||[]){
    // Claim using a conditional update; retries remain bounded.
    const {data:claimed}=await supabase.from('pr_training_review_email_outbox')
      .update({attempts:item.attempts+1}).eq('id',item.id).eq('attempts',item.attempts).is('sent_at',null).select('id').maybeSingle();
    if(!claimed) continue;
    if(!item.recipient_email){await supabase.from('pr_training_review_email_outbox').update({last_error:'missing_email'}).eq('id',item.id);failed++;continue;}
    const {data:teacher}=await supabase.from('profiles').select('nombre,apellido').eq('id',item.reviewer_profile_id).maybeSingle();
    const {data:student}=await supabase.from('profiles').select('nombre').eq('id',item.recipient_profile_id).maybeSingle();
    const teacherName=[teacher?.nombre,teacher?.apellido].filter(Boolean).join(' ')||'Tu profesor';
    const approved=item.review_status==='approved';
    const {data:duty}=await db.from('pr_training_v2_submissions').select('assignment_duty_id').eq('id',item.submission_id).maybeSingle();
const {data:task}=duty?.assignment_duty_id?await db.from('pr_training_v2_assignment_duties').select('duty_snapshot').eq('id',duty.assignment_duty_id).maybeSingle():{data:null};
const taskTitle=String(task?.duty_snapshot?.title||'tu tarea').slice(0,100);
const heading=approved?`¡Aprobaste ${taskTitle}!`:`Tu profesor revisó ${taskTitle}`;
    const detail=approved?'¡Muy buen trabajo! Seguí avanzando en tu entrenamiento.':'Tenés una devolución para mejorar tu ejercicio.';
    const html=`<div style="background:#191A20;padding:32px 16px;font-family:Arial,sans-serif;color:#F3F1EC"><div style="max-width:520px;margin:auto"><p style="color:#C4FF24;font-weight:800;letter-spacing:3px">PR NEXT · PUNTA ROLLERS</p><h1 style="font-size:32px">${heading}</h1><p>Hola ${esc(student?.nombre||'')}, ${detail}</p><div style="padding:20px;background:#292A30;border-radius:16px"><strong>Revisión de ${esc(teacherName)}</strong>${item.reviewer_note?`<p>${esc(item.reviewer_note)}</p>`:''}</div><p style="margin-top:24px"><a style="background:#C4FF24;color:#191A20;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold" href="https://www.puntarollers.com/app/mi-pr">Ver mi entrenamiento</a></p></div></div>`;
    try {
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':item.id},body:JSON.stringify({from:'Punta Rollers <notificaciones@puntarollers.com>',to:[item.recipient_email],subject:heading,html})});
      if(!response.ok) throw new Error(`resend_${response.status}`);
      await supabase.from('pr_training_review_email_outbox').update({sent_at:new Date().toISOString(),last_error:null}).eq('id',item.id);
      sent++;
    }catch(e){await supabase.from('pr_training_review_email_outbox').update({last_error:String(e).slice(0,120)}).eq('id',item.id);failed++;}
  }
  return new Response(JSON.stringify({sent,failed}),{headers:cors});
});
