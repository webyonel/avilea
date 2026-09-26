// src/lib/admin-catalog.ts
// Utilidades del admin relacionadas al catálogo (Fase 2).
//
// ANTES (fase 1) este archivo era la capa de persistencia localStorage
// del catálogo (`avilea_products`). Eso ya NO se usa: el CRUD de
// productos pasa por los endpoints /api/admin/products que hablan con
// Supabase. Lo que queda aquí es la **tasa USD → MN**, que todavía vive
// en localStorage hasta que la próxima fase la migre a una tabla
// `settings` de Supabase (ver checklist pre-fase 2).

import {
  CATEGORIES,
  CATEGORY_LABEL,
  DEFAULT_PRODUCTS,
} from './catalog';
import type { Product, Category } from './catalog';

/** Re-exports por compat con imports viejos (algunos componentes los usan). */
export { DEFAULT_PRODUCTS, CATEGORIES, CATEGORY_LABEL };
export type { Product, Category };

/* ============================================================
   Tasa de cambio USD → MN
   ============================================================
   DEPRECATED — la tasa ahora vive en Supabase (tabla `settings`,
   key `usd_rate`). Las funciones de abajo quedan solo por compat con
   código viejo (leen/escriben en localStorage). El panel admin ya
   habla con `/api/admin/settings/usd-rate`.

   Para migrar valor viejo → DB manualmente (one-off), desde DevTools:
     const v = localStorage.getItem('avilea_usd_rate');
     if (v) fetch('/api/admin/settings/usd-rate',
       { method:'PUT', headers:{'Content-Type':'application/json',
         Authorization:'Bearer ' + (await supabase.auth.getSession()).data.session.access_token},
         body: JSON.stringify({ rate: JSON.parse(v).rate }) });
*/

const USD_RATE_KEY = 'avilea_usd_rate';

/** @deprecated Usar el endpoint `/api/admin/settings/usd-rate`. */
export function loadUsdRate(): number | null {
  if (typeof console !== 'undefined') {
    console.warn('[admin-catalog] loadUsdRate() deprecated → usa la API.');
  }
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USD_RATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rate?: unknown };
    const r = Number(parsed?.rate);
    return Number.isFinite(r) && r > 0 ? r : null;
  } catch {
    return null;
  }
}

/** @deprecated Usar el endpoint `/api/admin/settings/usd-rate`. */
export function saveUsdRate(rate: number): void {
  if (typeof console !== 'undefined') {
    console.warn('[admin-catalog] saveUsdRate() deprecated → usa la API.');
  }
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(USD_RATE_KEY, JSON.stringify({ rate }));
  } catch {
    // localStorage lleno o deshabilitado: se ignora.
  }
}

/** Limpia el valor viejo de localStorage (one-off). Llamar desde el admin
 *  al detectar que existe el dato legacy. */
export function clearLegacyUsdRate(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(USD_RATE_KEY);
  } catch {
    /* ignore */
  }
}