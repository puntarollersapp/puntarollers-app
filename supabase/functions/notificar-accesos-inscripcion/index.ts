import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, corsHeaders, isAllowedBrowserOrigin, jsonResponse } from "../_shared/mercadopago.ts";
import { paidClassAccessEmailHtml } from "../_shared/classAccess.ts";

const escapeHtml=(v:unknown)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

Deno.serve(async (req:Request)=>{
 const origin=req.headers.get("origin"),headers=corsHeaders(origin);
 const reply=(body:Record<string,unknown>,status=200)=>jsonResponse(body,status,headers);
 if(req.method==="OPTIONS")return new Response(null,{status:isAllowedBrowserOrigin(origin)?204:403,headers});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 if(!isAllowedBrowserOrigin(origin))return reply({error:"origin_not_allowed"},403);
 const jwt=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!jwt)return reply({error:"unauthorized"},401);
 const db=adminClient();
 const {data:auth,error:authError}=await db.auth.getUser(jwt);
 if(authError||!auth.user)return reply({error:"unauthorized"},401);
 const {data:profile,error:profileError}=await db.from("profiles").select("role").eq("auth_user_id",auth.user.id).eq("role","admin").maybeSingle();
 if(profileError||!profile)return reply({error:"forbidden"},403);
 let id:unknown;
 try{id=(await req.json()).registrationId;}catch{return reply({error:"invalid_json"},400);}
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:"invalid_id"},400);
 const {data:row,error}=await db.from("pr_inscripciones_2026").select("id,modalidad,estado,comprobante_recibido,metodo_pago,nombre_completo,nombre_responsable,email,monto,monto_final,turno_sabado,manual_access_email_sent_at").eq("id",id).maybeSingle();
 if(error||!row)return reply({error:"registration_not_found"},404);
 if(!["pago_verificado","confirmado"].includes(row.estado)||row.comprobante_recibido!==true)return reply({error:"payment_not_verified"},409);
 if(!["kids","grupales"].includes(row.modalidad)||row.metodo_pago==="Mercado Pago")return reply({error:"not_applicable"},409);
 if(row.manual_access_email_sent_at)return reply({ok:true,sentAt:row.manual_access_email_sent_at,alreadySent:true});
 const email=String(row.email??"").trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({error:"invalid_email"},422);
 const access=paidClassAccessEmailHtml(row.modalidad,row.turno_sabado);
 if(!access)return reply({error:"class_access_missing"},422);
 const key=Deno.env.get("RESEND_API_KEY");
 if(!key)return reply({error:"email_not_configured"},503);
 const program=row.modalidad==="kids"?"PR Kids":"Adultos · Clases Grupales";
 const amount=Number(row.monto_final??row.monto).toLocaleString("es-UY");
 const html='<html><body style="background:#15151c;color:#fff;font-family:Arial,sans-serif;padding:24px"><div style="max-width:580px;margin:auto"><p style="color:#a1f0df;font-weight:bold">PUNTA ROLLERS · PAGO VERIFICADO</p><h1>Tu inscripción está confirmada</h1><p>Hola, '+escapeHtml(row.nombre_responsable||row.nombre_completo)+'. Confirmamos tu pago de $'+escapeHtml(amount)+' UYU para '+escapeHtml(program)+'.</p>'+access+'<p>Punta Rollers · No es solo patinar, es pertenecer.</p></div></body></html>';
 const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"pr-manual-access/"+id},body:JSON.stringify({from:"Punta Rollers <hola@puntarollers.com>",to:[email],subject:"✓ Pago verificado · "+program,html}),signal:AbortSignal.timeout(10000)}).catch(()=>null);
 if(!sent?.ok)return reply({error:"email_send_failed"},502);
 const sentAt=new Date().toISOString();
 const {error:saveError}=await db.from("pr_inscripciones_2026").update({manual_access_email_sent_at:sentAt}).eq("id",id);
 if(saveError)return reply({error:"email_sent_status_not_saved"},500);
 return reply({ok:true,sentAt});
});