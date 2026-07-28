---
name: create-issue
description: >-
  Crea una issue en Linear (equipo A2R) desde el contexto actual: detecta tipo, labels,
  caso de uso y owner, propone estimación Fibonacci y pide confirmación antes de crearla.
  Funciona con el MCP de Linear o con linear-cli, el que esté disponible.
  Úsala cuando el usuario escriba "/a2r:create-issue" o pida, en sus palabras, registrar
  un bug, tarea, feature o mejora en Linear: p. ej. "crea una issue de esto", "abre un
  bug en Linear", "mete esto en el backlog", "registra esta tarea". La salida es siempre
  en español de España. NO la uses para clasificar bugs que ya existen en Triage (usa
  a2r:triage-bug) ni para actualizar issues existentes (usa a2r:update-status).
disable-model-invocation: true
allowed-tools: Bash(linear *), Bash(cat *), Bash(rm *), Bash(git *), Read, AskUserQuestion, mcp__linear, mcp__linear-server, mcp__claude_ai_Linear
---

# /a2r:create-issue

Creates an issue in Linear with smart context, integrated estimation, and mandatory preview before confirming.

The methodology below (context, labels, case owner, estimation, preview) is the same
whichever backend talks to Linear. Only name resolution and the create call differ.

## Backend selection

Two backends can reach Linear. Decide once, at the start, before gathering any names:

1. **Linear MCP** — preferred when available. Check whether the session lists Linear MCP
   tools (`save_issue`, `list_issue_labels`, `list_cycles`, …, under whatever server
   prefix). If they are there, use the MCP: nothing to install, no version to check.
   Read `references/backend-mcp.md`.
2. **linear-cli** — fallback when there is no Linear MCP. Verify with `linear --version`
   (2.3.0 or later, authenticated with `linear auth login`).
   Read `references/backend-cli.md`.
3. **Neither** — stop before the preview and say so:
   "No veo forma de llegar a Linear: no hay MCP de Linear conectado ni linear-cli
   instalado. Instala el CLI (`npm i -g @schpet/linear-cli@latest` + `linear auth login`)
   o conecta el MCP de Linear, y lo retomamos."

Read only the reference file for the backend you selected. If the dev explicitly asks for
one ("créala con el CLI", "usa el MCP"), honour that over the default order. Mention the
backend once, in the preview footer, so the dev knows which path ran.

If the selected backend fails for an infrastructure reason (auth, missing binary, broken
connection) and the other one is available, offer to retry through it rather than
abandoning the gathered data. Data errors (a label that does not exist, an unresolvable
case) are not backend problems — fix the data instead of switching.

## Case owners: which table to read

The `caso de uso -> owner` mapping has one source of truth per environment. Resolve it in this order:

1. **`docs/case-owners.md` in the current repo**, if it exists (the `a2r-linear-strategy` repo). That is the live master table — always prefer it.
2. Otherwise, **`references/case-owners.md`** bundled with this skill: a snapshot of the master table.

If you fall back to the snapshot, say so once in the preview: "tabla de owners desde el snapshot de la skill". A snapshot can be stale; the live table cannot.

## Complete Flow

### 1. Context detection

Before asking the dev for data, gather context automatically:

- **Recent conversation:** open files, discussed errors, reviewed code
- **Current git branch:** `git branch --show-current` -- may contain issue ID (e.g.: `feat/A2R-42-login-fix`)
- **Repo name:** infer if it is a Framework project or specific client
- **Recent errors:** stack traces, error logs visible in the conversation
- **Discord messages:** if the context comes from a Discord conversation, include the full message/thread link in the description (format: `https://discord.com/channels/{server}/{channel}/{message}`)

Use this context to pre-fill title, description, labels, and area.

### 2. Information gathering

**If the dev provides all info at once:**
Example: "/a2r:create-issue Bug: el redirect de login falla despues de OAuth"
- Parse: type = Bug, title = "El redirect de login falla despues de OAuth"
- Complete the rest with automatic context

**If information is missing:**
Ask only what is necessary. Fields:

| Field | Required | Auto-detectable |
|-------|----------|-----------------|
| Title | Yes | Partial (from context) |
| Type | Yes | Partial (Bug if error, Feature if requesting something new) |
| Description | No (auto-generate from context if not given) | Yes |
| Area | No | Yes (from code/files) |
| Client | No | Yes (from repo/branch) |
| Caso de uso | Yes (Framework) | Yes (from context: domain keywords like "traducciones", "chatbot", "login", "PDF", etc.) |
| Estimation | No (always suggest) | Yes |
| Cycle | No | No |

