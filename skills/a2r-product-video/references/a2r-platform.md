# Grabar A2R Studio: entorno, datos y trampas

Son las lecciones de los walkthroughs de Evaluaciones y Generación de actividades
(octubre-noviembre de 2026). Léelas antes de escribir el primer guion de grabación.

## Entorno y sesión

- **Se graba en PRE.** Su URL se pasa en `A2R_BASE`; pídesela al equipo, porque no está en los
  `.env` del repo. Producción, solo con el modo cuidado de `SKILL.md`.
- **La sesión es la de la e2e del repo nimrod-multitenant.** `walk-lib.ts` hace login con la
  cuenta de `e2e/.env.e2e` (`E2E_EMAIL` y su contraseña; se copia de `e2e/.env.e2e.example`).
  Después siembra las cookies `directus_session_token` y `directus_refresh_token` en el host
  del front. Nadie teclea credenciales en la toma.
- **Usa siempre una cuenta con rol Default, nunca admin.** `admin_access` se salta las
  políticas y enseña cosas que un cliente no ve.
- **Interfaz en inglés.** Pon `language: 'en-GB'` en el usuario con `PATCH /users/me` y la
  misma cuenta. Guarda antes el valor original y devuélvelo al acabar: es una cuenta
  compartida, y la usan la e2e y las pruebas de humo.

## Datos: grabar limpio antes que tapar

- **Crea datos DEMO propios con la cuenta Default.** Por ejemplo, la evaluación «DEMO · La
  Revolución Industrial, 4.º ESO», la marca «Editorial DEMO · Ciencias» o el trabajo «Ficha
  de repaso · El movimiento, 3.º ESO». Apunta sus ids y avisa al usuario de lo que dejas en
  PRE.
- **Filtra los listados por DEMO en `prep`**, antes de la acción. Si se filtra mientras se
  teclea, el listado sin filtrar se ve uno o dos segundos.
- **Esconde las DEMO de grabaciones anteriores** con `HIDE=<id>,<id>`: `walk-lib.ts` esconde
  su fila o su tarjeta. Ojo: `nth()` sigue contando lo oculto, así que usa
  `>> visible=true`.
- **Renombra en el navegador** lo que no se puede limpiar, con `RENAMES` y `REGEXES`. También
  se reescriben los valores de los campos, porque React los repone. La columna «Creado por»
  no se deja renombrar bien: escóndela con CSS.
- **El renombre no llega a los ficheros exportados.** Exporta con una marca DEMO: la marca
  predeterminada de PRE lleva el nombre de un cliente en la portada y en la cabecera del PDF.
- **No saques nombres de clientes** salvo que el vídeo sea para ese cliente y lo hayan
  autorizado. No saques nombres de compañeros, códigos `A2R-nnn`, «LOCAL · prueba…» ni
  «Humo…». Al final, pasa `ocr-nombres.sh`.
- No borres ni archives datos que no hayas creado tú. Borrar un documento de contexto pide
  teclear su nombre y no se puede deshacer, así que no lo hagas en una toma.

## Grabación: trampas conocidas

- **El script inicial va como cadena**, como en `walk-lib.ts`. Con `tsx`, una función pasada
  a `addInitScript` lleva `__name` y falla sin avisar.
- **El cursor** se cuelga de `body` y se repone con un `setInterval`, porque la hidratación de
  Next lo borra. Solo se pinta en `window.top`: si no, el iframe del PDF pinta un segundo
  cursor.
- **Mueve con `page.mouse.move(x, y, { steps })`** (`glide`, `hover` y `click` de la lib).
  Haz clic con `locator.click()` después del desplazamiento y espera al estado nuevo, sea una
  tarjeta, una rejilla o un `menuitem`.
- **Usa `page.setDefaultTimeout(5000–6000)`.** Si no, una caja que no aparece mete 30 s
  muertos en la toma.
- **Selects de HeroUI v3**: abre el combobox visible y elige con `getByRole('option')`, no con
  `selectOption`. El botón de un select se llama «<valor> <etiqueta>».
- **Casillas y `Switch` de HeroUI v3**: el `input` es sr-only, así que haz clic en su `label`.
- **La página tiene scroll suave**, y `scrollIntoView` más `scrollBy` se corta. Usa
  `window.scrollTo({ behavior: 'instant' })` o `scrollBy` de la lib, con el cursor dentro del
  viewport.
- **Pestañas**: en Chromium headless, el indicador se queda a medio animar. Inyecta el CSS
  `.tabs__indicator{translate:none !important}`.
- **El visor de PDF sale en blanco** con el headless por defecto. `walk-lib.ts` ya lanza
  `chromium.launch({ channel: 'chromium' })`.
- **Modo oscuro**: la app no sigue `prefers-color-scheme`. Pon `dark: true` en la toma y la lib
  añade la clase `dark` y `data-theme='dark'` a `<html>`.
- **Esperas del LLM**: no esperes a que el texto deje de crecer, porque se para durante el
  razonamiento. Espera a un contenido concreto del resultado.
- **Vistas previas que ensanchan la página**, como el crucigrama o marcar palabras: vuelve con
  `scrollTo({ left: 0 })`.
- **Campos numéricos con rango**: rechazan valores fuera de rango mientras se escribe. Cámbialos
  con ArrowDown.

## Por módulo

- **Evaluaciones.**
  - Al crear se pide la rúbrica (`input[name=fileRubric]`). Extraer los criterios tarda 2-3
    min, y corregir cada entrega, unos 5.
  - El visor de una corrección es `/activity/[id]`, y se abre con el enlace del nombre. Para
    verlo a dos columnas, la entrega tiene que llevar PDF.
  - No despliegues «Detalles del cálculo de la nota»: enseña trazas internas.
  - No archives una corrección a medias: al terminar, el worker la publica otra vez.
- **Generación de actividades.**
  - Para generar hace falta un fichero de contexto.
  - La vista previa sale en JSON: elige HTML en `prep`.
  - Exportar solo saca las actividades aprobadas, así que pulsa «Aprobar todo» antes.
  - QTI solo admite los tipos clásicos: los pasatiempos se quedan fuera, y el diálogo lo dice.
  - Si un tipo no genera dentro de un trabajo grande, genéralo en un trabajo aparte o ajusta la
    instrucción de su línea.

## Documentos

- **Word, PDF u Office a PNG por página**: usa `assets/render/doc-to-images.sh`. Sin LibreOffice,
  genera el PDF con `page.pdf()` de Chrome headless y pásalo por `pdftoppm`.
- **Descargas**: crea el contexto con `acceptDownloads` y usa `page.waitForEvent('download')`.
