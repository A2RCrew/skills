---
name: a2r-product-video
description: >
  Genera vídeos de demostración de producto con el formato estándar de A2R:
  graba un módulo/caso de uso de la plataforma con Playwright (solo el viewport,
  sin navegador, con cursor y sesión ya iniciada) y lo monta en Remotion con la
  marca A2R (intro, rótulos por paso, interstitial de proceso, scroll de
  documentos y cierre), en 1920×1080 y por defecto sin audio. Es CONFIGURABLE:
  arranca con una entrevista (audio, entorno, fichero, idioma, formato…) y tiene
  cuidado especial en Producción. Úsala SIEMPRE que el usuario escriba
  "/a2r-product-video" o pida "grabar/crear un vídeo de la plataforma", "un vídeo
  demo de este módulo", "un vídeo con el estilo/formato de A2R", "grabar la app
  con Playwright y Remotion" o quiera estandarizar un vídeo de producto. Es una
  ESTRATEGIA reutilizable, no un guion fijo: adáptala a cada módulo (con o sin
  ficheros, con o sin espera asíncrona, con o sin documento visualizable).
# user-invocable: true
---

# A2R product-video

Produce vídeos de demostración de los módulos de A2R con una **estética y una
narrativa consistentes**. No copies el flujo de ningún vídeo concreto (p. ej. "ir
a la página 3 del listado"): sigue la **estrategia** y adáptala al módulo.

Dos etapas: **grabar** el producto real con Playwright (viewport limpio, sin
navegador) y **montar** con Remotion aplicando la gramática de escenas de A2R.

## Cuándo usarla

- El usuario quiere un vídeo de un módulo/caso de uso de la plataforma A2R.
- Se pide "el estilo/formato de A2R", un screencast profesional, o estandarizar
  cómo el equipo hace vídeos de producto.

No la uses para edición de vídeo genérica sin relación con la plataforma.

## Dependencias

Este plugin declara como **dependencias** (se auto-instalan) dos skills de marca,
que operan en capas distintas del vídeo:

- **`a2r-brand-design-system`** → capa **visual**: paleta (Core Blue `#2764F4`,
  Silver Gray, Solid Black), tipografías (Faculty Glyphic + Plus Jakarta Sans),
  logo y regla 60-30-10. Ya va embebida en `assets/remotion/brand.ts`; consúltala
  si necesitas más recursos de marca.
- **`a2r-brand-voice`** → capa **texto**: redacta los rótulos, el subtítulo y el
  tagline con la voz A2R y sus reglas (sin punto final en titulares, mayúsculas
  solo en overlines/botones, "tú"/"nosotros", estilo punchy ES/EN).

Remotion es un **companion recomendado** (su plugin de skills ayuda pero no es
obligatorio: las recetas van en `references/`). Los paquetes npm y las
herramientas del sistema **no** son dependencias de plugin — se comprueban con
`assets/setup/check-deps.sh` (ver Paso 1). Requisitos de sistema: **Node**,
**Google Chrome**, **ffmpeg**, y (solo para escenas de documento) **LibreOffice**
y **poppler**.

## La estrategia (qué hace "A2R" a un vídeo)

1. **Producto real, navegador invisible.** Solo el contenido de la página (nunca
   barras/pestañas), con **cursor virtual** para que se lea como una demo.
2. **Narrativa por pasos.** El flujo se trocea en clips, cada uno con su ritmo y un
   **rótulo** `PASO N`. Navegación rápida; pasos que hay que entender, más lentos.
3. **Marca A2R.** Intro/cierre de marca, color 60-30-10, tipografías Faculty +
   Plus Jakarta Sans, transiciones calmadas sobre lienzo silver.
4. **Escenas opcionales según el módulo.** Documento fuente, interstitial de
   "procesando", scroll del documento resultado.
5. **Entrega 1920×1080 (o 9:16), 30 fps, por defecto SIN audio.**

Escenas y reglas de ritmo: **[references/scene-taxonomy.md](references/scene-taxonomy.md)**.

## Flujo de trabajo

### Paso 0 — Entrevista (obligatorio)

Antes de tocar nada, lanza una **entrevista con `AskUserQuestion`** para
configurar el vídeo. Preguntas mínimas:

- **Entorno de grabación** → `Producción` / `Pre (staging)` / `Local`. Si es
  **Producción**, activa el *modo cuidado* (ver abajo).
- **Audio** → `Sin audio` (por defecto) o `Música de fondo` (SOLO con una pista
  que aporte/apruebe el usuario; nunca descargues música con derechos).
- **Fichero de entrada** → ¿el módulo necesita subir un documento/archivo? Pide la
  ruta y (si aplica) idioma/descripción del contenido.
- **Idioma de los rótulos** → ES / EN (redáctalos con `a2r-brand-voice`).
- **Formato** → 16:9 (web/demo) y/o 9:16 (redes).
- **Permiso para acciones reales** → ¿autorizas ejecutar acciones con efectos
  (crear trabajos, publicar, gastar créditos)? Imprescindible en Producción.
- **Escenas opcionales** → ¿hay espera asíncrona (interstitial)? ¿hay
  documento-resultado visualizable (scroll)?
- **Guion / brief (texto libre)** → pide al usuario, EN SUS PALABRAS, qué quiere
  contar: qué tomas, qué enseñar y cómo, duración objetivo, tono, qué resaltar,
  qué omitir. No lo des por hecho: pregúntalo explícitamente (el usuario puede
  responder "sigue el estándar"). Ver "Guion y datos sensibles" abajo.
- **Ofuscación de datos** → ¿hay que ocultar/anonimizar datos reales o sensibles
  (nombres de cliente, emails, PII, contenido real)? Si sí, ¿cuáles?

Añade cualquier otra pregunta que el módulo requiera. Con las respuestas, decides
qué escenas entran y cómo grabas.

**Guion y datos sensibles (convierte el brief en un plan y confírmalo):**

- Transforma el brief libre en una **lista de tomas** concreta (escenas, orden,
  qué se muestra en cada una, duración aproximada) y **enséñasela al usuario para
  confirmarla o iterarla ANTES de grabar**. Es el punto natural para ajustar.
- Respeta duración/tono/foco del brief al elegir clips, velocidades y rótulos.
- **Ofuscación** — por orden de preferencia: (1) grabar con **datos demo /
  anonimizados** para que nada sensible llegue a aparecer; (2) si aparece en una
  **región fija**, taparla con el overlay `Redaction` (barra sólida fiable, o blur
  best-effort) — coordenadas en px, tiempos en segundos de la escena; (3) si es un
  momento entero, **recortar** esa toma. Valida con `remotion still` que la
  máscara tapa lo que debe. En Producción, trátalo como requisito, no opcional.

### Paso 1 — Comprobar dependencias

Ejecuta `bash assets/setup/check-deps.sh <dir-recorder> <dir-remotion>`: verifica
Chrome/ffmpeg/LibreOffice/poppler e instala `playwright-core`, el ffmpeg de
Playwright y `@remotion/google-fonts`. No toca ni la app ni Producción.

### Paso 2 — Grabar el producto (Playwright)

Sigue **[references/recording.md](references/recording.md)**. En resumen: **login
manual una sola vez** hecho por el usuario (la sesión suele vivir en localStorage;
**Claude nunca teclea credenciales**), explora el DOM para selectores robustos, y
graba con `assets/playwright/record-lib.mjs` (viewport-only + cursor + hitos).

### Paso 3 — Montar el vídeo (Remotion)

Sigue **[references/remotion.md](references/remotion.md)**. Copia los componentes
de `assets/remotion/` a un proyecto Remotion, prepara `data.json` con
`build-data.mjs`, ensambla las escenas, **valida con `remotion still`** y
renderiza. Redacta los textos de los rótulos/subtítulo/tagline con
`a2r-brand-voice` en el idioma elegido. Si el usuario pidió **música**, añádela
como pista y **no** elimines el audio; si es **silencioso** (por defecto),
elimina la pista AAC con `ffmpeg -c:v copy -an`. Para **9:16**, ajusta
`width/height` en `data.json` (ver remotion.md).

### Paso 4 — Entregar

Entrega el `.mp4` (SendUserFile, `display:"render"`), deja copia accesible y
ofrece ajustes de ritmo (los controla `data.json`) u otro formato.

## Modo Producción (cuidado especial)

Si el entorno es **Producción**, trata la cuenta como real y frágil:

- **DRY-run obligatorio** de cualquier flujo con efectos: rellena y captura, pero
  NO envíes hasta verificar.
- **Confirmación explícita del usuario** antes de cada acción con efectos
  (crear/enviar/publicar/pagar). No la generalices: es por acción.
- **Nunca** borres, sobrescribas ni toques datos que no hayas creado tú en esta
  sesión. Prefiere datos de prueba y nombres claramente de demo.
- Pedir permiso antes de **cerrar/relanzar el navegador** del usuario; reabre lo
  que cierres.
- Deja constancia en el resumen final de qué se creó en Producción (por si hay que
  limpiarlo).

En `Pre`/`Local` relaja estos controles, pero mantén el DRY-run para flujos caros.

## Building blocks (assets)

```
assets/setup/check-deps.sh         — doctor de dependencias (npm + herramientas)
assets/playwright/record-lib.mjs   — grabación viewport-only + cursor + hitos
assets/playwright/login-once.mjs   — login manual una vez (sesión persistente)
assets/render/doc-to-images.sh     — docx/pptx/xlsx/pdf -> PNG por página
assets/remotion/brand.ts           — tokens de color + fuentes A2R
assets/remotion/helpers.tsx        — FadeScene, GridBg, CornerMarks
assets/remotion/scenes/            — Intro, Outro, SceneVideo, Interstitial, DocScroll
assets/remotion/*.example.*        — Video/Root/timeline/build-data a adaptar
assets/remotion/remotion.config.ts — config de render
```

Los componentes son el "design system" del vídeo: reutilízalos y cambia solo
`data.json` y los textos de los rótulos.

## Guías

- **Estrategia, no calco.** Reproduce el *enfoque*, no el flujo de otro módulo.
- **Ritmo legible.** Ralentiza lo que haya que entender; scrolls de documento a
  ~120–140 px/s y sin quedarse parado en la última página.
- **Seguridad.** No teclees credenciales; en Producción, modo cuidado.
- **Coste.** Grabar un flujo real puede consumir créditos/crear datos reales:
  confírmalo (Paso 0).

## Ejemplos

### Módulo con fichero y espera (p. ej. Traducciones)
Intro → scroll del documento fuente → subir → configurar (lento) → enviar →
interstitial "procesando" → resultado "Publicado" → scroll del documento resultado
→ cierre.

### Módulo sin fichero ni espera (p. ej. un generador instantáneo)
Intro → pasos de la app (entrada + acción) → resultado en pantalla → cierre. Sin
documento fuente ni interstitial.