For Framework issues, a `Caso de uso` label is MANDATORY. If you cannot infer it from context, ask the dev. If still unclear, apply `Transversal` (Marcos's queue) for later disambiguation in the Monday group session.

### 3. Name resolution

Both backends take human-readable names and resolve IDs themselves. What matters is
passing the **exact** name. The backend reference file has the concrete commands or tool
calls; the rules below hold either way:

1. **Labels** — names carry no group prefix. The group is `Tipo`, the label is `Bug`.
   Writing a prefixed name (`Tipo` + colon + `Bug`) fails to resolve. Pick one from
   `Tipo`, the areas that apply (`Backend`, `Frontend`, `Infra`, `Docs`), the client if
   any, and the case from `Caso de uso` (mandatory in Framework). Read
   `references/label-taxonomy.md` to validate the suggested labels.

2. **Cycle** — never compare dates by hand and never hardcode cycle numbers: ask Linear
   which cycle is current or next. The CLI takes relative references directly
   (`--cycle now|next`); the MCP does not, so with the MCP you resolve the cycle first
   and pass its number. Cycle gaps happen — if there is no active cycle, offer the next
   one or no cycle at all.

3. **Case -> owner** — read the case owners table (see "Case owners: which table to read" above). For the resolved case label:
   - Take the owner's **Linear username** from the table and set it as the assignee.
   - Keep the case label in the label set.
   - If the owner is **TBD**, apply the label and leave it unassigned. Say so in the preview: "caso sin owner asignado, la issue queda sin asignar".
   - If the case cannot be inferred, ask the dev; if it stays unclear, use `Transversal` (Marcos).

   Watch out for the two Luises: `luis` is Luis Anaya, `lguisado` is Luis Guisado. Verify
   against the Linear user list if in doubt. The CLI takes the username as-is; the MCP
   wants an ID, name or email, so look the username up first.

4. **Project** — only for issues that belong to a scoped, dated project (PAU and similar).
   There are no per-case projects. Never pass a project like `[Caso] X`.

### 4. Integrated estimation

Read `references/estimation-rules.md` and analyze the issue:

1. Evaluate 4 dimensions: architectural complexity, AI reliability, review/validation, integration surface
2. Apply "highest dimension wins"
3. Map to Fibonacci value
4. If >8 pts: suggest splitting into subtasks

Include the estimation in the preview with a brief one-line rationale.

### 5. Preview (MANDATORY)

ALWAYS show before creating. Do not create without explicit confirmation.

First show the preview as text:
```
=== Nueva Issue ===
Titulo:       El redirect de login falla despues de OAuth callback
Equipo:       A2R
Tipo:         Bug
Caso:         Auth
Asignado a:   jordi (owner del caso)
Labels:       Bug, Backend, Auth
Estimacion:   3 pts — Arquitectura clara, la IA genera buen CRUD pero la validacion requiere ajustes
Ciclo:        Cycle 11 (3-9 ago)
Descripcion:
  El redirect despues del callback de OAuth devuelve 404.
  Pasos para reproducir:
  1. Iniciar login con OAuth
  2. Completar autorizacion
  3. El callback redirige a /auth/callback -> 404

(vía MCP de Linear)
```

The line `Asignado a: <owner> (owner del caso)` reflects the auto-assignment. The dev can
override it in the Editar branch. The footer says which backend will create the issue —
`(vía MCP de Linear)` or `(vía linear-cli)`.

Then call `AskUserQuestion` with options:
- **Confirmar** -- Create the issue with this data
- **Editar** -- Change a field before creating (caso, asignado, tipo, labels, etc.)
- **Cancelar** -- Discard without creating

### 6. Conversational editing

If the dev chooses "Editar":

1. Use `AskUserQuestion` to ask: "Que quieres cambiar?"
2. Accept changes in natural language:
   - "Cambia el tipo a Feature" -> update type
   - "Anade el label de Frontend" -> add the `Frontend` label
   - "La estimacion deberia ser 5" -> update estimation
   - "Pon la descripcion como..." -> replace description
   - "Cambia el caso de uso a Traducciones" -> re-resolve the chain: new case label and new owner from the case owners table. Show both changes in the updated preview.
   - "Asigna a luis" -> override the assignee without changing the case, and flag in the preview that the assignee is not the case owner.
   - "Créala con el CLI" / "usa el MCP" -> switch backend, re-resolving anything that is backend-specific (cycle reference, assignee format).
3. Show updated preview
4. Repeat until the dev confirms (call `AskUserQuestion` again)

### 7. Creation

On confirm, create the issue with the selected backend, following the exact invocation in
its reference file:

- **MCP** — one `save_issue` call with `team`, `title`, `description`, `labels`,
  `estimate`, `cycle` and `assignee`. Never pass `id` (that would update an existing
  issue instead of creating one). See `references/backend-mcp.md`.
- **CLI** — `linear issue create` with the description in a temp file, one `-l` per
  label, and `--no-interactive`. Delete the temp file afterwards. See
  `references/backend-cli.md`.

Either way the issue lands in the team's default entry state; do not force a state.

### 8. Success confirmation

```
Issue [ID] creada — [Linear URL]
```

Example: "Issue A2R-123 creada — https://linear.app/a2r/issue/A2R-123"

Take the identifier and URL from the backend's response — never build the URL from a
guessed identifier.

## Error Handling

Backend-independent errors:

| Error | Response |
|-------|----------|
| No backend available | "No veo forma de llegar a Linear: no hay MCP de Linear conectado ni linear-cli instalado. Instala el CLI (`npm i -g @schpet/linear-cli@latest` + `linear auth login`) o conecta el MCP de Linear, y lo retomamos." |
| Label not found | "No encontré el label '[X]'. Recuerda que los labels no llevan prefijo de grupo. Labels de tipo válidos: Bug, Feature, Tarea, Mejora, Spike" |
| Team not found | "No encontré el equipo 'A2R'. Verifica que apuntas al workspace correcto." |
| No hay ciclo activo | "No hay ciclo activo ahora mismo. El siguiente empieza el [fecha]. ¿La creo sin ciclo o la meto en el siguiente?" |
| Caso de uso no resoluble | "No puedo deducir el caso de uso desde el contexto. Indícame el caso (lista en la tabla de owners) o lo dejo como `Transversal` para discutir el lunes." |
| Caso sin owner (TBD) | "El caso '[X]' todavía no tiene owner asignado. Creo la issue con el label del caso y sin asignar." |
| Owner no resoluble | "No encontré el owner del caso '[X]' en la tabla de owners. Verifica el mapping o asigna manualmente." |
| Backend falla por infraestructura | Offer the other backend if available: "El [MCP/CLI] ha fallado ([detalle]). Tengo el otro disponible, ¿lo reintento por ahí?" |

Backend-specific errors (CLI versions, MCP prefixes and permissions) live in the two
backend reference files.

## A2R Configuration

### Team
- Name: A2R (pass it as the team on every call; with the CLI you can also set `LINEAR_TEAM_ID`)

### Workflows by project type
- Framework: Triage -> Backlog -> Todo -> In Progress -> In Review -> Validating -> Done (Canceled, Duplicate)
- Precio Cerrado: Backlog -> Todo -> In Progress -> In Review -> Done (Canceled, Duplicate)
- PoC: Backlog -> Todo -> In Progress -> Done (Canceled)
- Default: Framework (if type cannot be determined)

### Labels
Resolve against the live workspace on every run. Names carry no prefix. Reference in `references/label-taxonomy.md`.

### Estimation
Fibonacci scale: 0, 1, 2, 3, 5, 8 (max individual), 13, 21 (subtasks only).
- Criteria: architectural complexity, AI reliability, review/validation, integration surface
Detailed rules in `references/estimation-rules.md`.

### Cycles
- Weekly, starting Monday (`cycleDuration: 1`, `cycleStartDay: 1`)
- Cycle gaps happen: the team does not always chain cycles back to back. Never hardcode cycle numbers or dates — ask Linear

### Linear Triage Intelligence
The team is on the Business plan, so Linear pre-classifies what lands in Triage: it suggests assignee and labels and flags possible duplicates. When you create an issue that goes to Triage, do not fight those suggestions — this skill decides the case and the owner, and Linear adds the duplicate detection on top.

### Interaction
- Language: Spanish (Spain, tuteo)
- Write pattern: preview -> [Confirmar] / [Editar] / [Cancelar]
- Success: one-line summary + Linear URL

## Output Language

All user-facing output MUST be in Spanish (Spain, tuteo):
- Headers, messages, and responses in Spanish
- Linear state names remain in English (Todo, In Progress, In Review, Done, etc.)
- Label names remain as configured in Linear

## Notes

- The preview is mandatory: NEVER create without showing first
- If the dev cancels, confirm: "Creacion cancelada. Los datos no se han perdido por si quieres retomar."
- The backend is an implementation detail: the dev sees the same flow, the same preview and the same confirmation either way
