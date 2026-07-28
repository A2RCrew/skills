# Backend: linear-cli

Mechanics for creating the issue with the `linear` CLI. Read this only if the CLI is
the selected backend (see "Backend selection" in SKILL.md).

**Requires:** linear-cli **2.3.0 or later**, authenticated (`linear auth login`).
Check with `linear --version`; upgrade with `npm i -g @schpet/linear-cli@latest`.
Version 2.0 renamed `issue list` to `issue mine` / `issue query`, so older versions
break the other A2R skills too.

## Name resolution

The CLI resolves names to IDs internally. What matters is passing the **exact** name.

| What | Command | Notes |
|------|---------|-------|
| Labels | `linear label list --all` | Names carry NO group prefix: the group is `Tipo`, the label is `Bug`. A prefixed name (`Tipo` + colon + `Bug`) fails to resolve. Accents resolve fine (`-l "Revisión de estilo"`). |
| Cycles | `linear cycle list --team A2R` | Only to show the dev which cycle is which. To assign, pass the relative reference: `--cycle now`, `--cycle next`, `--cycle previous`, a number or a name. |
| Users | `linear user list` | The owners table already carries Linear usernames, which is exactly what `--assignee` takes. Use this only to disambiguate (`luis` = Luis Anaya, `lguisado` = Luis Guisado). |
| Projects | `linear project list --team A2R` | Only for issues that belong to a scoped, dated project (PAU and similar). There are no per-case projects — never pass `--project "[Caso] X"`. |

If there is no active cycle, `--cycle now` errors out and the CLI reports the start
date of the next one. During a cycle gap, offer `--cycle next` or no cycle at all.

## Creation

Write the description to a temp file, then create the issue:

```bash
cat > /tmp/issue-desc.md <<'EOF'
[description in markdown]
EOF

linear issue create \
  -t "[title]" \
  --description-file /tmp/issue-desc.md \
  --team A2R \
  -l "Bug" \
  -l "Backend" \
  -l "Auth" \
  --estimate 3 \
  --cycle next \
  --assignee jordi \
  --no-interactive

rm /tmp/issue-desc.md
```

Notes on the command:

- `-l` is repeatable — one flag per label, and always include the case label in Framework
- `--description-file` avoids shell escape issues with markdown; delete the temp file afterwards
- `--cycle` takes `now`, `next`, `previous`, a number or a name. Omit it if the issue does not go into a cycle
- `--assignee` takes the owner's Linear **username** from the case owners table. Omit it if the case owner is TBD, or use the dev's override from the preview
- `--no-interactive` prevents the CLI from prompting for anything you did not pass
- Add `-p 1..4` when the priority is already clear (1 = Urgent)
- The team has issue templates (Bug report, Feature request, Tarea genérica, Tarea PoC), but since the skill writes the full description the template adds nothing. Verified on 2026-07-27: passing `--description-file` produces exactly that description, with no template content prepended

The CLI prints the identifier and URL of the created issue — use them for the success line.

## CLI-specific errors

| Error | Response |
|-------|----------|
| Label not found | "No encontré el label '[X]'. Recuerda que los labels no llevan prefijo de grupo. Labels de tipo válidos: Bug, Feature, Tarea, Mejora, Spike" |
| Project not found | "No encontré el proyecto '[X]'. Proyectos activos: [lista]" |
| Team not found | "No encontré el equipo 'A2R'. Verifica la configuración del workspace" |
| `issue list` / unknown option | "Tu linear-cli es anterior a la 2.0. Actualiza con `npm i -g @schpet/linear-cli@latest`." |
| Not authenticated | "linear-cli no está autenticado. Ejecuta `linear auth login`." |
| Any other CLI error | "Error de linear-cli: [detalle]. Verifica que está instalado (`linear --version`, mínimo 2.3.0) y autenticado (`linear auth login`)." |

If the CLI fails for a reason that is not the data (missing binary, broken auth, old
version) **and** the Linear MCP is available in the session, offer to retry through
the MCP instead of asking the dev to fix the install mid-flow.
