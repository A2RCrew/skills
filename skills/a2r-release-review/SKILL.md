---
name: a2r-release-review
description: >-
  Revisión de release para repositorios A2R (nimrod-multitenant y afines) antes de subir a
  producción (main / releases). Ejecuta gates deterministas (lint, tsc, circular-deps, vitest,
  checks de migraciones), revisa el diff por áreas con subagentes en paralelo, pasa cada
  hallazgo por un verificador adversario que lo CONFIRMA, REFUTA o deja PLAUSIBLE, evalúa la
  checklist de reglas del repo con evidencia, y emite un informe con nota 1-5 (techo calculado
  + veredicto del revisor ≤ techo) y nivel de confianza. Úsala cuando el usuario escriba
  "/a2r-release-review", pida "revisar la release", "review de lo pendiente de subir a main",
  "qué riesgo tiene subir esto a producción", "code review de la versión X" o "nota de la
  release". Solo lectura: no edita, no commitea, no ejecuta migraciones ni toca Directus.
argument-hint: "[rango-git | tag | rama]  p.ej. origin/main..HEAD · v2.54.0..HEAD · --skip-tests · --quick"
---

# a2r-release-review

Objetivo: un informe **verificado** del rango de commits pendiente de producción. Todo lo que
aparezca como hallazgo lleva fichero:línea y un comando ejecutado. Lo que no se pueda comprobar
se declara como tal. La nota es un veredicto acotado por una fórmula, y así se presenta.

Ficheros de la skill (`SKILL_DIR` = directorio de este fichero):
- `assets/collect.sh` — fase 0 determinista
- `references/checklist.md` — reglas del repo como comprobaciones con evidencia
- `references/rubric.md` — severidades, techo, confianza
- `references/prompts/reviewer.md`, `references/prompts/verifier.md` — prompts de subagentes
- `assets/report.template.md` — plantilla del informe

## Argumentos

| Forma | Rango revisado |
|---|---|
| (vacío) | `origin/main..HEAD` — lo pendiente de subir a producción |
| `A..B` | ese rango literal |
| `vX.Y.Z` | `vX.Y.Z..HEAD` |
| `rama` | `origin/rama..HEAD` |
| `--skip-tests` | fase 0 sin vitest (G4 queda NO VERIFICABLE, techo ≤4) |
| `--quick` | equivale a `--skip-tests` y sin `pnpm install` |
| `--out <dir>` | dónde dejar informe y artefactos |

Salida por defecto: `~/.claude/a2r-release-review/reports/<repo>/<version>-<fecha>-<head7>/`
con `report.md`, `report.json` y los artefactos de fase 0. Nada se escribe dentro del repo.

## Reglas absolutas

1. **Solo lectura**. Sin `Edit`/`Write` sobre el repo, sin `git commit/push/checkout`, sin
   `pnpm run migrate`, sin llamadas a ningún Directus. Si un subagente necesita probar algo, lo hace
   con `tsc`, `vitest run <fichero>`, `node -e`, `git grep`, `git show`.
2. **Sin evidencia no hay hallazgo**. Un hallazgo sin `evidence_cmd` ejecutado se descarta en la
   fase de verificación, no se degrada a "menor".
3. **El modelo no elige el techo**. El techo sale de `references/rubric.md`; el veredicto es ≤ techo.
4. **No preguntar al usuario** durante la ejecución. Si falta algo, se anota en "No verificable".
5. **Idioma del informe**: español de España. Rutas y comandos literales.

## Procedimiento

### Fase 0 · Recolección determinista
```bash
OUT=<dir-salida>; mkdir -p "$OUT"
SKIP_TESTS=<0|1> SKIP_INSTALL=<0|1> bash "$SKILL_DIR/assets/collect.sh" "<rango>" "$OUT"
```
Lee `meta.json`. Si `worktree_dirty_files > 0`, anótalo: la revisión es del rango de commits,
no de los cambios sin commitear. Si el rango tiene 0 commits, informa y termina.
Si `counts.files > 400`, avisa en la cabecera y prioriza áreas `migrations`, `tts-v2`, `api`,
`auth`, `data`, `actions`; el resto se revisa por muestreo y la cobertura lo refleja.

