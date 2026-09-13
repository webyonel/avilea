// src/lib/catalog.ts
// Modelo de producto y catálogo por defecto.

export type Category =
  | 'pregraduados'
  | 'armaduras'
  | 'femenino'
  | 'masculino'
  | 'ninos'
  | 'unisex'
  | 'accesorios'
  | 'gastronomia';

export type Shape =
  | 'round'
  | 'cat'
  | 'rect'
  | 'square'
  | 'rimless'
  | 'aviator'
  | 'wayfarer'
  | 'case'
  | 'cord'
  | 'bottle'
  | 'wipes'
  | 'kit';

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string | null;
  shape?: Shape;
  color?: string;
};

// Etiqueta legible por categoría (chip y filtro)
export const CATEGORY_LABEL: Record<Category, string> = {
  pregraduados: 'Pregraduados',
  armaduras: 'Armaduras',
  femenino: 'Femenino',
  masculino: 'Masculino',
  ninos: 'Niños',
  unisex: 'Unisex',
  accesorios: 'Accesorios',
  gastronomia: 'Gastronomía',
};

// Color del chip por categoría. Paleta ampliada pero armónica con el logo.
export const CATEGORY_CHIP: Record<Category, string> = {
  pregraduados: '#fef3c7',  // ámbar suave (lectura)
  armaduras: '#e3ecf8',     // tinte del primary
  femenino: '#fce7f3',      // rosa
  masculino: '#dbeafe',     // azul claro
  ninos: '#fed7aa',         // naranja infantil
  unisex: '#d1fae5',        // verde
  accesorios: '#ede9fe',    // lavanda
  gastronomia: '#fee2e2',   // rojo suave (acento)
};

export const CATEGORIES: Category[] = [
  'pregraduados',
  'armaduras',
  'femenino',
  'masculino',
  'ninos',
  'unisex',
  'accesorios',
  'gastronomia',
];

/**
 * Categorías de armaduras (frames) cuyo ID lo pone el admin a mano — son
 * productos con referencia/modelo propio (ej. `aria-001`). El resto
 * (pregraduados, accesorios, gastronomía) llevan ID auto-generado por el
 * sistema porque son productos genéricos sin referencia comercial.
 */
export const MANUAL_ID_CATEGORIES: ReadonlySet<Category> = new Set<Category>([
  'armaduras',
  'femenino',
  'masculino',
  'unisex',
  'ninos',
]);

export function categoryRequiresManualId(c: Category): boolean {
  return MANUAL_ID_CATEGORIES.has(c);
}

// Productos por defecto: 1 por categoría para que el catálogo no quede vacío.
// Reemplazar/eliminar/ampliar desde el admin (fase 2) o editando este archivo.
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'aria',
    name: 'Aria',
    category: 'femenino',
    price: 1850,
    image: null,
    shape: 'round',
    color: '#0a1f5c',
  },
  {
    id: 'onix',
    name: 'Onix',
    category: 'armaduras',
    price: 1950,
    image: null,
    shape: 'rect',
    color: '#0a1f5c',
  },
  {
    id: 'bruno',
    name: 'Bruno',
    category: 'masculino',
    price: 1850,
    image: null,
    shape: 'square',
    color: '#0a1f5c',
  },
  {
    id: 'vento',
    name: 'Vento',
    category: 'unisex',
    price: 1850,
    image: null,
    shape: 'aviator',
    color: '#0a1f5c',
  },
  {
    id: 'lente-lectura',
    name: 'Lente de Lectura',
    category: 'pregraduados',
    price: 850,
    image: null,
    shape: 'round',
    color: '#0a1f5c',
  },
  {
    id: 'marco-infantil',
    name: 'Marco Infantil',
    category: 'ninos',
    price: 1200,
    image: null,
    shape: 'rect',
    color: '#0a1f5c',
  },
  {
    id: 'estuche-rigido',
    name: 'Estuche Rígido',
    category: 'accesorios',
    price: 450,
    image: null,
    shape: 'case',
    color: '#0a1f5c',
  },
  {
    id: 'producto-gastronomia',
    name: 'Producto Gastronomía',
    category: 'gastronomia',
    price: 950,
    image: null,
    shape: 'case',
    color: '#0a1f5c',
  },
];
