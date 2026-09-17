// src/lib/pricing.ts
// Lógica de precios para espejuelos a medida.
//
// Los precios BASE de los lentes vienen en USD de la lista "Lista de precios
// final vendedoras.docx" (compartida por el cliente). Las armaduras se
// cobran aparte en MN desde el catálogo.
//
// Estructura:
//   - Por cada combinación material × distancia focal × (foto | no foto) ×
//     (índice 1.56 | 1.59, solo progresivo) hay una lista de tiers por rango
//     de esfera/cilindro.
//   - Algunos tratamientos ya vienen INCLUIDOS en el precio base
//     (ej. "MONOFOCAL FOTOCROMATICO AR" ya tiene Antirreflejo).
//   - El resto de tratamientos son add-ons explícitos (+5 USD cada uno).
//
// La función `calculateLensPriceUsd(order)` toma el pedido del formulario y
// devuelve el desglose (USD) listo para mostrar y para mandar por WhatsApp.

import type {
  CustomOrder,
  FocalDistance,
  Material,
  Treatment,
} from './orders';

export interface PriceTier {
  /** Tope de |esfera| para entrar en este tier. */
  maxAbsSphere: number;
  /** Tope de |cilindro| para entrar en este tier. */
  maxAbsCylinder: number;
  /** Precio base en USD para este tier. */
  priceUsd: number;
}

export interface LensAddOn {
  treatment: Treatment;
  priceUsd: number;
}

export interface LensConfig {
  /** Etiqueta humana (debug/UI). */
  label: string;
  /** Tiers del más barato al más caro. El calculador toma el primero que
   *  contiene la prescripción; si no entra en ninguno cae al más caro. */
  tiers: PriceTier[];
  /** Tratamientos cuyo costo ya está dentro del base (no se suman como add-on). */
  includedTreatments: Treatment[];
  /** Add-ons que aplica esta combinación (ej. +5 USD por AR). */
  addOns: LensAddOn[];
}

/* ============================================================
   Tablas de precios (fuente: lista de precios vendedoras.docx)
   ============================================================ */

