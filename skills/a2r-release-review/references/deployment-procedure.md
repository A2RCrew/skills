# Procedimiento de despliegue de A2R

**Este informe se lee ANTES de ejecutar el despliegue.** Que una migración esté pendiente es el
estado esperado en ese momento, no un defecto. La skill debe distinguir dos cosas que se parecen y
no lo son:

- **Precondición**: el código presupone una migración, y el procedimiento la ejecuta antes. No es
  un hallazgo. Va a la lista de requisitos previos, con su verificación.
- **Hallazgo**: el orden que el código necesita **contradice** el procedimiento, o **no está
  declarado** en ningún sitio, o la migración en sí está mal. Eso sí puntúa.

## El orden canónico

| # | Paso | Detalle |
|---|---|---|
| 1 | **Cerrar las PR de promoción** | Las de release-please en los repos que lo tienen; PR manuales en los que no. |
| 2 | **Migraciones de nimrod-multitenant** | En todos los tenants. Es el dueño del esquema de Directus. |
| 3 | **Workers en Fargate** | `translate-documents`, `semantic-pdf-serverless`, `pdf-remediation`, `bulk-url-process`. |
| 4 | **nimrod-api** | Después de los workers. |
| 5 | **nimrod-multitenant** | El front va el último. |

Consecuencia directa: **las migraciones siempre preceden a todo el código**. Por tanto, «esta tarea
pide un campo cuya migración está pendiente» **no es un riesgo por sí solo**: el paso 2 lo cubre.

## Cuándo una dependencia de migración SÍ es un hallazgo

| Situación | Severidad | Por qué |
|---|---|---|
| El orden que el código necesita contradice el canónico (p. ej. el código debe ir **antes** que la migración) | crítica | El procedimiento estándar lo rompería |
| La migración crea un campo que un worker lee en proyección obligatoria y **la migración no lo menciona** | mayor | Quien la ejecute por partes o por tenant no sabrá que ese worker depende de ella |
| La migración es incorrecta: no relanza errores, no es aditiva, no concede permisos, retipa un campo | crítica | Falla el propio paso 2 |
| El campo lo usa un repo que **ya está en producción** y la migración lo retira | crítica | Rompe lo desplegado, no lo que se va a desplegar |
| El orden está declarado y coincide con el canónico | **no es hallazgo** | Va a requisitos previos |

## Cómo se refleja en el informe

Sección **«Requisitos previos»**, antes de los bloqueantes: una línea por migración pendiente, con
qué crea, qué código la necesita y en qué paso del procedimiento encaja. Marcada como parte del
plan, no como problema.

Sección **«Secuencia de despliegue»**: el orden canónico, anotado con lo específico de esta
release (qué migraciones, qué activar a mano, qué tenant).

## Deuda heredada

Un hallazgo cuyo fichero **no cambia en el rango** es deuda anterior: se reporta en su propia
sección y **no baja la nota de esta release**. Lo que se puntúa es lo que se sube hoy. La excepción
son los secretos: se reportan siempre y con la misma urgencia, porque el riesgo es continuo.
