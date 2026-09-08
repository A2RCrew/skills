# Rúbrica de nota (1-5)

La nota se calcula **por caso de uso** y luego **global**. En ambos niveles hay dos partes:

1. **Techo calculado**: determinista, sale de gates, checklist y hallazgos CONFIRMADOS.
2. **Veredicto del revisor**: valor **≤ techo**, con dos líneas de justificación y confianza.
   Puede bajar, nunca subir.

## Severidades

| Severidad | Definición |
|---|---|
| crítica | Puede tumbar un tenant o un worker en producción, perder o corromper datos, exponer secretos o saltarse permisos. Migración no aditiva o sin concesión a `Default`. Campo hecho a mano. Variable requerida sin definir en el despliegue. Contrato Directus/HTTP roto entre repos. |
| mayor | Rompe una funcionalidad para usuarios; gate determinista rojo; ruta o worker sin validación; dependencia entre repos sin orden declarado; `feat`/`fix` sin issue Linear. |
| menor | Deuda, estilo, logs, `as any`, commit sin formato, límite duplicado, doc desactualizada. |

## Techo por caso de uso

Se cuentan solo los hallazgos y fallos de checklist cuyos ficheros pertenecen al caso
(`usecases.tsv`). Los gates de repo (G*) cuentan para todos los casos de ese repo.

| Condición | Techo |
|---|---|
| ≥1 CONFIRMADO crítico, o FALLA crítica de checklist | **1** |
| ≥1 CONFIRMADO mayor, o gate rojo del repo (G1, G2, G3, G4, G5, M1–M4, I1, K1) | **2** |
| ≥3 CONFIRMADOS menores, otra FALLA mayor, o cobertura del caso < 80 % | **3** |
| ≥1 CONFIRMADO menor, PLAUSIBLE mayor/crítico sin refutar, o G4 NO VERIFICABLE | **4** |
| Nada de lo anterior | **5** |

## Techo global

`min(techo de cada caso de uso)`, y además:

- Migración con riesgo **bloqueante** → 1 si es crítica (permisos, no aditiva), 2 si es mayor.
- Dependencia entre repos sin orden declarado (X3) → ≤3.
- Algún repo seleccionado sin fase 0 completa (install o typecheck no ejecutados) → ≤3.

## Confianza

| Confianza | Condición |
|---|---|
| alta | ≥95 % de ficheros leídos por un revisor, todos los gates ejecutados en todos los repos, todos los hallazgos verificados |
| media | 80–95 % leídos, o tests saltados en algún repo, o ≥1 hallazgo sin verificar por tiempo |
| baja | <80 % leídos, fase 0 con errores, árbol de trabajo sucio, o rango dudoso (`range_note`) |

## Lectura para el equipo

| Nota | Lectura |
|---|---|
| 5 | Sube. Nada confirmado, gates verdes, checklist limpia. |
| 4 | Sube con los menores anotados en la issue de release. |
| 3 | Sube solo tras corregir o aceptar explícitamente lo mayor, y con el orden de despliegue escrito. |
| 2 | No sube. Bloqueante confirmado o gate rojo. |
| 1 | No sube. Riesgo de tenant, datos, seguridad o migración peligrosa. |

La nota certifica la ausencia de los fallos que sabemos nombrar, no la ausencia de fallos.
No sustituye a los tests ni a la verificación con rol `Default` en PRE.
