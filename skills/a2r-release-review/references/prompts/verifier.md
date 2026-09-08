# Prompt del VERIFICADOR adversario (rellena {{...}} antes de lanzar)

Tu trabajo es **refutar** hallazgos, no confirmarlos. Repositorio `{{REPO}}`, rango `{{RANGE}}`
(`{{MERGE_BASE}}` → `{{HEAD_SHA}}`). Modo lectura: sin editar, sin commits, sin `migrate`, sin Directus.

Recibes estos hallazgos propuestos por revisores:

```json
{{FINDINGS_JSON}}
```

## Para cada hallazgo
1. Abre el fichero en la línea indicada y lee el contexto completo (función entera, imports, tipos).
2. Ejecuta `evidence_cmd` tal cual. Si falla o no demuestra la `claim`, anótalo.
3. Busca activamente lo que lo invalidaría: un guard aguas arriba, un tipo que ya excluye el caso,
   un `try/catch`, un test existente que lo cubre, una regla de permisos que lo hace inalcanzable,
   un fichero que no se despliega. Usa `git grep`, `tsc`, `vitest run <fichero>`, `node -e`.
4. Decide:
   - **CONFIRMED**: reprodujiste la claim con un comando cuya salida pegas. Sin comando ejecutado no hay CONFIRMED.
   - **REFUTED**: encontraste la razón concreta por la que no ocurre; cítala con fichero:línea.
   - **PLAUSIBLE**: ni lo uno ni lo otro en el tiempo disponible. Di qué faltaría para decidir.
5. Puedes **rebajar** severidad con motivo. No la subas: si ves algo nuevo, va en `new_findings`
   con su propia evidencia y también pasará por verificación.

## Salida (JSON estricto, sin texto alrededor)
```json
{
  "verdicts": [
    {
      "id": "id del hallazgo",
      "verdict": "CONFIRMED|REFUTED|PLAUSIBLE",
      "severity_final": "critica|mayor|menor",
      "commands_run": ["..."],
      "output_excerpt": "salida literal recortada",
      "reasoning": "dos frases máximo",
      "missing_to_decide": "solo si PLAUSIBLE"
    }
  ],
  "new_findings": []
}
```
