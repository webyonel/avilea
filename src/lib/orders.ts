// src/lib/orders.ts
// Modelo de pedido de espejuelos a medida.
// Fase 1: el pedido NO se persiste en backend. Solo se envía por WhatsApp.

export type EyeData = {
  esfera: string;
  cilindro: string;
  eje: string;
  prisma: string;
  base: string;
};

export type Material = 'cr9' | 'policarbonato' | 'high_index';

export const MATERIALS: { value: Material; label: string; description: string; disabled?: boolean }[] = [
  {
    value: 'cr9',
    label: 'CR-9 (Orgánico)',
    description:
      'El lente más común y accesible. Buena calidad óptica para graduaciones leves o moderadas. Se raya con más facilidad que otros materiales.',
  },
  {
    value: 'policarbonato',
    label: 'Policarbonato (no disponible)',
    description:
      'Hasta 10 veces más resistente a golpes que el CR-9. Más delgado y liviano. Recomendado para niños, deportes y trabajos manuales.',
    disabled: true,
  },
  {
    value: 'high_index',
    label: 'High Index',
    description:
      'Cristal extra delgado y liviano. Ideal para graduaciones altas: el lente queda estéticamente mucho más fino.',
  },
];

export type Treatment =
  | 'antirreflejo'
  | 'fotocromatico'
  | 'polarizado'
  | 'filtro_luz_azul';

export const TREATMENTS: { value: Treatment; label: string; description: string; disabled?: boolean }[] = [
  {
    value: 'antirreflejo',
    label: 'Antirreflejo',
    description:
      'Quita los reflejos de la pantalla y de la luz, mejora la visión nocturna y hace que los lentes se vean más transparentes.',
  },
  {
    value: 'fotocromatico',
    label: 'Fotocromático',
    description:
      'Se oscurece automáticamente con la luz del sol y se aclara en interiores. Funciona como lente normal y de sol a la vez.',
  },
  {
    value: 'polarizado',
    label: 'Polarizado (no disponible)',
    description:
      'Filtra los reflejos del sol en agua, carretera y superficies brillantes. Ideal para conducir y actividades al aire libre.',
    disabled: true,
  },
  {
    value: 'filtro_luz_azul',
    label: 'Filtro de luz azul',
    description:
      'Reduce la luz que emiten las pantallas (celular, computadora, tablet). Disminuye el cansancio y la fatiga visual al final del día.',
  },
];

export type FocalDistance = 'monofocal' | 'bifocal' | 'progresivo';

export const FOCAL_DISTANCES: { value: FocalDistance; label: string; description: string }[] = [
  {
    value: 'monofocal',
    label: 'Monofocal',
    description:
      'Un solo foco en todo el lente: o para lejos o para cerca. Lo más común, simple y económico.',
  },
  {
    value: 'bifocal',
    label: 'Bifocal',
    description:
      'Dos focos en un mismo lente: una zona para lejos arriba y otra para cerca abajo, separadas por una línea visible.',
  },
  {
    value: 'progresivo',
    label: 'Progresivo',
    description:
      'Como el bifocal pero sin línea: transición gradual entre lejos, distancia intermedia y cerca. Estéticamente más prolijo.',
  },
];

/** Solo aplica a Progresivo. La lista de precios distingue 1.56 y 1.59. */
export type ProgresivoIndex = '1.56' | '1.59';

export const PROGRESIVO_INDICES: { value: ProgresivoIndex; label: string; description: string }[] = [
  {
    value: '1.56',
    label: 'Índice 1.56',
    description:
      'Estándar. Buena opción para graduaciones leves a moderadas.',
  },
  {
    value: '1.59',
    label: 'Índice 1.59 (más delgado)',
    description:
      'Más delgado y liviano. Recomendado para graduaciones medias a altas.',
  },
];

export type CustomOrder = {
  fullName: string;
  ci: string;
  /**
   * Armadura elegida para el pedido.
   * - `id` poblado desde el probador virtual (ID del catálogo).
   * - `nombre` y `precio` son el fallback manual: se usan cuando NO hay `id`.
   *   Si el cliente eligió del probador, ambos quedan autoreflexionados del catálogo
   *   (puede editarlos si quiere).
   */
  armaduraId: string | null;
  armaduraNombre: string;
  armaduraPrecio: string;
  material: Material | '';
  treatments: Treatment[];
  focalDistances: FocalDistance[];
  /** Solo si el usuario eligió Progresivo. Vacío si no aplica. */
  progresivoIndex: ProgresivoIndex | '';
  rightEye: EyeData;
  leftEye: EyeData;
  adicion: string;
  distanciaPupilar: string;
  ejeAstigmatismo: string;
};

export const EMPTY_EYE: EyeData = {
  esfera: '',
  cilindro: '',
  eje: '',
  prisma: '',
  base: '',
};

export const EMPTY_ORDER: CustomOrder = {
  fullName: '',
  ci: '',
  armaduraId: null,
  armaduraNombre: '',
  armaduraPrecio: '',
  material: '',
  treatments: [],
  focalDistances: [],
  progresivoIndex: '',
  rightEye: { ...EMPTY_EYE },
  leftEye: { ...EMPTY_EYE },
  adicion: '',
  distanciaPupilar: '',
  ejeAstigmatismo: '',
};

