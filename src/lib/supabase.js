import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadPublicImage(bucket, file, folder = 'uploads') {
  if (!file) return { url: null, error: 'No se seleccionó archivo' }

  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFolder = String(folder || 'uploads').replace(/[^a-zA-Z0-9-_]/g, '')
  const fileName = `${safeFolder}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return { url: data.publicUrl, error: null }
}
