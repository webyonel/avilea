# Avilea — sitio web (versión Astro)

Sitio público y panel admin de **Avilea Óptica**, óptica comercial con locales en Ciego de Ávila, Ciro Redondo (Pina) y Morón, Cuba.

Migración desde el sitio vanilla original (`../HTMLAvilea/`) a **Astro 7** con output estático y deploy automático en **GitHub Pages**.

## Features

### Público
- **Catálogo** con 8 categorías y filtros client-side. Datos desde Supabase (snapshot al build).
- **Formulario de espejuelos a medida** con probador virtual (subir foto + carrusel de armaduras). Al enviar abre WhatsApp con el resumen prellenado. No persiste pedidos en backend.
- **Sección de contacto** con una tarjeta por local (cada uno con su propio WhatsApp).
- **Página `/sobre-nosotros`**: hero + visión/cómo trabajamos + galería de fotos con lightbox + blog (modal fullscreen por post) + CTA.

### Admin (`/admin`)
- Login con Supabase Auth (email + password).
- Dashboard con KPIs (productos, categorías, publicaciones) y tasa USD → MN editable.
- CRUD de productos (crear, listar, eliminar) con upload de imagen con compresión client-side.
- CRUD de publicaciones (crear, listar, eliminar) con upload de cover, slug auto-generado desde el título, editor markdown con modal de ayuda.

## Stack

- **Astro 7** con **output estático** (`output: 'static'`) — sin SSR, sin adapter de servidor.
- **Supabase**: Postgres + Auth + Storage + RLS. Auth del admin desde el browser; lecturas públicas también desde el browser con anon key.
- **CSS vanilla** (`src/styles/`), sin Tailwind ni preprocesadores.
- **TypeScript** estricto.
- **pnpm** como package manager.
- **GitHub Actions** para build + deploy automático a GitHub Pages.

## Comandos

| Comando | Acción |
|---|---|
| `pnpm install` | Instala dependencias. |
| `pnpm dev` | Levanta el dev server en `localhost:4321` con HMR. |
| `pnpm build` | Genera el bundle estático en `./dist/`. |
| `pnpm preview` | Sirve `./dist/` localmente para verificación. |

## Deploy (GitHub Pages)

El sitio se deploya automáticamente en cada `push` a `main` vía `.github/workflows/deploy.yml`.

### Setup inicial (una sola vez por repo)

