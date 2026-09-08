# Rúbrica de nota (1-5)

La nota final tiene dos partes que se reportan por separado:

1. **Techo calculado**: sale de la checklist y de los hallazgos CONFIRMADOS. Es determinista.
2. **Veredicto del revisor**: el modelo elige un valor **≤ techo**. Puede bajar, nunca subir.
   Va acompañado de dos líneas de justificación y de la **confianza**.

## Severidades

| Severidad | Definición en este repo |
|---|---|
| crítica | Puede tumbar un tenant, perder o corromper datos, exponer secretos o saltarse permisos. Migración no aditiva o sin concesión a `Default`. Campo hecho a mano. `accessLevel` sin barra. Campo nuevo en proyección obligatoria del worker. |
| mayor | Rompe una funcionalidad para usuarios, falla un gate determinista (lint, tsc, circular, tests), variable de entorno sin definir, ruta API sin validación, `feat`/`fix` sin issue Linear. |
| menor | Deuda, estilo, logs, `as any`, commit sin formato, límite duplicado, doc desactualizada. |

## Techo

Se aplica la primera regla que cumpla, de arriba abajo:

| Condición | Techo |
|---|---|
| ≥1 hallazgo CONFIRMADO crítico, o checklist con FALLA crítica | **1** |
| ≥1 hallazgo CONFIRMADO mayor, o FALLA en G1–G5 (no G1b), I1 o M1–M4 | **2** |
| ≥3 hallazgos CONFIRMADOS menores, o cualquier otra FALLA mayor de checklist, o cobertura de revisión < 80 % de ficheros | **3** |
| ≥1 hallazgo CONFIRMADO menor, o ≥1 PLAUSIBLE mayor/crítico sin refutar, o G4 NO VERIFICABLE | **4** |
| Nada de lo anterior | **5** |

## Confianza

| Confianza | Condición |
|---|---|
| alta | ≥95 % de ficheros revisados por un agente, todos los gates G1–G4 ejecutados, todos los hallazgos pasaron por verificador |
| media | 80–95 % revisados, o G4 saltado, o ≥1 hallazgo sin verificar por tiempo |
| baja | <80 % revisados, o fase 0 con errores de ejecución, o árbol de trabajo sucio |

## Significado para el equipo

| Nota | Lectura |
|---|---|
| 5 | Sube. Nada confirmado, gates verdes, checklist limpia. |
| 4 | Sube con los menores anotados en la issue de release. |
| 3 | Sube solo tras corregir o aceptar explícitamente lo mayor. |
| 2 | No sube. Hay un bloqueante confirmado o un gate rojo. |
| 1 | No sube. Riesgo de tenant, datos o seguridad. |

La nota nunca sustituye los tests: certifica ausencia de los fallos que sabemos nombrar,
no ausencia de fallos.
