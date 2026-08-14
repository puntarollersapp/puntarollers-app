import { useId } from 'react'

export default function SkateMomentMask({ children, className = '', glow = '#8b5cf6' }) {
  const id = `skate-mask-${useId().replace(/:/g, '')}`

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 320 300" className="h-full w-full" role="presentation" aria-hidden="true">
        <defs>
          <clipPath id={id}>
            {/* Outer inline-skate silhouette only: no inner frame/wheel details. */}
            <path d="M80 24c-15 4-24 17-24 34v61c0 22-8 40-22 55-12 13-18 29-18 46 0 21 15 37 37 41 12 2 24 1 37-1 8 22 27 37 51 37 15 0 29-6 39-16 10 10 24 16 39 16 25 0 45-16 52-39 21-4 35-19 35-39 0-25-17-43-43-48l-49-9c-20-4-34-15-43-33l-29-61c-7-15-18-28-32-37-10-7-20-9-30-7Z" />
          </clipPath>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g clipPath={`url(#${id})`}>
          <foreignObject x="0" y="0" width="320" height="300">
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full w-full overflow-hidden">
              {children}
            </div>
          </foreignObject>
        </g>

        <path
          d="M80 24c-15 4-24 17-24 34v61c0 22-8 40-22 55-12 13-18 29-18 46 0 21 15 37 37 41 12 2 24 1 37-1 8 22 27 37 51 37 15 0 29-6 39-16 10 10 24 16 39 16 25 0 45-16 52-39 21-4 35-19 35-39 0-25-17-43-43-48l-49-9c-20-4-34-15-43-33l-29-61c-7-15-18-28-32-37-10-7-20-9-30-7Z"
          fill="none"
          stroke={glow}
          strokeWidth="3"
          opacity=".92"
          filter={`url(#${id}-glow)`}
        />
      </svg>
    </div>
  )
}
