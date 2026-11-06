/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // "Cryo Lab" light theme. One cool neutral ramp, one ink, and two accents
      // taken from the robot itself: the arc-reactor cyan and the suit's hot red.
      colors: {
        ice: {
          DEFAULT: '#E8ECF0', // page
          2: '#DFE4EA',       // recessed
          panel: '#F4F7F9',   // cells / cards
          hi: '#FAFBFC',      // raised
        },
        ink: {
          DEFAULT: '#0D1117',
          2: '#3A4452',       // body copy
          mute: '#66717F',    // labels, meta
        },
        arc: {
          DEFAULT: '#0E8DB5',
          deep: '#0B6E8E',    // small text on light backgrounds
          soft: '#CFEAF3',
        },
        hot: {
          DEFAULT: '#D9412A',
          soft: '#F7DCD6',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        label: '0.08em',
        display: '-0.055em',
      },
    },
  },
  plugins: [],
}
