import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkGfm from "remark-gfm";

export default defineConfig({
  site: "https://richardbt.com",
  redirects: {
    "/about": "/",
  },
  markdown: {
    // Warm light theme that sits on the cream paper; background is overridden in CSS.
    shikiConfig: { theme: "rose-pine-dawn" },
  },
  integrations: [
    tailwind(),
    mdx({ remarkPlugins: [remarkGfm] }),
    react(),
    sitemap(),
  ],
  vite: {
    ssr: {
      // These packages ship browser-only builds (wasm-pack output, bundler-only
      // "module" fields, etc.) that Node's native ESM resolver can't load
      // directly. Forcing Vite to bundle them for SSR sidesteps that.
      noExternal: [
        "wasm-swarmalators",
        "@jscad/modeling",
        "@jscad/3mf-serializer",
        "jscad-fiber",
        "jscad-text",
        "fflate",
        "three",
      ],
    },
  },
});
