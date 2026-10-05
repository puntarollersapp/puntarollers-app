import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const FROM = "Punta Rollers <hola@puntarollers.com>";
const ADMIN = Deno.env.get("PAYMENT_NOTIFICATION_EMAIL") || "claudiofaccelli@gmail.com";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validEmail = (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());
const esc = (v: unknown) => String(v ?? "-").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c));

function secretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  if (keys.default) return keys.default;
  throw new Error("service_key_missing");
}
function reply(body: unknown, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"apikey, content-type, authorization" }});
}
function detail(program: string, row: any) {
  if (program === "PR Kids") return `<p><b>Horario:</b> ${esc(row.turno_sabado || "Sábado 19:00–20:00 · Pista cerrada Maldonado")}</p>`;
  if (program === "Adultos · Clases Grupales") return `<p><b>Encuentro incluido:</b> Miércoles 19:30–20:30 · Parada 2, Punta del Este</p><p><b>Turno sábado:</b> ${esc(row.turno_sabado)}</p>`;
  if (program === "Personalizadas 1 a 1") return `<p><b>Modalidad:</b> Personalizadas 1 a 1</p><p style="color:#9d9da8">Los horarios disponibles se habilitan semanalmente para que elijas tu turno.</p>`;
  return `<p><b>Fechas:</b> 28, 29 y 30 de octubre de 2026</p><p><b>Experiencia:</b> Clínica completa · 3 jornadas</p>`;
}
function userHtml(program:string,row:any,amount:number) {
  return `<!doctype html><html><body style="margin:0;background:#0b0b0f;font-family:Arial,sans-serif;color:#fff"><div style="max-width:620px;margin:auto;padding:28px 16px"><div style="background:#15151c;border:1px solid #292934;border-radius:24px;padding:30px"><div style="color:#f0c85b;font-size:12px;font-weight:900;letter-spacing:1.5px">PUNTA ROLLERS · PAGO</div><h1 style="margin:10px 0 12px;font-size:28px">Recibimos tu aviso de transferencia</h1><p style="color:#c8c8d1;line-height:1.6">Hola, <b>${esc(row.nombre_completo)}</b>. Tu inscripción sigue guardada y registramos que elegiste transferencia.</p><div style="background:#101014;border-radius:16px;padding:18px;margin:22px 0"><p style="margin:0 0 8px"><b>${esc(program)}</b></p><p style="margin:0 0 8px">Importe informado: <b>$${amount.toLocaleString("es-UY")} UYU</b></p>${detail(program,row)}</div><p style="color:#c8c8d1;line-height:1.6"><b>Importante:</b> esto todavía no confirma la acreditación. Verificaremos el comprobante y tu lugar quedará confirmado cuando el pago sea validado.</p><p style="margin-top:24px;color:#777784;font-size:12px">Punta Rollers · No es solo patinar, es pertenecer.</p></div></div></body></html>`;
}
function adminHtml(program:string,row:any,amount:number,id:string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#111"><div style="max-width:620px;margin:auto;padding:24px"><div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #e4e4e8"><div style="color:#7b2ac5;font-size:12px;font-weight:900;letter-spacing:1.4px">PUNTA ROLLERS · TRANSFERENCIA INFORMADA</div><h1 style="font-size:24px;margin:10px 0 18px">${esc(program)}</h1><p><b>Alumno/a:</b> ${esc(row.nombre_completo)}</p><p><b>WhatsApp:</b> ${esc(row.telefono)}</p><p><b>Email:</b> ${esc(row.email)}</p><p><b>Importe:</b> $${amount.toLocaleString("es-UY")} UYU</p>${detail(program,row)}<p><b>Estado:</b> Pendiente de verificar comprobante</p><p style="color:#777;font-size:12px"><b>ID:</b> ${esc(id)}</p></div></div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"apikey, content-type, authorization"}});
  if (req.method !== "POST") return reply({error:"method_not_allowed"},405);
  const resend = Deno.env.get("RESEND_API_KEY");
  if (!resend) return reply({error:"email_not_configured"},503);
  const body = await req.json().catch(()=>({}));
  const registrationType = String(body.registrationType || "");
  const id = String(body.registrationId || "");
  if (!uuid.test(id) || !["inscripciones_2026","clinica_oct_2026"].includes(registrationType)) return reply({error:"invalid_request"},400);
  const db = createClient(Deno.env.get("SUPABASE_URL") || "", secretKey(), {auth:{persistSession:false}});
  const table = registrationType === "inscripciones_2026" ? "pr_inscripciones_2026" : "pr_clinica_oct_2026_inscripciones";
  const {data:row,error} = await db.from(table).select("*").eq("id",id).maybeSingle();
  if (error || !row) return reply({error:"registration_not_found"},404);
  const program = registrationType === "clinica_oct_2026" ? "Clínica Internacional Miguel Flores" : row.modalidad === "kids" ? "PR Kids" : row.modalidad === "grupales" ? "Adultos · Clases Grupales" : "Personalizadas 1 a 1";
  const amount = Number(row.monto_final ?? row.monto ?? 0);
  if (registrationType === "inscripciones_2026") {
    const {error:updateError}=await db.from(table).update({metodo_pago:"Transferencia",estado: row.estado==="pago_verificado" ? row.estado : "pago_pendiente",updated_at:new Date().toISOString()}).eq("id",id);
    if (updateError) return reply({error:"could_not_update_registration"},500);
  } else if (row.estado !== "confirmado" && row.estado !== "lista_espera") {
    await db.from(table).update({opcion_pago:"pagar_ahora",estado:"pendiente_aprobacion",updated_at:new Date().toISOString()}).eq("id",id);
  }
  const batch:any[] = [{from:FROM,to:[ADMIN],subject:`📲 Transferencia informada — ${program} — ${row.nombre_completo}`,html:adminHtml(program,row,amount,id)}];
  if (validEmail(row.email)) batch.push({from:FROM,to:[String(row.email).trim().toLowerCase()],subject:`Recibimos tu transferencia · ${program}`,html:userHtml(program,row,amount)});
  const response = await fetch("https://api.resend.com/emails/batch",{method:"POST",headers:{Authorization:`Bearer ${resend}`,"Content-Type":"application/json"},body:JSON.stringify(batch)});
  const result = await response.json().catch(()=>({}));
  if (!response.ok) return reply({error:"email_send_failed",detail:result},502);
  return reply({ok:true,program,status:"pending_verification"});
});