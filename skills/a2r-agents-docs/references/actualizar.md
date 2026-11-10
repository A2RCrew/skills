# Actualizar `.agents/`

Cada operación es un commit y deja `pnpm lint:docs` en verde. `$S` = `${CLAUDE_PLUGIN_ROOT}`.
Antes de empezar, lee el `AI-INSTRUCTIONS.md` del repo: si difiere de `convenciones.md` en algo
propio del repo, manda el del repo.

## Documento nuevo

1. **Dominio**: el del código que describe (`convenciones.md`, «Destino de un documento»). Mira la
   tabla de `AGENTS.md`.
2. **¿Ya existe?** Busca en la ficha y con `rg -il '<término>' .agents/<dominio>`. Si hay un
   documento del tema y cabe, amplíalo. Un dato duro vive en un solo sitio.
3. **Tipo** y plantilla: `templates/documento.md`, o `templates/receta.md` para una receta.
4. **Escríbelo contra el código**: abre los ficheros que describe y cita rutas reales. Una receta
   se prueba o, como mínimo, se sigue contra el código paso a paso.
5. **≤500 tokens** (`wc -c` / 4). Si no cabe, es un tema: sigue «Partir un documento».
6. **Enlázalo en la ficha** bajo una línea de palabras clave que ya lo describa, o bajo una nueva:
   `- [Título](nombre.md) · <tipo>`. Vigila los 250 tokens de la ficha. Si no cabe, agrupa entradas
   en un tema con su `INDEX.md`.
7. Si cambia lo que se rompe en el primer minuto del dominio, actualiza `trampas.md` y la regla de
   `.claude/rules/`.

## Dominio nuevo

Cuatro sitios, en el mismo commit:

1. `.agents/<dominio>/INDEX.md` (`templates/INDEX.md`) y `trampas.md`.
2. Una fila en la tabla de `AGENTS.md`: rutas · palabras clave · `.agents/<dominio>/INDEX.md`.
   Vigila las 60 líneas.
3. `.claude/rules/<dominio>.md` (`templates/regla.md`) con sus `paths:` y la cita a la ficha, o el
   dominio en `withoutRule` si no tiene ruta de código.
4. El dominio en `domains` de `structure-schema.json`.

Si lo que describe ya estaba en otro dominio, muévelo con `git mv` y actualiza las citas
(`rg '\.agents/<viejo>/<fichero>'`).

## Partir un documento

Para un documento de más de 500 tokens, esté o no en `oversized`.

1. **Lee el documento entero** y decide los cortes por tema, no por tamaño: cada parte tiene que
   poder leerse sola.
2. **Tema plano o carpeta de tema.** Si salen dos o tres documentos, van planos en el dominio. Si
   salen más, van en una carpeta `<dominio>/<tema>/` con su `INDEX.md` (`templates/tema-INDEX.md`,
   ≤200 tokens) y la ficha enlaza ese índice.
3. **Muy grande** (contrato, juego de ADR, guía de cientos de líneas): cabeceras de sección y partes
   `(n/N)` (`convenciones.md`, «Partir un documento»). El índice del tema enlaza las cabeceras.
4. **Lo normativo se mueve literal**, con sus números (`§4.3`, `D2.1`) en el título y en el nombre
   de fichero. Lo que tiene fecha (changelog, historia) va a `registros/`.
5. **Traduce** al castellano lo que estaba en inglés, sin perder reglas, sintaxis ni ejemplos.
6. **Citas**: `rg -n '<ruta-vieja>'` en `.agents/`, `.claude/rules/`, `AGENTS.md`, comentarios de
   código y repos hermanos (`../*/`). Actualízalas todas. Si la citan ficheros congelados
   (`frozen`), deja una redirección de una línea declarada en `redirects`. En el código solo
   cambian comentarios.
7. **Trinquete**: quita la entrada de `oversized`. Si alguna parte sigue sin caber y no se puede
   cortar más (una tabla que no se parte), va a `oversized` con su tamaño y su resumen `> `. El
   total de la lista no puede crecer.
8. Si Prettier ensancha tablas, añade la carpeta a `.prettierignore`.

## Cerrar un plan

Cuando se ejecuta lo que describe un plan de `planes/`, en el mismo commit que lo ejecuta:

- `git mv planes/<plan>.md registros/AAAA-MM-DD-<slug>.md` y en la cabecera
  `> Plan ejecutado. Ejecutado el dd/mm/aaaa, commit \`xxxx\` (A2R-nnn).`; o bórralo si no deja
  nada que contar.
