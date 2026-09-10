# Checklist de reglas (multi-repo)

Cada ítem se evalúa como **PASA / FALLA / NO APLICA / NO VERIFICABLE** con evidencia: el comando
ejecutado o el fichero de fase 0 que lo demuestra. Sin evidencia no hay PASA. El resultado alimenta
`rubric.md`. Las secciones se activan según `checklist_sections` de `repos.json`.

Severidad si falla: **C** crítica · **M** mayor · **m** menor (definiciones en `rubric.md`).

## Común a todos los repos

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| G1 | Lint sin warnings en los ficheros del rango | `checks.lint-changed == 0` (`n/a` si el repo no tiene lint → NO APLICA) | M |
| G1b | Lint sin warnings en todo el repo | `checks.lint == 0`; si G1 pasa y G1b falla, deuda preexistente | m |
| G2 | Typecheck pasa | `checks.typecheck == 0` | M |
| G3 | Sin dependencias circulares (si el repo tiene el check) | `checks.circular-deps == 0` | M |
| G4 | Suite de tests pasa | `checks.test == 0`; `skipped`/`n/a` → NO VERIFICABLE | M |
| G5 | deps de `package.json` cambiadas ⇒ `pnpm-lock.yaml` cambiado | `counts.deps_changed==1 ⇒ counts.lockfile_changed>0` | M |
| W1 | Todo commit cita `A2R-nnn` (él o el merge que lo trajo) | `commits-without-issue.tsv` vacío; `feat`/`fix` sin issue → M, otros → m | m/M |
| W2 | Commits siguen Conventional Commits (release-please los necesita para no perder cambios) | `commits-nonconventional.tsv` vacío | m |
| W3 | Nada añade `pnpm run migrate` a pelo en scripts o CI | `signal-run-migrate.txt` vacío | M |
| S1 | Sin secretos en el diff | `signal-secrets.txt` vacío, o cada fila refutada por el verificador leyendo el contexto (fixture, ejemplo, placeholder). El fichero trae `fichero:línea`, tipo y huella: **nunca el valor**, y así se reporta | C |
| S1b | El informe no contiene ningún valor de credencial | `node assets/redact.mjs report.md --in-place` sale 0. Si sale 3, el informe traía un valor: FALLA, se corrige el texto y se anota | C |
| S2 | Variables de entorno nuevas definidas en `.env*` o en `deploy/` | `env-new-undefined.txt` vacío | M |
| S3 | Sin uso nuevo de token admin / `admin_access` en rutas de usuario | `signal-admin-token.txt`; verificador lee contexto | C |
| Q1 | Sin `@ts-ignore` / `as any` / `: any` / `eslint-disable` nuevos sin justificación | `signal-ts-ignore.txt`, `signal-any-type.txt` | m |
| Q2 | Sin `console.*` nuevos en código de producción (workers y api usan logger) | `signal-console-log.txt` filtrado a `src/` | m |
| D1 | Cabeceras de módulo modificadas siguen siendo ciertas tras el cambio | revisor lee cabecera y diff del mismo fichero | m |
| D2 | Docs/planes nuevos viven en `docs/`, no en `.claude/` ni `.planning/` sueltos | `areas.tsv` | m |
| X1 | Contrato Directus cruzado: un campo/colección nuevo que usa este repo existe en una migración de nimrod-multitenant (en el rango revisado o ya en producción) | revisor cruza `directus-model-fields.tsv` con `migration-identifiers.txt` y `git grep` en nimrod-multitenant | C |
| X2 | Contrato HTTP cruzado: rutas `api/v0/*` que un worker llama existen en nimrod-api (rango o producción) | revisor cruza `fetchApi` paths del worker con `src/app/api/v0/` de nimrod-api | M |
| X3 | Orden de despliegue declarado cuando hay dependencia entre repos | sección «Migraciones» y hallazgos X1/X2 lo indican; si falta → FALLA | M |

## Superficies compartidas (las evalúa el revisor de superficies, no los de caso de uso)

Fuente: `blast-radius.json` de cada repo y `references/shared-surfaces.json`. Una superficie es
compartida si está declarada, o si su cambio afecta a ≥3 casos de uso y ≥15 importadores.

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| SH1 | Ningún símbolo o campo retirado de una superficie compartida sigue usándose | por cada entrada de `exports_retirados` / `campos_retirados`, `git grep` en todos los repos del alcance, en el head y en `origin/main` | C |
| SH2 | Todo cambio en una superficie **declarada** se ha contrastado con su lista `rompedor_si` | el revisor devuelve `contraste_rompedor_si` con una fila por regla | M |
| SH3 | Una proyección obligatoria compartida (`readMe` de sesión, ajustes generales, modelo del worker) no gana campos sin migración desplegada en todos los tenants | diff del fichero + estado de la migración en `index.ts` | C |
| SH4 | Un esquema de validación compartido no endurece un campo que el cliente antiguo sigue enviando | `campos_ahora_obligatorios` vacío, o refutado con el llamante | M |
| SH5 | Una clave de idioma retirada ya no se usa en el código | `claves_retiradas` cruzadas con `git grep` de la clave | m |
| SH6 | Un contrato entre repos (esquema Directus, ruta `api/v0`, nombre de tarea, estados) cambia en los dos lados o declara su orden | sección `cross_repo` del revisor | C |
| SH7 | El caso de uso que introduce el cambio no es el único afectado, y el informe lo dice | cada hallazgo compartido lleva `blast_radius` con casos y repos | M |

