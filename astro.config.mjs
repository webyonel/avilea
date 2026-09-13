// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Static export para deploy en GitHub Pages (sin SSR).
// El admin usa Supabase Auth + RLS directamente desde el browser.
export default defineConfig({
  output: 'static',
});