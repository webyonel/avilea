// src/lib/contact.ts
// Datos de los locales físicos de Avilea.
// Cualquier referencia a un local (dirección, WhatsApp del local, horarios)
// sale de acá. No se hardcodea en componentes.

export type Location = {
  id: 'ciego' | 'pina' | 'moron';
  name: string;        // Nombre del local (ej. "Ciego de Ávila").
  phone: string;       // Solo dígitos, formato wa.me (sin "+").
  display: string;     // Cómo se muestra al usuario (ej. "+53 524 516 26").
  image: string;       // Ruta pública de la foto del local.
  address?: string;    // Dirección completa. Opcional: si no, la card oculta el bloque.
};

// BASE_URL siempre termina sin "/" → le agregamos uno para concatenar.
const base = `${(import.meta.env.BASE_URL ?? '').replace(/\/$/, '')}/`;

export const LOCATIONS: readonly Location[] = [
  {
    id: 'ciego',
    name: 'Ciego de Ávila',
    phone: '5352451626',
    display: '+53 524 516 26',
    image: `${base}local_ciego1.jpg`,
    address: 'Calle Joaquín de Agüero entre Honorato del Castillo y Maceo, #82, en el Cine-Teatro Iriondo, Ciego de Ávila, Cuba',
  },
  {
    id: 'pina',
    name: 'Ciro Redondo (Pina)',
    phone: '5354519347',
    display: '+53 545 193 47',
    image: `${base}local_pina2.jpg`,
    address: 'La óptica del hospital, Ciro Redondo, Cuba',
  },
  {
    id: 'moron',
    name: 'Morón',
    phone: '53812546',
    display: '+53 812 546',
    image: `${base}local_moron.jpg`,
    address: 'Calle Martí, esquina San José, local de "Delavida", Morón, Cuba',
  },
] as const;

// Horario único para todos los locales (Lun–Sáb 9:00 AM – 6:00 PM).
export const SCHEDULE_LABEL = 'Lun – Sáb: 9:00 AM – 6:00 PM';
