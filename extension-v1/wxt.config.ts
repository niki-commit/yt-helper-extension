import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "VideoNotes",
    description: "Distraction-free YouTube learning with timestamped notes",
    permissions: ["storage", "tabs"],
    host_permissions: ["https://*.supabase.co/*", "http://localhost:3000/*"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  }),
});
