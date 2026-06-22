/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#A24E5A",
        accent: "#C46C72",
        sidebar: "#542D36",
        page: "#FFF7F3",
        card: "#FFFEFC",
        body: "#3E2B2E",
        border: "#EBD8D2",
        hover: "#853943",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(162, 78, 90, 0.12)",
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
