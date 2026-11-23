/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        doodl: {
          bg: '#f7f5f0',
          surface: '#ffffff',
          ink: '#1f2330',
          soft: '#707687',
          line: '#e9e8e3',
          orange: '#fd7259',
          orangeDark: '#dc5b46',
          mint: '#bdf3d5',
          purple: '#e8ddff',
          yellow: '#fff0b6',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        head: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'doodl': '22px',
        'card': '18px',
      },
      boxShadow: {
        'doodl': '0 18px 65px rgba(34,32,30,.06)',
        'btn': '0 6px 0 #dc5b46',
        'btn-dark': '0 5px 0 #0f1220',
      }
    },
  },
  plugins: [],
}
