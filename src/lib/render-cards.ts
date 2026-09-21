// src/lib/render-cards.ts
// Funciones puras que devuelven HTML strings para los `<script>` de los
// componentes públicos. Reemplazan las plantillas Astro (ProductCard.astro,
// PostCard.astro, fragmentos de CustomOrderForm.astro) en runtime.
//
// Toda cadena que viene del backend (Supabase) pasa por `escapeHtml()` para
// evitar XSS. Las constantes estructurales (clases, data-attrs del contrato
// con los scripts existentes) se preservan exactamente como en el .astro
// original — los handlers de los `<script>` siguen leyendo los mismos
// data-attributes y disparando los mismos eventos.
//
// Lo que cambió:
// - Inputs: `Product`, `Post`, etc. (objetos TS).
// - Output: string HTML listo para `innerHTML` o template literal.
//
// Lo que se reusa: `renderShape`, `formatPrice`, `productWaLink`,
// `formatPostDate`, `POST_CATEGORY_LABEL`, `CATEGORY_LABEL`.

import type { Product, Shape } from './catalog';
import { CATEGORY_LABEL } from './catalog';
import type { Post } from './posts';
import { POST_CATEGORY_LABEL, formatPostDate } from './posts';
import { formatPrice } from './format';
import { productWaLink } from './whatsapp';
import { renderShape } from './svgShapes';

// ============== Escape helpers ==============

/** Escapa texto que va dentro de un nodo HTML. */
export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

/** Escapa valor que va dentro de un atributo HTML (mismo set de chars). */
export function escapeHtmlAttr(s: string): string {
  return escapeHtml(s);
}

// ============== SVG icons (paths fijos, no vienen de Supabase) ==============

const WA_ICON_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`;

const CHECK_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>`;

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// ============== Frames: catálogo y probador ==============

/** Shapes válidas para el probador virtual y el custom-select del catálogo. */
const FRAME_SHAPES: readonly Shape[] = [
  'round', 'cat', 'rect', 'square', 'rimless', 'aviator', 'wayfarer',
];

function hasFrameThumb(p: Product): boolean {
  return !!p.image || (!!p.shape && (FRAME_SHAPES as readonly string[]).includes(p.shape));
}

function renderFrameThumb(p: Product): string {
  if (p.image) {
    return `<img src="${escapeHtmlAttr(p.image)}" alt="" loading="lazy" />`;
  }
  if (p.shape && (FRAME_SHAPES as readonly string[]).includes(p.shape)) {
    return renderShape(p.shape, p.color ?? '#0a1f5c');
  }
  return '';
}

// ============== ProductCard (catálogo principal) ==============

/**
 * Render de un ProductCard. Mantiene el mismo markup que ProductCard.astro
 * para que los estilos en styles.css (`#catalog .product-card …`) sigan
 * aplicando sin cambios.
 */
export function renderProductCard(p: Product): string {
  const fallbackColor = p.color ?? '#1c4d6e';
  const visual = p.image
    ? `<img src="${escapeHtmlAttr(p.image)}" alt="${escapeHtmlAttr(p.name)}" loading="lazy" />`
    : p.shape
      ? renderShape(p.shape, fallbackColor)
      : '';

  return `
    <article class="product-card reveal" data-cat="${escapeHtmlAttr(p.category)}">
      <div class="product-image">${visual}</div>
      <div class="product-body">
        <span class="product-category">${escapeHtml(CATEGORY_LABEL[p.category])}</span>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <div class="product-footer">
          <div class="product-price">
            <span class="label">Precio</span>
            <span><span class="currency">$</span><span class="value">${escapeHtml(formatPrice(p.price))}</span> MN</span>
          </div>
          <a
            href="${escapeHtmlAttr(productWaLink(p))}"
            class="product-btn"
            target="_blank"
            rel="noopener"
            aria-label="Consultar ${escapeHtmlAttr(p.name)} por WhatsApp"
          >${WA_ICON_SVG}</a>
        </div>
      </div>
    </article>
  `.trim();
}

// ============== PostCard (blog) ==============

/**
 * Render de un PostCard. Emite el `data-post` JSON-stringified con el
 * payload exacto que PostModal escucha (`post:open` custom event).
 * `contentHtml` viene pre-parseado por `marked` desde runtime-posts.ts.
 */
export function renderPostCard(p: Post & { contentHtml?: string }): string {
  const dateLabel = formatPostDate(p.date);
  const categoryLabel = POST_CATEGORY_LABEL[p.category];
  const payload = JSON.stringify({
    title: p.title,
    contentHtml: p.contentHtml ?? '',
    cover: p.cover,
    coverAlt: p.title,
    categoryLabel,
    dateLabel,
    author: p.author,
  });

  return `
    <article class="post-card" data-reveal>
      <button
        type="button"
        class="post-card__link"
        data-post-card
        data-post='${escapeHtmlAttr(payload)}'
        aria-label="Leer: ${escapeHtmlAttr(p.title)}"
      >
        <div class="post-card__media">
          <img src="${escapeHtmlAttr(p.cover)}" alt="${escapeHtmlAttr(p.title)}" loading="lazy" class="post-card__img" />
          <span class="post-card__chip">${escapeHtml(categoryLabel)}</span>
        </div>
        <div class="post-card__body">
          <p class="post-card__meta">
            <time datetime="${escapeHtmlAttr(p.date)}">${escapeHtml(dateLabel)}</time>
            ${p.author ? `<span aria-hidden="true">·</span><span>${escapeHtml(p.author)}</span>` : ''}
          </p>
          <h3 class="post-card__title">${escapeHtml(p.title)}</h3>
          <p class="post-card__excerpt">${escapeHtml(p.excerpt)}</p>
          <span class="post-card__cta">
            Leer artículo ${ARROW_SVG}
          </span>
        </div>
      </button>
    </article>
  `.trim();
}

