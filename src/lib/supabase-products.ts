// src/lib/supabase-products.ts
// Lectura de productos desde Supabase. Se usa SOLO en build-time
// (frontmatter de páginas) con el cliente anon → snapshot al deploy.
//
// En runtime, las mutaciones (crear/borrar) las hace el admin desde el
// browser vía `supabaseBrowser` (en `src/lib/admin-auth.ts`) directamente,
// aprovechando las RLS policies que filtran por `auth.role() = 'authenticated'`.

import { supabaseAnon } from '../db/supabase';
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

/** Lista todos los productos ordenados por fecha de creación. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`[products] fetch: ${error.message}`);
  }

  return (data ?? []).map(rowToProduct);
}