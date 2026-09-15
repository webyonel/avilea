# AGENTS.md — Avilea (versión Astro)

> Documento de contexto que la IA lee cada vez que se abre una sección de este proyecto.
> Léelo entero antes de tocar cualquier archivo. Si algo aquí entra en conflicto con código real, gana el código y se actualiza este archivo.

---

## 1. Resumen

**Avilea** es una óptica comercial con 3 locales en Cuba: Ciego de Ávila, Ciro Redondo (Pina) y Morón. Este proyecto (`avilea/`) es la migración a **Astro** del sitio vanilla original (`/home/onel/Proyectos/Clientes/HTMLAvilea/`). Mantiene el mismo diseño base; **agrega** backend (Supabase + RLS), un **formulario de espejuelos a medida**, un **probador virtual con foto**, una **página Sobre Nosotros** con visión, galería y blog, y un **panel admin** con CRUD de productos y publicaciones.

Estado actual:

- `/` — Home con Hero, Catálogo, Probador virtual (dentro de `#pedido`), Formulario de pedido y Contacto.
- `/sobre-nosotros` — Visión / cómo trabajamos, galería de fotos, blog (modal fullscreen), CTA.
- `/admin` — Login con Supabase Auth. Panel con dashboard, CRUD productos, CRUD publicaciones, tasa USD → MN.
- Deploy **estático** en **GitHub Pages** vía GitHub Actions. Build-time: el frontmatter de cada página hace snapshot del contenido desde Supabase (anon key + RLS público). Runtime admin: escrituras desde el browser con sesión Supabase Auth + RLS `authenticated`.

---

## 2. Origen (referencia histórica)

`HTMLAvilea/` es el código fuente original, totalmente en HTML+CSS+JS vanilla. Cosas que **deben replicarse** tal cual:

- Catálogo: 8 armaduras + 9 accesorios del original (ver §5). El modelo actual los reemplaza por categorías expandidas (ver §5.1).
- Categorías: `pregraduados`, `armaduras`, `femenino`, `masculino`, `ninos`, `unisex`, `accesorios`, `gastronomia`. La categoría `sol` está eliminada.
- Moneda: **MN** (peso cubano), formato `1,850 MN`.
- WhatsApp principal (consultas, navbar, contacto, WA float): `+53 545 191 24` → constante `WA_PHONE`.
- WhatsApp dedicado a pedidos de espejuelos: `+53 545 193 47` → constante `WA_PHONE_ORDERS`.
- Cada local atiende por una línea distinta (ver §6.1).
- Mensaje WA genérico: `Hola Avilea, me interesa el producto "X" (1,850 MN). ¿Está disponible?`
- Dirección Ciego de Ávila: "Calle Joaquín de Agüero entre Honorato del Castillo y Maceo, #82, **en el Cine-Teatro Iriondo**, Ciego de Ávila, Cuba" (no "frente al").
- Horario: Lun–Sáb 9:00 AM – 6:00 PM.
- Idiomas: **solo español**, sin i18n.
- Admin: ahora usa **Supabase Auth** (email + password). El usuario se crea en **Supabase → Authentication → Users**. Las credenciales hardcoded de fase 1 están deprecadas.
- localStorage: ya no se usa para productos (`avilea_products` eliminado). El admin usa la sesión de Supabase que el cliente `@supabase/supabase-js` persiste automáticamente en localStorage del browser.

Cuando haya duda sobre comportamiento o copy, **consultar primero** `/home/onel/Proyectos/Clientes/HTMLAvilea/README.md` y el código en `HTMLAvilea/`.

---

## 3. Stack y decisiones arquitectónicas

| Decisión | Valor | Motivo |
|---|---|---|
| Framework | Astro 7.x | Migración desde HTML plano. |
| Modo de render | **Estático (`output: 'static'`)** | Deploy en GitHub Pages (sin servidor). El frontmatter de cada página hace fetch a Supabase al build → snapshot al deploy. |
| Adapter | **ninguno** | No hay SSR; GitHub Pages sirve los archivos estáticos del bundle. |
| Deploy | **GitHub Pages** vía `.github/workflows/deploy.yml` | Build + deploy automático en cada push a `main`. |
| Estilos | **CSS vanilla**, sin Tailwind ni preprocesadores | Decisión explícita del cliente. Se conserva `styles.css` y `admin.css` del original. |
| JS interactivo | Islas (`client:*`) o `<script>` en `.astro` | Filtros del catálogo, login admin, formulario a medida. |
| Package manager | `pnpm` | `pnpm-workspace.yaml` requiere `packages: ['.']` para pnpm 10+. |
| Node | `>=22.12.0` (en `package.json`) | El workflow usa Node 22. |
| Base path | `astro.config.mjs → base: '/avilea'` | El repo vive en `https://<owner>.github.io/avilea/`. Override con env `BASE_PATH`. **Todos** los assets, links y redirects concatenan con `import.meta.env.BASE_URL` (normalizado a `base/` con trailing slash). |

---

## 4. Estructura de carpetas (convención)

