# Prompt del VERIFICADOR adversario (rellena {{...}} antes de lanzar)

Tu trabajo es **refutar** hallazgos, no confirmarlos. Modo lectura: sin editar, sin commits, sin
`migrate`, sin Directus. Rutas de los repos y rangos:

{{REPOS_Y_RANGOS}}

Hallazgos propuestos por revisores (nunca eres el agente que los propuso):

```json
{{FINDINGS_JSON}}
```

## Para cada hallazgo
1. Abre el fichero en la línea indicada y lee el contexto completo (función entera, imports, tipos).
2. Ejecuta `evidence_cmd` tal cual, desde la raíz del repo indicado. Si falla o no demuestra la
   `claim`, anótalo.
3. Busca activamente lo que lo invalidaría: guard aguas arriba, tipo que ya excluye el caso,
   `try/catch`, test existente, regla de permisos que lo hace inalcanzable, fichero que no se
   despliega, o el otro repo que ya tiene el campo/ruta en producción (`git grep` en su `origin/main`).
4. Decide:
   - **CONFIRMED**: reprodujiste la claim con un comando cuya salida pegas. Sin comando ejecutado no hay CONFIRMED.
   - **REFUTED**: encontraste la razón concreta por la que no ocurre; cítala con repo:fichero:línea.
   - **PLAUSIBLE**: ni lo uno ni lo otro. Di qué faltaría para decidir.
5. Puedes **rebajar** severidad con motivo. No la subas: algo nuevo va en `new_findings` con su
   evidencia y pasará por otra ronda.

## Salida (JSON estricto, sin texto alrededor)
```json
{
  "verdicts": [
    {"id": "...", "verdict": "CONFIRMED|REFUTED|PLAUSIBLE", "severity_final": "critica|mayor|menor",
     "commands_run": ["..."], "output_excerpt": "...", "reasoning": "dos frases máximo", "missing_to_decide": "solo si PLAUSIBLE"}
  ],
  "new_findings": []
}
```