// ============== Custom-select: opción de armadura ==============

/**
 * Render de una opción del menú flotante de selección de armadura en el
 * formulario de pedido. Mantiene los mismos data-attrs que el bloque
 * original de CustomOrderForm.astro (líneas 139-172) para que el handler
 * `syncArmaduraFromCatalog()` los siga leyendo.
 */
export function renderArmaduraOption(p: Product): string {
  const thumbHtml = renderFrameThumb(p);

  return `
    <li>
      <button
        type="button"
        role="option"
        class="armadura-custom-select__option"
        data-armadura-option
        data-value="${escapeHtmlAttr(p.id)}"
        data-name="${escapeHtmlAttr(p.name)}"
        data-price="${escapeHtmlAttr(String(p.price))}"
        data-shape="${escapeHtmlAttr(p.shape ?? '')}"
        data-color="${escapeHtmlAttr(p.color ?? '#0a1f5c')}"
        data-image="${escapeHtmlAttr(p.image ?? '')}"
        aria-selected="false"
      >
        <span class="armadura-custom-select__thumb" aria-hidden="true">${thumbHtml}</span>
        <span class="armadura-custom-select__info">
          <span class="armadura-custom-select__name">${escapeHtml(p.name)}</span>
          <span class="armadura-custom-select__price">${escapeHtml(formatPrice(p.price))} MN</span>
        </span>
        <span class="armadura-custom-select__check" aria-hidden="true">${CHECK_SVG}</span>
      </button>
    </li>
  `.trim();
}

// ============== Probador virtual: frame en el rail ==============

/**
 * Render de un botón del rail del probador virtual. Mantiene los data-attrs
 * que consume el handler `selectFrame()` en CustomOrderForm.astro (líneas
 * 2329-2358): data-frame-id, data-frame-name, data-frame-price,
 * data-frame-image, data-shape, data-color.
 */
export function renderTryonFrame(p: Product): string {
  const thumbHtml = renderFrameThumb(p);

  return `
    <li>
      <button
        type="button"
        class="tryon-frame"
        data-frame-id="${escapeHtmlAttr(p.id)}"
        data-frame-name="${escapeHtmlAttr(p.name)}"
        data-frame-price="${escapeHtmlAttr(String(p.price))}"
        data-frame-image="${escapeHtmlAttr(p.image ?? '')}"
        data-shape="${escapeHtmlAttr(p.shape ?? '')}"
        data-color="${escapeHtmlAttr(p.color ?? '#0a1f5c')}"
        aria-checked="false"
        role="radio"
      >
        <span class="tryon-frame__thumb">${thumbHtml}</span>
        <span class="tryon-frame__name">${escapeHtml(p.name)}</span>
      </button>
    </li>
  `.trim();
}

// ============== Helpers de filtrado ==============

/** Devuelve solo los productos con shape de armadura (para el probador). */
export function filterTryOnFrames(products: Product[]): Product[] {
  return products.filter(
    (p): p is Product & { shape: Shape } =>
      typeof p.shape === 'string' && (FRAME_SHAPES as readonly string[]).includes(p.shape),
  );
}

/**
 * Devuelve los productos que se pueden elegir desde el custom-select del
 * formulario. Excluye `pregraduados` (lentes listos, no armaduras a medida).
 */
export function filterCatalogFrames(products: Product[]): Product[] {
  return products.filter((p) => p.category !== 'pregraduados');
}

// ============== Loading & error UI ==============

/** Bloque de loading reutilizable: spinner + texto. */
export function renderLoading(label: string): string {
  return `
    <div class="runtime-loading" role="status" aria-live="polite">
      <div class="runtime-loading__spinner" aria-hidden="true"></div>
      <p class="runtime-loading__text">${escapeHtml(label)}</p>
    </div>
  `.trim();
}

/** Bloque de error reutilizable. */
export function renderError(detail: string): string {
  return `
    <div class="runtime-error" role="alert">
      <div class="runtime-error__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 class="runtime-error__title">No pudimos cargar el contenido</h3>
      <p class="runtime-error__msg">
        Estamos teniendo problemas para conectarnos con el servidor. Por favor intentá de nuevo en unos minutos.
      </p>
      <p class="runtime-error__detail">Detalle técnico: ${escapeHtml(detail)}</p>
    </div>
  `.trim();
}
