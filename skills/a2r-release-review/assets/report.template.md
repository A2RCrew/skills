# Release review · {{FECHA}} · {{REPOS_RESUMEN}}

| Campo | Valor |
|---|---|
| Repos revisados | {{REPOS_TABLA_CORTA}} (repo · versión · rango · commits/ficheros) |
| Casos de uso tocados | {{CASOS_LISTA}} |
| Migraciones pendientes | {{N_MIGRACIONES}} ({{MIGRACIONES_MODO}}) |
| Profundidad · tests | {{PROFUNDIDAD}} · {{TESTS_MODO}} |
| Cobertura de revisión | {{COBERTURA_PCT}} % de ficheros leídos por un revisor |
| Modelo · generado | {{MODELO}} · {{TIMESTAMP}} |
| Supuestos | {{SUPUESTOS}} |

## Nota global

**{{NOTA}} / 5** · techo calculado {{TECHO}} · confianza **{{CONFIANZA}}**

{{JUSTIFICACION_DOS_LINEAS}}

## Qué se sube, por caso de uso

| Caso de uso | Owner | Repos | Issues | Qué cambia (una frase) | Techo | Nota | Bloqueantes |
|---|---|---|---|---|---|---|---|
{{FILAS_CASOS}}

## Secuencia de despliegue recomendada

{{SECUENCIA}}

## Superficies compartidas tocadas

| Superficie | Repo | Quién la tocó | Cambio | Importadores | Casos que arrastra | Veredicto |
|---|---|---|---|---|---|---|
{{FILAS_SUPERFICIES}}

{{SUPERFICIES_SIN_RIESGO}}
<!-- Una línea con las aditivas: «Sin riesgo: X, Y, Z (aditivas, nadie pierde nada).» -->

## Secretos detectados

{{SECRETOS}}
<!-- Una fila por credencial: fichero:línea · tipo · huella · ¿introducida en este rango o preexistente? ·
     acción (rotar). NUNCA el valor. Si no hay ninguna: «Ninguno. El escáner no marcó líneas añadidas y
     el redactor no tuvo que enmascarar nada en este informe.» -->

## Requisitos previos (los cubre el procedimiento, no bajan la nota)

| Qué | Lo necesita | Paso | Orden declarado | Verificación |
|---|---|---|---|---|
{{FILAS_PRECONDICIONES}}

## Bloqueantes y mayores confirmados

{{CONFIRMADOS_CRITICOS_MAYORES}}

<!-- ===== A partir de aquí solo en el informe DETALLADO ===== -->

## Migraciones pendientes

| Migración | Crea/cambia | Aditiva | Permisos Default | Consumidores | Orden requerido | Riesgo |
|---|---|---|---|---|---|---|
{{FILAS_MIGRACIONES}}

{{MIGRACIONES_AJENAS_EN_INDEX}}

## Detalle por caso de uso

### {{CASO}} · {{OWNER}} · techo {{TECHO_CASO}} · nota {{NOTA_CASO}}

**Qué se sube**: commits e issues ({{COMMITS_CASO}}), ficheros por repo.

**Hallazgos confirmados**
{{CONFIRMADOS_CASO}}

**Plausibles (no refutados ni confirmados)**
{{PLAUSIBLES_CASO}}

**Checklist aplicable**
| ID | Regla | Resultado | Evidencia |
|---|---|---|---|
{{CHECKLIST_CASO}}

## Gates deterministas por repo

| Repo | lint (rango / repo) | typecheck | circular | tests | extra | migraciones | i18n |
|---|---|---|---|---|---|---|---|
{{FILAS_GATES}}

## Checklist común y de repo (resto)

| Repo | ID | Regla | Resultado | Evidencia |
|---|---|---|---|---|
{{FILAS_CHECKLIST_RESTO}}

## Refutados por el verificador

{{REFUTADOS}}

## No verificable en local

{{NO_VERIFICABLE}}

## Cobertura

| Repo | Caso de uso | Ficheros | Leídos | Revisor |
|---|---|---|---|---|
{{FILAS_COBERTURA}}

---
Generado por `a2r-release-review`. Artefactos de fase 0 en `{{OUT}}` (`<repo>/meta.json`, logs). JSON en `{{JSON_PATH}}`.
