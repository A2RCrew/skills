# Backend: Linear MCP

Mechanics for creating the issue through the Linear MCP server. Read this only if the
MCP is the selected backend (see "Backend selection" in SKILL.md).

**Requires:** a Linear MCP server connected in the session. Nothing to install and no
version to check — if the tools are listed, the connection is authenticated.

## Tool names and prefixes

MCP tool names are prefixed with the server name, which depends on how the dev connected
Linear. This file names tools by their **base name**; prefix them with whatever the
session shows:

| Connection | Prefix | Example |
|------------|--------|---------|
| claude.ai Linear connector | `mcp__claude_ai_Linear__` | `mcp__claude_ai_Linear__save_issue` |
| Official remote MCP added as `linear` | `mcp__linear__` | `mcp__linear__save_issue` |
| Added as `linear-server` | `mcp__linear-server__` | `mcp__linear-server__save_issue` |

Never guess a prefix: use the exact tool names available in the session. If the tools are
listed but calling one is blocked, the server name is missing from the skill's
`allowed-tools` — tell the dev to add `mcp__<server-name>` there, and offer the CLI
meanwhile.

## Name resolution

The MCP accepts human-readable names for most fields, so resolution is mostly the same
work as the CLI — with two exceptions flagged below.

| What | Tool | Notes |
|------|------|-------|
| Labels | `list_issue_labels({ team: "A2R" })` | Pass label **names** in `labels` as an array. Names carry NO group prefix: the group is `Tipo`, the label is `Bug`. |
| Team | `list_teams({ query: "A2R" })` | `save_issue` takes the team **name**, so `team: "A2R"` is enough. You still need the team **ID** for cycles — see below. |
| Cycles | `list_cycles({ teamId: "<uuid>", type: "current" \| "next" \| "previous" })` | ⚠️ `teamId` is a real ID, not the name — get it from `list_teams` first. ⚠️ `save_issue.cycle` does **not** accept `now`/`next`: resolve the cycle first and pass its number or ID. |
| Users | `list_users({ team: "A2R", query: "<username>" })` | ⚠️ `save_issue.assignee` takes an ID, display name, email or `"me"` — **not** necessarily the Linear username in the owners table. Look the username up and pass the returned user ID. |
| Projects | `list_projects({ team: "A2R" })` | Only for scoped, dated projects (PAU and similar). There are no per-case projects. |

If `list_cycles` returns nothing for `type: "current"`, there is no active cycle: query
`type: "next"` and offer that cycle or no cycle at all.

## Creation

One call, no temp file and no shell escaping — pass the markdown description directly
with literal newlines (never `\n` escape sequences):

```
save_issue({
  team: "A2R",                       // required on create
  title: "El redirect de login falla después de OAuth callback",
  description: "<markdown, literal newlines>",
  labels: ["Bug", "Backend", "Auth"],
  estimate: 3,
  cycle: "12",                       // number/name/ID resolved via list_cycles — NOT "next"
  assignee: "<user id from list_users>",
  priority: 1                        // optional, only when clear: 0=None 1=Urgent 2=High 3=Medium 4=Low
})
```

Notes on the call:

- **Never pass `id`.** `id` turns `save_issue` into an update of an existing issue. Creating requires `team` + `title` and no `id`
- `labels` is a single array, not repeated arguments, and it **replaces** the whole label set — include every label the preview showed (type + areas + client + case)
- Omit `cycle` if the issue does not go into a cycle; omit `assignee` if the case owner is TBD, or use the dev's override from the preview
- Omit `estimate` (or pass `null`) for no estimate. `0` is a real estimate only on teams that allow zero estimates
- Do not pass `state`: let the issue land in the team's default entry state (Triage/Backlog) so Linear Triage Intelligence can do its pass
- The response carries the identifier and URL of the created issue — use them for the success line

## MCP-specific errors

| Error | Response |
|-------|----------|
| Label not found / not resolved | "No encontré el label '[X]'. Recuerda que los labels no llevan prefijo de grupo. Labels de tipo válidos: Bug, Feature, Tarea, Mejora, Spike" |
| Team not found | "No encontré el equipo 'A2R' en el workspace de Linear conectado. Verifica que el MCP apunta al workspace correcto." |
| Cycle not resolved | "No pude resolver el ciclo. El MCP no acepta `now`/`next`: lo busco con `list_cycles` y te digo el número." |
| Assignee not resolved | "No pude resolver a '[X]' como usuario de Linear. Busco el usuario por nombre y uso su ID, o creo la issue sin asignar." |
| Auth / connection error | "El MCP de Linear ha fallado la autenticación. Reconecta el servidor, o lo creo con linear-cli si lo tienes instalado." |
| Tool blocked by permissions | "El MCP de Linear está conectado pero la skill no tiene permiso para usarlo. Añade `mcp__<servidor>` a `allowed-tools`. ¿Lo creo con el CLI mientras tanto?" |

If the MCP fails for a reason that is not the data (auth, connection, permissions) **and**
linear-cli is installed, offer to retry through the CLI instead of stopping the flow.
