// src/lib/tryon-gestures.ts
// Gesture controller para el overlay del probador virtual.
//
// Permite mover y escalar la armadura sobre la foto del usuario:
//   - 1 dedo / click + drag → mueve (offsetX/Y)
//   - 2 dedos pinch → escala
//   - Mouse wheel (sin modificador) → escala
//   - reset() → vuelve a { tx: 0, ty: 0, scale: 1 }
//
// El estado es independiente del resultado de MediaPipe: la detección define
// el ancla (left/top/width/rotate vía CSS vars), y este módulo superpone
// tx/ty/scale sobre esa base. Por eso al cambiar de armadura los ajustes
// manuales se preservan (la posición de MediaPipe + el offset del usuario
// siguen aplicando igual sobre la nueva armadura).

export interface OverlayAdjustment {
  /** Pixel offset from the MediaPipe anchor (positive = right/down). */
  tx: number;
  ty: number;
  /** Scale multiplier (1 = original). */
  scale: number;
}

export interface OverlayGestureOptions {
  /** The overlay element — gets the pointer listeners. */
  overlayEl: HTMLElement;
  /** The canvas element — wheel listener attaches here (so scrolling
   *  anywhere on the canvas zooms, not just over the armadura). */
  canvasEl: HTMLElement;
  /** Called whenever the adjustment changes. Receives a fresh copy. */
  onChange: (adj: OverlayAdjustment) => void;
  /** Scale range as [min, max]. Default [0.5, 3]. */
  scaleRange?: readonly [number, number];
}

export interface OverlayGestureController {
  start(): void;
  stop(): void;
  reset(): void;
  getAdjustment(): OverlayAdjustment;
  isDefault(): boolean;
}

const DEFAULT_ADJ: OverlayAdjustment = { tx: 0, ty: 0, scale: 1 };

export function createOverlayGestureController(
  opts: OverlayGestureOptions,
): OverlayGestureController {
  const { overlayEl, canvasEl, onChange } = opts;
  const [minScale, maxScale] = opts.scaleRange ?? [0.5, 3];

  let adj: OverlayAdjustment = { tx: 0, ty: 0, scale: 1 };
  // pointerId → última posición conocida. Borramos en pointerup/cancel.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStartDist: number | null = null;
  let pinchStartScale = 1;

  const clampScale = (s: number) => Math.max(minScale, Math.min(maxScale, s));

  function notify() {
    onChange({ ...adj });
  }

  function onPointerDown(e: PointerEvent) {
    // En mouse, solo botón primario. Touch/pen: cualquier toque.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      overlayEl.setPointerCapture(e.pointerId);
    } catch {
      /* algunos browsers fallan si el pointer ya no está activo; ignorar */
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinchStartDist = Math.hypot(b.x - a.x, b.y - a.y);
      pinchStartScale = adj.scale;
    }
  }

  function onPointerMove(e: PointerEvent) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      // Drag: 1 dedo / mouse. Sumamos el delta al offset.
      adj.tx += dx;
      adj.ty += dy;
      notify();
    } else if (pointers.size === 2 && pinchStartDist !== null) {
      // Pinch: 2 dedos. Calculamos ratio vs distancia inicial.
      const [a, b] = Array.from(pointers.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (pinchStartDist > 0) {
        const ratio = dist / pinchStartDist;
        adj.scale = clampScale(pinchStartScale * ratio);
        notify();
      }
    }
  }

  function onPointerEnd(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (overlayEl.hasPointerCapture(e.pointerId)) {
      try { overlayEl.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (pointers.size < 2) {
      pinchStartDist = null;
    }
  }

  function onWheel(e: WheelEvent) {
    // Cualquier scroll sobre el canvas hace zoom (sin modificador).
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    adj.scale = clampScale(adj.scale * factor);
    notify();
  }

  return {
    start() {
      overlayEl.addEventListener('pointerdown', onPointerDown);
      overlayEl.addEventListener('pointermove', onPointerMove);
      overlayEl.addEventListener('pointerup', onPointerEnd);
      overlayEl.addEventListener('pointercancel', onPointerEnd);
      canvasEl.addEventListener('wheel', onWheel, { passive: false });
    },
    stop() {
      overlayEl.removeEventListener('pointerdown', onPointerDown);
      overlayEl.removeEventListener('pointermove', onPointerMove);
      overlayEl.removeEventListener('pointerup', onPointerEnd);
      overlayEl.removeEventListener('pointercancel', onPointerEnd);
      canvasEl.removeEventListener('wheel', onWheel);
    },
    reset() {
      adj = { ...DEFAULT_ADJ };
      notify();
    },
    getAdjustment() {
      return { ...adj };
    },
    isDefault() {
      return adj.tx === 0 && adj.ty === 0 && adj.scale === 1;
    },
  };
}
