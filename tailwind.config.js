/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Ferrari DESIGN tokens (extracted spec) ─────────────────────────
        primary: {
          DEFAULT: '#da291c', // Rosso Corsa
          active: '#b01e0a',
          hover: '#9d2211',
        },
        ink: '#ffffff',
        body: '#969696',
        'body-strong': '#ffffff',
        'body-on-light': '#181818',
        muted: '#666666',
        'muted-soft': '#8f8f8f',
        hairline: '#303030',
        'hairline-on-light': '#d2d2d2',
        'hairline-soft': '#ebebeb',
        canvas: '#181818',
        'canvas-elevated': '#303030',
        'canvas-light': '#ffffff',
        'surface-card': '#303030',
        'surface-soft-light': '#f7f7f7',
        'surface-strong-light': '#ebebeb',
      },
      fontFamily: {
        sans: ['FerrariSans', '"Inter Variable"', 'Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      // 8px token ladder
      spacing: {
        xxxs: '4px',
        xxs: '8px',
        xs: '16px',
        sm: '24px',
        md: '32px',
        lg: '48px',
        xl: '64px',
        xxl: '96px',
        super: '128px',
      },
      fontSize: {
        'display-mega': ['80px', { lineHeight: '1.05', letterSpacing: '-1.6px', fontWeight: '500' }],
        'display-xl': ['56px', { lineHeight: '1.1', letterSpacing: '-1.12px', fontWeight: '500' }],
        'display-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.36px', fontWeight: '500' }],
        'display-md': ['26px', { lineHeight: '1.5', letterSpacing: '0.195px', fontWeight: '500' }],
        'title-md': ['18px', { lineHeight: '1.2', fontWeight: '700' }],
        'title-sm': ['16px', { lineHeight: '1.4', letterSpacing: '0.08px', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-up': ['11px', { lineHeight: '1.4', letterSpacing: '1.1px', fontWeight: '600' }],
        button: ['14px', { lineHeight: '1', letterSpacing: '1.4px', fontWeight: '700' }],
        'nav-link': ['13px', { lineHeight: '1.4', letterSpacing: '0.65px', fontWeight: '600' }],
        'number-display': ['80px', { lineHeight: '1', letterSpacing: '-1.6px', fontWeight: '700' }],
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      transitionTimingFunction: {
        ferrari: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scroll-cue': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 900ms cubic-bezier(0.22,0.61,0.36,1) both',
        'scroll-cue': 'scroll-cue 2.2s cubic-bezier(0.65,0,0.35,1) infinite',
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
}
