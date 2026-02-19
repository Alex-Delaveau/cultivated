/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a78bfa',
          hover:   '#8c68f7',
          muted:   'rgba(167,139,250,0.15)',
        },
        surface: {
          DEFAULT: '#42385a',
          dark:    '#2d2440',
          card:    '#111827',
          input:   '#0f172a',
        },
        success: '#22c55e',
        danger:  '#ef4444',
        warning: '#fbbf24',
        streak:  '#f97316',
      },
      borderRadius: {
        card: '0.75rem',
        btn:  '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
        glow:    '0 0 20px rgba(167,139,250,0.3)',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(160deg, rgba(40,35,122,1) 0%, rgba(81,9,121,1) 100%)',
      },
    },
  },
  plugins: [],
}

