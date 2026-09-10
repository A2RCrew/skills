---
name: a2r-release-review
description: >-
  Revisión de release conversacional y verificada para los repos de despliegue de A2R
  (nimrod-multitenant, nimrod-api, semantic-pdf-serverless, pdf-remediation, translate-documents,
  bulk-url-process). Entrevista al usuario recomendando en cada pregunta (qué repos, revisión
  profunda de migraciones Directus, informe breve o detallado), ejecuta gates por repo, reparte la
  revisión por CASO DE USO de la plataforma con subagentes que cruzan front, API y workers, pasa cada
  hallazgo por un verificador adversario y emite un informe por caso de uso con qué se sube, nota 1-5
  (techo calculado + veredicto), confianza y secuencia de despliegue. Úsala con "/a2r-release-review",
  "revisar la release", "qué se sube a producción", "riesgo del despliegue" o "revisar las migraciones
  pendientes". Solo lectura: no edita, no commitea, no ejecuta migraciones ni toca Directus.
argument-hint: "[--repos a,b] [--range repo=A..B] [--migrations|--no-migrations] [--depth breve|detallado] [--skip-tests] [--yes]"
---

# a2r-release-review

Objetivo: un informe **verificado y orientado a casos de uso** de lo que está pendiente de
producción en uno o varios repos de A2R. Todo hallazgo lleva repo, fichero:línea y un comando
ejecutado. Lo que no se puede comprobar se declara. La nota es un veredicto acotado por fórmula.

Ficheros de la skill (`SKILL_DIR` = directorio de este fichero):

| Fichero | Para qué |
|---|---|
| `assets/prescan.sh` | pre-escaneo de todos los repos para la entrevista |
| `assets/collect.sh` | fase 0 determinista de un repo (gates, señales, casos de uso) |
| `assets/usecases.mjs` | clasifica ficheros y commits por caso de uso |
| `assets/report.template.html` | **plantilla del informe: es el entregable**, se publica como artefacto |
| `assets/report.template.md` | misma información en markdown, para diffs y para CI |
| `assets/sync.sh` | pone los árboles al día antes de medir (única parte que escribe en los repos) |
| `assets/archive.sh` | archiva la revisión en `<repos-root>/release-reviews/` |
| `references/repos.json` | configuración por repo: rango por defecto, comandos, features |
| `references/use-cases.json` | los 14 casos de uso de Linear con globs por repo |
| `references/shared-surfaces.json` | superficies compartidas declaradas y contratos entre repos |
| `assets/blastRadius.mjs` | radio de impacto: quién importa cada fichero cambiado y a cuántos casos arrastra |
| `references/checklist.md` | reglas comunes, por repo y cruzadas, con evidencia y severidad |
| `references/rubric.md` | severidades, techo por caso y global, confianza |
| `references/migrations-review.md` | procedimiento de revisión profunda de migraciones |
| `references/deployment-procedure.md` | **el orden canónico de despliegue y qué NO cuenta como hallazgo** |
| `references/interview.md` | preguntas, opciones y regla de recomendación |
| `references/prompts/*.md` | prompts de revisor por caso, de superficies compartidas, verificador y revisor de migraciones |

## Reglas absolutas

1. **Solo lectura** en todos los repos. Sin `Edit`/`Write` sobre ellos, sin `git commit/push/merge/rebase`,
   sin `pnpm run migrate`, sin llamadas a ningún Directus. Las pruebas se hacen con `tsc`, `vitest run`,
   `node --test`, `node -e`, `git grep`, `git show`.
   **Única excepción**: `assets/sync.sh` (stash, checkout y `pull --ff-only`), y solo cuando el
   usuario lo autoriza en la entrevista. Después hay que decirle qué se guardó en stash y dónde.
2. **Sin evidencia no hay hallazgo.** Un hallazgo sin `evidence_cmd` ejecutado se descarta en verificación.
3. **El modelo no elige el techo.** Sale de `references/rubric.md`; el veredicto es ≤ techo.
4. **La entrevista se hace una vez**, al principio, y siempre recomienda. Después no se pregunta más:
   las dudas se resuelven con la opción recomendada y se anotan en «Supuestos».
5. **El informe habla de casos de uso**, no de repos. Los repos aparecen como columna, no como capítulo.
   Los componentes generales **no tienen dueño**: no les pongas owner en el informe. Se nombra a
   quien firmó el cambio y de qué caso de uso salió. Un cambio que los degrade se reporta aunque
   su caso vaya limpio.
5 bis. **Este informe se lee ANTES de desplegar.** Una migración pendiente es la precondición
   normal, no un defecto: el procedimiento las ejecuta en el paso 2, antes de todo el código. Va a
   «Requisitos previos» y **no toca la nota**. Solo puntúa si el orden contradice el canónico, si
   nadie lo declaró, si la migración está mal, o si retira algo que ya usa producción. Y la deuda
   heredada (fichero sin cambios en el rango) se reporta sin bajar la nota. Ver
   `references/deployment-procedure.md`.
