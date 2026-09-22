// src/lib/products-runtime-cache.ts
// Cache compartido para el catálogo en runtime. Tanto el `<script>` del
// formulario como el del probador virtual (dentro de CustomOrderForm.astro)
// necesitan los productos de Supabase; este módulo expone una promesa única
// para que un solo fetch sirva a ambos.
//
// Si el fetch falla, reseteamos la promesa para permitir reintento (ej. el
// usuario hace click en "Reintentar" en el bloque de error).
//
// Cuando la promesa resuelve, marcamos window.__avileaProductsLoaded = true y
// disparamos el evento `avilea:catalog-ready` con los productos. Eso le
// permite a otros scripts (típicamente el preload de MediaPipe) saber cuándo
// es seguro empezar a gastar ancho de banda sin competir con el catálogo.
//
// Astro bundlea cada `<script>` de un componente como un módulo ES
// independiente, así que este módulo se importa desde cada script y la
// promesa queda compartida vía module-singleton (no vía `window`).

import { fetchProductsBrowser } from './runtime-products';
import type { Product } from './catalog';

declare global {
  interface Window {
    /** true cuando el catálogo ya terminó de cargar (éxito). */
    __avileaProductsLoaded?: boolean;
  }
  interface WindowEventMap {
    /** Se dispara cuando el catálogo resolvió con éxito. detail.products trae el array. */
    'avilea:catalog-ready': CustomEvent<{ products: Product[] }>;
  }
}

let pending: Promise<Product[]> | null = null;

export function sharedFetchProducts(): Promise<Product[]> {
  if (!pending) {
    pending = fetchProductsBrowser()
      .then((products) => {
        window.__avileaProductsLoaded = true;
        window.dispatchEvent(
          new CustomEvent('avilea:catalog-ready', { detail: { products } }),
        );
        return products;
      })
      .catch((err) => {
        pending = null; // reset on error para permitir reintento
        throw err;
      });
  }
  return pending;
}
