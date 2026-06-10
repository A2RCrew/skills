---
name: aplicar-plantilla-docx
description: Convierte contenido Markdown en un documento Word (.docx) con la plantilla corporativa de A2R (portada, índice automático, cuerpo maquetado y contraportada) llamando al endpoint público de A2R Brand Voice (POST https://voice.a2r.com/api/v1/md2docx). Úsala SIEMPRE que el usuario escriba "/aplicar-plantilla-docx", o pida "aplicar la plantilla docx", "convertir este markdown a docx", "generar un Word con la plantilla de A2R", "maquetar este markdown con la portada de A2R", "pasar este .md a documento corporativo", o cualquier petición de transformar un Markdown/MD en un .docx con la imagen de marca de A2R. No usar para PDFs ni para crear .docx sin la plantilla corporativa (para eso, la skill genérica docx).
---

# aplicar-plantilla-docx

Convierte un Markdown en un `.docx` con la **plantilla corporativa de A2R** llamando
al endpoint público de conversión de A2R Brand Voice. El endpoint reutiliza el
conversor oficial y produce: **portada**, **índice automático**, **cuerpo
maquetado** y **contraportada**, con la identidad visual de A2R ya aplicada.

> El diseño visual (colores, tipografía, logos) lo aplica el servidor a partir de
> la plantilla corporativa. Esta skill **no** maqueta a mano: solo prepara el
> Markdown + metadatos y llama al endpoint.

## Cuándo usarla

- El usuario tiene (o acaba de redactar) un Markdown y quiere un Word con la
  imagen de marca de A2R.
- Cualquier deliverable A2R en formato `.docx`: propuestas, informes, memos,
  documentación de cliente, etc.

Para la **redacción** del contenido aplica además la skill `a2r-brand-voice`
(tono y estilo). El **formato visual** ya lo garantiza el endpoint, así que no
necesitas `a2r-brand-design-system` para la maquetación del .docx.

## Endpoint

```
POST https://voice.a2r.com/api/v1/md2docx
Content-Type: application/json
```

⚠️ **Endpoint público, sin autenticación.** No compartas la URL fuera del equipo
A2R. No envíes datos sensibles de cliente que no deban salir.

### Cuerpo de la petición (JSON)

| Campo | Tipo | Requerido | Por defecto | Descripción |
|-------|------|-----------|-------------|-------------|
| `markdown` | string | **Sí** | — | Markdown a convertir. El primer `# H1` se usa como título. Máx. **1 MB**. |
| `locale` | `"en"` \| `"es"` | No | `"en"` | Idioma del documento (textos de portada, índice, formato de fecha). |
| `authorName` | string | No | `"A2R"` | Autor que aparece en la portada. |
| `subtitle` | string | No | Generado con IA | Subtítulo de la portada. |
| `abstract` | string | No | Generado con IA | Resumen (2-3 frases) de la portada. |
| `clientName` | string | No | Generado con IA | Cliente para la portada. Usa `"none"` si no aplica. |
| `date` | string | No | Fecha actual según `locale` | Texto libre de fecha para la portada. |
| `filename` | string | No | `"a2r-document.docx"` | Nombre del fichero (se sanea y se fuerza `.docx`). |

Si faltan `subtitle`, `abstract` o `clientName`, el servidor los **genera con IA**
a partir del contenido. Enviando los tres se **omite la IA** y la conversión es
más rápida y determinista. Para deliverables de cliente, **prefiere enviarlos**
redactados con `a2r-brand-voice` en lugar de dejarlos a la IA.

### Respuesta

- **200 OK** → binario `.docx` (`Content-Type: ...wordprocessingml.document`).
- **Error** → JSON `{ "error": "<mensaje>" }`.

| Código | Causa |
|--------|-------|
| 400 | JSON inválido, falta `markdown`, `markdown` vacío o supera 1 MB. |
| 500 | Fallo interno al generar el documento. |

## Flujo de trabajo

1. **Consigue el Markdown.** Si el usuario te da un fichero `.md`, úsalo. Si te da
   contenido en el chat, guárdalo en un `.md` temporal. Si te pide redactar el
   contenido, escríbelo aplicando `a2r-brand-voice` y guárdalo en un `.md`.
   - El primer `# H1` del Markdown será el **título** de la portada → asegúrate de
     que existe y es el título correcto.
   - Comprueba que no supera **1 MB**.
2. **Decide los metadatos de portada.** Pregunta o infiere `locale` (por defecto
   `es` para A2R), `authorName`, `subtitle`, `abstract`, `clientName`, `date`,
   `filename`. Para cliente, redáctalos tú con voz A2R; si no, déjalos en blanco y
   los genera la IA.
3. **Llama al endpoint** con el script incluido (ver abajo). Guarda el `.docx` en
   la ruta de salida que indique el usuario (por defecto, junto al `.md`).
4. **Avisa al usuario** de que, al abrir el documento en Word, **Word pedirá
   actualizar los campos** para mostrar los números de página del índice (Acepta /
   "Sí"). Esto es normal por el índice automático.

## Cómo invocar el conversor

Usa el script Node incluido (`scripts/md2docx.mjs`). Node ya está disponible y la
conversión puede tardar **hasta 120 s** (el script usa timeout de 130 s).

```bash
node "C:\Users\usuario\.claude\skills\aplicar-plantilla-docx\scripts\md2docx.mjs" \
  --markdown "ruta\al\documento.md" \
  --out "ruta\salida\documento.docx" \
  --locale es \
  --authorName "Equipo A2R" \
  --clientName "Cliente S.A." \
  --subtitle "Propuesta técnica y económica" \
  --abstract "Documento de propuesta para el proyecto X."
```

Argumentos del script (todos opcionales salvo `--markdown`):

| Flag | Mapea a | Notas |
|------|---------|-------|
| `--markdown <ruta>` | `markdown` (leído del fichero) | **Obligatorio.** UTF-8. |
| `--out <ruta>` | — | Dónde guardar el `.docx`. Por defecto `--filename` o `a2r-document.docx`. |
| `--locale <en\|es>` | `locale` | Por defecto `es`. |
| `--authorName <txt>` | `authorName` | |
| `--subtitle <txt>` | `subtitle` | |
| `--abstract <txt>` | `abstract` | |
| `--clientName <txt>` | `clientName` | `none` si no aplica. |
| `--date <txt>` | `date` | |
| `--filename <txt>` | `filename` | Nombre dentro del documento; se fuerza `.docx`. |

En caso de error HTTP, el script imprime `md2docx failed (<código>): <mensaje>` y
sale con código 1. Diagnostica según la tabla de errores de arriba (lo más común:
falta `# H1`, Markdown vacío, o supera 1 MB).

### Alternativa PowerShell

Si Node no estuviera disponible, usa `scripts/md2docx.ps1` con los mismos
parámetros (`-MarkdownPath`, `-OutFile`, `-Locale`, `-AuthorName`, etc.).

## Notas operativas

- **Timeout:** hasta 120 s para documentos largos, con SVG embebidos o metadatos
  por IA. No reintentes antes de tiempo.
- **SVG:** los bloques `<svg>...</svg>` del Markdown se rasterizan a PNG y se
  insertan como imágenes.
- **Tamaño:** `markdown` no puede superar 1 MB.

## Fuente

Documentación oficial del endpoint: issue
[A2RCrew/a2r-brand-voice#3](https://github.com/A2RCrew/a2r-brand-voice/issues/3)
(código en `main`, commit `2ebeaf9`; fuente en `docs/api/md2docx.md`).
