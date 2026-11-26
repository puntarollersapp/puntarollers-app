// Private social media must never be exposed through an anonymous image proxy.
export default function handler(req,res){res.setHeader('Cache-Control','private, no-store, max-age=0');return res.status(410).end('Private media requires authentication')}