- Quita su enlace de la línea `**Planes**:` de la ficha. Si el plan cambió cómo funciona algo, lleva
  la verdad nueva al documento del dominio: el registro es historia.

## Trampa o palabra clave que faltó

- **Algo rompió** y se podía haber sabido: una línea en `<dominio>/trampas.md` y, si es de las que
  se rompen en el primer minuto, en la regla de `.claude/rules/`.
- **Un agente no encontró** un documento que existía: añade su palabra, la que buscó, a la línea
  `**Palabras clave**:` que corresponda.

## Registro

Lo que retrata un momento (una medición, una auditoría, una migración hecha, una sesión de
decisiones): `registros/AAAA-MM-DD-<slug>.md` desde `templates/registro.md`. No tiene tope. La ficha
enlaza la carpeta. Una serie que se repite (auditorías periódicas) va en `registros/<serie>/` con su
`README.md` de índice.

## Migrar del esquema antiguo

Si hay fichas `<dominio>/README.md`, `.agents/README.md`, carpetas por tipo o `docs/`:

1. **Linters y schema**: copia los de `$S/scripts/`. Pasa al schema nuevo las claves que el repo ya
   tenía (`domains`, `frozen`, `stubs`, `deadCitations`, `excluded`), quita `noLimit` y
   `summaryFrom`, y añade `index`, `tipos`, `generated`, `oversized` y `redirects`.
2. **Entrada**: `git mv .agents/README.md .agents/AI-INSTRUCTIONS.md` y ajústalo a
   `templates/AI-INSTRUCTIONS.md`.
3. **Fichas**: `git mv <dominio>/README.md <dominio>/INDEX.md`. Rehazla como índice por palabras
   clave con tipos. Lo que era prosa de trampas pasa a `trampas.md`. Si una ficha la citan ficheros
   congelados, deja `README.md` como redirección declarada.
4. **Eje por tipo → dominios**: cada documento de `codebase/`, `how-tos/`, `reference/`… a su
   dominio con `git mv`. Añade a `forbidden` el patrón de las rutas viejas para que no vuelvan.
5. **`AGENTS.md`** a ≤60 líneas, con la tabla apuntando a los `INDEX.md`. Lo que sobra (estilo,
   git) pasa a `comun/`.
6. **Trinquete**: `--write-baseline` una vez y resumen `> ` en cada documento que queda en
   `oversized`.
7. `rg '\.agents/[a-z0-9-]+/README\.md|AI-INSTRUCTIONS'` (y las rutas viejas) en todo el repo y en
   los hermanos: cero citas rotas. Revisa también el `README.md` de la raíz, que suele quedarse
   describiendo la estructura vieja.

## Sincronizar los linters

```bash
shasum "${CLAUDE_PLUGIN_ROOT}"/scripts/*.ts .agents/scripts/*.ts
```

- **Iguales**: nada que hacer.
- **El repo tiene una versión más vieja** que la de la skill: copia los tres y ejecuta
  `pnpm lint:docs` y los tests. Si el linter nuevo pide claves de schema que el repo no tiene,
  añádelas con el valor de `$S/scripts/structure-schema.json`.
- **El repo tiene cambios que la skill no tiene**: alguien editó un linter en el repo. No lo pises.
  Enséñale el diff a quien pide el cambio: o el cambio sube a la skill y se copia a todos los repos,
  o se deshace en el repo y lo propio pasa al schema.

## Auditar

1. `pnpm lint:docs` y los tests de los linters. Arregla cada error con la operación que toque.
2. `oversized`: lista los documentos más grandes y propón partir los dos o tres más leídos.
3. `AGENTS.md`: que cada fila siga apuntando a código que existe (`ls` de sus rutas).
4. `planes/`: planes ya ejecutados que no se cerraron (búscalos por su `A2R-nnn` en `git log`).
5. **Prueba de humo** (opcional, al estrenar o tras una reorganización): toma dos o tres tareas
   reales y recorre el camino como un agente, desde la tabla y la ficha hasta los documentos,
   contando ficheros abiertos y tokens. Objetivo: su ficha y ≤2 documentos, menos de ~1500 tokens
   por tarea. Lo que falte (una receta, una palabra clave) se escribe. El resultado va a
   `comun/registros/AAAA-MM-DD-prueba-de-humo.md`.
