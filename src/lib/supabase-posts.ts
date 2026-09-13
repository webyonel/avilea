// src/lib/supabase-posts.ts
// Capa de acceso a la tabla `public.posts`. Server-side only.
//
// - `fetchPosts` (anon) → LECTURA PÚBLICA. Filtra `is_published = true`.
//   Lo usa el sitio público (`/sobre-nosotros`).
// - `fetchPostsAdmin` (admin) → LECTURA ADMIN. Ve TODOS los posts, incluso
//   drafts. Lo usa el panel /admin.
// - `createPostServer` / `deletePostServer` (admin) → ESCRITURA. Bypasean
//   RLS. SOLO se llaman desde endpoints /api/admin/** que ya validaron
//   la sesión del admin.

import { supabaseAnon, supabaseAdmin } from '../db/supabase';
import type { Post, PostCategory } from './posts';

/** Forma de fila en la tabla `posts` (snake_case como viene de Postgres). */
type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: string;
  author: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    cover: row.cover,
    category: row.category as PostCategory,
    author: row.author ?? undefined,
    date: row.published_at.slice(0, 10), // ISO yyyy-mm-dd para formatPostDate.
    is_published: row.is_published,
    published_at: row.published_at,
  };
}

/* ============================================================
   Lecturas
   ============================================================ */

/** Posts publicados para el sitio público. RLS filtra is_published = true. */
export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabaseAnon
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    throw new Error(`[posts] fetch: ${error.message}`);
  }

  return (data ?? []).map(rowToPost);
}

/** Todos los posts (publicados y drafts) para el panel admin. */
export async function fetchPostsAdmin(): Promise<Post[]> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    throw new Error(`[posts] admin fetch: ${error.message}`);
  }

  return (data ?? []).map(rowToPost);
}

/* ============================================================
   Escritura (admin)
   ============================================================ */

export type CreatePostInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: PostCategory;
  author?: string;
  is_published?: boolean;
};

/** Inserta un post nuevo. Devuelve el post creado. */
export async function createPostServer(input: CreatePostInput): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      cover: input.cover,
      category: input.category,
      author: input.author ?? null,
      is_published: input.is_published ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[posts] create: ${error.message}`);
  }

  return rowToPost(data as PostRow);
}

/** Borra un post por id (uuid de Postgres). */
export async function deletePostServer(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`[posts] delete: ${error.message}`);
  }
}
