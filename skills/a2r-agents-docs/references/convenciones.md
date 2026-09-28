# Convenciones de `.agents/`

## Estructura

```
AGENTS.md                    router único (≤60 líneas); sin CLAUDE.md en la raíz
.claude/rules/<dominio>.md   `paths:` del código del dominio → «Lee .agents/<dominio>/INDEX.md» + 1–3 trampas
.claude/rules/proceso.md     `paths:` .agents/**, AGENTS.md, .claude/rules/** → resumen de AI-INSTRUCTIONS
.agents/
  AI-INSTRUCTIONS.md         cómo se lee y se escribe (≤1000 tokens); el único fichero de la raíz
  .scratch/                  notas de sesión, gitignored; nunca se commitea
  scripts/                   lint-structure.ts · lint-docs.ts · lint.test.ts · structure-schema.json
  skills/                    solo si el repo ya guarda ahí skills instaladas (va en `excluded`)
  <dominio>/INDEX.md         la ficha: índice por palabras clave que enlaza TODO lo del dominio (≤250)
  <dominio>/trampas.md       lo que ya ha roto algo («Antes de tocar código»)
  <dominio>/<tema>.md        un tema, ≤500 tokens
  <dominio>/<tema>/          un tema partido: su INDEX.md (≤200) y sus documentos, un solo nivel
  <dominio>/planes/          trabajo sin hacer, con su A2R-nnn
  <dominio>/registros/       con fecha (AAAA-MM-DD-<slug>.md) o una serie (<serie>/README.md + entradas)
  <dominio>/para-clientes/   lo que se entrega fuera
```

`comun/` (producto, estilo, testing, revisión, glosario) y `plataforma/` (entornos, desarrollo
local, despliegue, CI) existen siempre. `comun` va en `withoutRule`: no tiene ruta de código.

**Por qué por dominio y no por tipo.** Los agentes llegan por la ruta que tocan. Con carpetas por
tipo (`codebase/`, `how-tos/`, `reference/`…), un mismo dominio acababa repartido en cinco sitios y
los índices se desincronizaban. Lo que hace funcionar la lectura justo a tiempo son el índice por
palabras clave, el tope de tamaño y el linter. El tipo es una etiqueta, no una carpeta.

## La ficha (`INDEX.md`)

```markdown
# <Dominio>

<1–2 líneas: qué es.> **Código**: `ruta/`, `otra/ruta.ts`. **Antes de tocar código**: [trampas](trampas.md).

**Palabras clave**: término, otroTérmino, identificadorDelCódigo, english term

- [Título](documento.md) · receta
- [Otro](tema/INDEX.md) · reglas — nota corta opcional

**Palabras clave**: …

- [Junto al código](../../src/modulo/README.md) · reglas — junto al código, manda sobre esto

**Planes**: [x](planes/x.md). **Registros**: [registros/](registros/). **Para clientes**: [para-clientes/](para-clientes/).
```

- Cada entrada `- [Título](ruta) · <tipo>` cuelga de una línea `**Palabras clave**:`. Entre la
  línea y sus entradas solo puede haber otras entradas o líneas en blanco. La línea de palabras
  clave puede ocupar varias líneas.
- Las palabras clave son las que escribiría quien busca: el término en castellano, el
  identificador del código y el término en inglés si se usa. Si un agente no encontró algo con su
  palabra, se añade.
- La ficha enlaza `registros/` y `para-clientes/` (la carpeta basta) si tienen algo, y cada plan de
  `planes/`.
- Una entrada puede salir de `.agents/` hacia un `README.md` o un `AGENTS.md` junto al código. Lo
  que vive junto al código manda.

## Tipos

| Tipo | Qué es |
|---|---|
| `reglas` | qué se hace y qué no |
| `receta` | pasos numerados, escritos contra el código o un sistema vivo |
| `diseño` | cómo está hecho |
| `referencia` | términos, tablas, valores |
| `integración` | un sistema externo |

## Documento

- Sin frontmatter. Un H1, una línea con qué es y cuándo leerlo, y el cuerpo. Las palabras clave
  van en la ficha, no en el documento.
- ≤500 tokens. Si se pasa y está congelado en `oversized` o es `generated`, abre con un resumen `> `
  de ≤80 tokens en sus cinco primeras líneas.
- Enlaces relativos en markdown. Nada de `mdc:` ni de rutas absolutas.
- **Un dato duro vive en un solo sitio.** Precios, códigos o valores que viven en el código o en una
  migración se enlazan; no se copian.
- Un documento generado por un script lleva `<!-- Generado por <script>. No edites a mano. -->`
  después del resumen y se declara en `generated`.

## Destino de un documento

1. **El dominio** de la zona de código que describe. Si cruza varios, el que más toca, enlazado
   desde los otros. Si no es de ninguno, `comun/` o `plataforma/`.
2. **La subcarpeta**: un plan, a `planes/`; lo que retrata un momento, a `registros/`; lo que se
   entrega a un cliente, a `para-clientes/`; lo demás, a la raíz del dominio o a su tema.
