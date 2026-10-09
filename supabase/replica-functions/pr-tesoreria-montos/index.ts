function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set(['https://pr-next-replica-fiel-oahke3cf7-puntarollersapps-projects.vercel.app',"https://puntarollers.com","https://www.puntarollers.com"]);
function headers(req: Request){
  const origin=req.headers.get("Origin")||"";
  return {
    "Access-Control-Allow-Origin": (allowedOrigins.has(origin) || isReplicaOrigin(origin))?origin:"https://www.puntarollers.com",
    "Vary":"Origin",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Content-Type":"application/json",
  };
}
function previousPeriod(periodo:string){
  const d=new Date(periodo+"T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth()-1);
  return d.toISOString().slice(0,7)+"-01";
}
function inPromoWindow(periodo:string, startsMonth:string, monthsTotal:number){
  const p=new Date(periodo+"T12:00:00Z");
  const s=new Date(startsMonth+"T12:00:00Z");
  const end=new Date(s); end.setUTCMonth(end.getUTCMonth()+Number(monthsTotal||0));
  return p>=s && p<end;
}
Deno.serve(async(req:Request)=>{
  const h=headers(req);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:h});
  if(req.method!=="POST") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:h});
  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=req.headers.get("Authorization")||"";
  const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await uc.auth.getUser();
  if(!user) return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:h});
  const db=createClient(url,service);
  const {data:actor}=await db.from("profiles").select("id,role,es_tesoreria").eq("auth_user_id",user.id).maybeSingle();
  if(!actor || (actor.role!=="admin" && actor.es_tesoreria!==true)) return new Response(JSON.stringify({error:"forbidden"}),{status:403,headers:h});

  const body=await req.json().catch(()=>({}));
  const action=String(body.action||"sync");
  const periodo=typeof body.periodo==="string"?body.periodo.slice(0,10):new Date().toISOString().slice(0,7)+"-01";

  await db.rpc("pr_asegurar_mensualidades",{p_periodo:periodo});

  if(action==="set"){
    if(actor.role!=="admin") return new Response(JSON.stringify({error:"admin_only"}),{status:403,headers:h});
    const alumnoId=String(body.alumno_id||"");
    const monto=Number(body.monto);
    if(!alumnoId || !Number.isFinite(monto) || monto<=0) return new Response(JSON.stringify({error:"invalid_amount"}),{status:400,headers:h});
    const {error}=await db.from("pr_mensualidades").update({monto}).eq("alumno_id",alumnoId).eq("periodo",periodo);
    if(error) return new Response(JSON.stringify({error:error.message}),{status:500,headers:h});
    return new Response(JSON.stringify({ok:true,alumno_id:alumnoId,monto}),{status:200,headers:h});
  }

  const prev=previousPeriod(periodo);
  const [{data:current,error:ce},{data:previous,error:pe},{data:profiles,error:pre},{data:benefits,error:be}]=await Promise.all([
    db.from("pr_mensualidades").select("id,alumno_id,monto,estado").eq("periodo",periodo),
    db.from("pr_mensualidades").select("alumno_id,monto").eq("periodo",prev),
    db.from("profiles").select("id,email"),
    db.from("pr_campaign_benefits").select("email,campaign_code,discount_percent,starts_month,months_total,active,base_amount,modalidad").eq("campaign_code","ROLLERWEENPR").eq("active",true),
  ]);
  if(ce||pe||pre||be) return new Response(JSON.stringify({error:ce?.message||pe?.message||pre?.message||be?.message}),{status:500,headers:h});

  const prevMap=new Map((previous||[]).map((r:any)=>[r.alumno_id,Number(r.monto||0)]));
  const emailById=new Map((profiles||[]).map((r:any)=>[String(r.id),String(r.email||"").trim().toLowerCase()]));
  const benefitByEmail=new Map((benefits||[]).map((r:any)=>[String(r.email||"").trim().toLowerCase(),r]));
  const copied:any[]=[];
  const promoApplied:any[]=[];

  for(const row of current||[]){
    if(String(row.estado||"").toLowerCase()==="pagado") continue;
    const email=emailById.get(String(row.alumno_id))||"";
    const benefit:any=benefitByEmail.get(email);
    if(benefit && inPromoWindow(periodo,String(benefit.starts_month).slice(0,10),Number(benefit.months_total||0))){
      const base=Number(benefit.base_amount||0);
      const pct=Number(benefit.discount_percent||10);
      if(base>0){
        const promoAmount=Math.round(base*(1-pct/100));
        const {error}=await db.from("pr_mensualidades").update({monto:promoAmount,observacion:"RollerWeen · ROLLERWEENPR · 10% OFF"}).eq("id",row.id);
        if(!error) promoApplied.push({alumno_id:row.alumno_id,monto:promoAmount});
        continue;
      }
    }
    if(Number(row.monto||0)>0) continue;
    const prior=Number(prevMap.get(row.alumno_id)||0);
    if(prior<=0) continue;
    const {error}=await db.from("pr_mensualidades").update({monto:prior}).eq("id",row.id);
    if(!error) copied.push({alumno_id:row.alumno_id,monto:prior});
  }
  return new Response(JSON.stringify({ok:true,copied,promo_applied:promoApplied}),{status:200,headers:h});
});
