// src/lib/tryon-gestures.ts
// Gesture controller para el overlay del probador virtual.
//
// Gestos soportados:
//   - 1 dedo / mouse drag        → mover (offsetX/Y)
//   - 2 dedos pinch              → escala
//   - 2 dedos twist              → rotación (ángulo entre los dedos)
//   - Mouse wheel (sin modif.)   → escala
//   - Mouse + Shift + drag       → rotación alrededor del centro
//   - reset()                    → vuelve a { tx:0, ty:0, scale:1, rotation:0 }
//
// El estado es independiente del resultado de MediaPipe: la detección define
// el ancla (left/top/width/rotate MediaPipe vía CSS vars), y este módulo
// superpone tx/ty/scale/rotation-user sobre esa base. Al cambiar de armadura
// los ajustes manuales se preservan.

export interface OverlayAdjustment {
  /** Pixel offset from the MediaPipe anchor (positive = right/down). */
  tx: number;
  ty: number;
  /** Scale multiplier (1 = original). */
  scale: number;
  /** Rotation in degrees added on top of MediaPipe's head-roll. 0 = none. */
  rotation: number;
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

const DEFAULT_ADJ: OverlayAdjustment = {
  tx: 0,
  ty: 0,
  scale: 1,
  rotation: 0,
};

export function createOverlayGestureController(
  opts: OverlayGestureOptions,
): OverlayGestureController {
  const { overlayEl, canvasEl, onChange } = opts;
  const [minScale, maxScale] = opts.scaleRange ?? [0.5, 3];

  let adj: OverlayAdjustment = { ...DEFAULT_ADJ };
  // pointerId → última posición conocida. Borramos en pointerup/cancel.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStartDist: number | null = null;
  let pinchStartScale = 1;
  let pinchStartAngle: number | null = null;
  let pinchStartRotation = 0;

  // Shift+drag rotación (solo mouse con Shift apretado).
  let rotateMode = false;
  let rotateCenter = { x: 0, y: 0 };
  let rotateStartAngle = 0;
  let rotateStartRotation = 0;

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

    // Si es mouse + Shift, este pointer va a rotar (no a mover).
    // Solo válido para el primer pointer del gesto — el segundo siempre
    // cae al modo pinch (2 pointers = pinch+twist, no importa Shift).
    rotateMode = e.pointerType === 'mouse' && e.shiftKey && pointers.size === 1;

    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinchStartDist = Math.hypot(b.x - a.x, b.y - a.y);
      pinchStartScale = adj.scale;
      pinchStartAngle = Math.atan2(b.y - a.y, b.x - a.x);
      pinchStartRotation = adj.rotation;
    } else if (rotateMode) {
      // Centro de rotación = centro actual del overlay (post-MediaPipe +
      // post-offset del usuario).
      const rect = overlayEl.getBoundingClientRect();
      rotateCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      rotateStartAngle = Math.atan2(
        e.clientY - rotateCenter.y,
        e.clientX - rotateCenter.x,
      );
      rotateStartRotation = adj.rotation;
    }
  }

  function onPointerMove(e: PointerEvent) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 1) Mouse + Shift + drag → rotación alrededor del centro del overlay.
    if (rotateMode && pointers.size === 1) {
      const angle = Math.atan2(
        e.clientY - rotateCenter.y,
        e.clientX - rotateCenter.x,
      );
      const deltaDeg = (angle - rotateStartAngle) * (180 / Math.PI);
      adj.rotation = rotateStartRotation + deltaDeg;
      notify();
      return;
    }

    // 2) 1 pointer normal → drag.
    if (pointers.size === 1) {
      adj.tx += dx;
      adj.ty += dy;
      notify();
      return;
    }

    // 3) 2 pointers → pinch + twist simultáneos (escala + rotación).
    if (pointers.size === 2 && pinchStartDist !== null && pinchStartAngle !== null) {
      const [a, b] = Array.from(pointers.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (pinchStartDist > 0) {
        adj.scale = clampScale(pinchStartScale * (dist / pinchStartDist));
      }
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const deltaDeg = (angle - pinchStartAngle) * (180 / Math.PI);
      adj.rotation = pinchStartRotation + deltaDeg;
      notify();
    }
  }

  function onPointerEnd(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (overlayEl.hasPointerCapture(e.pointerId)) {
      try { overlayEl.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (pointers.size < 2) {
      pinchStartDist = null;
      pinchStartAngle = null;
    }
    if (pointers.size === 0) {
      rotateMode = false;
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
      return (
        adj.tx === 0 &&
        adj.ty === 0 &&
        adj.scale === 1 &&
        adj.rotation === 0
      );
    },
  };
}
