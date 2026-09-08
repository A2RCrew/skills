# Checklist de reglas del repositorio (nimrod-multitenant)

Cada ítem se evalúa como **PASA / FALLA / NO APLICA / NO VERIFICABLE** y lleva evidencia:
el comando ejecutado o el fichero de la fase 0 que lo demuestra. Un ítem sin evidencia
no puede marcarse como PASA. El resultado alimenta la fórmula de `references/rubric.md`.

Fuente de cada regla: `CLAUDE.md` del repo, `docs/tts-v2/05-plan-metodologia-y-docs.md` §4,
`docs/migration-patterns.md`, `docs/migration-isolation.md`.

| ID | Regla | Cómo se verifica | Severidad si falla |
|---|---|---|---|
| G1 | ESLint sin warnings en los ficheros del rango | `meta.checks.lint_changed == 0` | mayor |
| G1b | ESLint sin warnings en todo el repo | `meta.checks.lint == 0`; si G1 pasa y G1b falla, es deuda preexistente | menor |
| G2 | `tsc --noEmit` pasa | `meta.checks.tsc == 0` | mayor |
| G3 | Sin dependencias circulares | `meta.checks.circular_deps == 0` | mayor |
| G4 | Suite vitest pasa | `meta.checks.vitest == 0` (si `skipped`, NO VERIFICABLE) | mayor |
| G5 | `package.json` deps cambiadas ⇒ `pnpm-lock.yaml` cambiado | `counts.deps_changed==1 ⇒ counts.lockfile_changed>0` | mayor |
| W1 | Todo commit cita `A2R-nnn` (él o el merge que lo trajo) | `commits-without-issue.tsv` vacío | menor por commit; mayor si es `feat`/`fix` sin issue |
| W2 | Commits siguen Conventional Commits | `commits-nonconventional.tsv` vacío | menor |
| W3 | Ninguna migración nueva ejecuta `pnpm run migrate` a pelo en scripts o CI | `signal-run-migrate.txt` vacío | mayor |
| M1 | Migración que crea campo lo concede a la política `Default` en el mismo fichero | `meta.checks.migration_grants == 0` | **crítica** |
| M2 | Colección nueva nace colocada y traducida (5 locales, `meta.group`, `sort`) | `meta.checks.migration_placement == 0` | mayor |
| M3 | Migración nueva trae prueba de banco | `meta.checks.migration_bench == 0` | mayor |
| M4 | Tests de migraciones pasan | `meta.checks.migration_tests == 0` | mayor |
| M5 | Migraciones estrictamente aditivas | `signal-destructive-migration.txt` filtrado a `scripts/migrations/`; el verificador lee cada línea y confirma si borra/retipa | **crítica** si confirmada |
| M6 | Líneas activas añadidas a `index.ts` corresponden solo a migraciones de este rango | comparar `index-ts-added-active.txt` con `areas/migrations.txt`; el revisor de migraciones lo confirma | mayor |
| M7 | Comentarios de `index.ts` ≤500 chars | `meta.checks.migration_index_comments == 0` | menor |
| M8 | Ningún campo nuevo usado en `src/data` / `src/lib/actions` sin migración que lo cree (ni en este rango ni previa) | el revisor extrae nombres de campo añadidos a proyecciones y hace `git grep` en `scripts/migrations/`; el verificador lo reproduce | **crítica** (campo hecho a mano) |
| T1 | Ningún campo nuevo en proyección obligatoria del worker TTS V2 | `signal-tts-projection.txt` filtrado a rutas TTS; verificador comprueba que campos nuevos van en consulta aparte con `try/catch` | **crítica** |
| T2 | Ningún error detectado por frase en inglés | `signal-english-error-match.txt`; verificador lee contexto | mayor |
| T3 | Ningún `accessLevel` sembrado sin barra final | `signal-accesslevel-no-slash.txt`; verificador confirma que es un seed y no una comparación | **crítica** |
| T4 | Ninguna lista vacía interpretada como «no hay datos» en lecturas Directus con reglas de fila | `signal-empty-list-as-nodata.txt` filtrado a `src/data/`; verificador lee contexto | mayor |
| T5 | Ningún límite definido en dos sitios | revisor busca constantes duplicadas en el diff (`MAX_`, `LIMIT`, números repetidos) | menor |
| T6 | Cambios en `modelCapabilities.ts` o `deliveryTagsForPrompt.ts` consistentes con la tabla de proveedores de CLAUDE.md | revisor TTS lee cabeceras y compara | mayor |
| I1 | Toda clave añadida a `messages/*.json` existe en los 5 locales | `meta.checks.i18n_parity_range == 0`; detalle en `i18n-added-keys-missing.tsv` | mayor (literal sin traducir en un tenant) |
| I1b | Paridad de traducciones en todo el repo | `meta.checks.i18n_parity_repo == 0`; si I1 pasa y I1b falla, es deuda preexistente | menor |
| S1 | Sin secretos en el diff | `signal-secrets.txt` vacío o cada match refutado (fixture, ejemplo) | **crítica** |
| S2 | Variables de entorno nuevas documentadas en algún `.env*` | `env-new-undefined.txt` vacío | mayor (rompe un tenant al desplegar) |
| S3 | Sin uso nuevo de token admin / `admin_access` en rutas de usuario | `signal-admin-token.txt`; verificador lee contexto | **crítica** |
| S4 | Nuevas rutas `src/app/api/*` validan el token Directus y la entrada con zod | revisor API lista rutas nuevas; verificador comprueba cada una | mayor |
| S5 | Nuevas server actions validan con `action-schemas.ts` | revisor actions; verificador comprueba | mayor |
| Q1 | Sin `@ts-ignore`/`as any`/`eslint-disable` nuevos sin justificación en comentario | `signal-ts-ignore.txt`; verificador lee la línea | menor |
| Q2 | Sin `console.log` nuevos fuera de scripts | `signal-console-log.txt` filtrado a `src/` | menor |
| Q3 | Componentes nuevos siguen servidor-por-defecto: `'use client'` solo con hooks/eventos | revisor components | menor |
| D1 | Cabeceras de módulo modificadas siguen siendo ciertas tras el cambio | revisor lee cabecera y diff del mismo fichero | menor |
| D2 | Plan o doc nuevo vive en `docs/`, no en `.claude/` | `areas.tsv` no contiene rutas `.claude/` añadidas | menor |

## Ítems que hoy son NO VERIFICABLE en local (declararlos siempre)

- Comportamiento en Directus de PRE con rol `Default` (permisos reales, reglas de fila).
- Orden de despliegue frente a `nimrod-api` cuando una migración lo requiere.
- Efecto de la migración sobre datos existentes de cada tenant.
- Rendimiento y coste de proveedores IA (solo se puede leer, no medir).