## nimrod-multitenant

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| M1 | Migración que crea campo lo concede a la política `Default` en el mismo fichero | `checks.migration-grants == 0` | C |
| M2 | Colección nueva nace colocada y traducida (5 locales, `meta.group`, `sort`) | `checks.migration-placement == 0` | M |
| M3 | Migración nueva trae prueba de banco | `checks.migration-bench == 0` | M |
| M4 | Tests de migraciones pasan | `checks.migration-tests == 0` | M |
| M5 | Migraciones estrictamente aditivas | `signal-destructive-migration.txt` filtrado a `scripts/migrations/`; verificador confirma | C |
| M6 | Líneas activas añadidas a `index.ts` son solo migraciones de este rango | `index-ts-added-active.txt` vs `migration-dirs.txt` | M |
| M6b | `index.ts` en HEAD no tiene activas migraciones ajenas al rango (se ejecutarían en el próximo `migrate`) | `index-ts-active-at-head.txt`; cada línea debe corresponder a `migration-dirs.txt` o estar ya aplicada en prod (commit `chore(migrations): Update index.ts after deployment`) | M |
| M7 | Comentarios de `index.ts` ≤500 chars | `checks.migration-index-comments == 0` | m |
| M8 | Ningún campo nuevo usado en `src/data` / `src/lib/actions` sin migración que lo cree | revisor extrae campos añadidos a proyecciones; `git grep` en `scripts/migrations/` | C |
| T1 | Ningún campo nuevo en proyección obligatoria del worker TTS V2 | `signal-directus-fields.txt` filtrado a rutas TTS; verificador comprueba consulta aparte con `try/catch` | C |
| T2 | Ningún error detectado por frase en inglés | `signal-english-error-match.txt` | M |
| T3 | Ningún `accessLevel` sembrado sin barra final | `signal-accesslevel-no-slash.txt`; verificador distingue seed de comparación | C |
| T4 | Ninguna lista vacía interpretada como «no hay datos» en lecturas Directus con reglas de fila | `signal-empty-list-as-nodata.txt` filtrado a `src/data/` | M |
| T5 | Ningún límite definido en dos sitios | revisor busca constantes duplicadas | m |
| T6 | `modelCapabilities.ts` / `deliveryTagsForPrompt.ts` coherentes con la tabla de proveedores | revisor TTS compara | M |
| I1 | Toda clave añadida a `messages/*.json` existe en los 5 locales | `checks.i18n-parity-range == 0`; detalle en `i18n-added-keys-missing.tsv` | M |
| I1b | Paridad de traducciones en todo el repo | `checks.i18n-parity-repo == 0`; si I1 pasa y I1b falla, deuda preexistente | m |
| S4 | Nuevas rutas `src/app/api/*` validan token Directus y entrada con zod | revisor API lista rutas nuevas; verificador comprueba | M |
| S5 | Nuevas server actions validan con `action-schemas.ts` | revisor; verificador comprueba | M |
| Q3 | Componentes nuevos servidor-por-defecto; `'use client'` solo con hooks/eventos | revisor | m |

## nimrod-api

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| A1 | Ninguna llamada HTTP a ElevenLabs vía SDK (`@elevenlabs/elevenlabs-js`); solo `node-fetch` | `git grep` en el diff | C |
| A2 | Llamadas a modelos pasan por `createGenerateTextCaller` / `createGenerateObjectCaller` con `taskId`/`taskType` | revisor sobre `generateText(`/`generateObject(` añadidos | M |
| A3 | Alerting: sin importar `src/utils/alerting/` desde tareas; sin doble log (3er arg de `executeQueuedTask` + `logger.child`); `taskType` nuevo añadido a `Log['taskType']` | revisor | M |
| A4 | `executeTask` no escribe `published` para tareas delegadas a workers | `signal-status-published.txt` filtrado a `src/tasks/` | C |
| A5 | Fronteras hexagonales en `src/custom-actions/`: `domain/` sin imports externos; `application/` no importa `infrastructure/` | `git grep -n "from '" src/custom-actions/domain` sobre ficheros del rango | M |
| A6 | Sin default exports en rutas API ni utils; sin `console` | `checks.astgrep == 0` | m |
| A7 | `RUN_TASK_AS_JOB` no cambia de semántica (es global) | revisor si el diff lo toca | C |
| A8 | Cambios en `src/model/directus.ts` tienen migración correspondiente (ver X1) | `directus-model-fields.tsv` | C |

