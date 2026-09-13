// src/pages/api/admin/posts/index.ts
// GET  /api/admin/posts        → lista TODOS los posts (incluye drafts)
// POST /api/admin/posts        → crea un post nuevo
//
// Ambos requieren sesión Supabase válida (Bearer token en Authorization).
// El slug se genera en el servidor desde el título (los posts no tienen
// página propia, así que no necesita ser editable por el admin).

import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/admin-auth';
import {
  createPostServer,
  fetchPostsAdmin,
} from '../../../../lib/supabase-posts';
import { POST_CATEGORIES, type PostCategory } from '../../../../lib/posts';

// Slug: minúsculas, números y guiones. Igual que el patrón de productos.
const SLUG_RE = /^[a-z0-9-]{3,80}$/;

/* Slugify: minúsculas, sin acentos, separadores → guion. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;

  try {
    const posts = await fetchPostsAdmin();
    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return jsonError(msg, 500);
  }
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;
  const { request } = context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('JSON inválido', 400);
  }

  const b = body as Record<string, unknown>;

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const excerpt = typeof b.excerpt === 'string' ? b.excerpt.trim() : '';
  const content = typeof b.content === 'string' ? b.content : '';
  const cover = typeof b.cover === 'string' ? b.cover.trim() : '';
  const category = typeof b.category === 'string' ? b.category : '';

  if (!title || title.length > 120) {
    return jsonError('Título inválido (1-120 caracteres).', 400);
  }
  const slug = slugify(title);
  if (!SLUG_RE.test(slug)) {
    return jsonError(
      'No se pudo generar un slug válido desde el título. Probá con un título más descriptivo (mín. 3 caracteres alfanuméricos).',
      400
    );
  }
  if (!excerpt || excerpt.length > 240) {
    return jsonError('Excerpt inválido (1-240 caracteres).', 400);
  }
  if (!content.trim()) {
    return jsonError('El contenido no puede estar vacío.', 400);
  }
  if (!cover) {
    return jsonError('Cover requerido (URL o data URL).', 400);
  }
  if (!POST_CATEGORIES.includes(category as PostCategory)) {
    return jsonError('Categoría inválida.', 400);
  }

  try {
    const post = await createPostServer({
      slug,
      title,
      excerpt,
      content,
      cover,
      category: category as PostCategory,
      is_published: true,
    });
    return new Response(JSON.stringify({ post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al crear';
    // Slug duplicado → Postgres devuelve 23505.
    if (/duplicate key|already exists/i.test(msg)) {
      return jsonError(
        `Ya existe un post con el slug "${slug}". Cambiá el título para generar uno distinto.`,
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
