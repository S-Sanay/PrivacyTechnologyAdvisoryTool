/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '5px',
        '3xl': '6px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
