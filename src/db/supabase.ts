// src/db/supabase.ts
// Clientes Supabase · Fase 2.
//
// Hay DOS clientes, ambos SSR (corren en el servidor):
//
// - `supabaseAnon`: usa la anon key. Respeta RLS. Usar para lecturas
//   públicas del sitio y como base del server-client de auth
//   (que pasa la sesión del usuario vía cookies).
//
// - `supabaseAdmin`: usa la service_role key. BYPASEA RLS. Úsalo SOLO
//   dentro de endpoints API protegidos (/api/admin/**) para CRUD de
//   productos. NUNCA importes este cliente desde código que pueda llegar
//   al browser (componentes con `client:*`, `<script>` dentro de .astro,
//   o rutas sin auth check).
//
// Las variables se leen con `import.meta.env.*` (Astro/Vite las expone
// en SSR). Ver .env.example para los nombres exactos.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[supabase] Falta la variable de entorno ${name}. ` +
      `Configurala en .env (ver .env.example).`
    );
  }
  return value;
}

/** Cliente con anon key. Respeta RLS. Para lecturas públicas y auth server-side. */
export const supabaseAnon: SupabaseClient = createClient(
  assertEnv(url, 'SUPABASE_URL'),
  assertEnv(anonKey, 'SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/** Cliente con service_role. BYPASEA RLS. SOLO server-side, en endpoints admin. */
export const supabaseAdmin: SupabaseClient = createClient(
  assertEnv(url, 'SUPABASE_URL'),
  assertEnv(serviceKey, 'SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);