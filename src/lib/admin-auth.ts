// src/lib/admin-auth.ts
// Auth admin · Fase 2 (Supabase Auth) con Bearer tokens.
//
// FLUJO:
//   1. BROWSER: `supabaseBrowser` maneja login/logout. Supabase guarda
//      la sesión en localStorage.
//   2. Al hacer fetch al /api/admin/*, el cliente mete el access_token
//      en `Authorization: Bearer <token>` (vía `getAccessToken()`).
//   3. SERVER (endpoints): extrae el Bearer y llama `verifyBearerToken`,
//      que verifica contra Supabase usando el cliente anon.
//   4. El middleware chequea el header Authorization como primera barrera
//      rápida antes de dejar pasar al endpoint (que hace la verificación real).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

function env(value: string | undefined, name: string): string {
  if (!value) throw new Error(`[admin-auth] Falta env ${name}`);
  return value;
}

/** Cliente para el browser (login form, logout). Persiste sesión en localStorage. */
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

/** Cliente server-side. ( usa anon key — verifica Bearer tokens contra Supabase. */
export const supabaseServer: SupabaseClient = createClient(
  env(url, 'PUBLIC_SUPABASE_URL'),
  env(anonKey, 'PUBLIC_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/* ============================================================
   Browser-side helpers
   ============================================================ */

/** Devuelve el access_token de la sesión actual, o null si no hay. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/* ============================================================
   Server-side helpers
   ============================================================ */

/** Extrae el Bearer token del header Authorization. */
export function extractBearer(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

/**
 * Chequeo rápido de "hay sesión activa" para el middleware.
 * Solo verifica que exista la cookie de Supabase (`*-auth-token`). NO
 * valida el token — la verificación real la hace `requireAuth()` en cada
 * endpoint (que sí chequea el Bearer con Supabase).
 *
 * Lo usamos en el middleware como primera barrera rápida antes de dejar
 * pasar a la página /admin/*: si no hay cookie ni siquiera intentamos
 * cargar el layout del panel.
 */
export function hasSessionCookie(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return cookieHeader.includes('-auth-token');
}

/** Verifica un access_token contra Supabase. Devuelve el user o null. */
export async function verifyBearerToken(
  token: string
): Promise<{ id: string; email: string | null } | null> {
  try {
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Helper para endpoints: extrae Bearer, verifica, devuelve Response 401 si no
 * hay sesión válida. Si todo OK, devuelve el user.
 */
export async function requireAuth(
  request: Request
): Promise<{ user: { id: string; email: string | null } } | { response: Response }> {
  const token = extractBearer(request);
  if (!token) {
    return {
      response: new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  const user = await verifyBearerToken(token);
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}

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