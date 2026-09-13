# AGENTS.md — Avilea (versión Astro)

> Documento de contexto que la IA lee cada vez que se abre una sección de este proyecto.
> Léelo entero antes de tocar cualquier archivo. Si algo aquí entra en conflicto con código real, gana el código y se actualiza este archivo.

---

## 1. Resumen

**Avilea** es una óptica comercial con 3 locales en Cuba: Ciego de Ávila, Ciro Redondo (Pina) y Morón. Este proyecto (`avilea/`) es la migración a **Astro** del sitio vanilla original (`/home/onel/Proyectos/Clientes/HTMLAvilea/`). Mantiene el mismo diseño base; **agrega** backend (Supabase, en fase 2), un **formulario de espejuelos a medida**, un **probador virtual con foto** y una **página Sobre Nosotros** con visión, galería y blog.

Estado actual:

- `/` — Home con Hero, Catálogo, Probador virtual (dentro de `#pedido`), Formulario de pedido y Contacto.
- `/sobre-nosotros` — Visión / cómo trabajamos, galería de fotos, blog, CTA.
- Admin y persistencia de pedidos aún no implementados (fase 2 con Supabase).

SSR con `@astrojs/node` standalone.

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
- Admin: credenciales hardcoded `onelmartinezv@gmail.com` / `onelito17` (se mantienen en fase 1; ver §8).
- localStorage clave `avilea_products`.

Cuando haya duda sobre comportamiento o copy, **consultar primero** `/home/onel/Proyectos/Clientes/HTMLAvilea/README.md` y el código en `HTMLAvilea/`.

---

## 3. Stack y decisiones arquitectónicas

| Decisión | Valor | Motivo |
|---|---|---|
| Framework | Astro 7.x | Migración desde HTML plano. |
| Modo de render | **SSR (`output: 'server'`)** | Necesario para `@astrojs/node` y futuros endpoints de Supabase. |
| Adapter | **`@astrojs/node`** en modo `standalone` | Único adapter instalado; evita dependencia de plataforma de deploy. |
| Estilos | **CSS vanilla**, sin Tailwind ni preprocesadores | Decisión explícita del cliente. Se conserva `styles.css` y `admin.css` del original. |
| JS interactivo | Islas (`client:*`) o `<script>` en `.astro` | Filtros del catálogo, login admin, formulario a medida. |
| Package manager | `pnpm` | — |
| Node | `>=22.12.0` (en `package.json`) | — |

---

## 4. Estructura de carpetas (convención)

```
avilea/
├── public/
│   ├── logo.webp              # logo de marca (453×453, RGBA, fondo sky)
│   ├── mascota_avilea.webp    # mascota 3D (1264×678 RGBA, fondo removido)
│   ├── local_ciego1.jpg       # foto del local en Ciego
│   ├── local_pina2.jpg        # foto del local en Pina
│   ├── local_moron.jpg        # foto del local en Morón
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
│   │   │   └── PostCard.astro         # card del blog
│   │   └── admin/             # (fase 2) Panel admin
│   ├── layouts/
│   │   └── Layout.astro       # público (navbar + footer + WA float)
│   ├── lib/
│   │   ├── catalog.ts         # Category, Product, DEFAULT_PRODUCTS, CATEGORY_LABEL/CHIP
│   │   ├── orders.ts          # CustomOrder, MATERIALS, TREATMENTS, FOCAL_DISTANCES, orderToMessage
│   │   ├── contact.ts         # LOCATIONS (3 locales con phone/display/image/address)
│   │   ├── whatsapp.ts        # WA_PHONE, WA_PHONE_ORDERS, waLink, productWaLink, orderWaLink, defaultWaLink
│   │   ├── format.ts          # formatPrice
│   │   ├── svgShapes.ts       # generadores SVG por forma
│   │   └── posts.ts           # Post, PostCategory, DEFAULT_POSTS, formatPostDate (blog)
│   ├── pages/
│   │   ├── index.astro            # / — home
│   │   └── sobre-nosotros.astro   # /sobre-nosotros
│   └── styles/
│       ├── styles.css         # público (puerto de HTMLAvilea/styles.css)
│       └── tokens.css         # variables CSS compartidas (paleta del logo)
├── astro.config.mjs
├── package.json
├── README.md
└── AGENTS.md
```

