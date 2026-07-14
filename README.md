# A2RCrew Skills

Agent skills for [Claude Code](https://claude.com/claude-code) by the A2R team,
packaged as a Claude Code plugin marketplace where **each skill is its own
independently installable plugin**.

## Repository architecture: public repo + private mirror

This marketplace lives in **two repositories** that must stay in sync:

| Repo | Visibility | Purpose |
|---|---|---|
| [`A2RCrew/skills`](https://github.com/A2RCrew/skills) | Public | Source of truth. All development, PRs, and reviews happen here. |
| [`A2RCrew/a2r`](https://github.com/A2RCrew/a2r) | Private | Mirror consumed by the claude.ai organization marketplace sync (Cowork / web). claude.ai only syncs marketplaces from **private or internal** repos, so this mirror exists solely for that. |

> ⚠️ **Never commit directly to `A2RCrew/a2r`.** It is a read-only mirror of
> `main`. Any change pushed only there will be overwritten by the next sync.

### One-time setup per teammate

Clone the public repo and add the private mirror as a second remote:

```bash
git clone git@github.com:A2RCrew/skills.git
cd skills
git remote add private git@github.com:A2RCrew/a2r.git
```

### Publishing workflow (ALWAYS follow this)

1. Create a branch off `main`, make your changes, open a PR against
   `A2RCrew/skills`, and merge it.
2. Update your local `main` and **push to BOTH remotes**:

```bash
git checkout main
git pull origin main
git push private main        # ← keeps the claude.ai marketplace up to date
```

The claude.ai organization marketplace has auto-sync enabled on
`A2RCrew/a2r`, so members receive the update as soon as `private` is pushed.
If you forget the `git push private main`, the web marketplace serves stale
plugins even though GitHub shows your change as merged.

## Install

### Via claude.ai organization settings (Cowork / web)

Admins: **Ajustes de la organización → Plugins → Añadir plugins →
Sincronizar desde GitHub**, then:

1. Select `https://github.com/A2RCrew/a2r` (the **private mirror** — the
   public repo will be rejected).
2. Leave **Sincronizar automáticamente** enabled.
3. Set **Acceso predeterminado** to "Disponible para instalar" so members can
   install the plugins.

If the repo doesn't appear in the dropdown, grant the Claude GitHub App access
to `A2RCrew/a2r` (GitHub → Organization Settings → GitHub Apps → Claude →
Repository access).

### Via Claude Code plugin system (CLI)

```
/plugin marketplace add A2RCrew/skills
/plugin install <skill-name>@a2r
```

Each skill is its own plugin, so install only the ones you need — for example:

```
/plugin install a2r-brand-voice@a2r
/plugin install senior-code-reviewer@a2r
```

### Via npx skills CLI

```bash
npx skills add A2RCrew/skills
```

Install a specific skill:

```bash
npx skills add A2RCrew/skills --skill my-skill -a claude-code -y
```

Install globally (available in all projects):

```bash
npx skills add A2RCrew/skills -g
```

### List available skills

```bash
npx skills add A2RCrew/skills --list
```

## Marketplace configuration

The marketplace is defined by `.claude-plugin/marketplace.json` at the repo
root:

```json
{
  "name": "a2r",
  "owner": { "name": "A2RCrew", "email": "nacho@a2r.com" },
  "metadata": {
    "description": "A2R team agent skills for Claude Code and Cowork",
    "version": "1.0.0"
  },
  "plugins": [ ...one entry per skill... ]
}
```

| Field | Purpose |
|---|---|
| `name` | Marketplace identifier (kebab-case). Public-facing: users install with `/plugin install <skill>@a2r`. |
| `owner` | Required. `name` plus optional `email`. |
| `metadata` | Optional description/version for the marketplace itself. |
| `plugins` | One entry per plugin (see below). |

Each entry in `plugins`:

```json
{
  "name": "my-new-skill",
  "source": "./skills/my-new-skill",
  "description": "Short summary of what the skill does.",
  "category": "development",
  "tags": ["a2r"]
}
```

- `name` — must match the skill directory and the `name` in its `plugin.json`
  and SKILL.md frontmatter.
- `source` — relative path to the plugin root inside this repo.
- `category` / `tags` — optional, used for browsing/filtering.

Validate any change before pushing:

```bash
claude plugin validate .                      # marketplace manifest
claude plugin validate skills/<skill-name>/   # a single plugin
```

## Add a new plugin (skill) to the marketplace

1. Copy the template:

```bash
mkdir -p skills/my-new-skill
cp template/SKILL.md.template skills/my-new-skill/SKILL.md
```

2. Edit `skills/my-new-skill/SKILL.md`:
   - Set `name` to match the directory name (`my-new-skill`)
   - Write a clear `description`
   - Replace all placeholder sections

3. Add a plugin manifest at `skills/my-new-skill/.claude-plugin/plugin.json`:

```json
{
  "name": "my-new-skill",
  "description": "Short summary of what the skill does.",
  "version": "1.0.0",
  "author": { "name": "A2RCrew" }
}
```

4. Register it as a plugin in `.claude-plugin/marketplace.json` by adding an
   entry to the `plugins` array:

```json
{
  "name": "my-new-skill",
  "source": "./skills/my-new-skill",
  "description": "Short summary of what the skill does."
}
```

5. Validate:

```bash
claude plugin validate . && claude plugin validate skills/my-new-skill/
```

6. Open a PR against `A2RCrew/skills`, merge it, and then **sync the private
   mirror** (see [Publishing workflow](#publishing-workflow-always-follow-this)):

```bash
git checkout main && git pull origin main && git push private main
```

## Skill structure

Each skill lives in its own directory under `skills/` and is also its own plugin:

```
skills/
└── my-skill/
    ├── SKILL.md                     # Required — frontmatter + instructions
    ├── .claude-plugin/
    │   └── plugin.json              # Required — plugin manifest
    ├── scripts/                     # Optional — helper scripts
    ├── references/                  # Optional — additional docs
    └── assets/                      # Optional — templates, data files
```

### SKILL.md format

```yaml
---
name: my-skill
description: >
  What this skill does and when Claude should use it.
---

# My Skill

Instructions for Claude...
```

#### Required fields

| Field | Description |
|---|---|
| `name` | Lowercase, hyphens, numbers. Max 64 chars. Must match directory name. |
| `description` | What the skill does and when to use it. Max 1024 chars. |

#### Optional fields

| Field | Description |
|---|---|
| `argument-hint` | Autocomplete hint (e.g., `[filename]`) |
| `user-invocable` | Show in `/` menu (default: `true`) |
| `disable-model-invocation` | Prevent auto-loading (default: `false`) |
| `allowed-tools` | Space-separated list of pre-approved tools |
| `model` | Model override when skill is active |
| `context` | Set to `fork` to run in a subagent |
| `agent` | Subagent type when `context: fork` |

## Naming rules

- Lowercase letters, numbers, and hyphens only
- No spaces, underscores, or uppercase
- Must not start or end with a hyphen
- No consecutive hyphens (`--`)
- Directory name must match the `name` field

## Resources

- [Agent Skills specification](https://agentskills.io/specification)
- [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [skills.sh](https://skills.sh)
