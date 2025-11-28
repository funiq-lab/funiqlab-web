import { defineConfig } from "astro/config";
import mermaid from 'astro-mermaid';
import rehypeExternalLinks from "rehype-external-links";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./src/i18n/config";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.funiqlab.com",
  markdown: {
    smartypants: true,
    syntaxHighlight: "shiki",
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-macchiato",
      },
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
        },
      ],
    ],
    prefetch: true,
  },
  i18n: {
    locales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx({
      gfm: true,
    }),
    sitemap(),
    mermaid({
      theme: "base",
      autoTheme: true,
    }),
  ],
});