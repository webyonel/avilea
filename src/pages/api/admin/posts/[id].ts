// src/pages/api/admin/posts/[id].ts
// DELETE /api/admin/posts/:id → elimina un post por id (uuid).
//
// Requiere sesión Supabase válida (Bearer token en Authorization).

import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/admin-auth';
import { deletePostServer } from '../../../../lib/supabase-posts';

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;
  const { params } = context;

  const id = params.id;
  if (!id || typeof id !== 'string') {
    return jsonError('id requerido', 400);
  }

  try {
    await deletePostServer(id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : 'Error al eliminar',
      500
    );
  }
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
