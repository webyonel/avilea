// src/lib/supabase-settings.ts
// Capa de acceso a la tabla `public.settings` (key/value, server-side).
//
// - Lecturas usan `supabaseAnon` (lectura pública por RLS).
// - Escrituras usan `supabaseAdmin` (service_role, bypasea RLS). Por eso
//   los callers DEBEN estar dentro de endpoints /api/admin/** que ya
//   validaron la sesión del admin.
//
// Helpers genéricos (getSetting/setSetting) más específicos de dominio
// (getUsdRate/setUsdRate).

import { supabaseAnon, supabaseAdmin } from '../db/supabase';

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

interface SettingsRow {
  key: string;
  value: Json;
  updated_at: string;
}

/* ============================================================
   Genéricos
   ============================================================ */

/** Lee una setting por key. Devuelve `null` si no existe. */
export async function getSetting<T extends Json = Json>(
  key: string
): Promise<T | null> {
  const { data, error } = await supabaseAnon
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw new Error(`[settings] get ${key}: ${error.message}`);
  }
  return (data?.value as T | null) ?? null;
}

/** Upsert de una setting. */
export async function setSetting<T extends Json = Json>(
  key: string,
  value: T
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key, value });

  if (error) {
    throw new Error(`[settings] set ${key}: ${error.message}`);
  }
}

/* ============================================================
   Tasa USD → MN (dominio específico)
   ============================================================ */

const USD_RATE_KEY = 'usd_rate';
const USD_RATE_RE = /^[a-z0-9_-]+$/i; // placeholder, validamos el número abajo
const USD_RATE_MIN = 0.01;
const USD_RATE_MAX = 100_000;

/** Devuelve la tasa actual (1 USD = X MN), o `null` si nunca se setó. */
export async function getUsdRate(): Promise<number | null> {
  const value = await getSetting<{ rate: number }>(USD_RATE_KEY);
  if (!value || typeof value.rate !== 'number') return null;
  return Number.isFinite(value.rate) && value.rate > 0 ? value.rate : null;
}

/** Persiste la tasa. Lanza si el valor no es válido. */
export async function setUsdRate(rate: number): Promise<void> {
  if (!Number.isFinite(rate) || rate < USD_RATE_MIN || rate > USD_RATE_MAX) {
    throw new Error(
      `Tasa inválida: debe ser un número entre ${USD_RATE_MIN} y ${USD_RATE_MAX}.`
    );
  }
  await setSetting(USD_RATE_KEY, { rate });
}