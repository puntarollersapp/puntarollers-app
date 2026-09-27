import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Profile2026Summary from '../components/profile/Profile2026Summary'

function savedUser(){try{return JSON.parse(localStorage.getItem('pr_user')||'{}')}catch{return{}}}

export default function Profile2026(){
  const { user } = useAuth()
  const base = useMemo(()=>({...savedUser(),...user}),[user])
  const profileId = base.id
  const [profile,setProfile]=useState(base)
  const [stats,setStats]=useState({sessions:0,kilometers:0})
  const [stravaConnected,setStravaConnected]=useState(false)
  const [open,setOpen]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    let alive=true
    async function load(){
      if(!profileId){setLoading(false);return}
      const [p,a,s]=await Promise.all([
        supabase.from('profiles').select('*').eq('id',profileId).maybeSingle(),
        supabase.from('pr_inline_skate_activities').select('distancia_metros,tiempo_movimiento_segundos').eq('alumno_id',profileId).eq('fuente','strava').eq('eliminada',false).limit(1000),
        supabase.from('pr_strava_connections').select('conectado').eq('alumno_id',profileId).maybeSingle(),
      ])
      if(!alive)return
      if(p.data){
        const row=p.data
        setProfile(prev=>({...prev,...row,
          fechaNacimiento:row.fecha_nacimiento||prev.fechaNacimiento,
          sobreMi:row.sobre_mi||prev.sobreMi,
          miembroDesde:row.miembro_desde||prev.miembroDesde,
          accesoHabilitado:typeof row.acceso_habilitado==='boolean'?row.acceso_habilitado:prev.accesoHabilitado,
          mensualidadHasta:row.mensualidad_hasta||prev.mensualidadHasta,
          verificado:Boolean(row.verificado),
        }))
      }
      const rows=a.data||[]
      setStats({sessions:rows.length,kilometers:rows.reduce((sum,r)=>sum+(Number(r.distancia_metros)||0)/1000,0)})
      setStravaConnected(Boolean(s.data?.conectado))
      setLoading(false)
    }
    load()
    return()=>{alive=false}
  },[profileId])

  const paymentStatus=useMemo(()=>{
    const raw=profile?.mensualidadHasta||profile?.mensualidad_hasta
    if(!raw)return {title:'Sin fecha registrada',description:'Tesorería todavía no registra una vigencia visible.',badge:'REVISAR'}
    const date=new Date(`${String(raw).slice(0,10)}T23:59:59`)
    if(Number.isNaN(date.getTime()))return {title:'Revisar mensualidad',description:'No pudimos interpretar la fecha registrada.',badge:'REVISAR'}
    const label=date.toLocaleDateString('es-UY',{day:'2-digit',month:'short',year:'numeric'})
    const expired=date.getTime()<Date.now()||profile?.accesoHabilitado===false||profile?.acceso_habilitado===false
    return expired?{title:'Mensualidad vencida',description:`Venció el ${label}.`,badge:'VENCIDA'}:{title:'Pago registrado',description:`Vigente hasta el ${label}.`,badge:'ACTIVA'}
  },[profile])

  const groups=Array.isArray(profile?.gruposInfo)?profile.gruposInfo:Array.isArray(profile?.grupos_info)?profile.grupos_info:[]

  return <AppLayout title="Mi perfil">
    <div className="pr-page space-y-4 pb-10 animate-page-enter">
      {loading?<div className="space-y-3"><div className="h-[390px] animate-pulse rounded-[34px] bg-white/[.04]"/><div className="h-20 animate-pulse rounded-[24px] bg-white/[.035]"/><div className="h-20 animate-pulse rounded-[24px] bg-white/[.035]"/></div>:<Profile2026Summary profile={profile} stats={stats} paymentStatus={paymentStatus} stravaConnected={stravaConnected} groups={groups} events={[]} services={[]} open={open} setOpen={setOpen}/>}      
      <section id="centro-pr" className="rounded-[28px] border border-pr-gold/15 bg-gradient-to-br from-pr-gold/[.08] via-white/[.02] to-transparent p-4">
        <p className="text-[8px] font-black uppercase tracking-[.18em] text-pr-gold">CENTRO PR</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/app/avatar-premium" className="rounded-[21px] border border-sky-300/12 bg-sky-400/[.06] p-4"><p className="text-sm font-black text-white">Mi PR Roller</p><p className="mt-1 text-[9px] leading-4 text-white/30">Crear o modificar tu identidad.</p></Link>
          <Link to="/app/mi-pr" className="rounded-[21px] border border-pr-gold/12 bg-pr-gold/[.05] p-4"><p className="text-sm font-black text-white">Mi PR</p><p className="mt-1 text-[9px] leading-4 text-white/30">Insignias, Track, Card y Music.</p></Link>
        </div>
      </section>
      <section className="rounded-[25px] border border-white/[.07] bg-white/[.02] p-4">
        <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/25">CONFIGURACIÓN</p>
        <p className="mt-2 text-sm font-black text-white">Tus datos siguen bajo tu control.</p>
        <p className="mt-1 text-[10px] leading-5 text-white/34">Mientras terminamos de migrar el editor visual, la edición utiliza el formulario completo original para no perder ninguna función.</p>
        <Link to="/app/perfil-clasico#editar" className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-white/[.08] bg-white/[.04] px-4 text-[10px] font-black text-white/65">Editar todos mis datos →</Link>
      </section>
    </div>
  </AppLayout>
}
