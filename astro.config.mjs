// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://saurinn.github.io',
  trailingSlash: 'ignore',
  markdown: {
    // Dual themes so highlighted code follows the class-based toggle instead of
    // the OS preference. See the --shiki-dark rules in global.css.
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