const LENS_CONFIGS: Record<string, LensConfig> = {
  /* ----- MONOFOCAL ----- */

  // CR-9 (1.56) monofocal
  'cr9-monofocal': {
    label: 'CR-9 monofocal',
    tiers: [
      { maxAbsSphere: 6, maxAbsCylinder: 2, priceUsd: 10 },
      { maxAbsSphere: 6, maxAbsCylinder: 4, priceUsd: 20 },
      { maxAbsSphere: 11, maxAbsCylinder: 4, priceUsd: 30 },
      { maxAbsSphere: 15, maxAbsCylinder: 6, priceUsd: 40 },
    ],
    includedTreatments: [],
    addOns: [
      { treatment: 'antirreflejo', priceUsd: 5 },
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // CR-9 monofocal FOTOCROMÁTICO (incluye AR)
  'cr9-monofocal-fotocromatico': {
    label: 'CR-9 monofocal fotocromático (con AR)',
    tiers: [
      { maxAbsSphere: 6, maxAbsCylinder: 4, priceUsd: 50 },
      { maxAbsSphere: 15, maxAbsCylinder: 6, priceUsd: 60 },
    ],
    includedTreatments: ['antirreflejo'],
    addOns: [
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // High Index (1.67) monofocal
  'high_index-monofocal': {
    label: 'High Index (1.67) monofocal',
    tiers: [
      { maxAbsSphere: 6, maxAbsCylinder: 2, priceUsd: 45 },
      { maxAbsSphere: 6, maxAbsCylinder: 4, priceUsd: 50 },
      { maxAbsSphere: 11, maxAbsCylinder: 4, priceUsd: 55 },
      { maxAbsSphere: 15, maxAbsCylinder: 6, priceUsd: 60 },
    ],
    includedTreatments: [],
    addOns: [
      { treatment: 'antirreflejo', priceUsd: 5 },
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // High Index (1.67) monofocal FOTOCROMÁTICO (incluye AR)
  'high_index-monofocal-fotocromatico': {
    label: 'High Index (1.67) monofocal fotocromático (con AR)',
    tiers: [
      { maxAbsSphere: 6, maxAbsCylinder: 2, priceUsd: 55 },
      { maxAbsSphere: 6, maxAbsCylinder: 4, priceUsd: 60 },
      { maxAbsSphere: 11, maxAbsCylinder: 4, priceUsd: 65 },
      { maxAbsSphere: 15, maxAbsCylinder: 6, priceUsd: 70 },
    ],
    includedTreatments: ['antirreflejo'],
    addOns: [
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  /* ----- BIFOCAL (flat top / blended, mismo precio) ----- */

  'cr9-bifocal': {
    label: 'CR-9 bifocal',
    tiers: [
      { maxAbsSphere: 6, maxAbsCylinder: 4, priceUsd: 35 },
    ],
    includedTreatments: [],
    addOns: [
      { treatment: 'antirreflejo', priceUsd: 5 },
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  'cr9-bifocal-fotocromatico': {
    label: 'CR-9 bifocal fotocromático (con AR)',
    tiers: [
      { maxAbsSphere: 8, maxAbsCylinder: 6, priceUsd: 60 },
    ],
    includedTreatments: ['antirreflejo'],
    addOns: [
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  /* ----- PROGRESIVO ----- */

  // 1.56 cubre 0 a +6 / A -8, cilindro -0.25 a -4
  'cr9-progresivo-1.56': {
    label: 'CR-9 progresivo 1.56',
    tiers: [
      { maxAbsSphere: 8, maxAbsCylinder: 4, priceUsd: 40 },
    ],
    includedTreatments: [],
    addOns: [
      { treatment: 'antirreflejo', priceUsd: 5 },
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // 1.59 cubre 0 a +8 / A -10, cilindro -0.25 a -6
  'cr9-progresivo-1.59': {
    label: 'CR-9 progresivo 1.59',
    tiers: [
      { maxAbsSphere: 10, maxAbsCylinder: 6, priceUsd: 60 },
    ],
    includedTreatments: [],
    addOns: [
      { treatment: 'antirreflejo', priceUsd: 5 },
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // 1.56 fotocromático (incluye AR): 0 a ±8, cilindro -0.25 a -6
  'cr9-progresivo-1.56-fotocromatico': {
    label: 'CR-9 progresivo 1.56 fotocromático (con AR)',
    tiers: [
      { maxAbsSphere: 8, maxAbsCylinder: 6, priceUsd: 65 },
    ],
    includedTreatments: ['antirreflejo'],
    addOns: [
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },

  // 1.59 fotocromático (incluye AR): 0 a +8 / A -10, cilindro -0.25 a -6
  'cr9-progresivo-1.59-fotocromatico': {
    label: 'CR-9 progresivo 1.59 fotocromático (con AR)',
    tiers: [
      { maxAbsSphere: 10, maxAbsCylinder: 6, priceUsd: 85 },
    ],
    includedTreatments: ['antirreflejo'],
    addOns: [
      { treatment: 'filtro_luz_azul', priceUsd: 5 },
    ],
  },
};

/* ============================================================
   Cálculo
   ============================================================ */

/** Si el usuario marca varias distancias focales, elegimos la más
 *  específica (progresivo > bifocal > monofocal). Si marca varias, gana la
 *  más cara en términos de precio. */
const FOCAL_RANK: Record<FocalDistance, number> = {
  monofocal: 0,
  bifocal: 1,
  progresivo: 2,
};

export interface LensPriceBreakdown {
  /** Key interna del config (ej. "cr9-monofocal"). Útil para debug. */
  configKey: string;
  /** Etiqueta humana (ej. "CR-9 monofocal fotocromático (con AR)"). */
  configLabel: string;
  /** Precio base del tier (USD). */
  basePriceUsd: number;
  /** Rango de prescripción que aplicó al tier. */
  prescriptionRange: string;
  /** Add-ons aplicados (USD cada uno). */
  appliedAddOns: { treatment: Treatment; priceUsd: number }[];
  /** Tratamientos del usuario que NO se contabilizaron (estaban
   *  deshabilitados como polarizado, o no aplican al config). */
  skippedTreatments: Treatment[];
  /** Total lente en USD = base + add-ons. */
  totalUsd: number;
}

/** Parsea un string de esfera/cilindro admitiendo coma o punto decimal.
 *  Devuelve su valor absoluto, o 0 si está vacío o no parsea. */
function absNum(s: string): number {
  const cleaned = String(s ?? '').trim().replace(',', '.');
  if (cleaned === '') return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

/** Resuelve la key del config según el pedido. Devuelve null si la
 *  combinación no existe (ej. Hi Index + bifocal no está en la lista). */
function resolveConfigKey(order: CustomOrder): string | null {
  if (!order.material) return null;
  if (order.focalDistances.length === 0) return null;

  const focal = [...order.focalDistances].sort(
    (a, b) => FOCAL_RANK[b] - FOCAL_RANK[a],
  )[0];

  // Policarbonato no debería llegar (está deshabilitado); si llega lo
  // tratamos como CR-9 (no hay precio separado en la lista).
  const materialKey: 'cr9' | 'high_index' =
    order.material === 'high_index' ? 'high_index' : 'cr9';

  const photochromic = order.treatments.includes('fotocromatico');

  if (focal === 'progresivo') {
    const idx = order.progresivoIndex || '1.56';
    return `${materialKey}-progresivo-${idx}${photochromic ? '-fotocromatico' : ''}`;
  }
  return `${materialKey}-${focal}${photochromic ? '-fotocromatico' : ''}`;
}

/** Calcula el precio del lente en USD según el pedido. Devuelve null si
 *  todavía no hay material o distancia focal elegidos. */
export function calculateLensPriceUsd(
  order: CustomOrder,
): LensPriceBreakdown | null {
  const key = resolveConfigKey(order);
  if (!key) return null;
  const config = LENS_CONFIGS[key];
  if (!config) return null;

  // Receta: máximo de los dos ojos (la graduación mayor manda).
  const maxAbsSphere = Math.max(
    absNum(order.rightEye.esfera),
    absNum(order.leftEye.esfera),
  );
  const maxAbsCylinder = Math.max(
    absNum(order.rightEye.cilindro),
    absNum(order.leftEye.cilindro),
  );

  // Primer tier que contiene la receta; si ninguno, caemos al más caro.
  let basePriceUsd = config.tiers[config.tiers.length - 1].priceUsd;
  for (const tier of config.tiers) {
    if (maxAbsSphere <= tier.maxAbsSphere && maxAbsCylinder <= tier.maxAbsCylinder) {
      basePriceUsd = tier.priceUsd;
      break;
    }
  }

  // Add-ons: solo los que están definidos en este config.
  // Tratamientos desconocidos / deshabilitados (polarizado) los saltamos
  // sin error.
  const appliedAddOns: { treatment: Treatment; priceUsd: number }[] = [];
  const skippedTreatments: Treatment[] = [];
  for (const t of order.treatments) {
    if (config.includedTreatments.includes(t)) continue;
    const addOn = config.addOns.find((a) => a.treatment === t);
    if (addOn) {
      appliedAddOns.push({ treatment: t, priceUsd: addOn.priceUsd });
    } else {
      skippedTreatments.push(t);
    }
  }

  const totalUsd =
    basePriceUsd + appliedAddOns.reduce((sum, a) => sum + a.priceUsd, 0);

  return {
    configKey: key,
    configLabel: config.label,
    basePriceUsd,
    prescriptionRange:
      maxAbsSphere > 0 || maxAbsCylinder > 0
        ? `±${maxAbsSphere.toFixed(2)} esfera / -${maxAbsCylinder.toFixed(2)} cilindro`
        : 'Receta a confirmar',
    appliedAddOns,
    skippedTreatments,
    totalUsd,
  };
}

/** Convierte USD → MN con la tasa del admin. Null si la tasa es inválida. */
export function usdToMn(usd: number, rate: number | null | undefined): number | null {
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round(usd * rate);
}
