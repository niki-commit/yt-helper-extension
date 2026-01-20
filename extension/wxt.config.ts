import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "VideoNotes",
    description: "Distraction-free YouTube learning with timestamped notes",
    permissions: ["storage", "identity", "tabs"],
    host_permissions: [
      "https://*.supabase.co/*",
      "http://localhost/*",
      "http://127.0.0.1/*",
    ],
  },
  vite: () => ({
    build: {
      sourcemap: false,
      minify: "terser",
      target: "esnext",
      terserOptions: {
        format: {
          comments: false,
          ascii_only: true,
        },
      },
    },
  }),
});
