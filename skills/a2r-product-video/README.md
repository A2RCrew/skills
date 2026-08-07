# a2r-product-video

Skill para generar **vídeos de demostración de producto con el formato estándar de
A2R**: se graba un módulo de la plataforma con **Playwright** (solo el viewport,
sin navegador, con cursor y la sesión ya iniciada) y se monta con **Remotion** con
la marca A2R (intro, rótulos por paso, interstitial de "procesando", scroll de
documentos, cierre). Salida 1920×1080 (o 9:16), 30 fps, por defecto **sin audio**.

Es una **estrategia reutilizable**, no un guion fijo. Arranca con una **entrevista**
(entorno, audio, fichero, idioma, formato, permisos, escenas) y adapta el vídeo a
cada módulo. En **Producción** activa un *modo cuidado* (DRY-run, confirmación por
acción, nunca tocar datos ajenos).

## Uso

Instala el plugin y escribe `/a2r-product-video` (o pide "un vídeo demo de este
módulo con el estilo de A2R"). La skill te guía por: entrevista → comprobación de
dependencias → grabación → montaje → entrega.

## Contenido

- `SKILL.md` — estrategia, flujo de trabajo, modo Producción.
- `references/` — recetas de grabación (`recording.md`), montaje (`remotion.md`) y
  la gramática de escenas (`scene-taxonomy.md`).
- `assets/` — building blocks reutilizables: librería de grabación Playwright,
  login-once, pipeline documento→PNG, y los componentes Remotion de marca.

## Dependencias

- Plugins (auto-instalan): `a2r-brand-design-system` (visual) y `a2r-brand-voice`
  (textos/rótulos).
- Companion recomendado: el plugin de skills de **Remotion**.
- Herramientas del sistema (verifícalas con `assets/setup/check-deps.sh`): Node,
  Google Chrome, ffmpeg y —solo para escenas de documento— LibreOffice y poppler.
