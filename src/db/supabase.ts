// src/db/supabase.ts
// Cliente Supabase para Fase 2 con deploy ESTÁTICO (GitHub Pages).
//
// Antes había dos clientes (anon + service_role). En estático no podemos
// usar service_role desde el browser (sería público), así que se ELIMINA.
// Toda la lógica de admin corre desde el cliente con `supabaseBrowser`
// (definido en `src/lib/admin-auth.ts`) y depende de las RLS policies
// que filtran por `auth.role() = 'authenticated'`.
//
// - `supabaseAnon`: anon key. Se usa en build-time (frontmatter de páginas)
//   para hacer un snapshot del contenido al momento del deploy. Para data
//   fresca en runtime, ver `supabaseBrowser` en `admin-auth.ts`.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[supabase] Falta la variable de entorno ${name}. ` +
        `Configurala en .env (ver .env.example).`
    );
  }
  return value;
}

/** Cliente con anon key. Respeta RLS. Se usa SOLO en build-time (frontmatter). */
export const supabaseAnon: SupabaseClient = createClient(
  assertEnv(url, 'PUBLIC_SUPABASE_URL'),
  assertEnv(anonKey, 'PUBLIC_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);