# Release review · {{REPO}} · v{{VERSION}}

| Campo | Valor |
|---|---|
| Rango | `{{RANGE}}` ({{MERGE_BASE_SHORT}} → {{HEAD_SHA_SHORT}}) |
| Último tag en base | {{LAST_TAG}} |
| Commits / merges | {{COMMITS}} / {{MERGES}} |
| Ficheros / líneas añadidas | {{FILES}} / {{ADDED_LINES}} |
| Cobertura de revisión | {{COVERAGE_PCT}} % de ficheros leídos por un revisor |
| Modelo · fecha | {{MODEL}} · {{DATE}} |
| Árbol de trabajo | {{DIRTY_NOTE}} |

## Nota

**{{SCORE}} / 5** · techo calculado {{CAP}} · confianza **{{CONFIDENCE}}**

{{VERDICT_JUSTIFICATION}}

## 1. Gates deterministas (sin modelo)

| Check | Resultado | Log |
|---|---|---|
| lint (ficheros del rango / repo) | {{LINT_CHANGED}} / {{LINT}} | `{{OUT}}/lint-changed.log` · `{{OUT}}/lint.log` |
| i18n parity (claves del rango / repo) | {{I18N_RANGE}} / {{I18N_REPO}} | `{{OUT}}/i18n-parity-range.log` · `{{OUT}}/i18n-parity-repo.log` |
| tsc | {{TSC}} | `{{OUT}}/tsc.log` |
| circular deps | {{CIRC}} | `{{OUT}}/circular-deps.log` |
| vitest | {{VITEST}} | `{{OUT}}/vitest.log` |
| migration grants / placement / bench / tests | {{MIG_CHECKS}} | `{{OUT}}/migration-*.log` |

## 2. Checklist del repositorio

| ID | Regla | Resultado | Evidencia |
|---|---|---|---|
{{CHECKLIST_ROWS}}

## 3. Hallazgos confirmados

{{CONFIRMED_FINDINGS}}

## 4. Hallazgos plausibles (no refutados ni confirmados)

{{PLAUSIBLE_FINDINGS}}

## 5. Refutados por el verificador

{{REFUTED_FINDINGS}}

## 6. No verificable en local

{{UNVERIFIABLE}}

## 7. Cobertura por área

| Área | Ficheros | Revisados | Revisor |
|---|---|---|---|
{{COVERAGE_ROWS}}

---
Generado por `a2r-release-review`. Artefactos de fase 0 en `{{OUT}}`. JSON en `{{JSON_PATH}}`.
