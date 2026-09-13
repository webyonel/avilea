-- =====================================================
-- Avilea · Fase 2 · Migración 003: tabla `posts` (blog)
-- =====================================================
-- Lista los artículos del blog en Supabase. El sitio público
-- (`/sobre-nosotros`) los lee con anon key + RLS de solo lectura
-- para `is_published = true`. Admin CRUD queda para una migración
-- posterior (no está en scope todavía).
--
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Idempotente: corre múltiples veces sin romper.

-- -----------------------------------------------------
-- 1) Tabla
-- -----------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text not null,
  content      text not null,                                  -- markdown
  cover        text not null,                                  -- ruta pública (/img/...) o URL externa
  category     text not null,
  author       text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Las categorías válidas matchean `PostCategory` en src/lib/posts.ts.
  -- Si agregás una categoría nueva en el código, agregala acá también.
  constraint posts_category_check check (
    category in ('cuidados', 'gafas', 'novedades', 'salud')
  )
);

-- -----------------------------------------------------
-- 2) Trigger: updated_at automático
--    (la función public.set_updated_at() ya fue creada en 001_create_products.sql)
-- -----------------------------------------------------
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------
-- 3) Row Level Security
-- -----------------------------------------------------
alter table public.posts enable row level security;

-- Lectura pública: solo posts publicados. El sitio público usa anon key
-- y la policy filtra por is_published. Para previews de drafts en admin
-- se usa service_role (bypasea RLS).
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read"
  on public.posts
  for select
  using (is_published = true);

