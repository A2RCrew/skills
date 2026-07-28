# Case Owners A2R — snapshot

> **Este fichero es un snapshot.** La tabla maestra vive en `docs/case-owners.md` del repo
> `a2r-linear-strategy`. Si estás trabajando en ese repo, lee ese fichero y **ignora este**.
> Este snapshot existe para que la skill funcione instalada como plugin en cualquier otro repo.
>
> **Snapshot tomado:** 2026-07-27, contra el workspace real de Linear y el reparto acordado en
> [A2R-18](https://linear.app/a2r/issue/A2R-18). Si la fecha queda lejos, avisa al usuario de que
> conviene refrescarlo.

## Modelo

A2R opera con **propiedad por caso de uso**: cada caso del Framework tiene un único owner principal responsable de su triage, planificación, ejecución y calidad. El backup activa cuando el owner está ausente, sobrecargado o delega explícitamente.

El modelo aplica a Framework, Precio Cerrado y PoC. En proyectos cliente, los issues que tocan core de un caso del Framework van al owner del caso, no al dev del proyecto.

Cada caso se registra en Linear con un **label del grupo `Caso de uso`** (selección única). El label es lo que conecta la issue con su owner.

## Tabla maestra

Owner se indica con el **username de Linear** (el que acepta `--assignee`), porque hay dos Luises y confundirlos asigna trabajo a la persona equivocada.

| # | Caso | Owner | Backup | Label |
|---|------|-------|--------|-------|
| 1 | Dashboard | `ivan` (Iván García) | TBD | `Dashboard` |
| 2 | Chatbots | `ivan` | TBD | `Chatbots` |
| 3 | Revisión de estilo | `ivan` | TBD | `Revisión de estilo` |
| 4 | Ingesta + Explorador de ficheros | `alex` (Alexander Yanez) | TBD | `Ingesta` |
| 5 | Acciones personalizadas | `lguisado` (Luis Guisado) | TBD | `Acciones personalizadas` |
| 6 | Imágenes y vídeo | `lguisado` | TBD | `Imágenes` |
| 7 | Remediación y accesibilidad PDF | `lguisado` | TBD | `PDF` |
| 8 | Evaluaciones | `luis` (Luis Anaya) | TBD | `Evaluaciones` |
| 9 | Generación de preguntas y contenido | `luis` | TBD | `Generación de preguntas` |
| 10 | SDC (Schema Driven Chatbot) | **TBD** | TBD | `SDC` |
| 11 | Traducciones | **TBD** — trabajo de Miguel, sin cuenta en Linear | TBD | `Traducciones` |
| 12 | Text To Speech + Speech To Text | `jesus` (Jesús Macías) | TBD | `TTS-STT` |
| 13 | Autenticación y usuarios | `jordi` | TBD | `Auth` |
| 14 | Transversal / Infra | `marcos` | TBD | `Transversal` |

Reparto: `ivan` 3 · `lguisado` 3 · `luis` 2 · `alex` 1 · `jesus` 1 · `jordi` 1 · `marcos` 1 · TBD 2.

### Cuidado con los nombres

- **Dos Luises:** `luis` es Luis Anaya (contenido educativo, evaluaciones), `lguisado` es Luis Guisado (imágenes, PDF, acciones personalizadas). Nunca escribas `--assignee luis` queriendo decir Guisado.
- **Jose Carlos no existe** en el workspace de Linear. Si ves ese nombre en documentación antigua, el owner correcto es `alex` (Ingesta) o `lguisado` (Acciones personalizadas, Imágenes).
- Ante cualquier duda, verifica con `linear user list`.

### Casos sin owner (TBD)

`SDC` y `Traducciones` no tienen owner asignado. Para esos casos: aplica el label del caso y deja la issue **sin asignar** — no adivines una persona. Dilo en la preview.

Cuando el caso en sí no está claro, aplica `Transversal` (cola de Marcos) y que el equipo lo resuelva en la sesión del lunes.

## Responsabilidades del case owner

El owner es **el único responsable** del caso:

- **Triage** de su propia cola (issues con su label de caso en estado Triage).
- **Estimación** en puntos Fibonacci antes de que la issue entre a Todo.
- **Ejecución** del trabajo, o delegación explícita coordinada con quien lo asuma.
- **Calidad** del caso a lo largo del tiempo: deuda técnica, bugs reincidentes, salud del módulo.
- **Comunicación** con PM y stakeholders sobre el estado del caso.
- **Alerting**: mantener su fila de `taskTypeOwners.ts` al día.

## Cuándo escalar al backup

- **Ausencia planificada** (vacaciones, formación): el owner avisa al backup antes de salir.
- **Sobrecarga sostenida** (>1 ciclo con overflow): se activa al backup para descargar issues concretos.
- **Baja imprevista**: el backup asume hasta que el owner vuelva o se reasigne el caso.
- **Conflicto de prioridades entre casos**: el backup toma las decisiones operativas del ciclo.

El backup **no es co-owner**: no decide estrategia, solo ejecuta y triagea mientras el owner está fuera de juego.

## Sin proyectos `[Caso] X`

Versiones antiguas de la metodología asumían un Linear Project por caso. Esos proyectos nunca se crearon y el modelo se descartó: el caso vive en el label. Los Linear Projects se usan para trabajo con alcance y fecha (PAU, FARO), no como carpeta permanente por caso.
