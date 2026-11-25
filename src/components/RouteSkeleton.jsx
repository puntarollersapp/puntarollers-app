export default function RouteSkeleton() {
  return (
    <div role="status" aria-label="Cargando" style={{ minHeight: '100vh', background: '#0a0a0f', padding: '20px 16px' }}>
      <div className="pr-skel" style={{ height: 44, width: '46%', borderRadius: 14, marginBottom: 22 }} />
      <div className="pr-skel" style={{ height: 150, borderRadius: 24, marginBottom: 14 }} />
      <div className="pr-skel" style={{ height: 96, borderRadius: 20, marginBottom: 14 }} />
      <div className="pr-skel" style={{ height: 96, borderRadius: 20 }} />
      <style>{`
        .pr-skel{background:rgba(255,255,255,.06);animation:prSkelPulse 1.4s ease-in-out infinite}
        @keyframes prSkelPulse{0%,100%{opacity:.55}50%{opacity:1}}
        @media (prefers-reduced-motion:reduce){.pr-skel{animation:none}}
      `}</style>
    </div>
  )
}
