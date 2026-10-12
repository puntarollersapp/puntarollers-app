/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pr: {
          black:   'var(--pr-bg)',
          dark:    'var(--pr-surface)',
          navy:    'var(--pr-elevated)',
          card:    'var(--pr-surface)',
          border:  'var(--pr-line)',
          text:    'var(--pr-text)',
          muted:   'var(--pr-muted)',
          lime:    'var(--pr-lime)',
          pink:    'var(--pr-pink)',
          cyan:    'var(--pr-cyan)',
          violet:  'var(--pr-violet)',
          ice:     'var(--pr-ice)',
          gold:    'var(--pr-lime)', // legacy alias; migrate callers incrementally
          'gold-light': 'var(--pr-gold-soft)',
          'gold-dim':   'var(--pr-gold-bg)',
          green:   '#1A6B4A',
          'green-light': '#22a370',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':   'fadeIn 0.6s ease forwards',
        'fade-up':   'fadeUp 0.7s ease forwards',
        'slide-up':  'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'badge-pop': 'badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        badgePop: { from: { opacity: 0, transform: 'scale(0.5)' }, to: { opacity: 1, transform: 'scale(1)' } },
      }
    }
  },
  plugins: []
}
