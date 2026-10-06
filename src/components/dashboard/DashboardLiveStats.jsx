import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import NewStudentWelcome from '../onboarding/NewStudentWelcome'
const EVENT='shifter-marathon-2026'
function monthStart(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01T00:00:00'}
export default function DashboardLiveStats({user}){
 const[data,setData]=useState({loading:true,monthKm:null,sessions:null,shifter:null,strava:false,newStudent:false})
 useEffect(()=>{let alive=true;(async()=>{if(!user?.id){setData(x=>({...x,loading:false}));return}
  const[p,a,s,e]=await Promise.all([
   supabase.from('profiles').select('miembro_desde,created_at').eq('id',user.id).maybeSingle(),
   supabase.from('pr_inline_skate_activities').select('id,distancia_metros,fecha_inicio').eq('alumno_id',user.id).eq('fuente','strava').eq('eliminada',false).gte('fecha_inicio',monthStart()).limit(1000),
   supabase.from('pr_strava_connections').select('conectado').eq('alumno_id',user.id).maybeSingle(),
   supabase.from('pr_training_enrollments').select('category,active').eq('profile_id',user.id).eq('event_slug',EVENT).maybeSingle()
  ])
  if(!alive)return
  const acts=a.data||[];let shifter=null
  if(e.data?.category&&e.data.category!=='NO'){
   const[t,r]=await Promise.all([
    supabase.from('pr_training_tasks').select('id,category').eq('event_slug',EVENT).eq('active',true),
    supabase.from('pr_training_task_results').select('task_id,status').eq('profile_id',user.id)
   ])
   const tasks=(t.data||[]).filter(x=>x.category==='ALL'||x.category===e.data.category)
   const done=new Set((r.data||[]).filter(x=>x.status==='completed').map(x=>x.task_id))
   shifter={completed:tasks.filter(x=>done.has(x.id)).length,total:tasks.length}
  }
  const memberDate=p.data?.miembro_desde||p.data?.created_at
  const ageDays=memberDate?Math.floor((Date.now()-new Date(memberDate).getTime())/86400000):null
  setData({loading:false,monthKm:acts.reduce((n,x)=>n+(Number(x.distancia_metros)||0)/1000,0),sessions:acts.length,shifter,strava:Boolean(s.data?.conectado)||acts.length>0,newStudent:(ageDays!==null&&ageDays<45)||(acts.length===0&&!shifter)})
 })().catch(()=>alive&&setData(x=>({...x,loading:false})));return()=>{alive=false}},[user?.id])
 const cards=[['KM ESTE MES',data.loading?'—':data.monthKm===null?'—':data.monthKm.toLocaleString('es-UY',{maximumFractionDigits:1}),data.strava?'Desde Strava':'Conectá Strava','/app/perfil'],['ENTRENOS',data.loading?'—':data.sessions??'—','Actividades de este mes','/app/rollerfeed'],['SHIFTER',data.loading?'—':data.shifter?data.shifter.completed+'/'+data.shifter.total:'—',data.shifter?'Tu capítulo guardado':'Sin participación',data.shifter?'/app/historia/shifter-2026':'/app/mi-pr']]
 return <><NewStudentWelcome show={!data.loading&&data.newStudent}/><section className="grid grid-cols-3 gap-2">{cards.map(([k,v,s,to])=><Link key={k} to={to} className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4"><p className="text-[7px] font-black tracking-[.13em] text-white/30">{k}</p><p className="mt-3 text-xl font-black tracking-tight">{v}</p><p className="mt-1 text-[8px] leading-3 text-white/30">{s}</p></Link>)}</section><section className="grid grid-cols-3 gap-2"><Link to="/app/tareas" className="rounded-[20px] border border-violet-300/12 bg-violet-300/[.04] p-4"><p className="text-[8px] font-black text-violet-200/60">TAREAS</p><p className="mt-2 text-[9px] text-white/30">Entrenamiento y objetivos →</p></Link><Link to="/app/asistencia" className="rounded-[20px] border border-cyan-300/12 bg-cyan-300/[.04] p-4"><p className="text-[8px] font-black text-cyan-200/60">PR CHECK</p><p className="mt-2 text-[9px] text-white/30">Asistencia e ID →</p></Link><Link to="/app/mi-pr" className="rounded-[20px] border border-white/[.07] bg-white/[.025] p-4"><p className="text-[8px] font-black text-white/35">MI PR</p><p className="mt-2 text-[9px] text-white/30">Identidad e historia →</p></Link></section></>
}