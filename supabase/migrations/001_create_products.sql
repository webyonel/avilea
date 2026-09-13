-- =====================================================
-- Avilea · Fase 2 · Migración inicial: tabla `products`
-- =====================================================
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Idempotente: corre múltiples veces sin romper.

-- -----------------------------------------------------
-- 1) Tabla
-- -----------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  name        text not null,
  category    text not null,
  price       numeric not null check (price >= 0),
  image       text,
  shape       text,
  color       text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Las categorías válidas matchean `Category` en src/lib/catalog.ts.
  -- Si agregás una categoría nueva en el código, agregala acá también.
  constraint products_category_check check (
    category in (
      'pregraduados', 'armaduras', 'femenino', 'masculino',
      'ninos', 'unisex', 'accesorios', 'gastronomia'
    )
  )
);

-- -----------------------------------------------------
-- 2) Trigger: updated_at automático
-- -----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------
-- 3) Row Level Security
-- -----------------------------------------------------
alter table public.products enable row level security;

-- Lectura pública (sitio público + admin usan anon key).
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  using (true);

-- Escritura solo para usuarios autenticados (admin logueado vía Supabase Auth).
-- El server-side usa service_role (bypasea RLS); esta policy cubre el caso
-- de un cliente anon intentando escribir directo.
drop policy if exists "products_authenticated_write" on public.products;
create policy "products_authenticated_write"
  on public.products
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- -----------------------------------------------------
-- 4) Seed: productos por defecto (idéntico a DEFAULT_PRODUCTS
--    en src/lib/catalog.ts). on conflict = no pisar si ya existen.
-- -----------------------------------------------------
insert into public.products (id, name, category, price, image, shape, color)
values
  ('aria',                 'Aria',                'femenino',     1850, null, 'round',   '#0a1f5c'),
  ('onix',                 'Onix',                'armaduras',    1950, null, 'rect',    '#0a1f5c'),
  ('bruno',                'Bruno',               'masculino',    1850, null, 'square',  '#0a1f5c'),
  ('vento',                'Vento',               'unisex',       1850, null, 'aviator', '#0a1f5c'),
  ('lente-lectura',        'Lente de Lectura',    'pregraduados',  850, null, 'round',   '#0a1f5c'),
  ('marco-infantil',       'Marco Infantil',      'ninos',        1200, null, 'rect',    '#0a1f5c'),
  ('estuche-rigido',       'Estuche Rígido',      'accesorios',    450, null, 'case',    '#0a1f5c'),
  ('producto-gastronomia', 'Producto Gastronomía', 'gastronomia',   950, null, 'case',    '#0a1f5c')
on conflict (id) do nothing;