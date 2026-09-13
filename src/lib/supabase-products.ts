// src/lib/supabase-products.ts
// CRUD de productos contra Supabase. Server-side only.
//
// - `fetchProducts` usa el cliente anon (lectura pública, RLS permite).
// - `createProductServer` / `deleteProductServer` usan el cliente admin
//   (service role, bypasea RLS). Estas funciones SOLO se llaman desde
//   endpoints /api/admin/** que ya validaron la sesión del usuario.

import { supabaseAnon, supabaseAdmin } from '../db/supabase';
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

/** Inserta un producto nuevo. Devuelve el producto creado con su id.
 *
 * Si `input.id` viene (y es válido), se usa tal cual; si no, se autogenera.
 * El endpoint decide cuándo enviarlo (para armaduras sí, para
 * pregraduados/accesorios/gastronomía no). El server confía en el caller
 * para validar formato y categoría antes de llegar acá.
 */
export async function createProductServer(
  input: Omit<Product, 'id'> & { id?: string }
): Promise<Product> {
  const id = input.id?.trim() || newProductId();

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      id,
      name: input.name,
      category: input.category,
      price: input.price,
      image: input.image,
      shape: input.shape ?? null,
      color: input.color ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[products] create: ${error.message}`);
  }

  return rowToProduct(data as ProductRow);
}

/** Borra un producto por id. */
export async function deleteProductServer(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`[products] delete: ${error.message}`);
  }
}

/** Genera un id estilo `p<timestamp-base36>` (consistente con la fase 1). */
function newProductId(): string {
  return 'p' + Date.now().toString(36);
}