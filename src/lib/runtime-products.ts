// src/lib/runtime-products.ts
// Lectura de productos desde Supabase en el browser del visitante.
// Espejo de `src/lib/supabase-products.ts` (que es build-time) pero usando
// el cliente público `supabasePublic` (sin auth persistida).
//
// Lo usan los `<script>` de los componentes públicos (Catalog, CustomOrderForm)
// para hidratar el catálogo con la versión más reciente sin esperar un deploy.

import { supabasePublic } from './supabase-public';
import type { Product, Category, Shape } from './catalog';

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

/** Lista todos los productos ordenados por fecha de creación (runtime). */
export async function fetchProductsBrowser(): Promise<Product[]> {
  const { data, error } = await supabasePublic
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`[products] fetch (browser): ${error.message}`);
  }

  return (data ?? []).map(rowToProduct);
}