6. **Ningún secreto sale en el informe, nunca.** Un hallazgo de credencial dice **qué** es y **dónde**
   está (fichero:línea, tipo, y la huella corta que da la fase 0), jamás el valor, ni entero ni
   truncado ni ofuscado a mano. Tampoco se pegan valores en `evidence_output`: se pega el comando y
   el recuento (`grep -c`), no la línea. Antes de escribir `report.md` y `report.json` se pasa
   `assets/redact.mjs`, que es la última red, no la primera.
7. Idioma: español de España. Rutas y comandos literales.

## Argumentos

| Forma | Efecto |
|---|---|
| (vacío) | pre-escaneo + entrevista completa |
| `--repos nimrod-multitenant,nimrod-api` | salta la pregunta de repos |
| `--range nimrod-api=v1.46.0..origin/main` | rango explícito para un repo (repetible) |
| `--migrations` / `--no-migrations` | salta la pregunta de migraciones |
| `--depth breve|detallado` | salta la pregunta de profundidad |
| `--skip-tests` | fase 0 sin suites (G4 NO VERIFICABLE, techo ≤4) |
| `--yes` | sin entrevista: recomendaciones del pre-escaneo (modo CI) |
| `--out <dir>` | directorio de trabajo (por defecto `~/.claude/a2r-release-review/reports/<fecha>/`) |
| `--no-archive` | no archivar en `release-reviews/` ni publicar artefacto |

`REPOS_ROOT` = directorio padre del repo desde el que se invoca (o variable de entorno). Salida por
defecto: `~/.claude/a2r-release-review/reports/<fecha>-<head7s>/` con `report.md`, `report.json` y una
carpeta por repo con los artefactos de fase 0. Nada se escribe dentro de ningún repo.

## Procedimiento

### Fase 0 · Pre-escaneo
```bash
OUT=<dir-salida>; mkdir -p "$OUT"
bash "$SKILL_DIR/assets/prescan.sh" "$REPOS_ROOT" "$OUT"
```
Lee `$OUT/prescan.json`. Si ningún repo tiene cambios pendientes, dilo y termina.

### Fase 1 · Entrevista
Sigue `references/interview.md`: llamada 1 (repos, dos preguntas multiselección con los datos del
pre-escaneo), llamada 2 (migraciones si procede, profundidad con recomendación razonada, rango si
algún repo lo necesita, tests). Resume lo acordado en tres líneas y arranca.

### Fase 1 bis · Árboles al día
Si el usuario lo autorizó:
```bash
bash "$SKILL_DIR/assets/sync.sh" "$REPOS_ROOT" develop
```
Devuelve un JSON por repo con `antes`, `despues`, `rama`, `stash`, `divergida` y `al_dia`. Lleva a
«Supuestos» cualquier repo con `divergida: sí` o `al_dia: false`, y **di en la respuesta final qué
se guardó en stash y en qué repo**.

### Fase 2 · Recolección por repo (paralelo)
Para cada repo seleccionado, en paralelo (Bash en background o una sola llamada encadenada):
```bash
SKIP_TESTS=<0|1> bash "$SKILL_DIR/assets/collect.sh" <repo-key> "<rango>" "$OUT/<repo-key>"
```
Lee cada `meta.json`. Si `worktree_dirty_files > 0`, anótalo. Si `range_note` aplica, anótalo en Supuestos.

### Fase 3 · Partición por caso de uso
Une los `usecases.json` de todos los repos: por cada caso con ≥1 fichero, un lote con sus ficheros
de todos los repos. Si un lote supera ~30 ficheros, divídelo por repo manteniendo un mismo
revisor para la parte cruzada (`src/model/directus.ts`, rutas `api/v0`, `fetchApi`). El caso
`plataforma` se divide por repo. Asigna a cada lote los ítems de checklist de `checklist.md` cuyo
repo esté en el lote (sección común + secciones de `checklist_sections`), más X1–X3 si cruza repos.

### Fase 3 bis · Superficies compartidas
`collect.sh` ya ha dejado `blast-radius.json` en cada repo: por cada fichero cambiado, quién lo
importa, a cuántos casos de uso arrastra y qué símbolos o campos pierde. Se marcan las superficies
**declaradas** en `references/shared-surfaces.json` y, además, cualquier fichero que supere los
umbrales (≥3 casos de uso y ≥15 importadores) aunque nadie lo declarase.

Esto es un lote propio, no se reparte entre los revisores de caso de uso: **ninguno de ellos ve el
radio**. Un cambio en la sesión o en el modelo de Directus vive en una carpeta y rompe en trece.

