import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey =
    env.GROQ_API_KEY ||
    env.VITE_GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    "";

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ["VITE_", "GROQ_"],
    define: {
      "import.meta.env.GROQ_API_KEY": JSON.stringify(apiKey),
      "import.meta.env.VITE_GROQ_API_KEY": JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve("."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("jspdf") || id.includes("html2canvas")) {
                return "vendor-pdf";
              }
              if (id.includes("recharts")) {
                return "vendor-charts";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("marked")) {
                return "vendor-markdown";
              }
              if (id.includes("papaparse")) {
                return "vendor-parser";
              }
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
            }
          },
        },
      },
    },
  };
});
