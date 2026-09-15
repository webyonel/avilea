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

export const MATERIALS: { value: Material; label: string; description: string }[] = [
  {
    value: 'cr9',
    label: 'CR-9 (Orgánico)',
    description:
      'El lente más común y accesible. Buena calidad óptica para graduaciones leves o moderadas. Se raya con más facilidad que otros materiales.',
  },
  {
    value: 'policarbonato',
    label: 'Policarbonato',
    description:
      'Hasta 10 veces más resistente a golpes que el CR-9. Más delgado y liviano. Recomendado para niños, deportes y trabajos manuales.',
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

export const TREATMENTS: { value: Treatment; label: string; description: string }[] = [
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
    label: 'Polarizado',
    description:
      'Filtra los reflejos del sol en agua, carretera y superficies brillantes. Ideal para conducir y actividades al aire libre.',
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

export function orderToMessage(order: CustomOrder): string {
  const v = (s: string) => (s.trim() === '' ? '—' : s.trim());
  const list = <T extends string>(
    arr: { value: T; label: string }[],
    selected: T[]
  ): string =>
    selected.length === 0
      ? '—'
      : selected.map((x) => labelOf(arr, x)).join(', ');

  // Armadura: si hay ID del catálogo va solo el ID (la tienda lo cruza con el catálogo).
  // Si NO hay ID, va el nombre y precio manuales que tipeó el cliente.
  const armaduraLine = order.armaduraId
    ? `• ID de catálogo: ${order.armaduraId}`
    : (order.armaduraNombre.trim() !== '' || order.armaduraPrecio.trim() !== '')
      ? `• Manual: ${v(order.armaduraNombre)} (${v(order.armaduraPrecio)} MN)`
      : '• —';

  return [
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
    '',
    'Quedo atento a la confirmación. Gracias.',
  ].join('\n');
}