```
avilea/
├── .github/
│   └── workflows/deploy.yml  # GitHub Actions: build + deploy a GitHub Pages
├── public/
│   ├── logo.webp              # logo de marca (453×453, RGBA, fondo sky)
│   ├── mascota_avilea.webp    # mascota 3D (1264×678 RGBA, fondo removido)
│   ├── local_ciego1.jpg       # foto del local en Ciego
│   ├── local_pina2.jpg        # foto del local en Pina
│   ├── local_moron.jpg        # foto del local en Morón
│   ├── img/                   # galería de /sobre-nosotros (galeria-*.jpg)
│   ├── .nojekyll              # desactiva Jekyll en GitHub Pages
│   ├── favicon.svg            # favicon stylized "A" en rojo/azul
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── public/            # Componentes del sitio público
│   │   │   ├── Navbar.astro
│   │   │   ├── Hero.astro
│   │   │   ├── Catalog.astro
│   │   │   ├── ProductCard.astro
│   │   │   ├── FrameShape.astro       # SVG fallback por shape
│   │   │   ├── Contact.astro
│   │   │   ├── Footer.astro
│   │   │   ├── WhatsAppFloat.astro
│   │   │   ├── CustomOrderForm.astro  # espejuelos a medida + probador virtual
│   │   │   ├── Gallery.astro          # galería con lightbox (página /sobre-nosotros)
│   │   │   ├── PostCard.astro         # card del blog
│   │   │   └── PostModal.astro        # modal fullscreen de un post (blog)
│   │   └── admin/
│   │       └── MarkdownHelpModal.astro  # ayuda de markdown en el form de post
│   ├── db/
│   │   └── supabase.ts        # supabaseAnon (cliente build-time)
│   ├── layouts/
│   │   └── Layout.astro       # público (navbar + footer + WA float)
│   ├── lib/
│   │   ├── admin-auth.ts      # supabaseBrowser + signInBrowser + signOutBrowser
│   │   ├── catalog.ts         # Category, Product, DEFAULT_PRODUCTS, CATEGORY_LABEL/CHIP
│   │   ├── contact.ts         # LOCATIONS (3 locales con phone/display/image/address)
│   │   ├── format.ts          # formatPrice
│   │   ├── orders.ts          # CustomOrder, MATERIALS, TREATMENTS, FOCAL_DISTANCES, orderToMessage
│   │   ├── posts.ts           # Post, PostCategory, DEFAULT_POSTS, formatPostDate (blog)
│   │   ├── supabase-products.ts  # fetchProducts() (build-time)
│   │   ├── supabase-posts.ts     # fetchPosts() (build-time)
│   │   ├── svgShapes.ts       # generadores SVG por forma
│   │   └── whatsapp.ts        # WA_PHONE, WA_PHONE_ORDERS, waLink, productWaLink, orderWaLink, defaultWaLink
│   ├── pages/
│   │   ├── index.astro            # / — home
│   │   ├── sobre-nosotros.astro   # /sobre-nosotros
│   │   └── admin/
│   │       ├── index.astro        # /admin — panel (dashboard, CRUD productos, CRUD posts, tasa USD)
│   │       └── login.astro        # /admin/login — pantalla de login
│   └── styles/
│       ├── styles.css         # público (puerto de HTMLAvilea/styles.css)
│       ├── tokens.css         # variables CSS compartidas (paleta del logo)
│       └── admin.css          # panel admin
├── supabase/
│   └── migrations/
│       ├── 001_create_products.sql  # tabla products + RLS
│       ├── 002_create_settings.sql  # tabla settings (tasa USD)
│       └── 003_create_posts.sql     # tabla posts + RLS + seed
├── astro.config.mjs
├── pnpm-workspace.yaml        # requiere `packages: ['.']` para pnpm 10+
├── package.json
├── README.md
└── AGENTS.md
```

**Reglas de organización:**

- Cualquier constante de negocio (teléfono WA, dirección, horario, locales) vive en `src/lib/`. **Nunca** hardcoded en componentes.
- Toda ruta de asset (imagen, link, redirect JS) se construye con `import.meta.env.BASE_URL` (normalizado a `base/` con trailing slash). **Nunca** un path hardcodeado con `/` (ej. `src="/logo.webp"`). Esto rompe el deploy en subpath de GitHub Pages.
- CSS por componente: solo overrides locales con `<style>` scoped en el `.astro`. El grueso va en `src/styles/`.
- Cada sección grande del sitio = un componente en `components/public/`.
- Capas de Supabase (build-time): `src/lib/supabase-*.ts` para `products`, `posts`. Solo exponen `fetch*()` server-side. Sin escritura.
- Auth admin (runtime): `src/lib/admin-auth.ts` expone `supabaseBrowser` + helpers `signInBrowser` / `signOutBrowser`. Las escrituras se hacen desde el panel con `supabaseBrowser.from(tabla).insert/update/delete(...)`; las RLS policies filtran por `auth.role() = 'authenticated'`.

---

## 5. Modelo del catálogo

`DEFAULT_PRODUCTS` exportado desde `src/lib/catalog.ts` contiene **8 productos** (1 por categoría) como punto de partida. Se reemplaza/amplía desde el admin en fase 2.