### Fase 1 · Partición
`areas.tsv` ya agrupa los ficheros. Un revisor por área con ≥1 fichero. Si un área supera
~25 ficheros, divídela en lotes (`migrations-a`, `migrations-b`) manteniendo juntos los ficheros
de una misma carpeta de migración. Áreas `docs` y `tests` se revisan en un único agente ligero
(D1, D2, y que los tests nuevos prueben lo que dicen).

Asignación de ítems de checklist por área:
- migrations → M1–M8, W3
- tts-v2 → T1–T6 (además de lo que aplique de data/actions)
- api → S3, S4 · auth → S3 · actions → S5 · data → M8, T4
- components / app → Q3, D1 · lib → Q1, D1 · scripts-ci → S2, W3, G5 · i18n → I1 (orquestador) + revisor ligero
- Los G*, W1, W2, S1, Q2, D2 los evalúa el orquestador desde `meta.json` y ficheros de fase 0.

### Fase 2 · Revisores (paralelo)
Lanza los revisores **en una sola respuesta** con `Agent` (`subagent_type: general-purpose`),
uno por área/lote, con `references/prompts/reviewer.md` rellenado. Espera todos. Guarda cada JSON en
`$OUT/review-<area>.json`. Si un agente devuelve texto no-JSON, extrae el bloque JSON; si no hay,
la área cuenta como no revisada.

### Fase 3 · Verificación adversaria (paralelo)
Reúne todos los `findings`. Lotes de ≤6 hallazgos, mezclando áreas, y **nunca el mismo agente que
los propuso**. Lanza los verificadores en paralelo con `references/prompts/verifier.md`. Los `new_findings`
que aparezcan se verifican en una segunda ronda (una sola; lo que quede sin verificar es PLAUSIBLE).
Guarda en `$OUT/verify-<n>.json`.

### Fase 4 · Checklist del orquestador
Evalúa desde fase 0, sin modelo:
- G1, G1b, G2–G5, I1, I1b desde `meta.checks` y `counts`.
- W1: `commits-without-issue.tsv`; si contiene `feat`/`fix` → FALLA mayor, si solo otros → menor.
- W2: `commits-nonconventional.tsv`.
- S1: `signal-secrets.txt`; cada línea se verifica leyendo el contexto (fixture vs real).
- S2: `env-new-undefined.txt`.
- Q2: `signal-console-log.txt` filtrado a `src/`.
- D2: rutas `.claude/` en `areas.tsv`.
Fusiona con los `checklist` de los revisores. Si dos revisores discrepan en un ítem, gana FALLA
si tiene evidencia; si no, NO VERIFICABLE.

### Fase 5 · Nota
Aplica `references/rubric.md` literalmente:
1. Cuenta CONFIRMED por severidad final, PLAUSIBLE mayor/crítico, FALLAs por ítem, cobertura
   (= ficheros en `files_reviewed` ∪ / total).
2. Techo por la primera regla que se cumple.
3. Confianza por la tabla.
4. Veredicto: elige nota ≤ techo. Si bajas del techo, di por qué en una frase. Dos líneas de
   justificación máximo.

### Fase 6 · Informe
Rellena `assets/report.template.md` → `$OUT/report.md` y escribe `$OUT/report.json`:
```json
{ "repo", "range", "head_sha", "version", "score", "cap", "confidence",
  "gates": {...}, "checklist": [...], "findings": {"confirmed": [], "plausible": [], "refuted": []},
  "unverifiable": [], "coverage": {"files_total", "files_reviewed", "by_area": {}} }
```
Cada hallazgo en el markdown: `**[severidad] título** — ruta:línea`, claim, comando y salida en
bloque de código, veredicto del verificador. Ordena por severidad.

Respuesta al usuario (concisa): nota, techo, confianza, ruta del informe, los hallazgos
CONFIRMADOS críticos/mayores en una línea cada uno. Nada más; el detalle está en el informe.

## Camino a CI

El contrato de entrada (rango) y salida (`report.json`) es el que usará una GitHub Action con
`claude -p` sobre PR a `main` y tag `v*`. Mientras la skill viva fuera del repo, cualquier cambio
de reglas va a `references/checklist.md`/`references/rubric.md`, nunca al prompt suelto: son los ficheros que se
copiarán tal cual al repo cuando se promocione.