3. **Ampliar o crear**: si ya hay un documento del tema y cabe, se amplía. Si no cabe, se parte en
   un tema. Si es otro tema, es un documento nuevo.

## Topes (tokens ≈ caracteres/4)

| Qué | Tope |
|---|---|
| `AI-INSTRUCTIONS.md` | 1000 |
| ficha `<dominio>/INDEX.md` | 250 |
| índice de tema `<dominio>/<tema>/INDEX.md` | 200 |
| documento | 500 |
| resumen `> ` de un documento que se pasa | 80 |
| `AGENTS.md` | 60 líneas |

Sin tope: `planes/`, `registros/`, `para-clientes/`, las redirecciones y `generated`.

## Trinquete (`oversized`)

`oversized` es un mapa `ruta → tokens` dentro de `structure-schema.json`. Un documento de la lista:

- **no puede crecer** por encima de su número;
- **sale de la lista** en cuanto cabe en 500 tokens, y el linter lo exige;
- **sale de la lista** si se borra o se mueve.

La lista solo encoge. `npx tsx .agents/scripts/lint-docs.ts --write-baseline` la reescribe con el
estado actual. Se usa **una sola vez**, al estrenar el trinquete en un repo con documentos que ya se
pasan. Quien toca un documento de `oversized` lo parte en un tema.

## Nombres

- kebab-case en castellano, sin tildes ni eñes en el nombre de fichero (`anadir-una-suite.md`).
- Sin repetir el dominio: `migraciones/nueva-migracion.md`, no `migraciones/migraciones-nueva.md`.
- Un registro empieza por su fecha: `registros/2026-09-28-docs-jit.md`. Dentro de una serie
  (`registros/<serie>/`), el nombre es libre y la serie abre con su `README.md`.
- Un dominio con nombre de módulo lo conserva (`tts-v2`, `custom-actions-v2`).
- `INDEX.md` solo en la raíz de un dominio o de un tema. `README.md` solo como índice de una serie o
  como redirección declarada en `redirects`.

## Partir un documento

- **Un nivel.** `<dominio>/<tema>/INDEX.md` (≤200 tokens) enlaza sus documentos. No hay
  `<tema>/<subtema>/`.
- **Dos niveles de índice sin carpeta nueva.** Si el tema es enorme (un contrato, un juego de
  ADR), el `INDEX.md` del tema enlaza **cabeceras de sección** (≤500) y cada cabecera enlaza sus
  partes (≤500). Las partes se llaman `<slug>-1.md … <slug>-N.md` y su H1 acaba en `(n/N)`, con una
  línea de navegación: `Cabecera: [§4](4-errores.md) · sigue en [2/3](4-errores-2.md)`.
- **Lo normativo se mueve literal.** Un contrato o una ADR no se reescribe ni se resume; se parte por
  secciones. Se conservan los números (`§4.3`, `D2.1`) en el título y en el nombre del fichero,
  porque el código los cita. El changelog pasa a `registros/`.
- **ADR**: `# Dn — Título · ESTADO` (ACEPTADA, PROPUESTA, PENDIENTE, DEROGADA), una línea de para qué,
  `**Contexto.**` y `**Decisión.**`. Una ADR derogada conserva su texto con un aviso
  `> **DEROGADA (A2R-nnn, AAAA-MM-DD).** …`.
- Si Prettier rellena tablas anchas y multiplica los tokens, esa carpeta va a `.prettierignore`.

## Planes y registros

- Un plan lleva su `A2R-nnn` en el título y abre con un resumen `> `.
- **Un plan ejecutado se cierra en el mismo commit**: pasa a `registros/AAAA-MM-DD-<slug>.md` con
  «Ejecutado el dd/mm/aaaa, commit `xxxx`», o se borra.
- Un registro retrata un momento y no se corrige después. La verdad actual vive en los documentos
  del dominio.
- Los registros no citan fuentes externas de inspiración (charlas, empresas, artículos): cuentan qué
  se hizo aquí y por qué.

## Enrutado

- Cada dominio sale en **exactamente una** fila de la tabla de `AGENTS.md`, con la ruta de su ficha.
- Cada dominio, salvo los de `withoutRule`, tiene `.claude/rules/<dominio>.md` con `paths:` y la
  cita a su ficha. La regla apunta; no copia. Para que se versione, `.gitignore` no puede ignorar
  `.claude/rules/`.
- Nada de planes en `.claude/`. Las notas de sesión van en `.agents/.scratch/`.

## `docs/`

- Si el repo tenía `docs/` y lo citan ficheros que no se editan (migraciones ejecutadas), quedan
  avisos de una línea que enlazan el destino nuevo, declarados en `stubs`, y los ficheros que citan
  van en `frozen`.
- Si `docs/` es documentación para personas que se queda, va en `excluded`.
- Si no queda nada, se borra y se añade a `forbidden` un patrón que impida volver a enlazarlo.
