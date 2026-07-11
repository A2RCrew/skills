---
name: codex-review
description: >
  Ask Codex CLI (gpt-5.6) for an independent code review of uncommitted changes, a branch
  diff, a commit, or a specific implementation. This is how gpt-5.6 is invoked for review
  work. Use when the user asks Claude to have Codex or gpt-5.6 review work, when the
  model-selection rubric calls for a gpt-5.6 review perspective, or when Codex should audit a
  diff, find bugs or regressions, or compare Claude's implementation against requirements. For
  a review by Claude itself, use the normal review process instead.
---

# Codex Review

Use Codex as an independent reviewer when the user wants a second-pass review or when a
change is broad enough that another agent's perspective is useful.

Prefer Claude's normal review process for small local checks. Do not delegate review just to
avoid reading the code yourself. Treat Codex's output as evidence, not authority.

## Workflow

1. Identify the review target: uncommitted changes, base branch, commit SHA, PR checkout, or
   specific files.
2. Create a temporary artifact directory for the Codex report.
3. Run `codex exec review` against that target.
4. Read Codex's report and verify important claims against the code before presenting them.

Use one of these command shapes:

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
REPORT="$ARTIFACT_DIR/report.md"
PROMPT="$ARTIFACT_DIR/prompt.md"

# Review staged, unstaged, and untracked changes.
codex exec -C "$PWD" review --uncommitted -o "$REPORT"

# Review current branch against a base branch.
codex exec -C "$PWD" review --base main -o "$REPORT"

# Review a single commit.
codex exec -C "$PWD" review --commit <sha> -o "$REPORT"

# Custom review instructions (write them to $PROMPT first).
codex exec -C "$PWD" review -o "$REPORT" - < "$PROMPT"
```

Use `codex exec review` rather than bare `codex review`: only the `exec` form takes
`-o`, which writes just the final review to `$REPORT` (stdout also carries session
headers and progress noise). Codex runs can exceed the Bash tool's default timeout:
pass an explicit long timeout, or run the command in the background and read
`$REPORT` when it exits.

These commands use the machine's Codex default model (`~/.codex/config.toml`); this skill
assumes that default is gpt-5.6 or a variant of it. If the local default is a different
model, pass `-m gpt-5.6` explicitly.

## Review Prompt

The target flags (`--uncommitted`, `--base`, `--commit`) cannot be combined with a custom
prompt — Codex rejects that invocation. Default to a target flag and Codex's built-in
review stance. When the review needs task-specific context (requirements, risky areas,
expected behavior, relevant tests, files Claude is unsure about), use the custom-prompt
form instead and name the target inside the prompt:

```text
Review the uncommitted changes in this repository (staged, unstaged, and untracked) for
bugs, regressions, missing tests, security issues, and requirement mismatches.

Context:
- <requirements, expected behavior, risky areas>

Prioritize findings over summary. For each finding include:
- severity
- file and line reference
- concrete failure mode
- suggested fix direction

Do not edit files. If there are no substantive findings, say so and name any residual test
gaps.
```

## Reporting Back

Before relaying a Codex finding, inspect the cited code or diff enough to decide whether the
finding is real. In the user-facing response, separate confirmed issues from Codex
suggestions you did not verify.

If Codex finds nothing, say that clearly and mention what review target it inspected.

If `codex` is not installed or the command fails, report the error and offer to review the
changes directly instead.
