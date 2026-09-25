import { supabase } from './supabase'

const safe = (x) => Array.isArray(x) ? x : []
const num = (x) => Number(x || 0)
const isoDaysAgo = (days) => { const d = new Date(); d.setDate(d.getDate()-days); return d.toISOString() }
export const PERIODS = { '30d':30, '90d':90, '6m':183, '1y':365, all:null }
export const PERIOD_LABELS = { '30d':'30 días', '90d':'90 días', '6m':'6 meses', '1y':'1 año', all:'Histórico' }
export const studentDisplayName = (p={}) => [p.nombre,p.apellido].map(v=>String(v||'').trim()).filter(Boolean).join(' ').replace(/\s+/g,' ').trim() || 'Alumno PR'
const inPeriod=(value,since)=>{if(!since)return true;if(!value)return false;const t=new Date(value).getTime();return Number.isFinite(t)&&t>=since}
const reservationDate=(r)=>r?.pr_personal_disponibilidad?.fecha||r?.fecha_reserva

export async function loadStudentReport(profileId, period='90d') {
  const days = PERIODS[period] ?? null
  const sinceIso=days?isoDaysAgo(days):null, sinceMs=sinceIso?new Date(sinceIso).getTime():null
  let activitiesQ = supabase.from('pr_inline_skate_activities').select('*').eq('alumno_id', profileId).eq('eliminada', false).order('fecha_inicio',{ascending:false})
  if (days) activitiesQ = activitiesQ.gte('fecha_inicio', sinceIso)
  const [profileR, activitiesR, performanceR, notesR, goalsR, takesR, resultsR, reservationsR] = await Promise.all([
    supabase.from('profiles').select('*').eq('id',profileId).single(), activitiesQ,
    supabase.from('pr_performance').select('*').eq('alumno_id',profileId).maybeSingle(),
    supabase.from('pr_performance_notes').select('*').eq('profile_id',profileId).order('created_at',{ascending:false}),
    supabase.from('pr_performance_objetivos').select('*').eq('alumno_id',profileId).eq('eliminado',false).order('creado_en',{ascending:false}),
    supabase.from('pr_performance_tomas').select('*').eq('alumno_id',profileId).eq('eliminado',false).order('fecha',{ascending:false}),
    supabase.from('pr_training_task_results').select('*,pr_training_tasks(title,description,category,target_value,target_secondary)').eq('profile_id',profileId).order('updated_at',{ascending:false}),
    supabase.from('pr_personal_reservas').select('*,pr_personal_disponibilidad(fecha,hora_inicio,hora_fin)').eq('alumno_id',profileId).order('fecha_reserva',{ascending:false})
  ])
  const firstError=[profileR,activitiesR,performanceR,notesR,goalsR,takesR,resultsR,reservationsR].find(r=>r.error)?.error
  if(firstError) throw firstError
  const activities=safe(activitiesR.data)
  const notes=safe(notesR.data).filter(n=>inPeriod(n.created_at,sinceMs))
  const goals=safe(goalsR.data).filter(g=>inPeriod(g.creado_en,sinceMs))
  const takes=safe(takesR.data).filter(t=>inPeriod(t.fecha,sinceMs))
  const trainingResults=safe(resultsR.data).filter(r=>inPeriod(r.completed_at||r.updated_at,sinceMs))
  const reservations=safe(reservationsR.data).filter(r=>inPeriod(reservationDate(r),sinceMs))
  const movingSeconds=activities.reduce((s,a)=>s+num(a.tiempo_movimiento_segundos),0)
  const totalMeters=activities.reduce((s,a)=>s+num(a.distancia_metros),0), elevation=activities.reduce((s,a)=>s+num(a.desnivel_metros),0)
  const elapsedSeconds=activities.reduce((s,a)=>s+num(a.tiempo_total_segundos),0)
  const calories=activities.reduce((s,a)=>s+num(a.calorias),0), weightedSpeed=activities.reduce((s,a)=>s+num(a.velocidad_media_ms)*num(a.tiempo_movimiento_segundos),0)
  const maxSpeed=Math.max(0,...activities.map(a=>num(a.velocidad_maxima_ms)))
  const heartRates=activities.map(a=>num(a.frecuencia_cardiaca_media)).filter(Boolean), maxHeartRates=activities.map(a=>num(a.frecuencia_cardiaca_maxima)).filter(Boolean)
  const cadenceRows=activities.map(a=>num(a.cadencia_media)).filter(Boolean), effortRows=activities.map(a=>num(a.esfuerzo_percibido)).filter(Boolean)
  const avgHeartRate=heartRates.length?heartRates.reduce((a,b)=>a+b,0)/heartRates.length:null, maxHeartRate=maxHeartRates.length?Math.max(...maxHeartRates):null
  const avgCadence=cadenceRows.length?cadenceRows.reduce((a,b)=>a+b,0)/cadenceRows.length:null
  const avgEffort=effortRows.length?effortRows.reduce((a,b)=>a+b,0)/effortRows.length:null
  const longestKm=activities.length?Math.max(...activities.map(a=>num(a.distancia_metros)/1000)):null
  const bestAvgSpeedKmh=activities.length?Math.max(0,...activities.map(a=>num(a.velocidad_media_ms)*3.6)):null
  const completed=trainingResults.filter(r=>r.status==='completed'||r.completed_at)
  return {generatedAt:new Date().toISOString(),period,periodLabel:PERIOD_LABELS[period]||period,profile:profileR.data,performance:performanceR.data,summary:{activities:activities.length,km:totalMeters/1000,movingSeconds,elapsedSeconds,elevationMeters:elevation,calories:calories||null,avgSpeedKmh:movingSeconds?weightedSpeed/movingSeconds*3.6:null,maxSpeedKmh:maxSpeed?maxSpeed*3.6:null,bestAvgSpeedKmh:bestAvgSpeedKmh||null,longestKm,avgHeartRate,maxHeartRate,avgCadence,avgEffort,heartRateActivities:heartRates.length,tasksCompleted:completed.length,reservations:reservations.length,classesDone:reservations.filter(r=>r.estado==='realizada').length},activities,notes,goals,takes,trainingResults,reservations}
}

