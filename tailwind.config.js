/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: "#00f2ff",
          pink: "#ff00ff",
          green: "#00ff9f",
          yellow: "#fdf500",
        }
      }
    },
  },
  plugins: [],
}
