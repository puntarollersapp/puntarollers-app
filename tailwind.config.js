/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pr: {
          black:    '#050508',
          dark:     '#09090f',
          navy:     '#0d0d1a',
          card:     '#111120',
          border:   '#1e1e35',
          gold:     '#C9A84C',
          'gold-light': '#E8D48E',
          'gold-dim':   '#8B6B20',
          green:    '#1A6B4A',
          'green-light': '#22a370',
          glass:    'rgba(255,255,255,0.04)',
          'glass-border': 'rgba(201,168,76,0.18)',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #B8960C 0%, #E8D48E 50%, #B8960C 100%)',
        'green-gradient': 'linear-gradient(135deg, #0d3d28 0%, #1A6B4A 100%)',
        'dark-gradient':  'radial-gradient(ellipse at top, #0d0d24 0%, #050508 60%)',
        'hero-gradient':  'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 70%)',
        'card-gradient':  'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'gold':       '0 0 30px rgba(201,168,76,0.2), 0 0 60px rgba(201,168,76,0.08)',
        'gold-sm':    '0 0 12px rgba(201,168,76,0.25)',
        'card':       '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.8), 0 0 20px rgba(201,168,76,0.1)',
        'inner-gold': 'inset 0 1px 0 rgba(201,168,76,0.3)',
      },
      animation: {
        'fade-in':       'fadeIn 0.6s ease forwards',
        'fade-up':       'fadeUp 0.7s ease forwards',
        'glow-pulse':    'glowPulse 3s ease-in-out infinite',
        'shimmer':       'shimmer 2.5s linear infinite',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'badge-pop':     'badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.4))' }, '50%': { filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.8))' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        badgePop:  { from: { opacity: 0, transform: 'scale(0.5)' }, to: { opacity: 1, transform: 'scale(1)' } },
      }
    }
  },
  plugins: []
}
