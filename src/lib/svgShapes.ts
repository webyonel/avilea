// src/lib/svgShapes.ts
// Generadores SVG por forma. Puerto del original `script.js → frameShapes`.
// Solo se usa cuando el producto NO tiene imagen física.

import type { Shape } from './catalog';

type ShapeFn = (color: string) => string;

export const frameShapes: Record<Shape, ShapeFn> = {
  round: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="60" x2="60" y2="60" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="180" y1="60" x2="220" y2="60" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="85" cy="60" r="25" fill="none" stroke="${color}" stroke-width="3.5"/>
      <circle cx="155" cy="60" r="25" fill="none" stroke="${color}" stroke-width="3.5"/>
      <path d="M110 60 Q120 58 130 60" fill="none" stroke="${color}" stroke-width="3.5"/>
    </svg>`,
  cat: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="58" x2="62" y2="50" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="178" y1="50" x2="220" y2="58" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <path d="M60 56 Q80 38 110 50 Q108 70 90 72 Q66 72 60 56 Z" fill="none" stroke="${color}" stroke-width="3.5"/>
      <path d="M180 56 Q160 38 130 50 Q132 70 150 72 Q174 72 180 56 Z" fill="none" stroke="${color}" stroke-width="3.5"/>
    </svg>`,
  rect: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="60" x2="60" y2="60" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="180" y1="60" x2="220" y2="60" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <rect x="60" y="40" width="55" height="40" rx="6" fill="none" stroke="${color}" stroke-width="3.5"/>
      <rect x="125" y="40" width="55" height="40" rx="6" fill="none" stroke="${color}" stroke-width="3.5"/>
      <line x1="115" y1="60" x2="125" y2="60" stroke="${color}" stroke-width="3.5"/>
    </svg>`,
  square: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="62" x2="58" y2="62" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <line x1="182" y1="62" x2="220" y2="62" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <path d="M55 50 L118 48 L116 75 L60 75 Z" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M122 48 L185 50 L180 75 L124 75 Z" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/>
      <line x1="118" y1="62" x2="122" y2="62" stroke="${color}" stroke-width="3.5"/>
    </svg>`,
  rimless: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="60" x2="60" y2="60" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="180" y1="60" x2="220" y2="60" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="85" cy="60" rx="25" ry="22" fill="rgba(28,77,110,0.04)" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <ellipse cx="155" cy="60" rx="25" ry="22" fill="rgba(28,77,110,0.04)" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <circle cx="60" cy="60" r="3" fill="${color}"/>
      <circle cx="180" cy="60" r="3" fill="${color}"/>
      <circle cx="110" cy="60" r="3" fill="${color}"/>
      <circle cx="130" cy="60" r="3" fill="${color}"/>
      <line x1="110" y1="60" x2="130" y2="60" stroke="${color}" stroke-width="2"/>
    </svg>`,
  aviator: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="50" x2="55" y2="55" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="185" y1="55" x2="220" y2="50" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <path d="M55 56 Q60 38 85 40 Q108 42 112 60 Q108 76 85 76 Q60 76 55 56 Z" fill="rgba(28,77,110,0.15)" stroke="${color}" stroke-width="3.5"/>
      <path d="M185 56 Q180 38 155 40 Q132 42 128 60 Q132 76 155 76 Q180 76 185 56 Z" fill="rgba(28,77,110,0.15)" stroke="${color}" stroke-width="3.5"/>
      <line x1="112" y1="52" x2="128" y2="52" stroke="${color}" stroke-width="2.5"/>
    </svg>`,
  wayfarer: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="58" x2="55" y2="55" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="185" y1="55" x2="220" y2="58" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M55 50 L110 50 L112 75 L62 75 Z" fill="rgba(10,26,38,0.7)" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M130 50 L185 50 L178 75 L128 75 Z" fill="rgba(10,26,38,0.7)" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/>
      <line x1="112" y1="62" x2="128" y2="62" stroke="${color}" stroke-width="3.5"/>
    </svg>`,
  case: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="40" width="160" height="42" rx="21" fill="none" stroke="${color}" stroke-width="3.5"/>
      <line x1="120" y1="40" x2="120" y2="82" stroke="${color}" stroke-width="2"/>
      <circle cx="60" cy="61" r="2.5" fill="${color}"/>
      <path d="M155 56 Q165 56 165 61" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  cord: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 60 Q70 25 120 60 Q170 95 210 60" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="30" cy="60" r="7" fill="none" stroke="${color}" stroke-width="3"/>
      <circle cx="210" cy="60" r="7" fill="none" stroke="${color}" stroke-width="3"/>
      <rect x="113" y="52" width="14" height="16" rx="2" fill="none" stroke="${color}" stroke-width="2.5"/>
    </svg>`,
  bottle: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="100" y="18" width="40" height="14" rx="3" fill="none" stroke="${color}" stroke-width="3"/>
      <line x1="105" y1="25" x2="135" y2="25" stroke="${color}" stroke-width="3"/>
      <path d="M90 32 L150 32 L155 44 L155 95 Q155 105 145 105 L95 105 Q85 105 85 95 L85 44 Z" fill="none" stroke="${color}" stroke-width="3.5"/>
      <line x1="95" y1="72" x2="145" y2="72" stroke="${color}" stroke-width="2"/>
      <text x="120" y="90" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="${color}">Avilea</text>
    </svg>`,
  wipes: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="32" width="120" height="58" rx="6" fill="none" stroke="${color}" stroke-width="3.5"/>
      <line x1="60" y1="50" x2="180" y2="50" stroke="${color}" stroke-width="2.5"/>
      <rect x="100" y="22" width="40" height="14" rx="2" fill="${color}"/>
      <line x1="80" y1="68" x2="160" y2="68" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="80" y1="78" x2="160" y2="78" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4"/>
    </svg>`,
  kit: (color) => `
    <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="35" width="160" height="55" rx="4" fill="none" stroke="${color}" stroke-width="3.5"/>
      <rect x="100" y="20" width="40" height="18" rx="3" fill="none" stroke="${color}" stroke-width="3"/>
      <line x1="65" y1="60" x2="80" y2="60" stroke="${color}" stroke-width="2.5"/>
      <line x1="65" y1="72" x2="80" y2="72" stroke="${color}" stroke-width="2.5"/>
      <circle cx="120" cy="65" r="10" fill="none" stroke="${color}" stroke-width="2.5"/>
      <rect x="155" y="58" width="25" height="18" rx="2" fill="none" stroke="${color}" stroke-width="2.5"/>
    </svg>`,
};

export function renderShape(shape: Shape | undefined, color: string = '#1c4d6e'): string {
  if (!shape) return '';
  return frameShapes[shape]?.(color) ?? '';
}
