function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins=new Set(['https://pr-next-replica-fiel-oahke3cf7-puntarollersapps-projects.vercel.app',"https://puntarollers.com","https://www.puntarollers.com"]);
function headers(req:Request){
  const origin=req.headers.get("Origin")||"";
  return {
    "Access-Control-Allow-Origin":(allowedOrigins.has(origin) || isReplicaOrigin(origin))?origin:"https://www.puntarollers.com",
    "Vary":"Origin",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Content-Type":"application/json"
  };
}

Deno.serve(async(req:Request)=>{
  const h=headers(req);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:h});

  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=req.headers.get("Authorization")||"";

  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await uc.auth.getUser();
  if(!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:h});

  const db=createClient(url,service);
  const {data:actor}=await db.from("profiles").select("id,role").eq("auth_user_id",user.id).maybeSingle();
  if(!actor||actor.role!=="admin")return new Response(JSON.stringify({error:"admin_only"}),{status:403,headers:h});

  const body=await req.json().catch(()=>({}));
  const action=String(body.action||"create");

  if(action==="delete"){
    const id=String(body.id||"").trim();
    if(!id.startsWith("tesoreria_"))return new Response(JSON.stringify({error:"treasury_only"}),{status:400,headers:h});

    const {data:paidRows,error:paidError}=await db.from("pr_mensualidades")
      .select("id,estado")
      .eq("alumno_id",id)
      .eq("estado","pagado")
      .limit(1);
    if(paidError)return new Response(JSON.stringify({error:paidError.message}),{status:500,headers:h});
    if((paidRows||[]).length>0)return new Response(JSON.stringify({error:"has_payment_history"}),{status:409,headers:h});

    await db.from("pr_tesoreria_recordatorios").delete().eq("alumno_id",id);
    const {error:dueDeleteError}=await db.from("pr_mensualidades").delete().eq("alumno_id",id);
    if(dueDeleteError)return new Response(JSON.stringify({error:dueDeleteError.message}),{status:500,headers:h});

    const {error:profileDeleteError}=await db.from("profiles").delete().eq("id",id);
    if(profileDeleteError)return new Response(JSON.stringify({error:profileDeleteError.message}),{status:500,headers:h});

    return new Response(JSON.stringify({ok:true,deleted:true,id}),{status:200,headers:h});
  }

  const nombre=String(body.nombre||"").trim();
  const telefono=String(body.telefono||"").trim()||null;
  const email=String(body.email||"").trim()||null;
  const monto=Number(body.monto||0);
  const periodo=typeof body.periodo==="string"?body.periodo.slice(0,10):new Date().toISOString().slice(0,7)+"-01";

  if(!nombre)return new Response(JSON.stringify({error:"name_required"}),{status:400,headers:h});
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return new Response(JSON.stringify({error:"invalid_email"}),{status:400,headers:h});
  if(!Number.isFinite(monto)||monto<=0)return new Response(JSON.stringify({error:"invalid_amount"}),{status:400,headers:h});

  const id="tesoreria_"+crypto.randomUUID();
  const {error:profileError}=await db.from("profiles").insert({
    id,
    nombre,
    telefono,
    email,
    role:"alumno",
    estado:"Activo",
    acceso_habilitado:false,
    prcard_activa:false,
    tracking_activo:false,
    participa_como_alumno:false,
    auth_migrado:false,
    es_tesoreria:false,
    particulares_habilitadas:false,
    es_alumno_personalizadas:false,
    es_solo_personalizadas:false
  });
  if(profileError)return new Response(JSON.stringify({error:profileError.message}),{status:500,headers:h});

  await db.rpc("pr_asegurar_mensualidades",{p_periodo:periodo});
  const {error:dueError}=await db.from("pr_mensualidades").update({monto}).eq("alumno_id",id).eq("periodo",periodo);
  if(dueError)return new Response(JSON.stringify({error:dueError.message}),{status:500,headers:h});

  return new Response(JSON.stringify({ok:true,id,nombre,monto}),{status:200,headers:h});
});
