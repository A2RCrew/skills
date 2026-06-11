---
name: docx-ninja
description: Super-skill para deliverables Word (.docx) de A2R. Redacta o revisa el contenido con la voz de marca (a2r-brand-voice), lo enriquece con tablas, gráficos SVG, callouts e iconos en la paleta de marca (a2r-brand-design-system) y lo entrega como .docx con portada, índice, cuerpo maquetado y contraportada corporativos llamando al endpoint público POST https://voice.a2r.com/api/v1/md2docx (script incluido, sin depender de otras skills). Úsala SIEMPRE que el usuario escriba "/docx-ninja", o pida "redacta y maqueta esto en Word con la marca A2R", "escribe esta propuesta/informe/memo con voz A2R y pásalo a docx", "documento corporativo de A2R con texto, tablas y gráficos", "Word de A2R con la plantilla y la imagen de marca", o cualquier deliverable .docx de A2R donde haya que cuidar redacción (tono), formato (plantilla) y/o elementos visuales (tablas, gráficos, colores de marca). Si solo hace falta redactar/revisar copy sin .docx, usa a2r-brand-voice; si solo hace falta diseño web/UI, usa a2r-brand-design-system.
---

# docx-ninja

Super-skill **autónoma** para deliverables A2R en `.docx`. Cubre las tres
dimensiones de un documento corporativo en un solo flujo:

1. **Redacción** → tono y estilo de marca con [`a2r-brand-voice`](../a2r-brand-voice/SKILL.md).
2. **Elementos visuales** → tablas, gráficos, callouts, iconos y colores con los
   tokens de [`a2r-brand-design-system`](../a2r-brand-design-system/SKILL.md).
3. **Maquetación final** → `.docx` con la plantilla corporativa llamando al
   endpoint `md2docx` con el **script incluido** en esta misma skill
   (`scripts/md2docx.mjs`).

La **plantilla base** (portada, índice, tipografía, logos, contraportada) la
aplica el servidor — no la maquetes a mano. El diseño de marca se usa solo para
lo que **vive dentro del cuerpo** (tablas, gráficos, SVG, colores destacados).

> Esta skill **no depende** de `aplicar-plantilla-docx`: trae su propia copia del
> conversor. Sí necesita las skills `a2r-brand-voice` y `a2r-brand-design-system`
> (instaladas junto a ella en esta colección).

## Cuándo usarla

- El usuario quiere un Word corporativo de A2R **y** hay que cuidar a la vez
  redacción, elementos visuales del cuerpo y/o formato: propuestas, informes,
  memos, documentación de cliente, keynotes, etc.
- Resumen de decisión:
  - Solo redactar/revisar copy (sin .docx) → `a2r-brand-voice`.
  - Solo diseño web/UI/marketing (sin .docx) → `a2r-brand-design-system`.
  - **Redactar/revisar + elementos visuales + entregar en .docx** → esta skill.

## Flujo de trabajo

### 1. Redacta o revisa el contenido con voz A2R

Carga y aplica **`a2r-brand-voice`**. Según lo que aporte el usuario:

- **Te da un tema / encargo** → redacta el contenido en Markdown aplicando las
  reglas de tono, los pilares de personalidad, la modulación por tipo de
  contenido (propuesta, informe, blog…) y la terminología de producto/modelos.
- **Te da un borrador (texto o `.md`)** → revísalo y reescríbelo según la
  *Brand Voice Compliance Checklist* antes de maquetar.

Reglas que NO debes saltarte (ver la skill para el detalle completo):

- Narrador colectivo "nosotros" / "we"; nunca "yo".
- **Sin emojis** (severidad alta).
- Sin buzzwords corporativos ni mensajes basados en el miedo; nada de "empower".
- Nombres de producto y modelos A2R con la grafía y mayúsculas exactas.
- Español: estilo "punchy", siempre "tú" (solo "usted" en textos legales).
- Sin títulos con punto final salvo que tengan más de una frase.

El resultado es un Markdown limpio. **Asegúrate de que el primer `# H1` es el
título correcto** (será el título de la portada) y de que el contenido no
supera **1 MB**.

### 2. Enriquece con elementos visuales de marca (cuando aporten valor)

Carga y aplica **`a2r-brand-design-system`** para todo lo que vaya **dentro del
cuerpo**. La plantilla del endpoint ya da la identidad base; aquí solo aplicas
marca a los elementos que tú añades al Markdown:

- **Tablas** → para datos comparativos, especificaciones, planes/precios.
  Encabezados claros y concisos (con voz A2R). El endpoint las maqueta con el
  estilo de la plantilla; no apliques el borde de esquinas de las *cards* de la
  guía de diseño (esa regla excluye expresamente listas y tablas).
- **Gráficos** → genera el gráfico como **SVG embebido** (`<svg>...</svg>`); el
  endpoint lo **rasteriza a PNG** y lo inserta como imagen. Colorea las series
  con la **paleta de marca**:
  - Color principal de datos: **Core Blue `#2764F4`**.
  - Acentos (un solo acento por gráfico, regla 60-30-10): Fresh Green `#A1E8C9`,
    Bright Yellow `#F7FF8E` o Warm Orange `#FFCDBF`.
  - Texto/ejes: Solid Black `#111218`; rejilla suave: Silver Gray 300 `#E6E6E9`.
