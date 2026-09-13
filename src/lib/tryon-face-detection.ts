// src/lib/tryon-face-detection.ts
// Detección de cara/ojos para el probador virtual usando MediaPipe Face Landmarker.
//
// Flujo:
//   1. Al abrir el modal del probador, se llama `preloadFaceLandmarker()` que
//      descarga (vía CDN) el bundle JS + el WASM + el modelo (~5 MB). Singleton:
//      la segunda vez se devuelve la instancia cacheada.
//   2. Cuando el usuario sube su foto, `detectFaceInPhoto(img)` corre la
//      detección y devuelve los landmarks del primer rostro.
//   3. `computeOverlayPosition(landmarks, img, container)` mapea los landmarks
//      (normalizados [0..1]) a coordenadas del contenedor visible del photo,
//      compensando el recorte que produce `object-fit: cover`. Devuelve los
//      % de left/top/width y los grados de rotación que hay que aplicar al
//      overlay para que la armadura quede sobre los ojos.
//
// Privacidad: la imagen NUNCA sale del cliente — todo el procesamiento es
// local (MediaPipe corre en WASM dentro del browser).

export interface NormalizedLandmark {
  x: number; // [0, 1] relativo a la imagen original
  y: number; // [0, 1]
  z: number; // profundidad relativa
}

export interface OverlayPosition {
  leftPct: number;
  topPct: number;
  widthPct: number;
  rotationDeg: number;
}

export interface FaceFound {
  found: true;
  landmarks: NormalizedLandmark[];
}

export interface FaceNotFound {
  found: false;
}

export type FaceDetectionResult = FaceFound | FaceNotFound;

// Landmarks clave (modelo Face Landmarker de MediaPipe, 478 puntos):
//   33  — esquina exterior del ojo derecho
//   263 — esquina exterior del ojo izquierdo
//   168 — puente de la nariz (entre los ojos, útil para Y si los iris fallan)
const LM = {
  RIGHT_OUTER: 33,
  LEFT_OUTER: 263,
} as const;

// Distancia entre los ojos → ancho del overlay.
// 2.6 ≈ el ancho típico de un marco de armaduras cubre desde un ojo al otro
// con algo de holgura lateral (las patillas sobresalen).
const EYE_DISTANCE_TO_OVERLAY_WIDTH = 2.6;

const MEDIAPIPE_VERSION = '0.10.18';
const MEDIAPIPE_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Tipo mínimo del API de FaceLandmarker (evita importar el módulo en el .ts
// — solo se importa en runtime, dentro de `loadFaceLandmarker`).
interface FaceLandmarkerLike {
  detect(input: HTMLImageElement): { faceLandmarks?: NormalizedLandmark[][] };
}

let landmarkerInstance: FaceLandmarkerLike | null = null;
let landmarkerLoading: Promise<FaceLandmarkerLike> | null = null;

/** Carga MediaPipe Face Landmarker (singleton, lazy). */
export async function loadFaceLandmarker(): Promise<FaceLandmarkerLike> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerLoading) return landmarkerLoading;

  landmarkerLoading = (async () => {
    // Import dinámico desde CDN — solo descarga el JS la primera vez.
    const mod = (await import(
      /* @vite-ignore */ `${MEDIAPIPE_BASE}/vision_bundle.mjs`
    )) as {
      FilesetResolver: { forVisionTasks: (url: string) => Promise<unknown> };
      FaceLandmarker: {
        createFromOptions: (
          fileset: unknown,
          options: Record<string, unknown>
        ) => Promise<FaceLandmarkerLike>;
      };
    };
    const filesetResolver = await mod.FilesetResolver.forVisionTasks(
      `${MEDIAPIPE_BASE}/wasm`
    );
    landmarkerInstance = await mod.FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputFaceBlendshapes: false,
        runningMode: 'IMAGE',
        numFaces: 1,
      }
    );
    return landmarkerInstance;
  })();

  try {
    return await landmarkerLoading;
  } catch (e) {
    // Si falla la carga, reseteamos para permitir un reintento.
    landmarkerLoading = null;
    throw e;
  }
}

/**
 * Dispara la precarga en background. Útil para empezar a bajar el modelo
 * apenas el usuario abre el modal (sin bloquearlo). Si falla, el catch
 * interno deja el estado limpio para reintentar.
 */
export function preloadFaceLandmarker(): void {
  loadFaceLandmarker().catch(() => {
    /* se loguea más abajo si la detección falla */
  });
}

