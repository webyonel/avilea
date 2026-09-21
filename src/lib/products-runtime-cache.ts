// src/lib/products-runtime-cache.ts
// Cache compartido para el catálogo en runtime. Tanto el `<script>` del
// formulario como el del probador virtual (dentro de CustomOrderForm.astro)
// necesitan los productos de Supabase; este módulo expone una promesa única
// para que un solo fetch sirva a ambos.
//
// Si el fetch falla, reseteamos la promesa para permitir reintento (ej. el
// usuario hace click en "Reintentar" en el bloque de error).
//
// Astro bundlea cada `<script>` de un componente como un módulo ES
// independiente, así que este módulo se importa desde cada script y la
// promesa queda compartida vía module-singleton (no vía `window`).

import { fetchProductsBrowser } from './runtime-products';
import type { Product } from './catalog';

let pending: Promise<Product[]> | null = null;

export function sharedFetchProducts(): Promise<Product[]> {
  if (!pending) {
    pending = fetchProductsBrowser().catch((err) => {
      pending = null; // reset on error para permitir reintento
      throw err;
    });
  }
  return pending;
}
