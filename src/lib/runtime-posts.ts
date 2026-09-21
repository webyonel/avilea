// src/lib/runtime-posts.ts
// Lectura de posts del blog desde Supabase en el browser del visitante.
// Espejo de `src/lib/supabase-posts.ts` (build-time) pero usando el cliente
// público `supabasePublic` y parseando el markdown del cuerpo en runtime con
// `marked` (el frontmatter ya no se encarga de esto).
//
// Lo usa el `<script>` de `src/pages/sobre-nosotros.astro` para hidratar
// la grilla del blog con los posts publicados al momento de cargar la página.

import { marked } from 'marked';
import { supabasePublic } from './supabase-public';
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

/**
 * Posts publicados para el sitio público. La RLS `posts_public_read` filtra
 * `is_published = true`, así que no hace falta pasar el eq() explícito, pero
 * lo dejamos por defensa en profundidad (si la policy cambiara en el futuro).
 */
export async function fetchPostsBrowser(): Promise<Post[]> {
  const { data, error } = await supabasePublic
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    throw new Error(`[posts] fetch (browser): ${error.message}`);
  }

  return (data ?? []).map(rowToPost);
}

/**
 * Posts + contenido markdown ya parseado a HTML.
 * Es la forma que consume `renderPostCard()` en `src/lib/render-cards.ts`.
 * Sanitización: hoy el contenido solo lo escribe el seed SQL o el panel
 * admin. Cuando se habilite input de usuarios externos, envolver la salida
 * con DOMPurify antes del innerHTML.
 */
export async function fetchPostsWithHtmlBrowser(): Promise<
  Array<Post & { contentHtml: string }>
> {
  const posts = await fetchPostsBrowser();
  return posts.map((p) => ({
    ...p,
    contentHtml: marked.parse(p.content) as string,
  }));
}
