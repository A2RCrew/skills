# Rúbrica de nota (1-5)

La nota se calcula **por caso de uso** y luego **global**. En ambos niveles hay dos partes:

1. **Techo calculado**: determinista, sale de gates, checklist y hallazgos CONFIRMADOS.
2. **Veredicto del revisor**: valor **≤ techo**, con dos líneas de justificación y confianza.
   Puede bajar, nunca subir.

## Antes de puntuar: qué no es un hallazgo

Este informe se lee **antes** de desplegar, y el procedimiento de A2R ejecuta las migraciones en el
paso 2, antes de todo el código (ver `references/deployment-procedure.md`). Por tanto:

- **Una migración pendiente no es un defecto.** Que una tarea pida un campo cuya migración aún no
  ha corrido es la precondición normal. Va a «Requisitos previos», no a hallazgos, y **no toca la nota**.
- **Sí es hallazgo** si el orden necesario contradice el canónico, si nadie lo declaró, si la
  migración está mal hecha, o si retira algo que ya usa producción.
- **La deuda heredada no puntúa.** Un hallazgo cuyo fichero no cambia en el rango se reporta en su
  sección y no baja la nota: se puntúa lo que se sube hoy. Los secretos son la excepción, se
  reportan siempre con la misma urgencia.
- **Un patrón sistémico tampoco puntúa como si fuera nuevo.** Si el fichero sí cambia en el rango
  pero reproduce una forma de hacer las cosas **que ya existe en el repositorio desde antes**, no es
  un defecto de esta release: es deuda técnica. Baja a **menor** y va a la sección «Deuda técnica»
  con su riesgo, no a bloqueantes. El umbral es mecánico: **≥5 ocurrencias previas al rango**,
  contadas con un comando que se pega como evidencia.

  El caso que motivó la regla: la migración 2026-09-08 devuelve `{ok:false}` en vez de relanzar,
  y eso mismo lo hacen 92 ficheros de migración desde 2024-12. Puntuarlo como crítico convertía en
  bloqueante de release cada vez que alguien tocase una migración, y una nota que siempre sale 1
  deja de leerse.

  La excepción: si el patrón, **en este caso concreto**, tiene una consecuencia que no tiene en los
  otros 92 sitios (aquí deja un tenant sin login), eso se dice en la ficha de deuda técnica, en la
  columna «qué puede provocar». Se informa del riesgo sin secuestrar la nota.

## Severidades

| Severidad | Definición |
|---|---|
| crítica | Puede tumbar un tenant o un worker en producción, perder o corromper datos, exponer secretos o saltarse permisos. Migración no aditiva o sin concesión a `Default`. Campo hecho a mano. Variable requerida sin definir en el despliegue. Contrato Directus/HTTP roto entre repos. |
| mayor | Rompe una funcionalidad para usuarios; gate determinista rojo; ruta o worker sin validación; dependencia entre repos sin orden declarado; `feat`/`fix` sin issue Linear. |
| menor | Deuda, estilo, logs, `as any`, commit sin formato, límite duplicado, doc desactualizada. |

**Antes de asignar crítica o mayor, cuenta las ocurrencias previas.** Si el mismo patrón ya está en
≥5 sitios anteriores al rango, no es de esta release: baja a menor y va a «Deuda técnica».

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
- **Superficie compartida rota** (SH1, SH3 o SH6 en FALLA, confirmada) → 1 si arrastra a ≥3 casos de
  uso o cruza repos; 2 en el resto. **No cuenta** si el único motivo es que su migración está
  pendiente y el orden canónico ya la cubre: eso es precondición. Esta regla existe porque el hallazgo vive en el caso de uso del
  fichero, pero el daño es de todos: sin ella, un cambio en la sesión o en el modelo de Directus se
  puntúa como si solo afectase a su carpeta.
- **Superficie compartida declarada tocada y no contrastada** con su `rompedor_si` (SH2 NO VERIFICABLE) → ≤3.
- Dependencia entre repos sin orden declarado (X3) → ≤3.
- Algún repo seleccionado sin fase 0 completa (install o typecheck no ejecutados) → ≤3.

## Superficies compartidas: sin dueño, con autor

Los componentes generales no tienen responsable asignado. En el informe **no se les pone owner**:
ni el del caso de uso «plataforma», ni ningún otro. Lo que se nombra es **quién firmó el cambio**
(`autores` e `issues` de `blast-radius.json`) y **de qué caso de uso salió ese trabajo**.

Un cambio que degrada una pieza común se reporta siempre, aunque su caso de uso vaya por lo demás
limpio: es precisamente el escenario que motiva esta sección, alguien tocando lo suyo y rompiendo
lo de todos.

## Cómo afecta el radio a los casos de uso

Un hallazgo en una superficie compartida **cuenta en todos los casos de uso que arrastra**, no solo
en aquel donde vive el fichero. `blast-radius.json` da la lista: aplica su severidad al techo de
cada uno de esos casos. Un cambio en `src/lib/auth.ts`, con 124 importadores en los trece casos,
baja el techo de los trece, no solo el de «auth».

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
