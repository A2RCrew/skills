---
name: a2r-discord-threads
description: >-
  Extrae los hilos de los foros de asistencia (canales tipo foro "*-asistencia" /
  "*-assistance") del Discord de A2R ("△² Ꝛ Framework") en un rango de fechas y los
  devuelve como una tabla Cliente | Título | Etiqueta | URL completa, lista para copiar.
  Úsala cuando el usuario escriba "/a2r-discord-threads" o pida, en sus palabras, listar,
  sacar o exportar los hilos/threads/tickets/incidencias de los foros de soporte o
  asistencia de A2R en Discord para un periodo: p. ej. "saca los hilos de Discord",
  "lista de hilos de asistencia", "incidencias abiertas en Discord", "hilos nuevos del
  foro", "qué tickets hay en Discord entre X e Y", "exporta los hilos de soporte de
  [cliente]". Pide SIEMPRE el rango de fechas (inicio y fin) antes de ejecutar si el
  usuario no lo ha indicado. NO la uses para informes completos de cliente que cruzan
  costes (cost.a2r.com), reuniones (Drive/Meet) y asistencia — para eso usa
  a2r-client-report; esta skill solo devuelve la tabla de hilos de Discord.
---

# A2R Discord threads

Extrae los hilos de los **foros de asistencia** del servidor de Discord de A2R (**△² Ꝛ Framework**, id `1176965988114247680`) en un rango de fechas y los presenta en una tabla lista para copiar.

## Paso 0 — OBLIGATORIO: pedir el rango de fechas

**Antes de hacer nada**, si el usuario NO ha indicado explícitamente las dos fechas, pregúntale:

> ¿Desde qué fecha y hasta qué fecha quieres extraer los hilos? (formato `AAAA-MM-DD`)

No asumas fechas por defecto (ni "hoy", ni "este mes"). Espera la respuesta con **fecha de inicio** y **fecha de fin** antes de ejecutar el script. El filtro es por **fecha de creación del hilo** (`thread_metadata.create_timestamp`), e incluye ambos extremos en **hora local de A2R (`Europe/Madrid`)**: la fecha de inicio desde las 00:00:00 y la de fin hasta las 23:59:59 de Madrid (no UTC), para que los hilos de madrugada no se desplacen de día.

## Qué cuenta como "foro de asistencia"

Los canales tipo foro (type 15) cuyo nombre contiene `asistencia` o `assistance`. Esto **excluye** otros foros como `procesos-de-venta`, `edelvives-diseño` o el canal automático de logs `incidencias`.

## Instalación (para compañeros de A2R)

Esta skill es **portable**: no contiene ningún token ni ninguna ruta atada a un usuario concreto. Cada persona la usa con **su propia cuenta de Discord**. Para dejarla operativa en una máquina nueva:

1. **Node.js** instalado y en el PATH (`node --version` debe responder).
2. **Copiar la carpeta de la skill** `a2r-discord-threads\` (este `SKILL.md` + la subcarpeta `scripts\` con `extract-threads.mjs`) dentro de las skills de usuario de Claude Code: `<HOME>\.claude\skills\a2r-discord-threads\` (en Windows, `<HOME>` = `C:\Users\<tu-usuario>`).
3. **Autenticar `agent-messenger` con tu cuenta de Discord** (una sola vez):
   ```powershell
   npx -y agent-messenger discord auth status   # ¿ya estoy autenticado?
   npx -y agent-messenger discord auth extract  # si no, extrae el token de tu sesión de Discord
   ```
   Esto crea `<HOME>\.config\agent-messenger\discord-credentials.json`, de donde la skill lee tu token automáticamente.
4. **Pertenecer al servidor de A2R** (`△² Ꝛ Framework`) con tu cuenta. El `guild` está fijado en el script, así que no importa cuál sea tu "servidor activo" en `agent-messenger`.

> ⚠️ **Los resultados dependen de tus permisos en Discord**: los foros de asistencia que tu rol no pueda ver devolverán **403** y se omitirán (se listan al final). Dos compañeros pueden obtener tablas distintas según a qué clientes tengan acceso.

## Cómo ejecutarlo

Requiere que `agent-messenger` esté autenticado con la cuenta de Discord de **quien ejecuta la skill** (el token se lee de `<HOME>/.config/agent-messenger/discord-credentials.json`, donde `<HOME>` es la carpeta de usuario de cada uno). Si no lo está, ejecuta primero `npx -y agent-messenger discord auth status` y, si hace falta, `auth extract`.

El script está en `scripts/extract-threads.mjs`, dentro de la carpeta de esta skill (su `Base directory`, que Claude Code te indica al invocarla y es distinto para cada usuario/equipo). **No uses una ruta fija con un nombre de usuario concreto**: construye la ruta a partir de ese `Base directory`. Lanza el script pasándole las fechas, p. ej.:

```powershell
node "<BASE_DIR>\scripts\extract-threads.mjs" --from 2026-06-05 --to 2026-06-12
```

donde `<BASE_DIR>` es el `Base directory` de esta skill en la máquina actual (típicamente `<HOME>\.claude\skills\a2r-discord-threads`).

El script:
1. Lee el token y el `guild` de las credenciales.
2. Descubre dinámicamente todos los foros de asistencia (`GET /guilds/{id}/channels`, filtra type 15 + nombre con asistencia/assistance) — así detecta clientes nuevos sin tocar la skill.
3. Para cada foro consulta `GET /channels/{id}/threads/search?sort_by=last_message_time&sort_order=desc` paginando con `offset` hasta `has_more=false`, con reintentos ante rate-limit (429).
4. Filtra por fecha de creación dentro del rango y mapea las etiquetas (`applied_tags` → `available_tags`).
5. Imprime una **tabla Markdown** ya ordenada y la URL completa de cada hilo.

Algún foro puede devolver 403 (la cuenta no tiene acceso, p. ej. `editex-asistencia-poc`): el script lo registra en stderr y continúa. Menciónaselo al usuario al final.

## Formato de salida (no lo cambies salvo que el usuario lo pida)

Tabla con exactamente estas 4 columnas, en este orden:

| Cliente | Título | Etiqueta | Url |

- **Url**: escríbela **completa** (`https://discord.com/channels/1176965988114247680/<threadId>`), no como enlace enmascarado, para que se pueda copiar y pegar.
- **Etiqueta**: todas las etiquetas aplicadas al hilo, separadas por coma.
- **Cliente**: nombre del cliente derivado del canal (p. ej. `sm-asistencia` → `SM`).

## Orden de los resultados (no lo cambies salvo que el usuario lo pida)

1. **Primero** los hilos que tengan la etiqueta `Resuelto`.
2. **Después** el resto, ordenados **alfabéticamente por Cliente**.

(El script ya emite la tabla en este orden.)

## Notas

- Taxonomía de etiquetas habitual: `Resuelto`, `Pendiente`, `Bug`, `Nueva funcionalidad`, `Consulta`.
- Si el usuario pide otras columnas, otro orden, o incluir/excluir ciertos clientes o el canal `incidencias`, adáptate a lo que pida — los apartados de formato y orden de arriba son solo el comportamiento por defecto.
- El script imprime también un `TOTAL` y, si los hubo, los foros que fallaron por permisos.