### Fase 4 · Revisores (paralelo)
Lanza **en una sola respuesta** un `Agent` (`general-purpose`) por lote con
`references/prompts/reviewer.md` rellenado, **más el revisor de superficies compartidas** con
`references/prompts/shared-reviewer.md` si `blast-radius.json` trae alguna fila con riesgo
`rompedor` o `revisar` (guarda su JSON en `$OUT/review-shared.json`). Si se acordó revisión profunda de migraciones, lanza
además el revisor de `references/prompts/migration-reviewer.md` con los repos consumidores
seleccionados. Guarda cada JSON en `$OUT/review-<caso>[-repo].json` y `$OUT/review-migrations.json`.

### Fase 5 · Verificación adversaria (paralelo)
Reúne todos los `findings` (incluidos los de migraciones con riesgo ≠ libre, convertidos a hallazgos).
Lotes de ≤6 mezclando casos, nunca el agente que los propuso. `references/prompts/verifier.md`.
Segunda ronda solo para `new_findings`; lo que quede sin verificar es PLAUSIBLE. Guarda `$OUT/verify-<n>.json`.

### Fase 6 · Checklist del orquestador
Desde `meta.json` de cada repo, sin modelo: G1–G5, W1–W3, S1–S2, Q1–Q2, D2, I1/I1b, K1, K7, K8, M6/M6b/M7.
SH1–SH7 las trae el revisor de superficies compartidas.
Fusiona con los `checklist` de los revisores. Discrepancia: gana FALLA con evidencia; si no, NO VERIFICABLE.

### Fase 7 · Nota
`references/rubric.md` literal: techo por caso (hallazgos y fallos cuyos ficheros pertenecen al caso,
más gates de sus repos), techo global = mínimo con los ajustes de migraciones, superficies compartidas
y dependencias, confianza, veredicto ≤ techo con dos líneas.
**Un hallazgo de superficie compartida cuenta en el techo de todos los casos que arrastra**, según
`blast_radius` del hallazgo, no solo en el caso donde vive el fichero.

### Fase 8 · Informe
**El entregable es el artefacto**: rellena `assets/report.template.html`, que ya trae el diseño y las
instrucciones de cada bloque en comentarios. No rediseñes la página; sustituye los `{{...}}` y borra
los comentarios. Guarda el resultado como `$OUT/report.html`. Un informe **breve** deja fuera los
menores, los refutados y los gates; uno **detallado** los incluye todos.
Escribe además `$OUT/report.md` (misma información, para diffs y CI) a partir de
`assets/report.template.md`.
**Antes de dar el informe por bueno**, pásalo por el redactor y adjunta su inventario:
```bash
node "$SKILL_DIR/assets/redact.mjs" "$OUT/report.md"   --in-place
node "$SKILL_DIR/assets/redact.mjs" "$OUT/report.json" --in-place
```
Sale con código 3 si redactó algo. Si redacta, **es un fallo de la revisión, no una salvaguarda que
funcionó**: localiza qué agente pegó el valor, corrígelo en el texto y deja constancia en el informe
(sección «Secretos detectados»). Los artefactos de fase 0 (`diff.patch`, `added-lines.txt`) contienen
el diff en crudo y nunca se copian al informe, ni se adjuntan, ni se publican.
Escribe `report.json`:
```json
{"date","repos":{"<key>":{"range","head_sha","version","gates":{}}},"depth","score","cap","confidence",
 "use_cases":{"<slug>":{"what_ships","owner","repos":[],"issues":[],"cap","score","findings":{"confirmed":[],"plausible":[]}}},
 "migrations":{"reviewed":true,"items":[],"sequence":[]},"checklist":[],"refuted":[],"unverifiable":[],"coverage":{}}
```
### Fase 9 · Archivo y publicación
```bash
DEST=$(bash "$SKILL_DIR/assets/archive.sh" "$OUT" "$REPOS_ROOT")
```
Archiva en `<repos-root>/release-reviews/revision-<fecha>-v<versión>/`. La versión sale **siempre**
del `package.json` de nimrod-multitenant: es el front principal y su número es la versión del
producto. El script pasa el redactor como puerta y no copia `diff.patch` ni `added-lines.txt`.
Después publica `report.html` como artefacto con la herramienta Artifact (título estable
«Veredicto de Release», favicon 🚦) y guarda la URL en `$DEST/artifact-url.txt`.

Nada de esto se sube a ningún repositorio: `A2RCrew/skills` es público y estos informes llevan
hallazgos de seguridad, nombres de tenants y rutas internas.

Respuesta al usuario, concisa: nota global, techo, confianza, enlace del artefacto y ruta del
archivo, tabla de una línea por caso de uso (qué se sube · nota · bloqueantes) y la secuencia de
despliegue. Nada más.

## Camino a CI

Con `--yes` la skill no pregunta y aplica las recomendaciones; el contrato es repos+rangos de entrada
y `report.json` de salida. Es lo que ejecutará una GitHub Action con `claude -p` sobre PR a `main` y
tag `v*`. Los cambios de reglas van a `references/checklist.md`, `references/rubric.md`,
`references/repos.json` y `references/use-cases.json`, nunca al prompt suelto.
