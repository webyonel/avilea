# Avilea — sitio web (versión Astro)

Sitio público de **Avilea Óptica**, óptica comercial con locales en Ciego de Ávila, Ciro Redondo (Pina) y Morón, Cuba.

Migración desde el sitio vanilla original (`../HTMLAvilea/`) a **Astro 7** en modo SSR con `@astrojs/node` standalone.

## Features

- **Catálogo** con 8 categorías y filtros client-side.
- **Formulario de espejuelos a medida**: el visitante completa su receta y se abre WhatsApp con el resumen prellenado. No persiste en fase 1.
- **Probador virtual** dentro de `#pedido`: callout con un botón que abre un modal fullscreen. El usuario sube una foto y va cambiando armaduras desde un carrusel. Sin backend en fase 1 (UI/UX, no detecta la cara).
- **Sección de contacto** con una tarjeta por local (cada uno con su propio WhatsApp).
- **Página `/sobre-nosotros`**: hero + visión/cómo trabajamos + galería con lightbox + blog (3 posts seed) + CTA.
- Panel admin y persistencia (fase 2 con Supabase).

## Stack

- **Astro 7** con SSR (`output: 'server'`) + `@astrojs/node` standalone.
- **CSS vanilla** (`src/styles/`), sin Tailwind ni preprocesadores.
- **TypeScript** estricto.
- **pnpm** como package manager.

## Comandos

| Comando | Acción |
|---|---|
| `pnpm install` | Instala dependencias. |
| `pnpm dev` | Levanta el dev server en `localhost:4321` con HMR. |
| `pnpm build` | Genera el bundle SSR en `./dist/`. |
| `pnpm preview` | Sirve el bundle localmente para verificación. |

## Estructura

```
avilea/
├── public/
│   ├── logo.webp              # logo de marca
│   ├── mascota_avilea.webp    # mascota (hero)
│   ├── local_*.jpg            # fotos de los 3 locales
│   └── favicon.{svg,ico}
├── src/
│   ├── components/public/     # Navbar, Hero, Catalog, ProductCard,
│   │                         # FrameShape, Contact, Footer,
│   │                         # WhatsAppFloat, CustomOrderForm (con probador virtual),
│   │                         # Gallery, PostCard
│   ├── layouts/Layout.astro   # shell del sitio público
│   ├── lib/                   # catalog, orders, contact, whatsapp, format,
│   │                         # svgShapes, posts
│   ├── pages/
│   │   ├── index.astro            # / — home
│   │   └── sobre-nosotros.astro   # /sobre-nosotros
│   └── styles/                # styles.css, tokens.css
├── astro.config.mjs
├── package.json
├── CLAUDE.md                  # contexto del proyecto (léelo antes de tocar nada)
└── README.md
```

## Constantes de negocio (no hardcodear)

Todas viven en `src/lib/`:

- `whatsapp.ts` → `WA_PHONE`, `WA_PHONE_ORDERS`, helpers `waLink`, `productWaLink`, `orderWaLink`, `defaultWaLink`.
- `contact.ts` → `LOCATIONS` (3 locales con `phone`, `display`, `image` y `address`).
- `orders.ts` → `MATERIALS`, `TREATMENTS`, `FOCAL_DISTANCES` (cada uno con `label` + `description`).
- `catalog.ts` → `DEFAULT_PRODUCTS`, `CATEGORIES`, `CATEGORY_LABEL`, `CATEGORY_CHIP`.
- `posts.ts` → `Post`, `PostCategory`, `DEFAULT_POSTS`, `formatPostDate`.

Toda URL de WhatsApp sale de `waLink()`. Todo precio pasa por `formatPrice()`. Toda fecha de post pasa por `formatPostDate()`.

## Recursos visuales

- `logo.webp` (453×453): "Avilea ÓPTICA" en azul oscuro + rojo sobre fondo sky. Circular en navbar, rectangular en footer.
- `mascota_avilea.webp` (1264×678): personaje 3D con anteojos, fondo removido. En el lado derecho del Hero.
- `local_ciego1.jpg`, `local_pina2.jpg`, `local_moron.jpg`: fotos de cada local, mostradas en la sección Contacto y referenciadas por `LOCATIONS` en `contact.ts`.
- **Galería de `/sobre-nosotros`**: actualmente usa placeholders de `picsum.photos` con seeds tipo `avilea-local-ciego`. Reemplazar por fotos reales (subir a `public/img/` y editar `galleryItems` en `sobre-nosotros.astro`).
- **Covers de posts del blog**: igual, placeholders de `picsum.photos` con seeds por `id`. Reemplazar en `DEFAULT_POSTS` (`src/lib/posts.ts`).

## Documentación adicional

- **`CLAUDE.md`** (raíz del proyecto, alias `AGENTS.md`): contexto detallado, modelo de datos, decisiones arquitectónicas, reglas duras para la IA. Léelo entero antes de hacer cambios.
- **Original**: `../HTMLAvilea/README.md` para referencia de comportamiento y copy del sitio vanilla.