Productos del catálogo original (referencia, no en el modelo actual):
- **8 armaduras**: Aria, Nora, Onix, Bruno, Lumen, Vento, Solar Aventura, Solar Tropico.
- **9 accesorios**:
  - 3 estuches: Rígido, Semirrígido, de Tela
  - 3 cordones: Deportivo, Cuero, con Clip
  - 3 limpieza: Líquido Limpiador 30ml, Toallitas x20, Kit de Limpieza Completo

### 5.1 Categorías y colores chip

| Categoría | ID | Label | Color chip |
|---|---|---|---|
| Pregraduados | `pregraduados` | Pregraduados | ámbar `#fef3c7` |
| Armaduras | `armaduras` | Armaduras | primary-soft `#e3ecf8` |
| Femenino | `femenino` | Femenino | rosa `#fce7f3` |
| Masculino | `masculino` | Masculino | azul `#dbeafe` |
| Niños | `ninos` | Niños | naranja `#fed7aa` |
| Unisex | `unisex` | Unisex | verde `#d1fae5` |
| Accesorios | `accesorios` | Accesorios | lavanda `#ede9fe` |
| Gastronomía | `gastronomia` | Gastronomía | rojo suave `#fee2e2` |

La categoría `sol` no existe. Cualquier producto viejo con `category === 'sol'` se reclasifica a `unisex` en el helper de migración (`src/lib/catalog.ts → migrateProducts()`).

### 5.2. Forma del producto

```ts
type Product = {
  id: string;              // slug estable, único
  name: string;            // nombre en español
  category: 'pregraduados' | 'armaduras' | 'femenino' | 'masculino'
           | 'ninos' | 'unisex' | 'accesorios' | 'gastronomia';
  price: number;           // MN, sin formato (ej. 1850)
  image: string | null;    // ruta pública, ej. '/img/aria.webp', o null
  shape?: 'round' | 'cat' | 'rect' | 'square' | 'rimless'
       | 'aviator' | 'wayfarer'
       | 'case' | 'cord' | 'bottle' | 'wipes' | 'kit';
  color?: string;          // color del frame (hex), usado en SVG fallback
  description?: string;    // opcional, para /productos/:slug o futuro
};
```

### 5.3. Storage (Supabase, fase 2)

- **Persistencia**: tabla `public.products` en Supabase (definida en `supabase/migrations/001_create_products.sql`).
- **Build-time (sitio público)**: `fetchProducts()` en `src/lib/supabase-products.ts` usa `supabaseAnon`. La RLS `products_public_read` permite lectura con anon key.
- **Runtime (admin)**: panel admin en `/admin` usa `supabaseBrowser` con sesión activa. La RLS `products_authenticated_write` (`auth.role() = 'authenticated'`) cubre INSERT/UPDATE/DELETE.
- `DEFAULT_PRODUCTS` en `src/lib/catalog.ts` queda como **seed inicial / fallback** (idéntico al insert de la migración 001). El sitio público no lo usa si Supabase responde; el admin puede confiar en los datos remotos.
- **Imagen**: se sube desde el admin como data URL (JPEG comprimido client-side, ~500 KB) y se guarda en la columna `image`. No se usa Supabase Storage para mantener el bundle simple.

---

## 6. Convenciones de negocio

### 6.1. WhatsApp

```ts
// src/lib/whatsapp.ts
// Línea principal del negocio (consultas, navbar, contacto, WA float).
export const WA_PHONE = '5354519124';              // sin "+", formato wa.me
export const WA_DISPLAY = '+53 545 191 24';        // cómo se muestra al usuario

// Línea DEDICADA a pedidos de espejuelos a medida. Distinta de WA_PHONE.
// (Dato provisto por el cliente; no es fallback, no se reutiliza para consultas.)
export const WA_PHONE_ORDERS = '5354519347';

export function buildProductMessage(product: Product): string {
  const price = `${product.price.toLocaleString('es-ES')} MN`;
  return `Hola Avilea, me interesa el producto "${product.name}" (${price}). ¿Está disponible?`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function productWaLink(product: Product): string {
  return waLink(WA_PHONE, buildProductMessage(product));
}

export function defaultWaLink(message: string): string {
  return waLink(WA_PHONE, message);
}

export function orderWaLink(order: CustomOrder): string {
  return waLink(WA_PHONE_ORDERS, orderToMessage(order));
}
```

**Todos** los enlaces a WhatsApp del sitio pasan por `waLink()`. Nunca se escribe `wa.me/` a mano en un componente. **Distinción crítica:** consultas van a `WA_PHONE`, pedidos del formulario de espejuelos van a `WA_PHONE_ORDERS`.

### 6.1.1. WhatsApp por local (sección Contacto)

Cada local tiene su propia línea. Los datos viven en `src/lib/contact.ts → LOCATIONS`:

