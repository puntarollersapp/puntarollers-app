import { useEffect, useState } from 'react'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function buildPRCheckPayload(profileId) {
  if (!UUID_RE.test(String(profileId || ''))) return null
  return `PRCHECK:2026:${profileId.toLowerCase()}`
}

export default function PRMemberQR({ profileId }) {
  const [copyState, setCopyState] = useState('')
  const payload = buildPRCheckPayload(profileId)
  const shortId = payload ? profileId.slice(0, 8).toUpperCase() : 'PENDIENTE'

  useEffect(() => { setCopyState('') }, [profileId])

  async function copyId() {
    if (!payload) return
    if (!navigator.clipboard?.writeText) {
      setCopyState('No se pudo copiar automáticamente. Mostrá tu ID al profesor.')
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      setCopyState('PR ID completo copiado. Podés compartirlo con tu profesor.')
    } catch {
      setCopyState('No se pudo copiar. Revisá los permisos del navegador.')
    }
  }

  return <div className="relative grid w-full place-items-center">
    <div aria-hidden="true" className="pointer-events-none absolute -inset-5 rounded-[36px] bg-cyan-300/[.06] blur-2xl"/>
    <div className="relative grid min-h-[240px] w-full max-w-[280px] place-items-center rounded-[28px] border border-dashed border-cyan-200/15 bg-[#0a0d10] p-6 text-center shadow-[0_20px_70px_rgba(34,211,238,.08)]">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] border border-cyan-200/15 bg-cyan-200/[.05] text-lg font-black text-cyan-100/55">PR</div>
        <p className="mt-5 text-[9px] font-black tracking-[.16em] text-cyan-100/60">QR ÚNICO EN VALIDACIÓN</p>
        <p className="mx-auto mt-2 max-w-[210px] text-[9px] leading-4 text-white/45">El QR escaneable todavía no está disponible. Mientras tanto, podés copiar tu PR ID completo para que el profesor lo consulte manualmente.</p>
      </div>
    </div>
    <div className="relative mt-3 rounded-full border border-cyan-200/15 bg-cyan-200/[.045] px-3 py-1.5 text-[9px] font-black tracking-[.12em] text-cyan-100/65">ID · {shortId}</div>
    <button type="button" disabled={!payload} onClick={copyId} className="relative mt-3 rounded-[14px] border border-cyan-200/20 bg-cyan-200/[.09] px-5 py-3 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-200/[.15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-35">
      COPIAR PR ID COMPLETO
    </button>
    <p role="status" aria-live="polite" className="relative mt-2 min-h-[18px] max-w-[280px] text-center text-[9px] leading-4 text-white/55">{copyState || (payload ? 'Solo compartilo con el equipo docente.' : 'Tu ID todavía no está disponible.')}</p>
  </div>
}
