# A2RCrew Skills

Agent skills for [Claude Code](https://claude.com/claude-code) by the A2R team.

## Install

### Via Claude Code plugin system

```
/plugin marketplace add A2RCrew/skills
/plugin install a2r-skills@a2r-skills
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

## Create a new skill

1. Copy the template:

```bash
cp -r template/SKILL.md skills/my-new-skill/SKILL.md
```

2. Edit `skills/my-new-skill/SKILL.md`:
   - Set `name` to match the directory name (`my-new-skill`)
   - Write a clear `description`
   - Replace all placeholder sections

3. Register it in `.claude-plugin/marketplace.json`:

```json
"skills": ["./skills/my-new-skill"]
```

4. Commit and push.

## Skill structure

Each skill lives in its own directory under `skills/`:

```
skills/
└── my-skill/
    ├── SKILL.md          # Required — frontmatter + instructions
    ├── scripts/          # Optional — helper scripts
    ├── references/       # Optional — additional docs
    └── assets/           # Optional — templates, data files
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