- **Callouts / destacados** → resalta palabras clave o cifras con Core Blue.
- **Iconos** → para acentos gráficos usa los *display icons* de la guía
  (p. ej. `Chart`, `Check`, `Sparks`) como SVG embebido; no uses iconos de UI.

Consulta `a2r-brand-design-system` (`references/colors-and-tokens.md`) para el
detalle. Pasa la *Brand Compliance Checklist* a los visuales que añadas (paleta
correcta, máximo un acento, contraste, etc.).

Si el documento es texto plano sin datos que lo justifiquen, **omite este paso**:
no fuerces tablas ni gráficos donde no aportan.

### 3. Prepara los metadatos de portada (también con voz A2R)

El conversor permite enviar `subtitle`, `abstract` y `clientName`. Si no los
envías, los **genera el servidor con IA**. Para un deliverable de cliente,
**redáctalos tú** con `a2r-brand-voice` (subtítulo y abstract con el tono
adecuado) en vez de dejarlos a la IA: más fiel a la marca y más rápido.

Decide / pregunta: `locale` (por defecto `es` para A2R), `authorName`
(por defecto "A2R"/"Equipo A2R"), `subtitle`, `abstract`, `clientName`
(`none` si no aplica), `date`, `filename`.

### 4. Maqueta a .docx

Llama al script incluido en esta skill. Node debe estar disponible; la
conversión puede tardar hasta ~120 s (más aún si hay SVG que rasterizar).
Ejecuta el script desde el directorio de la skill (la ruta de
`scripts/md2docx.mjs` es relativa a esta carpeta):

```bash
node scripts/md2docx.mjs \
  --markdown "ruta/al/documento.md" \
  --out "ruta/salida/documento.docx" \
  --locale es \
  --authorName "Equipo A2R" \
  --clientName "Cliente S.A." \
  --subtitle "Subtítulo redactado con voz A2R" \
  --abstract "Resumen de 2-3 frases redactado con voz A2R."
```

(Si Node no estuviera disponible, usa `scripts/md2docx.ps1` con los mismos
parámetros: `-MarkdownPath`, `-OutFile`, `-Locale`, `-AuthorName`, etc.)

### 5. Avisa al usuario

Al abrir el `.docx` en Word, **Word pedirá actualizar los campos** para mostrar
los números de página del índice → aceptar ("Sí"). Es normal por el índice
automático.

## Endpoint md2docx

```
POST https://voice.a2r.com/api/v1/md2docx
Content-Type: application/json
```

⚠️ **Endpoint público, sin autenticación.** No compartas la URL fuera del equipo
A2R ni envíes datos sensibles de cliente que no deban salir.

### Cuerpo de la petición (JSON)

| Campo | Tipo | Requerido | Por defecto | Descripción |
|-------|------|-----------|-------------|-------------|
| `markdown` | string | **Sí** | — | Markdown a convertir. El primer `# H1` es el título. Máx. **1 MB**. |
| `locale` | `"en"` \| `"es"` | No | `"en"` | Idioma del documento (portada, índice, fecha). |
| `authorName` | string | No | `"A2R"` | Autor de la portada. |
| `subtitle` | string | No | Generado con IA | Subtítulo de la portada. |
| `abstract` | string | No | Generado con IA | Resumen (2-3 frases) de la portada. |
| `clientName` | string | No | Generado con IA | Cliente para la portada. `"none"` si no aplica. |
| `date` | string | No | Fecha actual según `locale` | Texto libre de fecha. |
| `filename` | string | No | `"a2r-document.docx"` | Nombre del fichero (se sanea y se fuerza `.docx`). |

Enviando `subtitle`, `abstract` y `clientName` se **omite la IA** y la conversión
es más rápida y determinista.

### Respuesta y errores

- **200 OK** → binario `.docx`. **Error** → JSON `{ "error": "<mensaje>" }`.

| Código | Causa |
|--------|-------|
| 400 | JSON inválido, falta `markdown`, `markdown` vacío o supera 1 MB. |
| 500 | Fallo interno al generar el documento. |

El script imprime `md2docx failed (<código>): <mensaje>` y sale con código 1. Lo
más común: falta `# H1`, Markdown vacío, o supera 1 MB.

## Notas

- **SVG** embebido en el Markdown se rasteriza a PNG y se inserta como imagen —
  es la vía para gráficos e iconos de marca en el documento.
- **Timeout** hasta 120 s; no reintentes antes de tiempo.
- La identidad **base** del .docx (portada, tipografía, logos) la garantiza la
  plantilla del endpoint; `a2r-brand-design-system` se usa solo para los
  elementos que añades al cuerpo (tablas, gráficos, colores, iconos).

## Fuente

Documentación del endpoint: issue
[A2RCrew/a2r-brand-voice#3](https://github.com/A2RCrew/a2r-brand-voice/issues/3).
