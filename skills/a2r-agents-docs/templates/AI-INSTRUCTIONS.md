# Instrucciones para agentes: cómo se lee y se escribe `.agents/`

Léelo antes de escribir, mover o clasificar un documento; para **leer** basta con el protocolo de
[`AGENTS.md`](../AGENTS.md).

## Cómo se lee

1. La tabla de `AGENTS.md` (o la regla `.claude/rules/<dominio>.md` de la ruta que tocas) lleva a
   la ficha `<dominio>/INDEX.md`.
2. La ficha es un índice: líneas `**Palabras clave**:` con sus documentos debajo. Busca tu palabra
   y abre **solo** ese documento. Si es un tema (`<tema>/INDEX.md`), repite dentro.
3. No abras otros dominios salvo que la tarea los cruce. `registros/` es historia.

## Estructura

```
<dominio>/INDEX.md      la ficha: enlaza TODO lo del dominio
<dominio>/trampas.md    lo que ya ha roto algo («Antes de tocar código»)
<dominio>/<tema>.md     un tema, ≤500 tokens
<dominio>/<tema>/       un tema partido: su INDEX.md y sus documentos, un nivel
<dominio>/planes/       trabajo sin hacer, con su A2R-nnn
<dominio>/registros/    con fecha (AAAA-MM-DD-<slug>.md) o una serie
<dominio>/para-clientes/
comun/ · plataforma/    lo transversal · scripts/: linters y structure-schema.json
```

## Etiquetas y destino

Cada entrada lleva su tipo: `reglas` (qué se hace y qué no), `receta` (pasos numerados, contra el
código o un sistema vivo), `diseño` (cómo está hecho), `referencia` (términos, tablas, valores) o
`integración` (un sistema externo).

1. **El dominio** de la zona de código que describe; si cruza varios, el que más toca, enlazado
   desde los otros. Si no es de ninguno, `comun/` o `plataforma/`.
2. **La subcarpeta**: un plan, a `planes/`; lo que retrata un momento, a `registros/`; lo que se
   entrega a un cliente, a `para-clientes/`; lo demás, a la raíz del dominio o a su tema.
3. **Lo que describe un módulo vive junto a su código** (<`README.md`, `AGENTS.md` junto al
   código>) y manda. Un dato duro vive en un solo sitio.

## Reglas

- **Índice**: `- [Título](ruta) · <tipo>` bajo una línea de palabras clave bilingües (el término en
  castellano y el identificador del código). Si un agente no encontró algo con su palabra, añádela.
- **Topes** (tokens ≈ caracteres/4): ficha 250, índice de tema 200, documento 500, este 1000;
  `AGENTS.md`, 60 líneas. Fuera: `registros/`, `para-clientes/`, `planes/` y `generated`.
- **Trinquete**: `oversized` congela los que ya se pasaban; encogen, no crecen. Si tocas uno,
  pártelo en un tema. Los que se pasan abren con un resumen `> ` de ≤80 tokens.
- **Nombres**: kebab-case en castellano, sin repetir el dominio; un registro empieza por su fecha;
  un dominio con nombre de módulo lo conserva.
- **Todo fichero nuevo se enlaza** desde la ficha o un índice suyo en el mismo commit
  (`registros/` y `para-clientes/`: basta la carpeta). Un plan ejecutado pasa a `registros/` con
  «Ejecutado el dd/mm/aaaa, commit `xxxx`», o se borra, en el mismo commit.
- **Dominio nuevo**: carpeta con `INDEX.md`, fila en `AGENTS.md`, regla en `.claude/rules/` que
  cite la ficha y alta en `domains` del schema.
- **Sin `CLAUDE.md`** en la raíz (taparía `AGENTS.md`); `.claude/rules/` apunta, no copia. Nada de
  planes en `.claude/` ni enlaces `mdc:`; las notas de sesión, en `.scratch/`.

**Por qué por dominio**: los agentes llegan por la ruta que tocan; con carpetas por tipo, un
dominio acababa repartido en cinco. El tipo es una etiqueta. `pnpm lint:docs` lo comprueba contra
`scripts/structure-schema.json`; los linters son idénticos en todos los repos y viven en la skill
`a2r-agents-docs`.
