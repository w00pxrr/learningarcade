import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "10.0.0.15",
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        home: "index.html",
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "react";
            }
            if (id.includes("/@mui/") || id.includes("/@emotion/")) {
              return "mui";
            }
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
