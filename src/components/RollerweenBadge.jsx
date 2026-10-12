export const PROFILE_BADGE = '/profile-badge.png'

export default function RollerweenBadge({ className = 'h-7 w-7' }) {
  return <img src={PROFILE_BADGE} alt="Punta Rollers" width="64" height="64"
    className={`pointer-events-none block object-contain ${className}`} />
}