const labelOf = <T extends string>(
  arr: { value: T; label: string }[],
  v: T
): string => arr.find((x) => x.value === v)?.label ?? v;

/** Convierte el precio de la armadura tipeado por el cliente (formato libre
 *  "1.850" / "1,850" / "1850") a número. Devuelve null si está vacío o no
 *  parsea. */
export function parseArmaduraPrecio(s: string): number | null {
  const cleaned = s.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Información de precio lista para pasar a `orderToMessage` o mostrar al usuario. */
export interface OrderPricing {
  /** Tiers/recargos aplicados a los lentes (en USD). */
  lens: {
    baseUsd: number;
    addOns: { treatment: string; priceUsd: number }[];
    totalUsd: number;
    /** Etiqueta humana del config (ej. "CR-9 monofocal"). */
    configLabel: string;
    /** Rango de prescripción que aplicó (ej. "±6.00 esferra / -2.00 cilindro"). */
    prescriptionRange: string;
  };
  /** Precio de la armadura (en MN), o null si el cliente no lo tipeó. */
  armaduraMn: number | null;
  /** Tasa USD→MN (ej. 185). Null si el admin aún no la configuró. */
  usdRate: number | null;
  /** Subtotal lentes en MN (lens.totalUsd × usdRate), redondeado. Null si no hay tasa. */
  lensMn: number | null;
  /** Total estimado (lente MN + armadura MN), en MN. Null si falta algún dato. */
  totalMn: number | null;
}

export function orderToMessage(
  order: CustomOrder,
  pricing?: OrderPricing | null
): string {
  const v = (s: string) => (s.trim() === '' ? '—' : s.trim());
  const list = <T extends string>(
    arr: { value: T; label: string }[],
    selected: T[]
  ): string =>
    selected.length === 0
      ? '—'
      : selected.map((x) => labelOf(arr, x)).join(', ');

  // Armadura: SIEMPRE viene del probador virtual. Mostramos nombre + precio
  // para que el cliente lo reconozca; el ID queda como referencia interna.
  const armaduraLine = order.armaduraId
    ? `• ${v(order.armaduraNombre)} — ${v(order.armaduraPrecio)} MN (cat. ${order.armaduraId})`
    : '• — (elegila desde el probador virtual antes de mandar el pedido)';

  const lines: string[] = [
    'Hola Avilea, necesito mandar a hacer unos espejuelos a medida.',
    '',
    '*Datos personales*',
    `• Nombre: ${v(order.fullName)}`,
    `• Carnet de Identidad: ${v(order.ci)}`,
    '',
    '*Armadura*',
    armaduraLine,
    '',
    '*Lente*',
    `• Material: ${order.material ? labelOf(MATERIALS, order.material as Material) : '—'}`,
    `• Tratamientos: ${list(TREATMENTS, order.treatments)}`,
    `• Distancias focales: ${list(FOCAL_DISTANCES, order.focalDistances)}`,
  ];

  if (order.progresivoIndex) {
    lines.push(`• Índice progresivo: ${order.progresivoIndex}`);
  }

  lines.push(
    '',
    '*Ojo derecho (OD)*',
    `• Esfera: ${v(order.rightEye.esfera)}`,
    `• Cilindro: ${v(order.rightEye.cilindro)}`,
    `• Eje: ${v(order.rightEye.eje)}°`,
    `• Prisma: ${v(order.rightEye.prisma)}`,
    `• Base: ${v(order.rightEye.base)}`,
    '',
    '*Ojo izquierdo (OI)*',
    `• Esfera: ${v(order.leftEye.esfera)}`,
    `• Cilindro: ${v(order.leftEye.cilindro)}`,
    `• Eje: ${v(order.leftEye.eje)}°`,
    `• Prisma: ${v(order.leftEye.prisma)}`,
    `• Base: ${v(order.leftEye.base)}`,
    '',
    '*Adicional*',
    `• Adición: ${v(order.adicion)}`,
    `• Distancia pupilar: ${v(order.distanciaPupilar)} mm`,
    `• Eje de astigmatismo: ${v(order.ejeAstigmatismo)}°`,
  );

  if (pricing) {
    lines.push('', '*Precio estimado*');
    lines.push(`• Lente (${pricing.lens.configLabel}, ${pricing.lens.prescriptionRange}): ${pricing.lens.baseUsd} USD`);
    if (pricing.lens.addOns.length > 0) {
      for (const a of pricing.lens.addOns) {
        lines.push(`• + ${a.treatment}: ${a.priceUsd} USD`);
      }
    }
    if (pricing.lensMn !== null) {
      lines.push(`• Subtotal lente: ${pricing.lens.totalUsd} USD (${pricing.lensMn.toLocaleString('es-CU')} MN)`);
    } else {
      lines.push(`• Subtotal lente: ${pricing.lens.totalUsd} USD (tasa USD/MN no configurada)`);
    }
    if (pricing.armaduraMn !== null) {
      lines.push(`• Armadura: ${pricing.armaduraMn.toLocaleString('es-CU')} MN`);
    }
    if (pricing.totalMn !== null) {
      lines.push(`• *TOTAL: ${pricing.totalMn.toLocaleString('es-CU')} MN*`);
    }
  }

  lines.push('', 'Quedo atento a la confirmación. Gracias.');
  return lines.join('\n');
}
