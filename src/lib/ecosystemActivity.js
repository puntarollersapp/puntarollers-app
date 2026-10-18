// Shared validation for the Ecosistema dashboard, ACTIVE and ORBIT.
export const validEcosystemActivity = (a, now = Date.now()) => {
 const timestamp = new Date(a.fecha_inicio).getTime()
 const distance = Number(a.distancia_metros)
 return !a.eliminada && a.tipo === 'Patinaje' && Number.isFinite(timestamp) && timestamp <= now && Number.isFinite(distance) && distance >= 0 && ((a.fuente === 'strava' && a.estado_validacion === 'sincronizada') || (a.fuente === 'manual' && a.estado_validacion === 'validada'))
}
export const ecosystemDayKey = value => {
 const d = new Date(value)
 if (Number.isNaN(d.getTime())) return ''
 const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d)
 const part = type => parts.find(p=>p.type===type)?.value || ''
 return part('year')+'-'+part('month')+'-'+part('day')
}
export const uniqueEcosystemActivities = rows => {
 const seen = new Set()
 return rows.filter(a=>{
  const key = a.fuente==='strava' && a.strava_activity_id ? 'strava:'+a.strava_activity_id : 'id:'+a.id
  if(seen.has(key))return false
  seen.add(key)
  return true
 })
}