| Local | ID | Teléfono wa.me | Display | Foto | Dirección |
|---|---|---|---|---|---|
| Ciego de Ávila | `ciego` | `5352451626` | `+53 524 516 26` | `local_ciego1.jpg` | Calle Joaquín de Agüero entre Honorato del Castillo y Maceo, #82, en el Cine-Teatro Iriondo |
| Ciro Redondo (Pina) | `pina` | `5354519347` | `+53 545 193 47` | `local_pina2.jpg` | La óptica del hospital |
| Morón | `moron` | `53812546` | `+53 812 546` | `local_moron.jpg` | Calle Martí, esquina San José, local de "Delavida" |

Cada tarjeta de local construye su propio `waLink(loc.phone, ...)`. La línea de Pina (`5354519347`) **coincide** con `WA_PHONE_ORDERS` (no es un cambio, ya venía así).

### 6.2. Moneda y formato

- Formato: `1,850 MN` (separador de miles con coma, sin decimales).
- Helper: `formatPrice(value: number): string` en `src/lib/format.ts`.

### 6.3. Idioma

- 100% español. Sin `i18n/`. Sin claves de traducción. Nombres de productos, copy y mensajes WA en español.
- Atributo `<html lang="es">` en `Layout.astro`.

---

## 7. Sistema de imágenes

- **Assets de marca** (logo, mascota, fotos de locales) viven en `public/` raíz: `logo.webp`, `mascota_avilea.webp`, `local_*.jpg`. No siguen la convención `public/img/` original — son archivos entregados por el cliente con nombres específicos.
- **Imágenes del catálogo** (cuando se carguen): convención `public/img/` (copiar de `HTMLAvilea/img/`).
- Las imágenes con caracteres raros en el nombre (`?`, espacios, `)`, `'`) **se sirven URL-encoded** mientras no se renombren. Esto está documentado como deuda técnica no prioritaria (ver §12.4).
- Productos sin imagen → SVG inline generado por `FrameShape.astro` (recibe `shape` + `color`). Shapes soportadas: `round`, `cat`, `rect`, `square`, `rimless`, `aviator`, `wayfarer`, `case`, `cord`, `bottle`, `wipes`, `kit`. `cloth` y `spray` están eliminadas.

### 7.1. Logo y mascota

- `logo.webp` (453×453, RGBA): "Avilea ÓPTICA" en azul oscuro + rojo + fondo sky. **Circular en navbar** (`border-radius: 50%`, ~52px). **Rectangular con --radius-sm en footer** (~80px).
- `mascota_avilea.webp` (1264×678, RGBA): personaje 3D con anteojos. Fondo removido con PIL (umbral por luminancia mínima). Ubicado en el lado derecho del Hero, reemplaza al antiguo `.hero-visual` con cards SVG. Animación `floatMascot` (sube/baja 10px cada 6s).

---

## 8. Panel admin (Supabase Auth + RLS, deploy estático)

### 8.1. Auth

- **Sin credenciales hardcoded**: el login usa Supabase Auth. El usuario admin se crea en **Supabase → Authentication → Users** (email + password).
- Cliente: `supabaseBrowser` en `src/lib/admin-auth.ts`. Persiste sesión automáticamente en localStorage del browser vía `@supabase/supabase-js`.
- **Sin service role key** — esa key nunca debe aparecer en el bundle (sería pública). Todas las escrituras del admin pasan por `supabaseBrowser` con anon key + sesión activa, y las RLS policies cubren los permisos.

### 8.2. Sesión

- La sesión la maneja Supabase (`supabaseBrowser.auth.getSession()`). El panel admin chequea al cargar y redirige a `/admin/login` si no hay sesión.
- Logout: `signOutBrowser()` en `admin-auth.ts` borra la sesión local.

### 8.3. Rutas

- `/admin` → si no hay sesión, redirige a `/admin/login`. Si hay, muestra el panel.
- `/admin/login` → formulario de Supabase Auth. Éxito → redirige a `/admin`.
- **No hay middleware** (el deploy es estático, no hay server). La protección se hace client-side en cada vista con `getSession()`.

### 8.4. Funcionalidad

- **Dashboard**: KPIs (productos totales, categorías, publicaciones), productos recientes, tasa USD → MN editable (lee/escribe en tabla `settings`).
- **Productos** (`/admin#productos`): listar, crear, eliminar. Imagen se sube desde el admin (data URL comprimida en canvas). Categorías que requieren ID manual (`armaduras`, `femenino`, `masculino`, `ninos`, `unisex`, `accesorios`) lo piden explícitamente; el resto auto-genera desde el nombre.
- **Blog** (`/admin#blog`): listar, crear, eliminar publicaciones. Slug se auto-genera desde el título (`slugify()`). Editor markdown con modal de ayuda (`MarkdownHelpModal`).
- **Sin edición inline** de productos/posts: solo crear + listar + eliminar. Edición se puede agregar después si hace falta.
- **Tasa USD** (`/admin#dashboard`): input numérico que upsert en `settings` (`key = 'usd_rate'`, `value = número`). El sitio público aún no la usa (no se muestran precios en USD); es solo para uso futuro.

### 8.5. Bugs y detalles visuales que ya están resueltos

