# Revisión profunda de migraciones (opcional, se pregunta en la entrevista)

Objetivo: antes de ejecutar `migrate:prod` / `migrate:releases`, saber qué hace cada migración
pendiente, a quién afecta y en qué orden debe desplegarse respecto a nimrod-api y los workers.
Solo lectura. **Nunca se ejecuta ninguna migración.**

## Entrada

De la fase 0 de nimrod-multitenant: `migration-dirs.txt`, `migration-identifiers.txt`,
`index-ts-added-active.txt`, `index-ts-active-at-head.txt`, `checks.migration-*`.
De los demás repos seleccionados: `directus-model-fields.tsv`, `directus-model.diff`.

## Por cada carpeta de migración del rango

Un subagente (`prompts/migration-reviewer.md`) responde con evidencia:

1. **Qué crea o cambia**: colecciones, campos (tipo, nullable, default), relaciones, flows,
   permisos, seeds. Cita fichero:línea.
2. **Aditiva**: ningún `deleteField`, `deleteCollection`, cambio de tipo, rename. Si hay un
   `updateField`, ¿qué propiedad cambia y es compatible con filas existentes?
3. **Permisos**: cada campo nuevo concedido a `Default` en el mismo fichero (M1). Si crea
   colección: `read`/`create`/`update` según uso, con el filtro de tenant habitual.
4. **Colocación y locales** (M2) y **banco** (M3).
5. **Seeds**: `accessLevel` con barra final; nada por tenant hardcodeado sin justificación.
6. **Registro en `index.ts`**: línea activa, comentario ≤500 chars, y que el comentario diga si
   requiere despliegue coordinado.
7. **Consumidores**: `git grep` de cada identificador de `migration-identifiers.txt` en
   nimrod-api (`src/model/directus.ts`, `src/tasks`, `src/utils`) y en cada worker seleccionado
   (`src/model/directus.ts`, `src/infrastructure/directus/schema.ts`). Para cada consumidor:
   - ¿el código consumidor está en el rango de ese repo (se despliega ahora) o ya en producción?
   - ¿lee el campo como obligatorio (proyección fija, tipo no opcional)? Entonces la migración
     **debe ir antes** que ese despliegue.
   - ¿el código nuevo escribe un campo que la migración aún no crea? Entonces el orden es
     **migración → api/worker** y hay que decirlo.
8. **Migraciones ajenas activas en `index.ts`** (M6b): si `index-ts-active-at-head.txt` incluye
   líneas fuera de `migration-dirs.txt`, listarlas: un `migrate` ejecutaría trabajo de otras
   personas. Recordar `docs/migration-isolation.md`.
9. **Reversibilidad**: ¿existe forma de deshacer sin perder datos? Si no, decirlo.

## Salida

Tabla por migración:

| Migración | Crea/cambia | Aditiva | Permisos Default | Consumidores (repo:fichero) | Orden requerido | Riesgo |
|---|---|---|---|---|---|---|

Riesgo: **bloqueante** (rompe tenant/datos o falta permiso), **coordinado** (correcta, pero el
orden importa y debe constar en la release), **libre** (aditiva, sin consumidores nuevos).

La sección «Migraciones pendientes» del informe reproduce esta tabla y añade un párrafo de
**secuencia de despliegue recomendada** (p. ej. «1. migrate:prod · 2. nimrod-api · 3. multitenant
· 4. semantic-pdf tag v*») deducida de los consumidores. Cualquier migración con riesgo
bloqueante pone el techo global en 1 (crítica) o 2 (mayor) según la tabla de `rubric.md`.
