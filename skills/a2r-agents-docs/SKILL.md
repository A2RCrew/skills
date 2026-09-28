---
name: a2r-agents-docs
description: Crea y mantiene la documentación para agentes de un repositorio de A2R en `.agents/`, leída «justo a tiempo». `AGENTS.md` enruta a la ficha de cada dominio, un índice por palabras clave, y de ahí a un solo documento de ≤500 tokens. Los linters del repo lo comprueban. Usar cuando se pida «crea la carpeta .agents», «monta la documentación de agentes», «documenta esto en .agents», «añade un documento / un dominio», «parte este documento», «cierra este plan», «migra la documentación al formato nuevo», cuando falle `pnpm lint:docs` o al tocar `AGENTS.md`, `.agents/**` o `.claude/rules/**`.
---

# Documentación de agentes en `.agents/`

El agente no lee la documentación entera: la tabla de `AGENTS.md` lo lleva a una ficha
`INDEX.md`, la ficha a una palabra clave y la palabra a **un** documento corto. Para que eso
aguante con el tiempo, un linter exige topes de tamaño, que no haya huérfanos y que cada dominio
esté enrutado. Lo que la skill trae:

| Fichero | Para qué |
|---|---|
| `scripts/lint-structure.ts`, `lint-docs.ts`, `lint.test.ts` | los linters, **idénticos en todos los repos**; se copian, no se editan |
| `scripts/structure-schema.json` | schema de partida: lo que cambia entre repos va aquí |
| `templates/` | `AGENTS.md`, `AI-INSTRUCTIONS.md`, ficha, índice de tema, trampas, documento, receta, plan, registro, reglas de `.claude/rules/` y el hook |
| `references/convenciones.md` | estructura, tipos, topes, destino, nombres, trinquete y partición |
| `references/crear.md` | montar `.agents/` en un repo que no la tiene |
| `references/actualizar.md` | cada operación de mantenimiento, paso a paso |

Las rutas son relativas a `${CLAUDE_PLUGIN_ROOT}`.

## Qué modo toca

Mira el repo antes de decidir:

- **No hay `.agents/AI-INSTRUCTIONS.md` ni `.agents/scripts/structure-schema.json`** → crear.
  Sigue `references/crear.md`. Si `.agents/` solo tiene `skills/` (el almacén de `npx skills`),
  también es crear, y `skills/` se respeta.
- **Hay `.agents/README.md`, fichas `<dominio>/README.md` o carpetas por tipo** (`codebase/`,
  `how-tos/`, `reference/`, `standards/`…) → migrar. Es una operación de
  `references/actualizar.md`.
- **Ya está montada** → actualizar. Elige la operación en `references/actualizar.md`: documento
  nuevo, dominio nuevo, partir un documento, cerrar un plan, trampa o palabra clave que faltó,
  sincronizar los linters o auditar.

Lee `references/convenciones.md` antes de escribir cualquier documento.

## Reglas que no se negocian

1. **Sin `CLAUDE.md` en la raíz.** Si existe, Claude Code deja de leer `AGENTS.md`. Su contenido
   pasa a `AGENTS.md` o a su dominio, y se borra con el OK de quien pide el cambio.
2. **`AGENTS.md` ≤60 líneas**: papel del repo, protocolo de lectura, comandos, las reglas que se
   rompen en el primer minuto y la tabla de dominios. Nada más.
3. **Todo fichero nuevo se enlaza desde su ficha en el mismo commit**, bajo una línea
   `**Palabras clave**:` bilingüe y con su `· <tipo>`.
4. **Topes** (tokens ≈ caracteres/4): ficha 250, índice de tema 200, documento 500,
   `AI-INSTRUCTIONS.md` 1000. Lo que no cabe se parte en un tema; no se sube el tope.
5. **Trinquete**: `oversized` solo encoge. `--write-baseline` se usa una vez, al estrenarlo en un
   repo; después, nunca para tapar un documento que crece.
6. **Los linters no se editan en un repo.** Lo propio del repo va en `structure-schema.json`. Si
   hace falta cambiar un linter, se cambia aquí y se copia a todos los repos.
7. **No se inventa contenido.** Un documento se escribe contra el código o contra un sistema vivo;
   lo que ya existe se mueve con `git mv` para conservar el historial.
8. **Castellano**, con las palabras clave en los dos idiomas: el término en castellano y el
   identificador del código.

## Al terminar

`pnpm lint:docs` en verde y, si el repo tiene Vitest, `pnpm test` con los tests de los linters.
Enseña lo creado, lo movido y lo que queda en `oversized`. El commit sigue a `a2r-git`:
`docs(agents): <qué cambia> (A2R-nnn)`. Una operación es un commit, y el documento va con su
entrada en la ficha.
