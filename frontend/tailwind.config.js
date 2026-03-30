/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        accent: "#D32F2F",
        sidebar: "#0F172A",
        page: "#F8FAFC",
        card: "#FFFFFF",
        body: "#1F2937",
        border: "#E5E7EB",
        hover: "#2563EB",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
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
