import { isRollerweenActive } from '../lib/rollerween'

export const ROLLERWEEN_BADGE = '/rollerween-pumpkin-transparent-20261002-r3.png?v=transparent-r3'

export default function RollerweenBadge({ className = 'h-7 w-7' }) {
  if (!isRollerweenActive()) return null
  return <img src={ROLLERWEEN_BADGE} alt="RollerWeen" width="1458" height="1438"
    className={`pointer-events-none block object-contain ${className}`} />
}