- **Login**: inputs flex con `min-width: 0` para que el toggle de contraseña no se salga.
- **Sidebar móvil**: el toggle lleva `e.stopPropagation()` para no cerrar el menú al abrirlo.
- **Textarea dentro de `.input-wrap`**: hereda transparente y `flex: 1`, sin borde propio (la wrap aporta el borde). Sin esto se duplicaba el border y el placeholder se cortaba.
- **Upload zone con compresión canvas**: 4 pasadas bajando resolución/calidad (1200/0.85 → 1000/0.80 → 800/0.75 → 700/0.70) hasta entrar en ~500 KB.

---

## 9. Formulario de espejuelos a medida

### 9.1. Objetivo

Que el visitante pueda pedir armaduras graduadas a medida. El envío **no persiste en backend**: solo abre WhatsApp en la línea dedicada `WA_PHONE_ORDERS` con el resumen prellenado.

### 9.2. Ubicación

- **Sección** dentro de la home (`#pedido`), ubicada entre `#productos` y `#contacto`.
- Enlace en el navbar público: `#pedido` ("Pedido"), entre "Productos" y "Sobre Nosotros".
- Componente: `src/components/public/CustomOrderForm.astro`.
- Si en el futuro se quiere como página aparte (`/pedido`), se puede extraer; no se hace preventivamente.

### 9.3. Campos del formulario

**Datos personales** (obligatorios):
- Nombre y Apellidos
- Carnet de Identidad

**Armadura**:
- **Card de selección** (visible solo si hay selección del probador): muestra el thumb SVG + nombre + precio de la armadura elegida en el probador virtual, con botón "Quitar" para limpiarla.
- **Inputs manuales** (siempre visibles, fallback): "Nombre (manual)" y "Precio (MN)". Sirven cuando el cliente NO usó el probador virtual y quiere tipear el nombre y precio de la armadura que vio en el catálogo/tienda.
- **Hidden input `armaduraId`**: lo setea automáticamente el script cuando el cliente elige una armadura del probador. Su presencia indica "selección del catálogo".
- **Regla de envío por WhatsApp**:
  - Si `armaduraId` está set → la sección *Armadura* del mensaje lleva `• ID de catálogo: <id>`.
  - Si NO hay ID pero hay nombre/precio manuales → lleva `• Manual: <nombre> (<precio> MN)`.
  - Si no hay nada → `• —`.

**Lente** (con descripciones popover al click del ⓘ):
- **Material** (radio único): CR-9 (Orgánico), Policarbonato, High Index.
- **Tratamientos** (checkbox multi): Antirreflejo, Fotocromático, Polarizado, Filtro de luz azul.
- **Distancias focales** (checkbox multi): Monofocal, Bifocal, Progresivo.

**Receta** (por ojo OD / OI, opcionales):
- Esfera, Cilindro, Eje (°), Prisma, Base.

**Adicional** (opcionales):
- Adición, Distancia pupilar (mm), Eje de astigmatismo (°).

Los arrays `MATERIALS`, `TREATMENTS`, `FOCAL_DISTANCES` en `src/lib/orders.ts` llevan cada uno un campo `description` con texto en lenguaje claro que se muestra en el popover.

### 9.4. Comportamiento al enviar

1. Validación cliente (`required` en `fullName` y `ci`; resto opcional).
2. Construir mensaje con `orderToMessage(order)` (`src/lib/orders.ts`).
3. Abrir `https://wa.me/${WA_PHONE_ORDERS}?text=...` en pestaña nueva (`_blank`, `noopener`).
4. Mostrar confirmación visual "Te redirigimos a WhatsApp" y vaciar el form.
5. **No** se guarda nada en localStorage ni se envía a backend en fase 1.

### 9.5. Forma del objeto

```ts
// src/lib/orders.ts
type EyeData = {
  esfera: string;
  cilindro: string;
  eje: string;       // 0–180
  prisma: string;
  base: string;
};

type Material = 'cr9' | 'policarbonato' | 'high_index';
type Treatment = 'antirreflejo' | 'fotocromatico' | 'polarizado' | 'filtro_luz_azul';
type FocalDistance = 'monofocal' | 'bifocal' | 'progresivo';

type CustomOrder = {
  fullName: string;
  ci: string;
  armaduraId: string | null;     // null si no usó el probador; ID del catálogo si lo usó
  armaduraNombre: string;        // fallback manual cuando armaduraId es null
  armaduraPrecio: string;        // fallback manual cuando armaduraId es null
  material: Material | '';
  treatments: Treatment[];
  focalDistances: FocalDistance[];
  rightEye: EyeData;
  leftEye: EyeData;
  adicion: string;
  distanciaPupilar: string;
  ejeAstigmatismo: string;
};
```

`orderToMessage(order: CustomOrder): string` arma un mensaje legible multi-línea con secciones `*Datos personales*`, `*Armadura*`, `*Lente*`, `*Ojo derecho*`, `*Ojo izquierdo*`, `*Adicional*`. Campos vacíos se renderizan como `—`. En la sección *Armadura*, si `armaduraId` está set se manda solo el ID (la tienda lo cruza con el catálogo); si no, se manda el nombre y precio manuales.

### 9.6. Probador virtual (callout + modal fullscreen)

