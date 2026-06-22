/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#184B6B",
        accent: "#B75B4B",
        sidebar: "#10283D",
        page: "#F4F6F8",
        card: "#FFFFFF",
        body: "#1B2733",
        border: "#D9E0E5",
        hover: "#123A53",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 40, 61, 0.10)",
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
