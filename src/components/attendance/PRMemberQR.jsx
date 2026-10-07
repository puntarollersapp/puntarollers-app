export function buildPRCheckPayload(profileId){return `PRCHECK:2026:${profileId}`}

export default function PRMemberQR({profileId}){
 const shortId=profileId?.slice?.(0,8)?.toUpperCase?.()||'PENDIENTE'
 return <div className="relative grid place-items-center">
  <div className="absolute -inset-5 rounded-[36px] bg-cyan-300/[.06] blur-2xl"/>
  <div className="relative grid min-h-[240px] w-full max-w-[280px] place-items-center rounded-[28px] border border-dashed border-cyan-200/15 bg-[#0a0d10] p-6 text-center shadow-[0_20px_70px_rgba(34,211,238,.08)]">
   <div>
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] border border-cyan-200/15 bg-cyan-200/[.05] text-lg font-black text-cyan-100/55">PR</div>
    <p className="mt-5 text-[9px] font-black tracking-[.16em] text-cyan-100/60">QR ÚNICO EN VALIDACIÓN</p>
    <p className="mx-auto mt-2 max-w-[210px] text-[8px] leading-4 text-white/25">Tu identidad ya tiene un payload estable. No mostramos un QR hasta tener un generador escaneable validado de punta a punta.</p>
   </div>
  </div>
  <div className="relative mt-3 rounded-full border border-cyan-200/15 bg-cyan-200/[.045] px-3 py-1.5 text-[7px] font-black tracking-[.16em] text-cyan-100/55">ID ÚNICO · {shortId}</div>
 </div>
}
