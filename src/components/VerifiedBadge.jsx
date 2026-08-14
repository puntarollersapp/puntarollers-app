export default function VerifiedBadge({ size = 20, className = '', label = 'Perfil verificado por Punta Rollers' }) {
  return (
    <span role="img" aria-label={label} title={label} className={`inline-grid shrink-0 place-items-center align-middle drop-shadow-[0_4px_10px_rgba(14,165,233,.28)] ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-full w-full">
        <path fill="#159CE4" d="M16 1.8l3.5 3 4.6-.5 1.7 4.3 4.1 2.2-1.1 4.5 2.2 4.1-3.5 3.1-.5 4.6-4.6.5-3.1 3.5-4.1-2.2-4.5 1.1-2.2-4.1-4.3-1.7.5-4.6-3-3.5 3-3.5-.5-4.6 4.3-1.7 2.2-4.1 4.5 1.1L16 1.8z" />
        <path fill="none" stroke="#07131d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.1" d="M10.2 16.4l3.7 3.7 7.9-8.2" />
      </svg>
    </span>
  )
}