**Reglas de organización:**

- Cualquier constante de negocio (teléfono WA, dirección, horario, credenciales, locales) vive en `src/lib/`. **Nunca** hardcoded en componentes.
- CSS por componente: solo overrides locales con `<style>` scoped en el `.astro`. El grueso va en `src/styles/`.
- Cada sección grande del sitio = un componente en `components/public/`.

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

### 5.3. Storage y migración (fase 1)

- Persistencia: `localStorage` clave `avilea_products`.
- Al cargar, aplicar en orden:
  1. Reclasificar `sol` → `unisex`.
  2. Agregar productos del array por defecto que no estén en localStorage (comparar por `id`).
  3. Rellenar `image` en productos que estén en `null` y tengan archivo físico.
- El array por defecto vive en `src/lib/catalog.ts` como `DEFAULT_PRODUCTS`.

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

## 8. Panel admin (Fase 1: localStorage)

### 8.1. Credenciales

```ts
// src/lib/auth.ts (SOLO FASE 1 — mover a Supabase en fase 2)
export const ADMIN_EMAIL = 'onelmartinezv@gmail.com';
export const ADMIN_PASSWORD = 'onelito17';
```

> **Nota de seguridad**: estas credenciales son conocidas y son la realidad del negocio original. **No** cambiarlas sin conversación explícita con el cliente. En fase 2 se reemplazan por auth real de Supabase.

### 8.2. Sesión

- `localStorage` clave `avilea_admin_session`: `{ loggedIn: true, ts: number }`.
- Expiración: 8 horas desde login (`Date.now() - ts > 8 * 3600 * 1000` → redirigir a login).
- Logout: borrar la clave.

### 8.3. Rutas

- `/admin` → si no hay sesión, redirige a `/admin/login`. Si hay sesión, muestra dashboard.
- `/admin/login` → formulario. Éxito → setea sesión y redirige a `/admin`.
- Middleware (`src/middleware.ts`) protege `/admin/**` excepto `/admin/login`.

### 8.4. Funcionalidad

Replicar lo que tiene `HTMLAvilea/admin.html`:
- Listar productos.
- Crear / editar / eliminar producto.
- Editar `name`, `category`, `price`, `image`, `shape`.
- Persistencia: `localStorage` con la clave y migraciones de §5.3.

### 8.5. Bug conocido a portar

- **Login**: inputs flex necesitan `min-width: 0` para que el botón "ojo" del toggle de contraseña no se salga. Ya está en `HTMLAvilea/admin.css` — copiarlo literal.
- **Sidebar móvil**: el toggle del sidebar debe llevar `e.stopPropagation()` para que el click no burbujee a `.admin-main` y cierre el menú inmediatamente.

---

## 9. Formulario de espejuelos a medida

### 9.1. Objetivo

Que el visitante pueda pedir armaduras graduadas a medida. **Fase 1**: el envío **no persiste**, solo abre WhatsApp en la línea dedicada `WA_PHONE_ORDERS` con el resumen prellenado.

### 9.2. Ubicación

- **Sección** dentro de la home (`#pedido`), ubicada entre `#productos` y `#contacto`.
- Enlace en el navbar público: `#pedido` ("Pedido"), entre "Productos" y "Sobre Nosotros".
- Componente: `src/components/public/CustomOrderForm.astro`.
- Si en el futuro se quiere como página aparte (`/pedido`), se puede extraer; no se hace preventivamente.

### 9.3. Campos del formulario

**Datos personales** (obligatorios):
- Nombre y Apellidos
- Carnet de Identidad

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

`orderToMessage(order: CustomOrder): string` arma un mensaje legible multi-línea con secciones `*Datos personales*`, `*Lente*`, `*Ojo derecho*`, `*Ojo izquierdo*`, `*Adicional*`. Campos vacíos se renderizan como `—`.

### 9.6. Probador virtual (callout + modal fullscreen)

Dentro de `#pedido`, justo encima del `<form>`, hay un callout "**¿Querés ver cómo te quedan antes de pedirlas?**" con el botón primario "Probar armaduras". Al click se abre `#tryonModal`, un modal con dos estados y un footer con link "completá el pedido" (que hace scroll al form).

