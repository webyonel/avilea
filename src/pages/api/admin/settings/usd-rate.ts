// src/pages/api/admin/settings/usd-rate.ts
//
//   GET  /api/admin/settings/usd-rate  → { rate: number | null }
//   PUT  /api/admin/settings/usd-rate  body: { rate: number } → 200 { ok: true }
//
// GET es lectura pública (RLS lo permite). PUT requiere admin (Bearer token).

import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/admin-auth';
import { getUsdRate, setUsdRate } from '../../../../lib/supabase-settings';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async () => {
  try {
    const rate = await getUsdRate();
    return json({ rate });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Error al leer la tasa' },
      500
    );
  }
};

export const PUT: APIRoute = async (context) => {
  const auth = await requireAuth(context.request);
  if ('response' in auth) return auth.response;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const b = body as { rate?: unknown };
  const rate = typeof b.rate === 'number' ? b.rate : Number(b.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    return json({ error: 'Tasa inválida: debe ser un número mayor a 0.' }, 400);
  }

  try {
    await setUsdRate(rate);
    return json({ ok: true, rate });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : 'Error al guardar la tasa' },
      500
    );
  }
};