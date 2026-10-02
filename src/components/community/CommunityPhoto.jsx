import { useState } from 'react'

export function thumbnailUrl(original) {
  try {
    const url = new URL(original)
    const prefix = '/storage/v1/object/public/'
    if (url.hostname !== 'ycgxnzeaihuwlwfwalom.supabase.co' || !url.pathname.startsWith(prefix)) return original
    const path = url.pathname.slice(prefix.length)
    if (!/^(community-albums|community-media)\//.test(path)) return original
    return `/api/community-thumbnail?path=${encodeURIComponent(path)}&v=1`
  } catch { return original }
}

export default function CommunityPhoto({ src, eager = false }) {
  const [fallback, setFallback] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div className="relative h-full w-full bg-violet-400/10">
    {!loaded && <span role="status" className="absolute inset-0 grid place-items-center text-[10px] text-violet-200/70">{failed ? 'No se pudo cargar la foto' : 'Cargando foto…'}</span>}
    <img src={fallback ? src : thumbnailUrl(src)} alt="Foto del álbum" loading={eager ? 'eager' : 'lazy'} decoding="async"
      className={`h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)} onError={() => { if (!fallback) setFallback(true); else setFailed(true) }} />
  </div>
}