1. **Settings → Pages → Source**: seleccionar **GitHub Actions** (no "Deploy from a branch").
2. **Settings → Secrets and variables → Actions → Variables** (NO en Secrets):
   - `PUBLIC_SUPABASE_URL` = `https://xxxx.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = el `anon` key del proyecto
3. **Supabase → Authentication → Users**: crear el usuario admin (email + password).
4. Correr las migraciones SQL en **Supabase → SQL Editor** (en orden):
   - `supabase/migrations/001_create_products.sql`
   - `supabase/migrations/002_create_settings.sql`
   - `supabase/migrations/003_create_posts.sql`

### Comportamiento de cada deploy

- El sitio público se reconstruye desde cero con snapshot de Supabase (productos, posts, tasa USD). Cambios del admin se reflejan cuando hay un nuevo deploy.
- `pnpm-workspace.yaml` debe tener `packages: ['.']` (requerido por pnpm 10+).

### Base path

`astro.config.mjs` define `base: '/avilea'` (el repo en GitHub Pages vive en `/avilea/`). Override por env con `BASE_PATH=/otro pnpm build`.

## Estructura

```
avilea/
├── .github/workflows/deploy.yml   # build + deploy a GitHub Pages
├── public/
│   ├── logo.webp                  # logo de marca
│   ├── mascota_avilea.webp        # mascota (hero)
│   ├── local_*.jpg                # fotos de los 3 locales
│   ├── .nojekyll                  # desactiva Jekyll en GitHub Pages
│   └── favicon.{svg,ico}
├── src/
│   ├── components/
│   │   ├── public/                # Navbar, Hero, Catalog, ProductCard,
│   │   │                          # FrameShape, Contact, Footer,
│   │   │                          # WhatsAppFloat, CustomOrderForm (con probador virtual),
│   │   │                          # Gallery, PostCard, PostModal
│   │   └── admin/                 # MarkdownHelpModal
│   ├── db/supabase.ts             # cliente anon (build-time)
│   ├── layouts/Layout.astro       # shell del sitio público
│   ├── lib/
│   │   ├── admin-auth.ts          # cliente browser + signIn/signOut
│   │   ├── catalog.ts             # Category, Product, DEFAULT_PRODUCTS
│   │   ├── contact.ts             # LOCATIONS (3 locales)
│   │   ├── format.ts              # formatPrice
│   │   ├── orders.ts              # CustomOrder, MATERIALS, TREATMENTS, FOCAL_DISTANCES
│   │   ├── posts.ts               # Post, PostCategory, DEFAULT_POSTS, formatPostDate
│   │   ├── supabase-products.ts   # fetchProducts() (build-time)
│   │   ├── supabase-posts.ts      # fetchPosts() (build-time)
│   │   ├── svgShapes.ts           # generadores SVG por forma
│   │   └── whatsapp.ts            # WA_PHONE, WA_PHONE_ORDERS, helpers
│   ├── pages/
│   │   ├── index.astro            # / — home
│   │   ├── sobre-nosotros.astro   # /sobre-nosotros (galería + blog modal)
│   │   └── admin/                 # index.astro (panel) + login.astro
│   └── styles/                    # styles.css, tokens.css, admin.css
├── supabase/migrations/           # 001_products, 002_settings, 003_posts
├── astro.config.mjs
├── pnpm-workspace.yaml
├── package.json
├── AGENTS.md                      # contexto del proyecto (léelo antes de tocar nada)
└── README.md
```

## Modelo de auth y RLS

Toda la escritura pasa por `supabaseBrowser` (anon key + sesión de Supabase Auth) desde el admin en el browser. Las RLS policies filtran por `auth.role() = 'authenticated'`, por lo que un usuario no logueado no puede escribir.

**No hay service role key en el bundle** — esa key no se usa y no debe agregarse. Toda la lógica de admin es client-side, aprovechando que las RLS ya cubren los permisos.

## Constantes de negocio (no hardcodear)

Todas viven en `src/lib/`:

- `whatsapp.ts` → `WA_PHONE`, `WA_PHONE_ORDERS`, helpers `waLink`, `productWaLink`, `orderWaLink`, `defaultWaLink`.
- `contact.ts` → `LOCATIONS` (3 locales con `phone`, `display`, `image` y `address`).
- `orders.ts` → `MATERIALS`, `TREATMENTS`, `FOCAL_DISTANCES` (cada uno con `label` + `description`).
- `catalog.ts` → `DEFAULT_PRODUCTS`, `CATEGORIES`, `CATEGORY_LABEL`, `CATEGORY_CHIP`.
- `posts.ts` → `Post`, `PostCategory`, `DEFAULT_POSTS`, `formatPostDate`.

Toda URL de WhatsApp sale de `waLink()`. Todo precio pasa por `formatPrice()`. Toda fecha de post pasa por `formatPostDate()`. Toda ruta de asset (imagen, link, redirect JS) pasa por `import.meta.env.BASE_URL` (con slash final normalizado) — ningún path hardcodeado con `/`.

## Recursos visuales

- `logo.webp` (453×453): "Avilea ÓPTICA" en azul oscuro + rojo sobre fondo sky. Circular en navbar, rectangular en footer.
- `mascota_avilea.webp` (1264×678): personaje 3D con anteojos, fondo removido. En el lado derecho del Hero.
- `local_ciego1.jpg`, `local_pina2.jpg`, `local_moron.jpg`: fotos de cada local, mostradas en la sección Contacto y referenciadas por `LOCATIONS` en `contact.ts`.
- **Galería de `/sobre-nosotros`**: fotos en `public/img/galeria-*.jpg` (8 imágenes), paths en `galleryItems` en `sobre-nosotros.astro`.
- **Covers de posts**: se suben desde el admin; las imágenes se almacenan como data URLs en Supabase (no se suben a Storage). El seed inicial usa `picsum.photos` con seeds por slug.

## Documentación adicional

- **`AGENTS.md`** / **`CLAUDE.md`** (raíz del proyecto): contexto detallado, modelo de datos, decisiones arquitectónicas, reglas duras para la IA. Léelo entero antes de hacer cambios.
- **Original**: `../HTMLAvilea/README.md` para referencia de comportamiento y copy del sitio vanilla.
