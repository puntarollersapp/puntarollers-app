import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' } })
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405)
  if (req.method === 'POST' && !req.headers.get('content-type')?.toLowerCase().includes('application/json')) return json({ error: 'JSON required' }, 415)
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return json({ error: 'Authentication required' }, 401)
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !secret) return json({ error: 'Service unavailable' }, 503)
  const auth = createClient(url, anon, { auth: { persistSession: false } })
  const { data: identity, error: authError } = await auth.auth.getUser(token)
  if (authError || !identity.user) return json({ error: 'Invalid session' }, 401)
  const admin = createClient(url, secret, { auth: { persistSession: false } })
  const { data: profiles, error: profileError } = await admin.from('profiles')
    .select('id,nombre,apellido,documento,email,fecha_nacimiento,role,prcard_activa')
    .eq('auth_user_id', identity.user.id).limit(2)
  if (profileError) return json({ error: 'Profile unavailable' }, 503)
  if (!profiles || profiles.length !== 1) return json({ error: 'Profile not found' }, 403)
  const profile = profiles[0]
  const isAdmin = profile.role === 'admin'
  if (req.method === 'GET') {
    if (new URL(req.url).searchParams.get('admin') === '1') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const { data, error } = await admin.from('prcard_requests').select('id,profile_id,first_name,last_name,email,status,requested_at,reviewed_at').order('requested_at', { ascending: false }).limit(100)
      return error ? json({ error: 'Requests unavailable' }, 503) : json({ requests: data || [] })
    }
    const { data, error } = await admin.from('prcard_requests').select('id,status,requested_at').eq('profile_id', profile.id).order('requested_at', { ascending: false }).limit(10)
    return error ? json({ error: 'Requests unavailable' }, 503) : json({ requests: data || [] })
  }
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (body.action === 'review') {
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)
    const id = Number(body.requestId)
    const status = body.status
    if (!Number.isSafeInteger(id) || id <= 0 || !['approved', 'rejected'].includes(String(status))) return json({ error: 'Invalid review' }, 400)
    const { data, error } = await admin.from('prcard_requests').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: profile.id }).eq('id', id).eq('status', 'pending').select('id,status').maybeSingle()
    if (error) return json({ error: 'Review unavailable' }, 503)
    if (!data) return json({ error: 'Already reviewed or not found' }, 409)
    // Approval records a decision only. It NEVER automatically enables a membership.
    return json({ request: data })
  }
  if (body.action !== 'request') return json({ error: 'Invalid action' }, 400)
  if (profile.prcard_activa) return json({ error: 'Already a member' }, 409)
  const { data: links, error: linksError } = await admin.from('prcard_membership_links').select('id,review_status,card_status').eq('profile_id', profile.id).limit(5)
  if (linksError) return json({ error: 'Membership status unavailable' }, 503)
  if (links?.some(link => link.review_status === 'verified' && link.card_status === 'active')) return json({ error: 'Already a verified member' }, 409)
  const firstName = String(profile.nombre || '').trim()
  const lastName = String(profile.apellido || '').trim()
  const document = String(profile.documento || '').trim()
  const email = String(profile.email || '').trim()
  const birthdate = String(profile.fecha_nacimiento || '').trim()
  if (!firstName || !lastName || !document || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return json({ error: 'Complete your profile before requesting a card', code: 'INCOMPLETE_PROFILE' }, 422)
  const { data: existing, error: existingError } = await admin.from('prcard_requests').select('id').eq('profile_id', profile.id).eq('status', 'pending').limit(1)
  if (existingError) return json({ error: 'Requests unavailable' }, 503)
  if (existing?.length) return json({ error: 'Request already pending', code: 'ALREADY_PENDING' }, 409)
  const { data, error } = await admin.from('prcard_requests').insert({ profile_id: profile.id, first_name: firstName, last_name: lastName, document, email, birthdate }).select('id,status,requested_at').single()
  if (error) return error.code === '23505' ? json({ error: 'Request already pending', code: 'ALREADY_PENDING' }, 409) : json({ error: 'Request could not be saved' }, 503)
  return json({ request: data }, 201)
})
