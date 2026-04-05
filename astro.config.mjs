import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        external: [/^next/],
      },
    },
  },
});