Dentro de `#pedido`, justo encima del `<form>`, hay un callout "**¿Querés ver cómo te quedan antes de pedirlas?**" con el botón primario "Probar armaduras". Al click se abre `#tryonModal`, un modal con dos estados y un footer con link "completá el pedido" (que hace scroll al form).

**Detección de cara** (MediaPipe Face Landmarker, 478 landmarks): corre 100% en el browser (WASM con delegate GPU). Solo usa los landmarks `33` (esquina exterior ojo derecho) y `263` (esquina exterior ojo izquierdo) para calcular el centro de los ojos, el ancho del overlay (distancia entre ojos × 2.6) y el ángulo de rotación (roll de la cabeza). `computeOverlayPosition` compensa el recorte de `object-fit: cover` para mapear coordenadas normalizadas → píxeles del contenedor.

**Modelo bundleado localmente**: `public/mediapipe/face_landmarker.task` (1.8 MB, float16). Se sirve desde el mismo sitio en `${import.meta.env.BASE_URL}mediapipe/face_landmarker.task` — sin dependencia de Google Storage en runtime. El bundle JS + WASM siguen viniendo de jsDelivr CDN (`@mediapipe/tasks-vision@0.10.18`) por su tamaño pequeño y caching global.

**Preload agresivo**: `preloadFaceLandmarker()` se dispara apenas carga la página con `requestIdleCallback` (fallback `setTimeout(1500)`). Cuando el usuario abre el modal + sube la foto, el modelo ya está cacheado — la detección es casi instantánea.

**Progreso real en la UI**: `prefetchModelWithProgress` usa `fetch + ReadableStream` y reporta 0..100% mientras baja el modelo. El indicador del canvas muestra:
- `Descargando modelo… XX%` durante la descarga (caso primera visita).
- `Inicializando…` cuando llega al 100% y se crea el FaceLandmarker.
- `Analizando tu foto…` durante `detect()` (suele ser <100ms).
Si el modelo ya estaba cacheado, el progreso pasa 0→100 muy rápido y el usuario ve "Analizando tu foto…" casi directo.

**Privacidad**: la foto nunca sale del dispositivo. `URL.createObjectURL(file)` crea un blob local que solo vive en memoria del browser.

**Filter de armaduras**: el componente recibe `products: Product[]` por prop. Filtra in-place por `shape ∈ {round, cat, rect, square, rimless, aviator, wayfarer}` para descartar accesorios. Renderiza cada item con `renderShape(p.shape, p.color ?? '#0a1f5c')` en el thumb del rail.

**Mobile-first**: el modal ocupa todo el viewport en móvil (`position: fixed; inset: 0`) y se centra como panel flotante ≥ 980px. Doble path de subida: botón "Elegir foto" (galería) o "Tomar foto ahora" (dispara `<input>` con `capture="user"` para abrir la cámara frontal).

**Props**: `CustomOrderForm` recibe `products?: Product[]` con default `DEFAULT_PRODUCTS`. La home pasa `products={DEFAULT_PRODUCTS}` desde `index.astro`.

---

## 10. Supabase (Fase 2 — implementado)

### 10.1. Lo que ya está hecho

- **Auth real**: Supabase Auth con email/password. Las credenciales hardcoded de fase 1 están deprecadas. El usuario admin se crea en Supabase → Authentication → Users.
- **Productos**: tabla `public.products` con seed en `001_create_products.sql`. Lectura pública + escritura autenticada vía RLS.
- **Posts (blog)**: tabla `public.posts` con seed en `003_create_posts.sql`. Lectura pública solo `is_published = true`; escritura autenticada.
- **Settings (tasa USD)**: tabla `public.settings` (`key text pk`, `value jsonb`) en `002_create_settings.sql`. Upsert autenticado.
- **Admin client-side**: panel admin en `/admin` hace todo vía `supabaseBrowser` (anon key + sesión Supabase). Las RLS filtran por `auth.role() = 'authenticated'`.
- **Sitio público (build-time)**: cada página hace fetch a Supabase en el frontmatter (con `supabaseAnon`) y serializa el resultado al bundle estático.

### 10.2. Variables de entorno

`.env` (en `.gitignore`):

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

Cargar con `import.meta.env.PUBLIC_*` (necesario el prefijo `PUBLIC_` para que Astro lo exponga al cliente). **No hay service role key** — esa key no se usa y no debe agregarse.

En GitHub Actions se configuran como **Variables** (NO Secrets, porque son públicas y van al bundle): `Settings → Secrets and variables → Actions → Variables`.

### 10.3. Migraciones

Archivos en `supabase/migrations/` (idempotentes, correr en orden en Supabase → SQL Editor):

- `001_create_products.sql` — tabla `products` + RLS + seed de `DEFAULT_PRODUCTS`.
- `002_create_settings.sql` — tabla `settings` (`key` PK text, `value` jsonb).
- `003_create_posts.sql` — tabla `posts` + RLS + seed de 3 posts.

### 10.4. Estructura real de las tablas

