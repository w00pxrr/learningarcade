/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["system-ui", "sans-serif"],
        body: ["system-ui", "sans-serif"],
      },
      colors: {
        base: "#000000",
        panel: "#121212",
        panelBorder: "#1a1a1a",
        textPrimary: "#ffffff",
        textSecondary: "#cccccc",
        accent: "#2563eb",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.3)",
        soft: "0 4px 12px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
