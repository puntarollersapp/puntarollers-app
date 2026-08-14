import { supabase } from './supabase'

export const MOMENT_REACTIONS = [
  { key: 'fire', icon: '🔥', label: 'Fuego' },
  { key: 'heart', icon: '❤️', label: 'Me encanta' },
  { key: 'skate', icon: '🛼', label: 'A rodar' },
  { key: 'bolt', icon: '⚡', label: 'Energía' },
  { key: 'clap', icon: '👏', label: 'Aplausos' },
]

export function relativeTime(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'ahora'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  return `hace ${Math.floor(seconds / 3600)} h`
}

export function timeLeft(value) {
  const minutes = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 60000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.ceil(minutes / 60)} h`
}

export async function signMomentMedia(rows) {
  const paths = [...new Set(rows.map((row) => row.storage_path).filter(Boolean))]
  if (!paths.length) return rows
  const { data, error } = await supabase.storage.from('pr-moments').createSignedUrls(paths, 3600)
  if (error) throw error
  const urls = new Map((data || []).map((item) => [item.path, item.signedUrl]))
  return rows.map((row) => ({ ...row, media_url: urls.get(row.storage_path) || '' }))
}

export async function loadActiveMoments() {
  const { data, error } = await supabase
    .from('pr_moments')
    .select('id,profile_id,media_type,caption,storage_path,visibility,created_at,expires_at')
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(150)
  if (error) throw error
  return signMomentMedia(data || [])
}

