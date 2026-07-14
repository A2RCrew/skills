# A2RCrew Skills Repository

## Project structure

```
skills/          — Agent skills; each subdirectory is also its own plugin
  <skill>/
    SKILL.md                     — the skill (auto-discovered at plugin root)
    .claude-plugin/plugin.json   — plugin manifest for this skill
template/        — SKILL.md template for creating new skills
.claude-plugin/  — Marketplace configuration (marketplace.json)
```

## Public repo + private mirror

This marketplace lives in TWO repos that must stay in sync:

- `A2RCrew/skills` (public, remote `origin`) — source of truth; all PRs and
  development happen here.
- `A2RCrew/a2r` (private, remote `private`) — read-only mirror consumed by the
  claude.ai organization marketplace sync (claude.ai only accepts private or
  internal repos). Never commit directly to it.

**IMPORTANT — after every merge to `main`, sync the mirror:**

```bash
git checkout main && git pull origin main && git push private main
```

If the `private` remote is missing locally, add it first:

```bash
git remote add private git@github.com:A2RCrew/a2r.git
```

Skipping this step leaves the claude.ai marketplace stale even though the
public repo shows the change as merged.

## Marketplace model

This repo is a Claude Code plugin marketplace. Each skill is packaged as an
independently installable plugin (one plugin = one skill), so users can install
just the skills they need:

```
/plugin marketplace add A2RCrew/skills
/plugin install <skill-name>@a2r
```

Each `skills/<skill>/` directory is a plugin root. Its `SKILL.md` lives at the
plugin root and is auto-discovered (no nested `skills/` folder needed). The
`.claude-plugin/plugin.json` manifest carries the plugin metadata.

## Creating a new skill

1. Copy `template/SKILL.md` into `skills/<skill-name>/SKILL.md`
2. The directory name MUST match the `name` field in frontmatter
3. Fill in all required frontmatter fields and replace placeholder content
4. Add `skills/<skill-name>/.claude-plugin/plugin.json` (see below)

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

## Plugin manifest (`plugin.json`)

Each skill needs `skills/<skill-name>/.claude-plugin/plugin.json`:

```json
{
  "name": "my-new-skill",
  "description": "Short summary of what the skill does.",
  "version": "1.0.0",
  "author": { "name": "A2RCrew" },
  "keywords": ["a2r", "..."]
}
```

- `name` MUST match the skill directory name and the SKILL.md frontmatter `name`.
- Do NOT add a `skills` field here — the root `SKILL.md` is auto-discovered.

## When adding skills to marketplace

After creating a new skill and its `plugin.json`, register it as a plugin in
`.claude-plugin/marketplace.json` by adding an entry to the `plugins` array:

```json
{
  "name": "my-new-skill",
  "source": "./skills/my-new-skill",
  "description": "Short summary of what the skill does.",
  "category": "development",
  "tags": ["a2r"]
}
```

Then validate before committing:

```bash
claude plugin validate . && claude plugin validate skills/my-new-skill/
```

## Publishing checklist

1. Branch off `main`, make changes, open a PR against `A2RCrew/skills`
2. Run `claude plugin validate .` (and per-plugin validation if manifests changed)
3. Merge the PR
4. Sync the private mirror: `git checkout main && git pull origin main && git push private main`

## Language

- Skills can be written in English or Spanish
- README and repo documentation are in English