**Lógica mínima, sin backend**: solo abrir/cerrar, `URL.createObjectURL` para previsualizar la foto del usuario, click en thumb del carrusel para swapear el SVG de la armadura seleccionada. **No** persiste la foto, **no** detecta la cara (el overlay está posicionado estáticamente a `top: 32%` del canvas). Cuando se integre face-tracking o AR, se enchufa en el `<script>` del componente dejando el HTML intacto.

**Filter de armaduras**: el componente recibe `products: Product[]` por prop. Filtra in-place por `shape ∈ {round, cat, rect, square, rimless, aviator, wayfarer}` para descartar accesorios. Renderiza cada item con `renderShape(p.shape, p.color ?? '#0a1f5c')` en el thumb del rail.

**Mobile-first**: el modal ocupa todo el viewport en móvil (`position: fixed; inset: 0`) y se centra como panel flotante ≥ 980px. Doble path de subida: botón "Elegir foto" (galería) o "Tomar foto ahora" (dispara `<input>` con `capture="user"` para abrir la cámara frontal).

**Props**: `CustomOrderForm` recibe `products?: Product[]` con default `DEFAULT_PRODUCTS`. La home pasa `products={DEFAULT_PRODUCTS}` desde `index.astro`.

**Pendiente fase 2**: integrar el face-tracking (face-api.js, MediaPipe o lo que decida el cliente). El HTML no cambia; solo el script que posiciona el overlay y aplica el SVG de la armadura seleccionada sobre la cara detectada.

---

## 10. Roadmap Supabase (Fase 2)

Cuándo se aborda: cuando el cliente lo pida. No se implementa preventivamente.

### 10.1. Cambios esperados

- **Auth real**: Supabase Auth con email/password para el admin. Las credenciales hardcoded desaparecen.
- **Productos**: tabla `products` en Supabase. `DEFAULT_PRODUCTS` queda como seed inicial / fallback.
- **Pedidos**: tabla `custom_orders` que persiste lo que hoy va solo a WhatsApp. El formulario envía a Supabase **y** abre WhatsApp.
- **Admin**: lee/escribe en Supabase vía `@supabase/supabase-js` server-side (usando service role key en variables de entorno). localStorage se elimina.

### 10.2. Variables de entorno

Crear `.env` (en `.gitignore`):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Cargar con `import.meta.env` en código que corre server-side (`.astro` en modo SSR, `src/pages/api/*`).

### 10.3. Estructura sugerida de tablas

- `products`: `id` (text, PK), `name`, `category`, `price`, `image`, `shape`, `description`, `created_at`, `updated_at`.
- `custom_orders`: `id` (uuid), `full_name`, `phone`, `frame_type`, `material`, `lens_type`, `treatments` (text[]), `focal_distances` (text[]), `notes`, `status` (default `pending`), `created_at`.

---

## 11. Estilos y responsive

### 11.1. CSS vanilla

- Un archivo base en `src/styles/`: `styles.css` (público). `admin.css` aún no creado (admin en fase 2).
- Variables compartidas en `src/styles/tokens.css` (importado por `styles.css`).
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

Las credenciales del admin son conocidas. Se abordan en fase 2 con Supabase Auth. No tocar en fase 1.

### 12.4. `WA_PHONE`

Constante única. Cualquier URL `wa.me/` debe salir de `src/lib/whatsapp.ts`. **Nunca** hardcoded en componentes. Para los 3 locales usar `waLink(loc.phone, ...)` desde `src/lib/contact.ts`.

### 12.5. `pnpm-workspace.yaml`

Hay un archivo en la raíz del proyecto. Origen incierto (posible residual del starter). **No agregar paquetes al workspace** ni crear `packages/` hasta confirmar si esto es monorepo intencional o ruido. Si se confirma que es ruido, eliminarlo.

### 12.6. Migraciones de localStorage

Cualquier cambio al schema de `Product` debe venir con:
1. Función de migración en `src/lib/catalog.ts → migrateProducts(stored)`.
2. Versionado de la clave si el cambio es incompatible (ej. `avilea_products_v2`).

### 12.7. Reveal animation bug

