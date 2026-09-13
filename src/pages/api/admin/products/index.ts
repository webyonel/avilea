// src/pages/api/admin/products/index.ts
// GET  /api/admin/products        → lista todos los productos
// POST /api/admin/products        → crea un producto nuevo
//
// Ambos requieren sesión Supabase válida. El cliente manda el access_token
// en `Authorization: Bearer <token>` y el server lo verifica con
// `requireAuth(request)` contra Supabase (Supabase guarda la sesión en
// localStorage del browser, no en cookies httpOnly, así que el server no
// puede leerla directamente).

import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/admin-auth';
import { createProductServer, fetchProducts } from '../../../../lib/supabase-products';
import { categoryRequiresManualId, type Category, type Shape } from '../../../../lib/catalog';

// ID manual: solo letras minúsculas, números y guiones. 3 a 40 caracteres.
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;

  try {
    const products = await fetchProducts();
    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

const VALID_CATEGORIES: Category[] = [
  'pregraduados', 'armaduras', 'femenino', 'masculino',
  'ninos', 'unisex', 'accesorios', 'gastronomia',
];

const VALID_SHAPES: Shape[] = [
  'round', 'cat', 'rect', 'square', 'rimless',
  'aviator', 'wayfarer',
  'case', 'cord', 'bottle', 'wipes', 'kit',
];

export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;
  const { request } = context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const b = body as {
    name?: unknown;
    category?: unknown;
    price?: unknown;
    image?: unknown;
    shape?: unknown;
    color?: unknown;
    id?: unknown;
  };

  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const category = typeof b.category === 'string' ? b.category : '';
  const price = typeof b.price === 'number' ? b.price : Number(b.price);
  const image = typeof b.image === 'string' ? b.image : null;
  const shape = typeof b.shape === 'string' ? b.shape : undefined;
  const color = typeof b.color === 'string' ? b.color : undefined;
  const rawId = typeof b.id === 'string' ? b.id.trim().toLowerCase() : '';

  if (!name || name.length > 80) {
    return jsonError('Nombre inválido', 400);
  }
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return jsonError('Categoría inválida', 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    return jsonError('Precio inválido', 400);
  }
  if (shape && !VALID_SHAPES.includes(shape as Shape)) {
    return jsonError('Forma (shape) inválida', 400);
  }

  // ID: obligatorio solo para categorías con ID manual (armaduras).
  // Para el resto, si el admin lo manda igual, lo aceptamos solo si
  // matchea el formato (así no rompemos integraciones existentes).
  const cat = category as Category;
  let finalId: string | undefined;
  if (categoryRequiresManualId(cat)) {
    if (!rawId) {
      return jsonError(
        'Esta categoría requiere un ID. Ingresá un identificador (ej. aria-001).',
        400
      );
    }
    if (!SLUG_RE.test(rawId)) {
      return jsonError(
        'ID inválido. Usá solo letras minúsculas, números y guiones (3 a 40 caracteres).',
        400
      );
    }
    finalId = rawId;
  } else if (rawId && SLUG_RE.test(rawId)) {
    finalId = rawId;
  }

  try {
    const product = await createProductServer({
      ...(finalId ? { id: finalId } : {}),
      name,
      category: cat,
      price,
      image,
      shape: shape as Shape | undefined,
      color,
    });
    return new Response(JSON.stringify({ product }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Colisión de PK (id duplicado) — Postgres devuelve 23505.
    const msg = e instanceof Error ? e.message : 'Error al crear';
    if (/duplicate key|already exists/i.test(msg)) {
      return jsonError(
        `Ya existe un producto con el ID "${finalId ?? rawId}". Elegí otro.`,
        409
      );
    }
    return jsonError(msg, 500);
  }
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}