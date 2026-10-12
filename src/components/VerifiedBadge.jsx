export default function VerifiedBadge({ size = 20, className = '', label = 'Perfil verificado por Punta Rollers' }) {
  return (
    <span role="img" aria-label={label} title={label} className={`inline-grid shrink-0 place-items-center align-middle ${className}`} style={{ width: size, height: size }}>
      <img src="/profile-verified.png" alt="" aria-hidden="true" className="block h-full w-full object-contain" />
    </span>
  )
}