- `products`: `id` (text PK), `name`, `category`, `price` (numeric), `image` (text), `shape`, `color`, `description`, `created_at`, `updated_at`. CHECK de categoría en 8 valores.
- `posts`: `id` (uuid PK default `gen_random_uuid()`), `slug` (text unique), `title`, `excerpt`, `content` (markdown), `cover`, `category`, `author`, `is_published` (bool), `published_at`, `created_at`, `updated_at`. CHECK de categoría en 4 valores.
- `settings`: `key` (text PK), `value` (jsonb).

### 10.5. Pendientes futuros

- **Persistencia de pedidos**: hoy el formulario abre WhatsApp sin guardar. Tabla `custom_orders` queda como trabajo futuro cuando el cliente lo pida.
- **Edición inline** de productos y posts (hoy solo crear/eliminar).
- **Storage de imágenes**: hoy se guardan como data URLs en la columna `image`/`cover`. Si las imágenes crecen mucho (>1 MB), conviene migrar a Supabase Storage con URL pública.
- **Sanitización de markdown**: el contenido se renderiza con `marked` y se inyecta con `innerHTML`. Hoy el seed viene solo del SQL (sin input del admin), así que el riesgo XSS es bajo. Cuando se habilite admin con input de usuario, envolver la salida con `DOMPurify` antes del `innerHTML`.

---

## 11. Estilos y responsive

### 11.1. CSS vanilla

- Archivos en `src/styles/`: `styles.css` (público) + `admin.css` (panel admin) + `tokens.css` (variables compartidas, importado por los dos).
- Scope local permitido: `<style>` dentro de un `.astro` para overrides específicos.
- **No** instalar Tailwind, Sass ni ningún preprocesador.

### 11.2. Paleta de colores (tokens.css)

Derivada del logo `logo.webp`:

| Token | Valor | Origen |
|---|---|---|
| `--primary` / `--ink` / `--dark` | `#0a1f5c` | azul oscuro del logo |
| `--primary-2` | `#1a3589` | hover |
| `--primary-soft` | `#e3ecf8` | tinte azul claro |
| `--accent` | `#e30613` | rojo del logo |
| `--accent-2` | `#b80510` | hover |
| `--sky` | `#b3d4ec` | azul claro decorativo |
| `--wa` / `--wa-2` | `#25d366` / `#1ebe5d` | verde WhatsApp |
| `--bg` / `--bg-alt` | `#fafbfc` / `#eaf3fa` | superficies |
| `--line` | `#dbe6f1` | bordes con leve tinte azul |

### 11.3. Breakpoints

| Breakpoint | Cambios principales |
|---|---|
| ≤ 980px | Hero a una columna, locations-grid a 1 col, footer 1 col |
| ≤ 720px | Navbar hamburguesa, mascot `max-width: 320px`, WhatsApp float más pequeño |

---

## 12. Pendientes y notas

### 12.1. Popup "En" en capturas

Es Google Translate del navegador, **no** parte del sitio. Se desactiva en `chrome://settings/languages`. No tocar.

### 12.2. Migración de imágenes

Deuda técnica no prioritaria. Las imágenes con caracteres raros en el nombre se sirven URL-encoded. Renombrar archivos a nombres limpios y quitar el encoding del código solo si se decide hacer el trabajo. **No** hacerlo preventivamente.

### 12.3. Hardening de credenciales

✅ **Hecho**: el admin ahora usa Supabase Auth. La contraseña se gestiona desde Supabase (no hardcoded). El usuario admin se crea en Authentication → Users.

### 12.4. `WA_PHONE`

Constante única. Cualquier URL `wa.me/` debe salir de `src/lib/whatsapp.ts`. **Nunca** hardcoded en componentes. Para los 3 locales usar `waLink(loc.phone, ...)` desde `src/lib/contact.ts`.

### 12.5. `pnpm-workspace.yaml`

Existe en la raíz del proyecto. **Tiene `packages: ['.']`** (requerido por pnpm 10+; si falta, el `pnpm install` falla con `ERROR packages field missing or empty`). No es un workspace real: solo declara la raíz como paquete único para que pnpm 10 valide. **No agregar más entradas** ni crear `packages/` a menos que se confirme intención de monorepo.

### 12.6. Migraciones de localStorage

Ya no aplica. Productos y posts viven en Supabase. La sesión admin la maneja Supabase Auth (persistida automáticamente por `@supabase/supabase-js` en localStorage del browser; no se usa `avilea_products` ni `avilea_admin_session`).

### 12.7. Reveal animation bug

`.product-card` tiene `class="reveal"` hardcoded en `ProductCard.astro`. Si se reemplaza o se mueven las cards, **asegurarse de que `.product-card` siga en el selector del `IntersectionObserver` en `Layout.astro`** — sino las cards quedan con `opacity: 0` y nunca aparecen. El mismo cuidado aplica a cualquier otro elemento que use la clase `.reveal`.

### 12.8. Página "Sobre Nosotros"

**Implementada como página aparte** en `src/pages/sobre-nosotros.astro` (no como sección ancla). El link del navbar apunta a `/sobre-nosotros` y se marca con `is-active` cuando estás en esa ruta. Contiene:

