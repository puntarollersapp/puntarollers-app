function isReplicaOrigin(origin: string) { return /^https:\/\/pr-next-replica-fiel-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/.test(origin); }
// Beta isolation: never initialize against another project.
if (Deno.env.get('SUPABASE_URL') !== 'https://azheisnfaedjqcuhiylo.supabase.co') throw new Error('PR NEXT beta isolation');
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=60',
};

function montevideoRange(kind: 'week' | 'month') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const shift = (value: string, n: number) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
  if (kind === 'month') {
    const start = `${parts.year}-${parts.month}-01`;
    const next = new Date(Date.UTC(Number(parts.year), Number(parts.month), 1, 12));
    const end = new Date(next.getTime()-86400000).toISOString().slice(0,10);
    return { start, end };
  }
  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday);
  const mondayOffset = weekday === 0 ? -6 : 1-weekday;
  const start = shift(today, mondayOffset);
  return { start, end: shift(start, 6) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(url, key);
    const out: Record<string, unknown> = {};
    for (const kind of ['week','month'] as const) {
      const range = montevideoRange(kind);
      const { data: acts, error } = await supabase.from('pr_inline_skate_activities')
        .select('alumno_id,distancia_metros,fecha_inicio,deporte_strava')
        
        .gte('fecha_inicio', `${range.start}T00:00:00-03:00`).lte('fecha_inicio', `${range.end}T23:59:59-03:00`)
        .gt('distancia_metros',0).limit(2000);
      if (error) throw error;
      const ids = [...new Set((acts||[]).map((a:any)=>String(a.alumno_id||'')).filter(Boolean))];
      const { data: profiles } = ids.length ? await supabase.from('profiles_feed').select('id,nombre,apellido,foto,auth_user_id').in('id',ids) : { data: [] as any[] };
      const pmap = new Map((profiles||[]).map((p:any)=>[String(p.id),p]));
      const grouped = new Map<string,{alumnoId:string,km:number,sessions:number}>();
      for (const a of acts||[]) { const id=String((a as any).alumno_id||''); if(!id) continue; const cur=grouped.get(id)||{alumnoId:id,km:0,sessions:0}; cur.km += Number((a as any).distancia_metros||0)/1000; cur.sessions += 1; grouped.set(id,cur); }
      const ranking = [...grouped.values()].map((x)=>{ const p:any=pmap.get(x.alumnoId)||{}; return {...x,name:p.nombre || 'Integrante PR',photo:p.foto || ''}; }).sort((a,b)=>b.km-a.km || b.sessions-a.sessions || a.name.localeCompare(b.name)).slice(0,3);
      out[kind] = { range, ranking };
    }
    return new Response(JSON.stringify(out), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), { status: 500, headers: cors });
  }
});
