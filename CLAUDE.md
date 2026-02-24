# A2RCrew Skills Repository

## Project structure

```
skills/          — Agent skills (each in its own subdirectory)
template/        — SKILL.md template for creating new skills
.claude-plugin/  — Marketplace configuration
```

## Creating a new skill

1. Copy `template/SKILL.md` into `skills/<skill-name>/SKILL.md`
2. The directory name MUST match the `name` field in frontmatter
3. Fill in all required frontmatter fields and replace placeholder content

## Naming conventions

- Skill names: lowercase letters, numbers, and hyphens only
- Max 64 characters
- Must not start or end with a hyphen
- No consecutive hyphens (`--`)
- No spaces, underscores, or uppercase letters
- Directory name must match the `name` frontmatter field exactly

## Frontmatter validation

Every SKILL.md must have at minimum:

- `name` — matches directory name, follows naming rules above
- `description` — non-empty, max 1024 chars, explains what the skill does AND when to use it

## When adding skills to marketplace

After creating a new skill, add its path to `.claude-plugin/marketplace.json` in the `skills` array:

```json
"skills": ["./skills/my-new-skill"]
```

## Language

- Skills can be written in English or Spanish
- README and repo documentation are in English
