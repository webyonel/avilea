# Guía para fotografiar armaduras (probador virtual)

Las fotos de las armaduras se usan en el **catálogo** y en el **probador virtual** de la web. Para que la armadura se vea bien sobre la cara del cliente, las fotos tienen que respetar una composición específica.

---

## Lo que necesitás

- La armadura limpia (sin polvo ni huellas).
- Fondo blanco o liso, bien iluminado.
- Una cámara decente (celular sirve).
- Una herramienta para borrar el fondo. Opciones:
  - **Gratis online:** [remove.bg](https://remove.bg) (sube la foto, descarga el PNG).
  - **GIMP / Photoshop:** selección por color o magic wand, eliminar el fondo.
  - **Photoshop:** *Select → Subject* → *Select and Mask* → exportá como PNG.

---

## Composición (esto es lo importante)

La foto se va a "pegar" sobre los ojos del cliente usando detección facial. Para que los lentes caigan exactamente donde están los ojos, el marco tiene que ocupar la imagen siguiendo esta guía:

```
┌──────────────────────────────────────────────┐
│                                              │
│                ╭──────╮ ╭──────╮             │
│  ◀─ 25% ─▶   (lente  │puente│ lente)  ◀─ 25% ─▶   │
│                ╰──────╯ ╰──────╯             │
│                  ↑ centros a 50% del alto    │
│                                              │
└──────────────────────────────────────────────┘
```

- **Relación de aspecto 2:1** (ej. 1200×600 px, 1600×800 px). Que coincida con la proporción del marco en la realidad.
- **Lente-izquierda** centrada en ~**25% del ancho**.
- **Lente-derecha** centrada en ~**75% del ancho**.
- **Centros de los lentes** (el punto medio vertical de cada círculo/rectángulo del lente) a **~50% del alto**.
- **Sin inclinación**: el puente del marco tiene que estar horizontal en la foto (que parezca que está colgado derecho sobre una mesa).
- **Vista de frente estricta**, no en 3/4 ni de perfil.

---

## Pasos

1. Apoyá la armadura sobre una mesa, vista de frente, lentes paralelos a la cámara.
2. Asegurate de que el puente esté a la misma altura que los centros de los lentes (las patillas se pueden abrir un poco).
3. Sacale 2-3 fotos con luz pareja (de día cerca de una ventana sirve).
4. Elegí la más nítida.
5. Borrá el fondo (queda PNG con transparencia).
6. Opcional: recortá la imagen para que el marco ocupe más lugar (siguiendo las proporciones de arriba).
7. Exportá como **PNG** (no JPG).

---

## Tamaño y formato

- **Formato:** PNG (preserva la transparencia).
- **Resolución sugerida:** 1200×600 px o 1600×800 px (no hace falta más).
- **Tamaño de archivo:** idealmente menos de 500 KB. Si queda más grande no pasa nada, pero intentá no pasar de 1 MB.
- **Nombre del archivo:** usá el nombre del modelo, ej. `aria-001.png`.

---

## Ejemplos

### ✅ Foto buena

- Marco centrado horizontal y vertical.
- Lente-izq ~25%, lente-der ~75% del ancho.
- Centros de lente exactamente a la mitad del alto.
- Fondo transparente.
- Puente horizontal (sin tilt).

### ❌ Foto mala

- Marco inclinado o en 3/4.
- Lentes muy juntos o muy separados.
- Centros de lente muy arriba o muy abajo del medio.
- Fondo con color (no transparente).
- Foto de alguien usando la armadura (queremos el marco solo, sin cara).

---

## ¿Por qué importa la composición?

El probador virtual usa MediaPipe para detectar los ojos del cliente en la foto que sube. Toma los landmarks 33 (esquina exterior ojo derecho) y 263 (esquina exterior ojo izquierdo) y posiciona la armadura entre ellos, rotada según el roll de la cabeza. Si los centros de los lentes de la foto no están donde la matemática espera, la armadura va a quedar corrida hacia arriba o hacia abajo respecto a los ojos.

No te preocupes si no sale perfecta al primer intento — desde el panel de administración (Nuevo producto) podés subir, ver el preview y volver a subir hasta que quede bien.
