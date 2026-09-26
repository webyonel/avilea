// src/lib/posts.ts
// Modelo y seed del blog.
//
// - Fase 2: los posts viven en la tabla `public.posts` de Supabase.
//   El sitio público (`/sobre-nosotros`) los lee con `fetchPosts()`
//   desde `src/lib/supabase-posts.ts` (server-side).
// - `DEFAULT_POSTS` se conserva como fallback de tipo en el frontmatter
//   de la página y como seed inicial de la migración SQL
//   `supabase/migrations/003_create_posts.sql`. Si corrés la migración,
//   esta constante ya no se usa en runtime.

export type PostCategory = 'cuidados' | 'gafas' | 'novedades' | 'salud';

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Cuerpo del artículo en markdown. Lo renderiza el servidor. */
  content: string;
  cover: string;       // ruta pública (/img/...) o URL externa.
  date: string;        // ISO yyyy-mm-dd.
  category: PostCategory;
  author?: string;
  /** Solo el panel admin. El sitio público filtra por is_published=true. */
  is_published?: boolean;
  /** Solo el panel admin. ISO timestamp completo de published_at. */
  published_at?: string;
};

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  cuidados: 'Cuidados',
  gafas: 'Gafas',
  novedades: 'Novedades',
  salud: 'Salud visual',
};

export const POST_CATEGORIES: PostCategory[] = [
  'cuidados',
  'gafas',
  'novedades',
  'salud',
];

export const DEFAULT_POSTS: Post[] = [
  {
    id: 'p-cuidado',
    slug: 'como-cuidar-tus-espejuelos',
    title: 'Cómo cuidar tus espejuelos y alargar su vida',
    excerpt:
      'Cinco hábitos sencillos que mantienen tus cristales limpios, tus armaduras alineadas y tus espejuelos como nuevos por más tiempo.',
    content: `## Cinco hábitos que marcan la diferencia

Tus espejuelos te acompañan todo el día: en el trabajo, mirando el celular, leyendo, conduciendo. Tratarlos con un mínimo de cuidado evita cristales rayados, armaduras desalineadas y visitas extra al local.

### 1. Limpia siempre con paño de microfibra

El borde de la remera, una servilleta de papel o la punta del pañuelo dejan micro-rayones que con el tiempo empañan la visión. Usa el paño de microfibra que te entregamos con la compra y, si necesitas líquido, nuestro **kit de limpieza**.

### 2. Guárdalos en su estuche cuando no los uses

Un estuche rígido los protege de caídas y de apoyarlos boca abajo sobre la mesa. Si todavía no tienes, en cualquiera de nuestros tres locales te conseguimos uno en el momento.

### 3. Evita dejarlos en el baño o en el auto

El calor extremo (guantera en verano) deforma armaduras de plástico y despega tratamientos antirreflejo. La humedad del baño favorece la oxidación de las bisagras metálicas.

### 4. Ajusta las patillas apenas notes que se aflojan

La mayoría de las armaduras traen un tornillo pequeño detrás de la bisagra que se afloja con el uso. Si te pasa, pasa por el local y te las dejamos como nuevas **sin costo**.

### 5. Haz una revisión una vez al año

Con el uso, la alineación se corre aunque no lo notes. Una revisión rápida en el local detecta el problema antes de que te genere dolor de cabeza o mareos.

---
¿Tienes alguna duda sobre el cuidado de tus espejuelos? **Escríbenos por WhatsApp** y te orientamos sin compromiso.`,
    cover: 'https://picsum.photos/seed/avilea-cuidado/960/640',
    date: '2026-09-01',
    category: 'cuidados',
    author: 'Equipo Avilea',
  },
  {
    id: 'p-materiales',
    slug: 'materiales-del-cristal-cual-elegir',
    title: 'Materiales del cristal: cuál elegir según tu receta',
    excerpt:
      'CR-39, policarbonato o high index? Te explicamos las diferencias, pros y contras, y cuándo conviene cada uno.',
    content: `## No todos los cristales son iguales

La graduación se monta sobre un material, y ese material cambia el peso, el grosor, la resistencia al impacto y el precio final. Acá te dejamos una guía rápida para elegir con confianza.

### CR-39 (orgánico)

- **Peso:** liviano.
- **Grosor:** estándar; graduaciones altas quedan gruesas.
- **Resistencia:** normal.
- **Cuándo conviene:** graduaciones leves a moderadas, uso diario sin impacto físico.
- **Precio:** el más accesible.

### Policarbonato

- **Peso:** más liviano que el CR-39.
- **Grosor:** más fino para la misma graduación.
- **Resistencia:** 10 veces más resistente al impacto que el orgánico.
- **Cuándo conviene:** niños, deportistas, oficios con riesgo de golpe, graduaciones altas.
- **Precio:** intermedio.

### High index (1.67 / 1.74)

- **Peso:** el más liviano de los tres.
- **Grosor:** mucho más fino — un alto índice reduce el grosor hasta un 40%.
- **Resistencia:** buena, comparable al policarbonato.
- **Cuándo conviene:** graduaciones altas (por encima de ±4.00 D) donde el grosor importa estéticamente.
- **Precio:** el más caro.

## ¿Cómo lo elegimos?

En el local, después del examen de vista, te recomendamos el material según tu graduación, tu rutina y tu presupuesto. No vendemos lo más caro ni lo más barato: vendemos el que **te va a durar más cómodo**.

---
Si tienes una receta a mano y quieres un presupuesto, **mándanos una foto por WhatsApp** y te respondemos con las opciones y el precio final.`,
    cover: 'https://picsum.photos/seed/avilea-materiales/960/640',
    date: '2026-08-20',
    category: 'gafas',
    author: 'Equipo Avilea',
  },
  {
    id: 'p-coleccion',
    slug: 'nueva-coleccion-primavera-2026',
    title: 'Llega la nueva colección primavera 2026',
    excerpt:
      'Modelos frescos, livianos y listos para graduarse a medida. Disponible en nuestros tres locales.',
    content: `## Lo nuevo de la temporada

Esta semana empezamos a exhibir la **colección primavera 2026** en los tres locales: Ciego de Ávila, Ciro Redondo y Morón. Son modelos que pedimos pensando en el calor que se viene: armazones más livianos, colores cálidos y monturas que se adaptan bien a cristales con tratamientos antirreflejo y fotocromáticos.

## Qué vas a encontrar

- Modelos **unisex** en acetato, con colores miel, verde botella y carey clásico.
- Líneas **femeninas** con formas redondeadas y patillas finas.
- Líneas **masculinas** más rectas, en azul y negro mate.
- Algunos modelos en **policarbonato** listos para graduaciones altas.

Todos los modelos de la colección se pueden graduar con tu receta. Si todavía no tienes el examen actualizado, te agendamos un turno en el local — demora unos 15 minutos y es **gratis**.

---
Pasa por el local que te quede más cómodo o **escríbenos por WhatsApp** para ver catálogo en foto antes de venir.`,
    cover: 'https://picsum.photos/seed/avilea-primavera/960/640',
    date: '2026-08-10',
    category: 'novedades',
    author: 'Equipo Avilea',
  },
];

// Helper para formatear fecha corta en español (es-ES).
export function formatPostDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