-- Escritura solo para usuarios autenticados (admin logueado vía Supabase Auth).
-- El server-side usa service_role (bypasea RLS); esta policy cubre el caso
-- de un cliente anon intentando escribir directo.
drop policy if exists "posts_authenticated_write" on public.posts;
create policy "posts_authenticated_write"
  on public.posts
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -----------------------------------------------------
-- 4) Seed: posts por defecto (idénticos a DEFAULT_POSTS en
--    src/lib/posts.ts, ahora con `content` markdown completo).
--    on conflict (slug) = no pisar si ya existen.
-- -----------------------------------------------------
insert into public.posts (slug, title, excerpt, content, cover, category, author, is_published, published_at)
values
  (
    'como-cuidar-tus-espejuelos',
    'Cómo cuidar tus espejuelos y alargar su vida',
    'Cinco hábitos sencillos que mantienen tus cristales limpios, tus armaduras alineadas y tus espejuelos como nuevos por más tiempo.',
    E'## Cinco hábitos que marcan la diferencia\n\nTus espejuelos te acompañan todo el día: en el trabajo, mirando el celular, leyendo, conduciendo. Tratarlos con un mínimo de cuidado evita cristales rayados, armaduras desalineadas y visitas extra al local.\n\n### 1. Limpiá siempre con paño de microfibra\n\nEl borde de la remera, una servilleta de papel o la punta del pañuelo dejan micro-rayones que con el tiempo empañan la visión. Usá el paño de microfibra que te entregamos con la compra y, si necesitás líquido, nuestro **kit de limpieza**.\n\n### 2. Guardalos en su estuche cuando no los uses\n\nUn estuche rígido los protege de caídas y de apoyarlos boca abajo sobre la mesa. Si todavía no tenés, en cualquiera de nuestros tres locales te conseguimos uno en el momento.\n\n### 3. Evitá dejarlos en el baño o en el auto\n\nEl calor extremo (guantera en verano) deforma armaduras de plástico y despega tratamientos antirreflejo. La humedad del baño favorece la oxidación de las bisagras metálicas.\n\n### 4. Ajustá las patillas apenas notes que se aflojan\n\nLa mayoría de las armaduras traen un tornillo pequeño detrás de la bisagra que se afloja con el uso. Si te pasa, pasá por el local y te las dejamos como nuevas **sin costo**.\n\n### 5. Hacé una revisión una vez al año\n\nCon el uso, la alineación se corre aunque no lo notes. Una revisión rápida en el local detecta el problema antes de que te genere dolor de cabeza o mareos.\n\n---\n¿Tenés alguna duda sobre el cuidado de tus espejuelos? **Escribinos por WhatsApp** y te orientamos sin compromiso.',
    'https://picsum.photos/seed/avilea-cuidado/960/640',
    'cuidados',
    'Equipo Avilea',
    true,
    '2026-09-01 00:00:00+00'
  ),
  (
    'materiales-del-cristal-cual-elegir',
    'Materiales del cristal: cuál elegir según tu receta',
    'CR-39, policarbonato o high index? Te explicamos las diferencias, pros y contras, y cuándo conviene cada uno.',
    E'## No todos los cristales son iguales\n\nLa graduación se monta sobre un material, y ese material cambia el peso, el grosor, la resistencia al impacto y el precio final. Acá te dejamos una guía rápida para elegir con confianza.\n\n### CR-39 (orgánico)\n\n- **Peso:** liviano.\n- **Grosor:** estándar; graduaciones altas quedan gruesas.\n- **Resistencia:** normal.\n- **Cuándo conviene:** graduaciones leves a moderadas, uso diario sin impacto físico.\n- **Precio:** el más accesible.\n\n### Policarbonato\n\n- **Peso:** más liviano que el CR-39.\n- **Grosor:** más fino para la misma graduación.\n- **Resistencia:** 10 veces más resistente al impacto que el orgánico.\n- **Cuándo conviene:** niños, deportistas, oficios con riesgo de golpe, graduaciones altas.\n- **Precio:** intermedio.\n\n### High index (1.67 / 1.74)\n\n- **Peso:** el más liviano de los tres.\n- **Grosor:** mucho más fino — un alto índice reduce el grosor hasta un 40%.\n- **Resistencia:** buena, comparable al policarbonato.\n- **Cuándo conviene:** graduaciones altas (por encima de ±4.00 D) donde el grosor importa estéticamente.\n- **Precio:** el más caro.\n\n## ¿Cómo lo elegimos?\n\nEn el local, después del examen de vista, te recomendamos el material según tu graduación, tu rutina y tu presupuesto. No vendemos lo más caro ni lo más barato: vendemos el que **te va a durar más cómodo**.\n\n---\nSi tenés una receta a mano y querés un presupuesto, **mandános una foto por WhatsApp** y te respondemos con las opciones y el precio final.',
    'https://picsum.photos/seed/avilea-materiales/960/640',
    'gafas',
    'Equipo Avilea',
    true,
    '2026-08-20 00:00:00+00'
  ),
  (
    'nueva-coleccion-primavera-2026',
    'Llega la nueva colección primavera 2026',
    'Modelos frescos, livianos y listos para graduarse a medida. Disponible en nuestros tres locales.',
    E'## Lo nuevo de la temporada\n\nEsta semana empezamos a exhibir la **colección primavera 2026** en los tres locales: Ciego de Ávila, Ciro Redondo y Morón. Son modelos que pedimos pensando en el calor que se viene: armazones más livianos, colores cálidos y monturas que se adaptan bien a cristales con tratamientos antirreflejo y fotocromáticos.\n\n## Qué vas a encontrar\n\n- Modelos **unisex** en acetato, con colores miel, verde botella y carey clásico.\n- Líneas **femeninas** con formas redondeadas y patillas finas.\n- Líneas **masculinas** más rectas, en azul y negro mate.\n- Algunos modelos en **policarbonato** listos para graduaciones altas.\n\nTodos los modelos de la colección se pueden graduar con tu receta. Si todavía no tenés el examen actualizado, te agendamos un turno en el local — demora unos 15 minutos y es **gratis**.\n\n---\nPasá por el local que te quede más cómodo o **escribinos por WhatsApp** para ver catálogo en foto antes de venir.',
    'https://picsum.photos/seed/avilea-primavera/960/640',
    'novedades',
    'Equipo Avilea',
    true,
    '2026-08-10 00:00:00+00'
  )
on conflict (slug) do nothing;