`.product-card` tiene `class="reveal"` hardcoded en `ProductCard.astro`. Si se reemplaza o se mueven las cards, **asegurarse de que `.product-card` siga en el selector del `IntersectionObserver` en `Layout.astro`** — sino las cards quedan con `opacity: 0` y nunca aparecen. El mismo cuidado aplica a cualquier otro elemento que use la clase `.reveal`.

### 12.8. Página "Sobre Nosotros"

**Implementada como página aparte** en `src/pages/sobre-nosotros.astro` (no como sección ancla). El link del navbar apunta a `/sobre-nosotros` y se marca con `is-active` cuando estás en esa ruta. Contiene:

- Hero (`#sobre-nosotros` como anchor interno para deep-links).
- Visión / cómo trabajamos (`#vision`) — grid de 2 columnas: prosa + 3 cards de pilares.
- Galería (`#galeria`) — componente `Gallery.astro` con grid 1/2/3 cols (mobile/tablet/desktop) + lightbox fullscreen al click.
- Blog (`#blog`) — listado de `DEFAULT_POSTS` en cards (`PostCard.astro`), 1/2/3 cols responsive.
- CTA final oscuro (`#contactanos`) con WhatsApp.

Posts viven en `src/lib/posts.ts` (`DEFAULT_POSTS`), mismo patrón que el catálogo. Cuando se implemente Supabase (fase 2), reemplazar el array por una query server-side — el resto del sitio no cambia. Las páginas individuales de post (`/blog/:slug`) aún no existen; los `href` ya apuntan ahí para cuando se creen.

> **Nota sobre el reveal**: las nuevas secciones usan `data-reveal` (en vez de `.product-card` / `.section-head`). El `IntersectionObserver` de `Layout.astro` ya está extendido para aceptar `[data-reveal]` además de las clases legacy. Si agregás otro tipo de card animable, marcá el contenedor con `data-reveal` en vez de pedir cambios al layout.

### 12.9. Categorías placeholder

Los productos default en las categorías `pregraduados`, `ninos` y `gastronomia` son placeholders genéricos ("Lente de Lectura", "Marco Infantil", "Producto Gastronomía"). Reemplazar cuando se defina el catálogo real.

---

## 13. Cómo desarrollar

### 13.1. Dev server

```sh
pnpm dev
```

Levanta en `localhost:4321` con HMR.

### 13.2. Build y preview

```sh
pnpm build          # genera ./dist con SSR bundle
pnpm preview        # sirve el bundle localmente
```

### 13.3. Reinicio de localStorage

Para probar la app desde cero: DevTools → Application → Local Storage → borrar `avilea_products` y `avilea_admin_session`.

---

## 14. Documentación externa

- Astro general: https://docs.astro.build
- Routing y páginas: https://docs.astro.build/en/guides/routing/
- Componentes: https://docs.astro.build/en/basics/astro-components/
- Islas / framework components: https://docs.astro.build/en/guides/framework-components/
- Content Collections: https://docs.astro.build/en/guides/content-collections/
- Estilos: https://docs.astro.build/en/guides/styling/
- `@astrojs/node`: https://docs.astro.build/en/guides/integrations-guide/node/

---

## 15. Reglas duras para la IA (resumen)

Si alguna de estas se rompe, está mal. No negociar sin pedir al usuario:

1. **No cambiar** credenciales del admin, `WA_PHONE`, `WA_PHONE_ORDERS`, dirección de Ciego ("en el Cine Iriondo"), horario ni formato de moneda.
2. **No introducir** Tailwind, Sass, Styled Components ni frameworks de CSS.
3. **No romper** los breakpoints ni los IDs de sección del sitio público (`#inicio`, `#productos`, `#pedido`, `#contacto`).
4. **No usar** `localStorage` para nada que no sea catálogo o sesión admin.
5. **No persistir** pedidos del formulario en fase 1.
6. **No agregar** paquetes al `pnpm-workspace.yaml`.
7. **No tocar** credenciales ni keys de Supabase sin que el usuario las haya dado explícitamente.
8. **Toda URL de WhatsApp** sale de `waLink()` (o `productWaLink` / `orderWaLink` / `defaultWaLink`).
9. **Todo formato de precio** pasa por `formatPrice()`.
10. Si el código entra en conflicto con este documento, **gana el código** y se actualiza el documento, no al revés.
