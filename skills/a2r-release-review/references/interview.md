# Entrevista (fase 1)

La skill es conversacional: antes de revisar pregunta, y en cada pregunta **recomienda** una
opción con el dato que la justifica. Usa `AskUserQuestion` (máx. 4 preguntas por llamada y
4 opciones por pregunta). Si el usuario pasó argumentos (`--repos`, `--migrations`, `--depth`,
`--range`) o `--yes`, las preguntas ya respondidas se saltan. En CI (`--yes`) no se pregunta
nada: se aplican las recomendaciones.

## Antes de preguntar: pre-escaneo

```bash
bash "$SKILL_DIR/assets/prescan.sh" "$REPOS_ROOT" "$OUT"
```

`prescan.json` da, por repo: rango por defecto, commits y ficheros pendientes, último tag,
rango alternativo si el por defecto está vacío, migraciones pendientes, casos de uso tocados con
sus issues, y una `recommendation` (repos con cambios, ficheros totales, casos, profundidad).

## Llamada 1 · Repositorios

Dos preguntas `multiSelect`, con el pre-escaneo en la descripción de cada opción
(«26 commits · 182 ficheros · casos: acciones-personalizadas, ingesta…» o «sin cambios pendientes»).
Marca «(Recomendado)» en las que tienen cambios. Las que no tienen cambios se listan igual, para
que el usuario pueda forzarlas con otro rango.

- **Plataforma**: `nimrod-multitenant`, `nimrod-api`.
- **Workers**: `semantic-pdf-serverless`, `pdf-remediation`, `translate-documents`, `bulk-url-process`.

Si un repo seleccionado tiene rango vacío y `alt_range`, la llamada 2 pregunta por el rango.

## Llamada 2 · Alcance (depende de la 1)

1. **Migraciones** (solo si nimrod-multitenant está seleccionado y `pending_migration_dirs > 0`):
   «Hay N carpetas de migración pendientes (fechas). ¿Revisión profunda?»
   - «Sí, revisión profunda (Recomendado)»: por cada migración, qué crea, si es aditiva,
     permisos, consumidores en nimrod-api/workers y orden de despliegue.
   - «No, solo los checks automáticos»: grants, placement, bench y tests (siempre se ejecutan).
2. **Profundidad del informe**: recomendación de `prescan.recommendation.report_depth` con sus
   motivos («444 ficheros, 9 casos de uso, 5 migraciones»).
   - «Breve»: nota global, tabla de un renglón por caso de uso, bloqueantes, secuencia de despliegue.
   - «Detallado»: además hallazgos completos, checklist por repo, plausibles, refutados, cobertura.
   Regla de recomendación: detallado si ficheros > 60, o ≥3 casos de uso, o migraciones
   pendientes, o ≥3 repos; breve en caso contrario.
3. **Rango** (solo si algún repo seleccionado tiene rango vacío o `range_note`):
   opciones con el rango por defecto, el alternativo (`último tag..origin/main`) y
   `origin/releases..origin/main`, cada una con su número de commits.
4. **Tests**: «Ejecutar suites completas (Recomendado)» / «Saltar tests (G4 queda NO VERIFICABLE,
   techo ≤4)». Recomendar saltar solo si el usuario pidió rapidez o el informe es breve y no hay
   cambios en `src/`.

## Después de la entrevista

Resume en tres líneas lo acordado (repos y rangos, migraciones sí/no, profundidad, tests) y
arranca sin volver a preguntar. Cualquier duda posterior se resuelve con la opción recomendada y
se anota en «Supuestos» del informe.
