// src/lib/tryon-face-detection.ts
// Detección de cara/ojos para el probador virtual usando MediaPipe Face Landmarker.
//
// Flujo:
//   1. Apenas carga la página, `preloadFaceLandmarker()` empieza a bajar el
//      bundle JS, el WASM y el modelo (.task, ~1.8 MB). El modelo viene
//      empaquetado localmente en /mediapipe/face_landmarker.task (paralelo al
//      resto del sitio, sin dependencia externa). Singleton: la segunda vez
//      devuelve la instancia cacheada.
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
// El SVG/imagen que renderizamos representa solo el frente del marco
// (lentes + puente, SIN las patillas). En una cara promedio la distancia
// entre las esquinas exteriores de los ojos (landmarks 33 y 263) es
// ~60-65mm; el frente del marco suele medir ~110-120mm de lente a lente,
// así que el ratio realista está cerca de 1.7-1.8x. Antes era 2.6 y
// quedaba gigante; calibrado a 2.1 tras probar con una cara real.
const EYE_DISTANCE_TO_OVERLAY_WIDTH = 2.3;

// Ajuste vertical: centrado puro sobre el midpoint de los ojos tiende a
// dejar el marco un toque bajo (la patilla del marco sobresale más arriba
// que abajo). Restamos un pequeño porcentaje de la altura de la imagen para
// que el marco quede un poco más arriba de los ojos, más natural.
const GLASSES_VERTICAL_OFFSET = 0.025;

const MEDIAPIPE_VERSION = '0.10.18';
const MEDIAPIPE_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;

// Modelo bundleado en el sitio (descargado en paralelo con el resto, sin
// dependencia de Google Storage en runtime). Se normaliza BASE_URL a un solo
// trailing slash para evitar concatenaciones tipo `/avileamediapipe/...`.
const MODEL_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/mediapipe/face_landmarker.task`;

/** Callback opcional para reportar progreso de descarga del modelo (0..100). */
export type ModelProgressCallback = (pct: number) => void;

// Tipo mínimo del API de FaceLandmarker (evita importar el módulo en el .ts
// — solo se importa en runtime, dentro de `loadFaceLandmarker`).
interface FaceLandmarkerLike {
  detect(input: HTMLImageElement): { faceLandmarks?: NormalizedLandmark[][] };
}

let landmarkerInstance: FaceLandmarkerLike | null = null;
let landmarkerLoading: Promise<FaceLandmarkerLike> | null = null;

/** Precarga el modelo local con fetch + ReadableStream para reportar progreso. */
async function prefetchModelWithProgress(
  url: string,
  onProgress?: ModelProgressCallback
): Promise<void> {
  // Cache HTTP estándar: si el modelo ya está en cache, la promesa resuelve
  // casi instantánea sin disparar el callback (caso normal en visitas 2+).
  const resp = await fetch(url, { cache: 'force-cache' });
  if (!resp.ok || !resp.body) {
    throw new Error(`fetch modelo ${resp.status}`);
  }
  const total = Number(resp.headers.get('content-length') || 0);
  if (!total || !onProgress) {
    // Sin content-length (compresión, etc.) o sin callback: igual consumimos
    // el body para que el browser lo cachee, pero sin reportar progreso.
    await resp.body.cancel();
    return;
  }
  const reader = resp.body.getReader();
  let received = 0;
  let lastReported = -1;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    const pct = Math.min(100, Math.round((received / total) * 100));
    if (pct !== lastReported) {
      lastReported = pct;
      onProgress(pct);
    }
  }
}

/** Carga MediaPipe Face Landmarker (singleton, lazy). */
export async function loadFaceLandmarker(
  onProgress?: ModelProgressCallback
): Promise<FaceLandmarkerLike> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerLoading) return landmarkerLoading;

  landmarkerLoading = (async () => {
    // 1) Bajar el modelo local con reporte de progreso (si hay callback).
    if (onProgress) onProgress(0);
    await prefetchModelWithProgress(MODEL_URL, onProgress);
    if (onProgress) onProgress(100);

    // 2) Import dinámico desde CDN — solo descarga el JS la primera vez.
    const visionBundleUrl = `${MEDIAPIPE_BASE}/vision_bundle.mjs`;
    let mod: {
      FilesetResolver: { forVisionTasks: (url: string) => Promise<unknown> };
      FaceLandmarker: {
        createFromOptions: (
          fileset: unknown,
          options: Record<string, unknown>
        ) => Promise<FaceLandmarkerLike>;
      };
    };
    try {
      mod = (await import(/* @vite-ignore */ visionBundleUrl)) as typeof mod;
    } catch (e) {
      console.error('[tryon] fallo import vision_bundle.mjs desde', visionBundleUrl, e);
      throw e;
    }
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
 * Dispara la precarga en background apenas carga la página (sin callback de
 * progreso; el progreso se reporta solo cuando el usuario sube la foto y
 * todavía no está en cache). Si falla, el catch interno deja el estado
 * limpio para reintentar.
 */
export function preloadFaceLandmarker(): void {
  loadFaceLandmarker().catch(() => {
    /* se loguea más abajo si la detección falla */
  });
}

/**
 * corre la detección sobre una imagen ya cargada en el DOM.
 * Devuelve `{ found: false }` si no hay cara, no se pudo cargar MediaPipe,
 * o la imagen no está lista. Acepta un callback de progreso del modelo.
 */
export async function detectFaceInPhoto(
  img: HTMLImageElement,
  onProgress?: ModelProgressCallback
): Promise<FaceDetectionResult> {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return { found: false };
  }

  let landmarker: FaceLandmarkerLike;
  try {
    landmarker = await loadFaceLandmarker(onProgress);
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
  const eyeMidY = (rightOuter.y + leftOuter.y) / 2 - GLASSES_VERTICAL_OFFSET;

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