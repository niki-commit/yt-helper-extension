import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  autoIcons: {
    baseIconPath: "assets/icon.svg",
  },
  manifest: {
    name: "VideoNotes: Take Notes, Bookmark, and Learn Distraction-Free on YouTube",
    short_name: "VideoNotes",
    description:
      "Enhance your learning on YouTube with timestamped notes and bookmarks, and stay focused by hiding distractions.",
    action: {
      default_title: "VideoNotes Settings and Dashboard",
    },
    permissions: ["storage", "tabs"],
    // host_permissions: ["https://*.supabase.co/*", "http://localhost:3000/*"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      minify: "terser",
      terserOptions: {
        format: {
          ascii_only: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  }),
});