## Workers (semantic-pdf-serverless, pdf-remediation, translate-documents, bulk-url-process)

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| K1 | Nueva variable zod requerida en `src/config` ⇒ definida en `deploy/` / task definition / `.env.example` | `env-zod-required-added.txt` vs `counts.deploy_changed`; si el repo no tiene `deploy/` → NO VERIFICABLE y se declara | C (el contenedor muere al arrancar) |
| K2 | Sin `process.exit(` directo; se usa el helper con flush de logs del repo | `signal-process-exit.txt` (translate-documents lo permite en `index.ts` final) | M |
| K3 | Sin `exec`/`spawn` sin timeout (helpers `execWithTimeout`/`spawnWithTimeout`) | `signal-raw-exec.txt` | M |
| K4 | Timeouts solo en el módulo central del repo (`externalTimeouts.ts`, `httpTimeout.ts`); sin `setGlobalDispatcher` | `signal-raw-fetch-timeout.txt`; revisor | M |
| K5 | Logs a través del logger del repo; sin tokens/PII/contenido de documentos en logs | revisor sobre líneas de log añadidas | M |
| K6 | Escrituras de estado Directus vía helpers del repo (`setSourceFileStatus`, lease de ingesta, `updateItem` con condición de ownership) | revisor | M |
| K7 | `dist/` no cambia salvo build intencional (semantic-pdf lo versiona) | `counts.dist_changed` con `committed-dist`; si cambia sin cambio en `src/` → FALLA | m |
| K8 | Dockerfile duplicado (raíz y `deploy/docker/`) cambian juntos cuando uno cambia | `counts.dockerfile_changed` es 0 o 2 en repos con duplicado | M |
| K9 | Ficheros de parámetros en `deploy/config/` no introducen secretos en claro | filas de `signal-secrets.txt` cuyo fichero empieza por `deploy/`; si ya los contenía, anotar como deuda crítica preexistente **nombrando el fichero y el tipo de credencial, nunca el valor**, y recomendar rotación | C |

## semantic-pdf-serverless

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| P1 | Reintentos de Mistral OCR solo ante fallos de transporte y 502/503/504; nunca 4xx (se factura por página) | revisor sobre `isRetriableMistralOcrError` | M |
| P2 | Scope `ingestion` con `generatedPdf === null` sigue llamando a `ensureGeneratedPdf` | test `tests/ingestionEnsurePdfRegression.test.ts` en `checks.test` | M |
| P3 | Cambios en el lease de ingesta compatibles con un nimrod-api que aún no pase token | revisor | M |

## pdf-remediation

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| R1 | `domain/` no importa fuera de `domain/`; `application/` solo `domain/` y sus puertos | `git grep` sobre imports añadidos | M |
| R2 | Cambio de regla §6 actualiza la especificación y registra el check en `registry.ts` | revisor | M |
| R3 | Predicados compartidos (caption, formula-figure, spread) tienen una única definición | revisor | M |
| R4 | Orden de pases en `document-tagger.ts` intacto salvo decisión documentada | revisor | C |
| R5 | `test/contract/` no importa módulos borrados (`web/lib/*`) | `checks.test`; si rojo por esto, deuda preexistente → M en vez de C | M |

## translate-documents

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| L1 | Cambios en el motor v1 (`translate.ts`, `docProcessor.ts`, `getTranslation.ts`, `dictionaries.ts`, `xml.ts`) tratados como producción aunque el PR hable de v2 | `usecases.tsv` + revisor | M |
| L2 | Placeholders `{{var}}` y el token `<SpecialChar code="N" />` intactos | revisor sobre `placeholders.ts` y serializadores | C |
| L3 | Tests round-trip de adaptadores ejecutados si cambia un adaptador/serializador | `checks.test` incluye `round-trip-integration` | M |
| L4 | Semántica `published` + `error` (warning JSON) no convertida en fallo | revisor | M |

## bulk-url-process

| ID | Regla | Evidencia | Sev |
|---|---|---|---|
| B1 | Si cambia `httpTimeout.ts` o un `*_TIMEOUT_MS`, se ejecutaron `test:timeouts` y `test:timeouts:extra` | log adjunto; si no → NO VERIFICABLE y techo ≤3 | M |
| B2 | `API_TIMEOUT_MS` sigue en 300000; `CONFLUENCE_DOWNLOAD_TIMEOUT_MS` separado de `CONFLUENCE_TIMEOUT_MS` | revisor | M |
| B3 | Rutas de `ApiPaths` existen en nimrod-api (X2) | revisor | M |

## No verificable en local (declararlo siempre)

- Comportamiento en Directus de PRE con rol `Default` (permisos reales, reglas de fila).
- Efecto de una migración sobre los datos existentes de cada tenant.
- Que la imagen Docker de un worker se haya construido y publicado (los pipelines viven fuera del repo o son manuales).
- Coste real de proveedores (OCR por página, modelos).
