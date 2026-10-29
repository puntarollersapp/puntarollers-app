import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' } })
const editable = ['commerce','title','description','redeem','category','valid_until_label','logo_url','phone','social','active','featured','sort_order'] as const
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (!['GET','POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405)
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY'), secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!token) return json({ error: 'Authentication required' }, 401)
  if (!url || !anon || !secret) return json({ error: 'Service unavailable' }, 503)
  const auth = createClient(url, anon, { auth: { persistSession: false } })
  const { data: identity, error: authError } = await auth.auth.getUser(token)
  if (authError || !identity.user) return json({ error: 'Invalid session' }, 401)
  const admin = createClient(url, secret, { auth: { persistSession: false } })
  const { data: profiles, error: profileError } = await admin.from('profiles').select('id,role').eq('auth_user_id',identity.user.id).limit(2)
  if (profileError) return json({ error: 'Profile unavailable' }, 503)
  if (!profiles || profiles.length !== 1 || profiles[0].role !== 'admin') return json({ error: 'Forbidden' }, 403)
  if (req.method === 'GET' && new URL(req.url).searchParams.get('audit') === '1') {
    const [profilesResult, linksResult, catalogResult, requestsResult] = await Promise.all([
      admin.from('profiles').select('id,nombre,apellido,prcard_activa').eq('prcard_activa',true).limit(1000),
      admin.from('prcard_membership_links').select('profile_id,review_status,card_status').limit(1000),
      admin.from('prcard_benefits').select('id,active').limit(1000),
      admin.from('prcard_requests').select('id,status').limit(1000),
    ])
    if (profilesResult.error || linksResult.error || catalogResult.error || requestsResult.error) return json({ error: 'Audit unavailable' }, 503)
    const links = linksResult.data || []
    const verified = new Set(links.filter(l => l.review_status === 'verified' && l.card_status === 'active').map(l => l.profile_id))
    const pending = (profilesResult.data || []).filter(p => !verified.has(p.id)).map(p => ({
      profile_id: p.id, name: [p.nombre,p.apellido].filter(Boolean).join(' ') || 'Sin nombre'
    }))
    return json({ summary: {
      flagged: (profilesResult.data || []).length, verified: verified.size,
      withoutVerifiedLink: pending.length, benefits: (catalogResult.data || []).length,
      activeBenefits: (catalogResult.data || []).filter(b => b.active).length,
      pendingRequests: (requestsResult.data || []).filter(q => q.status === 'pending').length,
    }, pending })
  }
  if (req.method === 'GET') {
    const { data, error } = await admin.from('prcard_benefits').select('id,commerce,title,description,redeem,category,valid_until_label,logo_url,phone,social,active,featured,sort_order').order('sort_order',{ascending:true}).order('id',{ascending:true}).limit(200)
    return error ? json({ error: 'Catalog unavailable' }, 503) : json({ benefits: data || [] })
  }
  if (!req.headers.get('content-type')?.toLowerCase().includes('application/json')) return json({ error: 'JSON required' }, 415)
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid payload' }, 400)
  const id = Number(body.id)
  if (!Number.isSafeInteger(id) || id <= 0) return json({ error: 'Invalid benefit' }, 400)
  const changes: Record<string, string | boolean | number | null> = {}
  for (const field of editable) {
    if (!Object.prototype.hasOwnProperty.call(body,field)) continue
    const value = body[field]
    if (field === 'active' || field === 'featured') {
      if (typeof value !== 'boolean') return json({ error: 'Invalid boolean' }, 422)
      changes[field] = value
    } else if (field === 'sort_order') {
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || Math.abs(value) > 100000) return json({ error: 'Invalid order' }, 422)
      changes[field] = value
    } else {
      if (value !== null && (typeof value !== 'string' || value.length > 2000)) return json({ error: 'Invalid text' }, 422)
      if ((field === 'commerce' || field === 'title') && !String(value || '').trim()) return json({ error: 'Required title' }, 422)
      if ((field === 'logo_url' || field === 'social') && value && !/^https:\/\//i.test(value as string)) return json({ error: 'HTTPS URL required' }, 422)
      changes[field] = value as string | null
    }
  }
  if (!Object.keys(changes).length) return json({ error: 'No changes' }, 422)
  const { data, error } = await admin.from('prcard_benefits').update(changes).eq('id',id).select('id,commerce,title,active,featured,sort_order').maybeSingle()
  if (error) return json({ error: 'Update unavailable' }, 503)
  if (!data) return json({ error: 'Benefit not found' }, 404)
  return json({ benefit: data })
})