/**
 corre la detección sobre una imagen ya cargada en el DOM.
 * Devuelve `{ found: false }` si no hay cara, no se pudo cargar MediaPipe,
 * o la imagen no está lista.
 */
export async function detectFaceInPhoto(
  img: HTMLImageElement
): Promise<FaceDetectionResult> {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return { found: false };
  }

  let landmarker: FaceLandmarkerLike;
  try {
    landmarker = await loadFaceLandmarker();
  } catch (e) {
    console.warn('[tryon] no se pudo inicializar MediaPipe', e);
    return { found: false };
  }

  try {
    const result = landmarker.detect(img);
    const first = result.faceLandmarks?.[0];
    if (!first || first.length === 0) return { found: false };
    return { found: true, landmarks: first };
  } catch (e) {
    console.warn('[tryon] detección falló', e);
    return { found: false };
  }
}

/**
 * Mapea los landmarks a coordenadas del contenedor visible, compensando el
 * recorte que produce `object-fit: cover` en la imagen.
 *
 * Devuelve los porcentajes de left/top/width y la rotación (deg) que hay que
 * aplicar al overlay para que la armadura quede centrada sobre los ojos.
 */
export function computeOverlayPosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): OverlayPosition {
  const nW = img.naturalWidth;
  const nH = img.naturalHeight;
  const cW = container.clientWidth;
  const cH = container.clientHeight;

  if (nW === 0 || nH === 0 || cW === 0 || cH === 0) {
    // Fallback: centrado.
    return { leftPct: 50, topPct: 50, widthPct: 56, rotationDeg: 0 };
  }

  const imgAspect = nW / nH;
  const conAspect = cW / cH;

  // object-fit: cover → la imagen llena el contenedor recortando el exceso.
  let scale: number;
  let cropXImg: number; // px de imagen recortados en X (de cada lado)
  let cropYImg: number;

  if (imgAspect > conAspect) {
    // Imagen más ancha que el contenedor: la altura llena, los lados se cortan.
    scale = cH / nH;
    cropXImg = (nW - cW / scale) / 2;
    cropYImg = 0;
  } else {
    // Imagen más alta: el ancho llena, arriba/abajo se cortan.
    scale = cW / nW;
    cropXImg = 0;
    cropYImg = (nH - cH / scale) / 2;
  }

  const rightOuter = landmarks[LM.RIGHT_OUTER];
  const leftOuter = landmarks[LM.LEFT_OUTER];

  const eyeMidX = (rightOuter.x + leftOuter.x) / 2;
  const eyeMidY = (rightOuter.y + leftOuter.y) / 2;

  // Distancia entre los ojos (normalizada → píxeles de imagen).
  const eyeDistNorm = Math.hypot(
    leftOuter.x - rightOuter.x,
    leftOuter.y - rightOuter.y
  );
  const eyeDistPxImg = eyeDistNorm * nW;

  // Ángulo de la línea entre las dos esquinas exteriores (roll de la cabeza).
  const rotationDeg =
    Math.atan2(
      leftOuter.y - rightOuter.y,
      leftOuter.x - rightOuter.x
    ) *
    (180 / Math.PI);

  // Punto medio de los ojos en píxeles del contenedor (ya compensando el crop).
  const imgPxX = eyeMidX * nW;
  const imgPxY = eyeMidY * nH;
  const conX = (imgPxX - cropXImg) * scale;
  const conY = (imgPxY - cropYImg) * scale;

  return {
    leftPct: (conX / cW) * 100,
    topPct: (conY / cH) * 100,
    widthPct:
      ((eyeDistPxImg * scale * EYE_DISTANCE_TO_OVERLAY_WIDTH) / cW) * 100,
    rotationDeg,
  };
}

/** Aplica la posición al overlay (inline styles ganan sobre el CSS estático). */
export function applyOverlayPosition(
  overlay: HTMLElement,
  position: OverlayPosition
): void {
  overlay.style.left = `${position.leftPct}%`;
  overlay.style.top = `${position.topPct}%`;
  overlay.style.width = `${position.widthPct}%`;
  overlay.style.transform = `translate(-50%, -50%) rotate(${position.rotationDeg}deg)`;
  overlay.dataset.dynamicPosition = 'true';
}

/** Limpia los inline styles — el overlay vuelve a su posición CSS estática (32%). */
export function resetOverlayPosition(overlay: HTMLElement): void {
  overlay.style.left = '';
  overlay.style.top = '';
  overlay.style.width = '';
  overlay.style.transform = '';
  delete overlay.dataset.dynamicPosition;
}