/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["facon", "system-ui", "sans-serif"],
        body: ["'Avenir Next'", "'Segoe UI Variable Text'", "'Segoe UI'", "sans-serif"],
      },
      colors: {
        base: "var(--gams-bg)",
        panel: "var(--gams-panel)",
        panelBorder: "var(--gams-panel-border)",
        textPrimary: "var(--gams-tx-1)",
        textSecondary: "var(--gams-tx-2)",
        accent: "var(--gams-accent)",
      },
      boxShadow: {
        glass: "0 22px 54px rgba(18, 33, 62, 0.18)",
        soft: "0 12px 32px rgba(25, 49, 92, 0.12)",
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(circle at 12% 6%, rgba(92, 156, 255, 0.22), transparent 34%), radial-gradient(circle at 85% 12%, rgba(125, 235, 206, 0.2), transparent 33%), linear-gradient(145deg, var(--gams-bg) 0%, var(--gams-bg-2) 54%, #eaf2ff 100%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        drift: {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "100%": { transform: "translate3d(22px,-18px,0) scale(1.08)" },
        },
      },
      animation: {
        floaty: "floaty 10s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
