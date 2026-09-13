// src/lib/format.ts
// Helpers de formato. Todo precio visible pasa por acá.

export function formatPrice(value: number): string {
  // 1850 -> "1,850"
  return value.toLocaleString('es-CU');
}
