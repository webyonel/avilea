// src/lib/supabase-public.ts
// Cliente Supabase para uso público desde el browser (sitio estático deployado
// en GitHub Pages). Reemplaza al patrón "build-time snapshot" del frontmatter:
// en lugar de fetchar productos/posts en el build y embebir el resultado en
// HTML estático, este cliente se importa desde los `<script>` de los componentes
// y hace el fetch en runtime, igual que el admin.
//
// Las RLS policies `products_public_read` y `posts_public_read` permiten
// lectura con anon key, así que este cliente no necesita sesión.
// Por eso desactivamos persistSession/autoRefreshToken: no queremos
// contaminar localStorage del visitante ni gastar requests de refresh.
//
// Es el hermano público de `src/db/supabase.ts → supabaseAnon` (build-time)
// y de `src/lib/admin-auth.ts → supabaseBrowser` (admin con sesión).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[supabase-public] Falta la variable de entorno ${name}. ` +
        `Configurala en .env (ver .env.example).`,
    );
  }
  return value;
}

export const supabasePublic: SupabaseClient = createClient(
  assertEnv(url, 'PUBLIC_SUPABASE_URL'),
  assertEnv(anonKey, 'PUBLIC_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
