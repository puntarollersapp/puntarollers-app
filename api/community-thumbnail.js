import sharp from 'sharp'

const ORIGIN = 'https://ycgxnzeaihuwlwfwalom.supabase.co'
const MAX_BYTES = 25 * 1024 * 1024

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const path = typeof req.query.path === 'string' ? req.query.path : ''
  // Only existing public community images; never accept an arbitrary URL.
  if (!/^(community-albums|community-media)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(path)) {
    return res.status(400).end('Invalid image path')
  }
  try {
    const upstream = await fetch(`${ORIGIN}/storage/v1/object/public/${path}`, {
      signal: AbortSignal.timeout(15000), redirect: 'error',
    })
    if (!upstream.ok) return res.status(upstream.status === 404 ? 404 : 502).end()
    if (Number(upstream.headers.get('content-length')) > MAX_BYTES) return res.status(413).end()
    const chunks = []
    let bytes = 0
    for await (const chunk of upstream.body) {
      bytes += chunk.length
      if (bytes > MAX_BYTES) return res.status(413).end()
      chunks.push(chunk)
    }
    const preview = await sharp(Buffer.concat(chunks), { limitInputPixels: 50000000 })
      .rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer()
    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400')
    return res.status(200).send(preview)
  } catch {
    return res.status(502).end('Preview unavailable')
  }
}