export function reportSheets(report){
 const p=report.profile||{},s=report.summary||{}
 const groups=(p.grupos_info||[]).map(g=>g?.titulo||g?.nombre||g).filter(Boolean).join(' · ')
 return {
  Perfil:[['Campo','Valor'],['Alumno',studentDisplayName(p)],['Documento',p.documento||''],['Email',p.email||''],['Teléfono',p.telefono||''],['Ciudad',p.ciudad||''],['Instagram',p.instagram||''],['Fecha de nacimiento',p.fecha_nacimiento||''],['Estado',p.estado||''],['Rol',p.role||''],['Grupos',groups]],
  Resumen:[['Campo','Valor'],['Alumno',studentDisplayName(p)],['Período',report.periodLabel||PERIOD_LABELS[report.period]||report.period],['Actividades inline',s.activities],['Kilómetros',s.km],['Tiempo movimiento (s)',s.movingSeconds],['Tiempo total (s)',s.elapsedSeconds],['Desnivel (m)',s.elevationMeters],['Velocidad media (km/h)',s.avgSpeedKmh??'No disponible'],['Mejor velocidad media (km/h)',s.bestAvgSpeedKmh??'No disponible'],['Velocidad máxima (km/h)',s.maxSpeedKmh??'No disponible'],['Actividad más larga (km)',s.longestKm??'No disponible'],['FC media (ppm)',s.avgHeartRate??'No disponible'],['FC máxima (ppm)',s.maxHeartRate??'No disponible'],['Actividades con FC',s.heartRateActivities??0],['Cadencia media',s.avgCadence??'No disponible'],['Esfuerzo medio',s.avgEffort??'No disponible'],['Calorías',s.calories??'No disponible'],['Deberes completados',s.tasksCompleted],['Clases realizadas',s.classesDone]],
  'Actividades Strava':[['Fecha','Nombre','Deporte Strava','Km','Tiempo movimiento (s)','Tiempo total (s)','Desnivel m','Vel. media km/h','Vel. máxima km/h','FC media','FC máxima','Cadencia','Calorías','Esfuerzo','Zona horaria','URL Strava','Observación','Validación','Motivo validación','Visible feed','Privada'],...report.activities.map(a=>[a.fecha_inicio,a.nombre,a.deporte_strava,num(a.distancia_metros)/1000,a.tiempo_movimiento_segundos,a.tiempo_total_segundos,a.desnivel_metros,a.velocidad_media_ms==null?'':num(a.velocidad_media_ms)*3.6,a.velocidad_maxima_ms==null?'':num(a.velocidad_maxima_ms)*3.6,a.frecuencia_cardiaca_media??'',a.frecuencia_cardiaca_maxima??'',a.cadencia_media??'',a.calorias??'',a.esfuerzo_percibido??'',a.zona_horaria??'',a.strava_url??'',a.observacion??'',a.estado_validacion??'',a.motivo_validacion??'',a.visible_feed===false?'No':'Sí',a.es_privada?'Sí':'No'])],
  Deberes:[['Estado','Deber','Categoría','Progreso','Completado','Actualizado'],...report.trainingResults.map(r=>[r.status,r.pr_training_tasks?.title||'',r.pr_training_tasks?.category||'',r.progress_value??'',r.completed_at??'',r.updated_at])],
  'Tomas de tiempo':[['Fecha','Toma','Distancia km','Tiempo s','Origen','Devolución'],...report.takes.map(t=>[t.fecha,t.numero_toma,t.distancia_km,t.tiempo_segundos,t.origen,t.devolucion])],
  Asistencia:[['Fecha','Estado','Hora inicio','Hora fin','Crédito consumido','Crédito devuelto'],...report.reservations.map(r=>[reservationDate(r),r.estado,r.pr_personal_disponibilidad?.hora_inicio||'',r.pr_personal_disponibilidad?.hora_fin||'',r.credito_consumido?'Sí':'No',r.credito_devuelto?'Sí':'No'])],
  Objetivos:[['Título','Distancia km','Tiempo objetivo s','Fecha límite','Estado','Indicación'],...report.goals.map(g=>[g.titulo,g.distancia_km??'',g.tiempo_objetivo_segundos??'',g.fecha_limite??'',g.estado,g.indicacion??''])],
  Observaciones:[['Fecha','Visibilidad','Observación','Autor'],...report.notes.map(n=>[n.created_at,n.visibility,n.body,n.created_by])]
 }
}
