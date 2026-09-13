// src/lib/whatsapp.ts
// Toda URL de WhatsApp sale de acá. Nunca hardcoded en componentes.

import type { Product } from './catalog';
import type { CustomOrder } from './orders';
import { formatPrice } from './format';
import { orderToMessage } from './orders';

// Línea principal del negocio (consultas, navbar, contacto, WA float).
export const WA_PHONE = '5354519124';
export const WA_DISPLAY = '+53 545 191 24';

// Línea dedicada para pedidos de espejuelos a medida.
// Distinta de WA_PHONE: el cliente la dio explícitamente para este flujo.
export const WA_PHONE_ORDERS = '5354519347';

export function buildProductMessage(product: Product): string {
  return `Hola Avilea, me interesa el producto "${product.name}" (${formatPrice(
    product.price
  )} MN). ¿Está disponible?`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function productWaLink(product: Product): string {
  return waLink(WA_PHONE, buildProductMessage(product));
}

// Para CTAs genéricos (navbar, hero, contacto, WA float).
export function defaultWaLink(message: string): string {
  return waLink(WA_PHONE, message);
}

export function buildOrderMessage(order: CustomOrder): string {
  return orderToMessage(order);
}

// Abre WhatsApp en la línea de pedidos con el resumen prellenado.
export function orderWaLink(order: CustomOrder): string {
  return waLink(WA_PHONE_ORDERS, buildOrderMessage(order));
}
