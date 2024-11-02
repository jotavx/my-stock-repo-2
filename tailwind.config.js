/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "selector",
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "big-stone": {
          50: "#f5f7fa",
          100: "#eaeef4",
          200: "#d0dbe7",
          300: "#a6bcd3",
          400: "#7799b9",
          500: "#557ca2",
          600: "#426287",
          700: "#37506d",
          800: "#30455c",
          900: "#2c3c4e",
          950: "#1f2937",
        },
      },
    },
  },
  plugins: [],
};
