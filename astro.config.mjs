// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Static export para deploy en GitHub Pages (sin SSR).
// El admin usa Supabase Auth + RLS directamente desde el browser.
//
// `base` = prefijo donde se sirve el sitio. En este repo: /avilea/.
// Si se deploya en otro repo de GitHub Pages (ej. fork a
// `webyonel.github.io/optica`), hay que cambiarlo acá. Se puede
// overridear con env BASE_PATH para no tocar el archivo.
const base = (process.env.BASE_PATH || '/avilea').replace(/\/$/, '');
export default defineConfig({
  output: 'static',
  base,
});