- Hero (`#sobre-nosotros` como anchor interno para deep-links).
- Visión / cómo trabajamos (`#vision`) — grid de 2 columnas: prosa + 3 cards de pilares.
- Galería (`#galeria`) — componente `Gallery.astro` con grid 1/2/3 cols (mobile/tablet/desktop) + lightbox fullscreen al click.
- Blog (`#blog`) — **posts desde Supabase** vía `fetchPosts()` en `src/lib/supabase-posts.ts` (anon + RLS `posts_public_read`). Render como cards (`PostCard.astro`) + modal fullscreen (`PostModal.astro`) al click.
- CTA final oscuro (`#contactanos`) con WhatsApp.

El modal escucha el custom event `post:open` (disparado por cada `PostCard` con `data-post`). El sitio público se recompone al deploy; el admin CRUD vive en `/admin#blog`.

> **Nota sobre el reveal**: las nuevas secciones usan `data-reveal` (en vez de `.product-card` / `.section-head`). El `IntersectionObserver` de `Layout.astro` ya está extendido para aceptar `[data-reveal]` además de las clases legacy. Si agregás otro tipo de card animable, marcá el contenedor con `data-reveal` en vez de pedir cambios al layout.

### 12.9. Categorías placeholder

Los productos default en las categorías `pregraduados`, `ninos` y `gastronomia` son placeholders genéricos ("Lente de Lectura", "Marco Infantil", "Producto Gastronomía"). Reemplazar cuando se defina el catálogo real (vía admin).

### 12.10. Base path (GitHub Pages subpath)

El repo se deploya en `https://<owner>.github.io/avilea/`. `astro.config.mjs` define `base: '/avilea'`. **Todos** los assets, links y redirects concatenan con `import.meta.env.BASE_URL` (normalizado a `base/` con trailing slash). **Nunca** un path hardcodeado con `/` (ej. `src="/logo.webp"` o `href="/admin"` en JS) — se rompería el deploy en subpath.

### 12.11. Public content = build-time snapshot

El sitio público hace fetch a Supabase en el frontmatter. Eso significa que **el contenido se congela al deploy**. Cambios desde el admin (crear/eliminar producto o post, cambiar tasa USD) **no se reflejan en el sitio público hasta el próximo deploy**. Si se quiere ver un cambio inmediato, hay que pushear a `main` (o "Run workflow" en Actions).

---

## 13. Cómo desarrollar

### 13.1. Dev server

```sh
pnpm dev
```

Levanta en `localhost:4321` con HMR. Sirve el sitio con la `base` correcta.

### 13.2. Build y preview

```sh
pnpm build          # genera ./dist con bundle estático
pnpm preview        # sirve ./dist localmente (sirve a subpath vacío; usar tunnel para probar con /avilea/)
```

### 13.3. Resetear sesión admin

Para cerrar sesión: clic en "Cerrar sesión" en el panel. Para forzar logout: DevTools → Application → Local Storage → borrar las claves `sb-<project>-auth-token` (el cliente de Supabase las crea automáticamente).

---

## 14. Documentación externa

- Astro general: https://docs.astro.build
- Routing y páginas: https://docs.astro.build/en/guides/routing/
- Componentes: https://docs.astro.build/en/basics/astro-components/
- Islas / framework components: https://docs.astro.build/en/guides/framework-components/
- Content Collections: https://docs.astro.build/en/guides/content-collections/
- Estilos: https://docs.astro.build/en/guides/styling/
- GitHub Pages: https://docs.github.com/en/pages
- GitHub Actions (Pages): https://github.com/actions/deploy-pages
- Supabase (JS client + Auth + RLS): https://supabase.com/docs/reference/javascript

---

## 15. Reglas duras para la IA (resumen)

Si alguna de estas se rompe, está mal. No negociar sin pedir al usuario:

1. **No cambiar** `WA_PHONE`, `WA_PHONE_ORDERS`, dirección de Ciego ("en el Cine Iriondo"), horario ni formato de moneda.
2. **No introducir** Tailwind, Sass, Styled Components ni frameworks de CSS.
3. **No romper** los breakpoints ni los IDs de sección del sitio público (`#inicio`, `#productos`, `#pedido`, `#contacto`).
4. **No usar** `localStorage` para datos propios. Solo Supabase persiste catálogo/posts/sesión admin.
5. **No persistir** pedidos del formulario en el backend (solo abre WhatsApp).
6. **No agregar** paquetes al `pnpm-workspace.yaml` ni crear `packages/` (no es monorepo).
7. **No usar** `service_role` key ni pedirla/almacenarla: todo va por `supabaseBrowser` + RLS.
8. **Toda URL de WhatsApp** sale de `waLink()` (o `productWaLink` / `orderWaLink` / `defaultWaLink`).
9. **Todo formato de precio** pasa por `formatPrice()`. **Toda fecha de post** pasa por `formatPostDate()`.
10. **Todo path de asset/link/redirect** concatena con `import.meta.env.BASE_URL` (normalizado a `base/`). Nunca hardcodear `/`.
11. Si el código entra en conflicto con este documento, **gana el código** y se actualiza el documento, no al revés.
