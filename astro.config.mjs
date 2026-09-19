// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Static export para deploy en GitHub Pages (sin SSR).
// El admin usa Supabase Auth + RLS directamente desde el browser.
//
// `base` = prefijo donde se sirve el sitio. En este repo: /avilea/.
// Si se deploya en otro repo de GitHub Pages (ej. fork a
// `webyonel.github.io/optica`), hay que cambiarlo acá. Se puede
// overridear con env BASE_PATH para no tocar el archivo.
//
// `site` = URL absoluta del deploy. Se usa para canonical, Open Graph
// y para que el sitemap emita URLs absolutas. Por defecto asume el
// GitHub Pages del repo. Overridear con env SITE_URL si hay dominio
// propio (ej. `https://avilea.cu`).
const base = (process.env.BASE_PATH || '/avilea').replace(/\/$/, '');
const site = process.env.SITE_URL || 'https://webyonel.github.io/avilea';
export default defineConfig({
  output: 'static',
  base,
  site,
  integrations: [
    sitemap({
      // No incluir /admin ni /admin/login en el sitemap.
      filter: (page) =>
        !/\/admin(\/|$)/.test(page) &&
        !/\/admin\/login/.test(page),
    }),
  ],
});