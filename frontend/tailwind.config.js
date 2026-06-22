/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5576B8",
        accent: "#C96A78",
        sidebar: "#33486F",
        page: "#F5F2FA",
        card: "#FFFDFC",
        body: "#334155",
        border: "#DDD6E8",
        hover: "#405F9C",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(85, 118, 184, 0.12)",
      },
      borderRadius: {
        lg: "0.875rem",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
    },
  },
  plugins: [],
};
