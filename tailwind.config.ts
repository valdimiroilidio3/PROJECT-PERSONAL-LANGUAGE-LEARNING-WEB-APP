import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sun: '#FFE500',
        'sun-deep': '#E8CE00',
        'sun-soft': '#FFF9D6',
        cream: '#F7F5EF',
        ink: '#20201D',
        muted: '#77766F',
        line: '#E9E6DD',
        success: '#3FA66B',
        'success-soft': '#E8F5EC',
        danger: '#E46B5A',
        'danger-soft': '#FDECE8',
        sky: '#DCEBF7',
        lilac: '#ECE6F7',
      },
      boxShadow: {
        card: '0 2px 0 0 rgba(32,32,29,0.04), 0 12px 30px -18px rgba(32,32,29,0.3)',
        lift: '0 8px 0 0 #20201D',
        soft: '0 8px 24px -12px rgba(32,32,29,0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
