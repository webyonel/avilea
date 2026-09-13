// src/lib/supabase-posts.ts
// Lectura de posts desde Supabase. Se usa SOLO en build-time
// (frontmatter de /sobre-nosotros) con el cliente anon → snapshot al deploy.
// RLS filtra `is_published = true` para la lectura pública.
//
// En runtime, las mutaciones (crear/borrar) las hace el admin desde el
// browser vía `supabaseBrowser` (en `src/lib/admin-auth.ts`) directamente,
// aprovechando las RLS policies que filtran por `auth.role() = 'authenticated'`.

import { supabaseAnon } from '../db/supabase';
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