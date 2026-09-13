// src/pages/api/admin/products/[id].ts
// DELETE /api/admin/products/:id → elimina un producto por id.
//
// Requiere sesión Supabase válida (Bearer token en Authorization).

import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/admin-auth';
import { deleteProductServer } from '../../../../lib/supabase-products';

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;
  const { params } = context;

  const id = params.id;
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await deleteProductServer(id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Error al eliminar' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};