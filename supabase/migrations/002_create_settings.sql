-- =====================================================
-- Avilea · Fase 2 · Migración 002: tabla `settings`
-- =====================================================
-- Key/value store genérico para configuración del sitio
-- (tasa USD, futuros toggles, copy editable, etc.).
--
-- Pegar en Supabase → SQL Editor → New query → Run.
-- Idempotente: corre múltiples veces sin romper.

-- -----------------------------------------------------
-- 1) Tabla
-- -----------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------
-- 2) Trigger: updated_at automático
-- -----------------------------------------------------
drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------
-- 3) Row Level Security
-- -----------------------------------------------------
alter table public.settings enable row level security;

-- Lectura pública: el sitio público puede leer configuraciones
-- (ej. para mostrar el equivalente en USD en el catálogo).
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read"
  on public.settings
  for select
  using (true);

-- Escritura solo para usuarios autenticados.
-- El server-side usa service_role (bypasea RLS); esta policy cubre el
-- caso de un cliente anon intentando escribir directo.
drop policy if exists "settings_authenticated_write" on public.settings;
create policy "settings_authenticated_write"
  on public.settings
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');