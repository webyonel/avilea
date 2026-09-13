// src/lib/admin-auth.ts
// Auth admin · Supabase Auth desde el browser (deploy en GitHub Pages).
//
// Con output:'static' no hay server, así que NO hay verificación de
// Bearer tokens ni middleware. Toda la protección se hace via Supabase
// RLS: las policies de las tablas filtran por `auth.role() = 'authenticated'`,
// y el cliente anon solo puede escribir si hay sesión activa.
//
// FLUJO:
//   1. Login: `signInBrowser(email, password)` usa supabaseBrowser.auth.
//      Supabase guarda la sesión en localStorage del browser.
//   2. Las llamadas a Supabase desde el cliente llevan automáticamente
//      el token de sesión en cada request → RLS decide qué puede hacer.
//   3. Logout: `signOutBrowser()` borra la sesión local.
//
// El admin/index.astro chequea la sesión al cargar y redirige a /admin/login
// si no hay user.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

function env(value: string | undefined, name: string): string {
  if (!value) throw new Error(`[admin-auth] Falta env ${name}`);
  return value;
}

/** Cliente para el browser. Persiste sesión en localStorage. */
export const supabaseBrowser: SupabaseClient = createClient(
  env(url, 'PUBLIC_SUPABASE_URL'),
  env(anonKey, 'PUBLIC_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/* ============================================================
   Login / Logout (browser)
   ============================================================ */

/** Login desde el browser. Devuelve `{ ok, error }`. */
export async function signInBrowser(
  email: string,
  password: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

/** Logout desde el browser. */
export async function signOutBrowser(): Promise<void> {
  try {
    await supabaseBrowser.auth.signOut();
  } catch {
    /* ignore */
  }
}