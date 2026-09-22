// src/lib/runtime-products.ts
// Lectura de productos desde Supabase en el browser del visitante.
// Espejo de `src/lib/supabase-products.ts` (que es build-time) pero usando
// el cliente público `supabasePublic` (sin auth persistida).
//
// Lo usan los `<script>` de los componentes públicos (Catalog, CustomOrderForm)
// para hidratar el catálogo con la versión más reciente sin esperar un deploy.
//
// `image` se trae porque ahora se guarda como URL pública de Supabase Storage
// (~50 bytes por producto), no como data URL. Antes se guardaba inline base64
// (~500 KB por producto) y eso inflaba la respuesta a 1-1.5 MB por catálogo,
// demorando 60+ segundos en conexiones lentas. Ver CLAUDE.md §10.5.

import { supabasePublic } from './supabase-public';
import type { Product, Category, Shape } from './catalog';

declare global {
  interface Window {
    /** Promesa del fetch raw a /rest/v1/products disparado por Layout.astro en <head>. */
    __avileaProductsPreload?: Promise<unknown> | null;
  }
}

/** Forma de fila en la tabla `products` (snake_case como viene de Postgres). */
type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number | string;
  image: string | null;
  shape: string | null;
  color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    price: Number(row.price),
    image: row.image,
    shape: (row.shape ?? undefined) as Shape | undefined,
    color: row.color ?? undefined,
  };
}

/** Lista todos los productos ordenados por fecha de creación (runtime).
 *
 * Si Layout.astro disparó un preload en `<head>` (raw fetch a /rest/v1/products),
 * la promesa vive en `window.__avileaProductsPreload`. La reusamos para ahorrarnos
 * la carga del bundle de supabase-js en el camino crítico del catálogo.
 * Si falla (red, CORS, etc.) limpiamos el preload y caemos al cliente supabase-js.
 */
export async function fetchProductsBrowser(): Promise<Product[]> {
  // 1) Intentar reutilizar el preload del <head>.
  if (typeof window !== 'undefined') {
    const preloaded = window.__avileaProductsPreload;
    if (preloaded) {
      try {
        const data = (await preloaded) as ProductRow[] | null;
        return (Array.isArray(data) ? data : []).map(rowToProduct);
      } catch {
        window.__avileaProductsPreload = null;
        // seguimos al fallback de abajo
      }
    }
  }

  // 2) Fallback: query completa con el cliente supabase-js.
  const { data, error } = await supabasePublic
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`[products] fetch (browser): ${error.message}`);
  }

  return (data ?? []).map(rowToProduct);
}
