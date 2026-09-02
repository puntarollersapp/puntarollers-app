import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function friendlyFeedback(
  currentSeconds: number,
  previousSeconds: number | null,
  bestBefore: number | null
) {
  if (!previousSeconds || !bestBefore) {
    return '¡Nueva toma registrada! Este resultado ya forma parte de tu historial PR y nos sirve como nueva referencia para seguir viendo tu evolución.'
  }

  const diffPct = ((previousSeconds - currentSeconds) / previousSeconds) * 100
  const isPersonalBest = currentSeconds < bestBefore

  if (isPersonalBest && diffPct > 0.5) {
    return `¡Nuevo mejor registro personal! Mejoraste ${Math.abs(diffPct).toFixed(1)}% frente a tu toma anterior. Tremendo paso: seguí construyendo sobre este progreso.`
  }

  if (Math.abs(diffPct) <= 2) {
    return 'Tu registro se mantuvo muy cerca de la toma anterior. Esa constancia también es progreso: seguí sumando kilómetros, técnica y confianza.'
  }

  if (diffPct > 0) {
    return `¡Muy buena evolución! Mejoraste ${Math.abs(diffPct).toFixed(1)}% frente a tu toma anterior. Cada segundo ganado refleja el trabajo acumulado.`
  }

  return 'Nueva toma registrada. Hoy el tiempo quedó por encima de tu referencia anterior, pero tu mejor marca sigue intacta. Cada toma nos da información para seguir ajustando y creciendo.'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const authHeader = req.headers.get('Authorization') || ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Sesión inválida.' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData?.user) return json({ error: 'La sesión venció.' }, 401)

    const body = await req.json().catch(() => ({}))
    const profileId = String(body?.profile_id || '').trim()
    const targetDate = String(body?.date || '2026-09-02').trim()

    if (!profileId) return json({ error: 'Falta el perfil.' }, 400)

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, auth_user_id')
      .eq('id', profileId)
      .maybeSingle()
    if (profileError) throw profileError

    if (!profile || String(profile.auth_user_id || '') !== String(authData.user.id)) {
      return json({ error: 'No podés procesar otro perfil.' }, 403)
    }

    const dayStart = `${targetDate}T00:00:00-03:00`
    const dayEnd = `${targetDate}T23:59:59-03:00`

    const { data: activities, error: activitiesError } = await admin
      .from('pr_activities')
      .select('id, strava_activity_id, nombre, deporte_strava, fecha_inicio, distancia_metros, tiempo_movimiento_segundos, tiempo_total_segundos, fuente, eliminada')
      .eq('alumno_id', profileId)
      .eq('fuente', 'strava')
      .eq('eliminada', false)
      .gte('fecha_inicio', dayStart)
      .lte('fecha_inicio', dayEnd)
      .order('fecha_inicio', { ascending: false })
    if (activitiesError) throw activitiesError

    const { data: previousTomas, error: tomasError } = await admin
      .from('pr_performance_tomas')
      .select('id, numero_toma, fecha, distancia_km, tiempo_segundos, origen, observacion_original_id')
      .eq('alumno_id', profileId)
      .eq('eliminado', false)
      .order('fecha', { ascending: true })
      .order('numero_toma', { ascending: true })
    if (tomasError) throw tomasError

    const alreadyImported = new Set(
      (previousTomas || [])
        .filter((take: any) => take.origen === 'strava' && take.observacion_original_id)
        .map((take: any) => String(take.observacion_original_id))
    )

    const candidates = (activities || []).filter((activity: any) => {
      const activityId = String(activity.strava_activity_id || '')
      if (!activityId || alreadyImported.has(activityId)) return false

      const sport = String(activity.deporte_strava || '').toLowerCase()
      const name = String(activity.nombre || '').toLowerCase()
      const isInline = sport.includes('inline') || sport.includes('skate') || sport.includes('roller')
      const namedAsTrial = name.includes('toma') || name.includes('tiempo') || name.includes('time trial') || name.includes('punta rollers') || name.includes(' pr ')
      if (!isInline && !namedAsTrial) return false

      const km = Number(activity.distancia_metros || 0) / 1000
      const seconds = Number(activity.tiempo_movimiento_segundos || activity.tiempo_total_segundos || 0)
      return km >= 1 && km <= 20 && seconds >= 120
    })

    const scored = candidates
      .map((activity: any) => {
        const km = Number(activity.distancia_metros || 0) / 1000
        const name = String(activity.nombre || '').toLowerCase()
        const sport = String(activity.deporte_strava || '').toLowerCase()
        const namedAsTrial = name.includes('toma') || name.includes('tiempo') || name.includes('time trial') || name.includes('punta rollers') || name.includes(' pr ')
        const isInline = sport.includes('inline') || sport.includes('skate') || sport.includes('roller')

        const historicalDistances = (previousTomas || [])
          .map((take: any) => Number(take.distancia_km || 0))
          .filter((distance: number) => distance > 0)

        let closestDistance: number | null = null
        let distanceErrorPct = 999

        for (const distance of historicalDistances) {
          const errorPct = (Math.abs(km - distance) / distance) * 100
          if (errorPct < distanceErrorPct) {
            distanceErrorPct = errorPct
            closestDistance = distance
          }
        }

        const strongDistanceMatch = closestDistance !== null && distanceErrorPct <= 7.5
        const score = (isInline ? 2 : 0) + (namedAsTrial ? 3 : 0) + (strongDistanceMatch ? 3 : 0)

        return {
          activity,
          km,
          closestDistance,
          distanceErrorPct,
          strongDistanceMatch,
          namedAsTrial,
          isInline,
          score,
        }
      })
      .sort((a: any, b: any) => b.score - a.score)

    const strong = scored.filter((item: any) => item.score >= 5)

    if (strong.length !== 1) {
      return json({
        success: true,
        registered: false,
        status: strong.length > 1 ? 'ambiguous' : 'no_strong_match',
        candidates: scored.map((item: any) => ({
          strava_activity_id: item.activity.strava_activity_id,
          name: item.activity.nombre,
          distance_km: Number(item.km.toFixed(2)),
          score: item.score,
        })),
      })
    }

    const chosen = strong[0]
    const activity = chosen.activity
    const activityId = String(activity.strava_activity_id)
    const distanceKm = Number(chosen.km.toFixed(2))
    const elapsedSeconds = Number(
      activity.tiempo_movimiento_segundos || activity.tiempo_total_segundos || 0
    )

    const comparable = (previousTomas || [])
      .filter((take: any) => {
        const distance = Number(take.distancia_km || 0)
        return distance > 0 && Math.abs(distance - distanceKm) / distance <= 0.075
      })
      .sort(
        (a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      )

    const previous = comparable.length ? comparable[comparable.length - 1] : null
    const bestBefore = comparable.length
      ? Math.min(...comparable.map((take: any) => Number(take.tiempo_segundos)))
      : null

    const feedback = friendlyFeedback(
      elapsedSeconds,
      previous ? Number(previous.tiempo_segundos) : null,
      bestBefore
    )

    const { data: inserted, error: insertError } = await admin
      .from('pr_performance_tomas')
      .insert({
        alumno_id: profileId,
        fecha: targetDate,
        distancia_km: distanceKm,
        tiempo_segundos: elapsedSeconds,
        devolucion: feedback,
        origen: 'strava',
        observacion_original_id: activityId,
      })
      .select('id, numero_toma, fecha, distancia_km, tiempo_segundos, devolucion, origen, observacion_original_id')
      .single()

    if (insertError) {
      if (String(insertError.code) === '23505') {
        const { data: existing } = await admin
          .from('pr_performance_tomas')
          .select('id, numero_toma, fecha, distancia_km, tiempo_segundos, devolucion, origen, observacion_original_id')
          .eq('alumno_id', profileId)
          .eq('origen', 'strava')
          .eq('observacion_original_id', activityId)
          .maybeSingle()

        return json({
          success: true,
          registered: false,
          status: 'already_registered',
          toma: existing,
        })
      }
      throw insertError
    }

    return json({
      success: true,
      registered: true,
      status: 'registered',
      toma: inserted,
      match: {
        activity_name: activity.nombre,
        strava_activity_id: activity.strava_activity_id,
        distance_km: distanceKm,
      },
    })
  } catch (error) {
    console.error('pr-toma-strava:', error)
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo procesar la toma.',
      },
      500
    )
  }
})
