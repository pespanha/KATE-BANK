/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#293A5F',
          deep: '#16223C',
          light: '#3D5280',
        },
        gold: {
          DEFAULT: '#F7A312',
          hover: '#DE9F2E',
          light: '#FFC857',
        },
        kate: {
          border: '#D4D7DB',
          bg: '#F8F9FB',
        }
      },
    },
  },
  plugins: [],
};
