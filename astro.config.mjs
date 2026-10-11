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
      noExternal: ["wasm-swarmalators", "three"],
    },
    // The nameplate generator's worker imports ES modules and WASM.
    worker: { format: "es" },
    // wasm-swarmalators (wasm-pack output) finds its .wasm file relative to its
    // own module. Vite's dev pre-bundling moves the module into
    // node_modules/.vite/deps, where the .wasm isn't, so the simulation fails to
    // load in dev. Serve it from its own package instead.
    optimizeDeps: { exclude: ["wasm-swarmalators"] },
  },
});
