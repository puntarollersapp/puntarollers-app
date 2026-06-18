import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadPublicImage(bucket, file, folder = 'uploads') {
  if (!file) return { url: null, error: 'No se seleccionó archivo' }

  const extension = file.name?.split('.').pop() || 'jpg'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return { url: data.publicUrl, error: null }
}
