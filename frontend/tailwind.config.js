/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#171717',
        forest: '#06110C',
        surface: '#202522',
        subtle: '#102017',
        crimson: {
          DEFAULT: '#A31C1B',
          hover: '#831615',
        },
        ink: {
          primary: '#F2F2EF',
          secondary: '#858B86',
          muted: '#6F7670',
        },
        border: {
          DEFAULT: '#26352D',
          strong: '#354A3F',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
