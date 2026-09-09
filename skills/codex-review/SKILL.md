---
name: codex-review
description: >
  Ask Codex CLI (gpt-6-astra) for an independent code review of uncommitted changes, a branch
  diff, a commit, or a specific implementation. This is how gpt-6-astra is invoked for review
  work. Use when the user asks Claude to have Codex or gpt-6-astra review work, when the
  model-selection rubric calls for a gpt-6-astra review perspective, or when Codex should audit a
  diff, find bugs or regressions, or compare Claude's implementation against requirements. For
  a review by Claude itself, use the normal review process instead.
---

# Codex Review

Use Codex as an independent reviewer when the user wants a second-pass review or when a
change is broad enough that another agent's perspective is useful.

Prefer Claude's normal review process for small local checks. Do not delegate review just to
avoid reading the code yourself. Treat Codex's output as evidence, not authority.

Codex has no access to this conversation or to Claude's tools. Requirements, decisions, and
risky areas it should know about must be in the prompt.

## Workflow

1. Identify the review target: uncommitted changes, base branch, commit SHA, PR checkout, or
   specific files.
2. Create a temporary artifact directory and snapshot `git status --porcelain` (a review must
   not change the checkout).
3. Run `codex exec review` against that target with an explicit model.
4. Check the exit code and the `Status:` line of the report, then confirm `git status` is
   unchanged.
5. Read Codex's report and verify important claims against the code before presenting them.

Use one of these command shapes:

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
PROMPT="$ARTIFACT_DIR/prompt.md"
REPORT="$ARTIFACT_DIR/report.md"
MODEL="gpt-6-astra"   # use the model the user asked for, if they named one
git status --porcelain > "$ARTIFACT_DIR/baseline.status"

run_review() {
  codex exec -C "$PWD" -m "$MODEL" --json -o "$REPORT" review "$@" \
    > "$ARTIFACT_DIR/events.jsonl" 2> "$ARTIFACT_DIR/stderr.log"
  echo $? > "$ARTIFACT_DIR/exit_code"
}

# Review staged, unstaged, and untracked changes.
run_review --uncommitted

# Review current branch against a base branch.
run_review --base main

# Review a single commit.
run_review --commit <sha>

# Custom review instructions (write them to $PROMPT first).
run_review - < "$PROMPT"
```

Use `codex exec review` rather than bare `codex review`: only the `exec` form takes
`-o`, which writes just the final review to `$REPORT`, and `--json`, which sends the event
stream to `events.jsonl` instead of mixing progress noise into the review.

Always pass `-m` explicitly. Default to `gpt-6-astra`; if the user asked for a specific model
or reasoning effort, use that instead (`-c model_reasoning_effort=<level>` for effort) and
name the configuration you used when reporting back.

Codex runs can exceed the Bash tool's default timeout: pass an explicit long timeout, or run
the command in the background and read `$ARTIFACT_DIR/exit_code` when it appears.

## Completion Protocol

An existing `report.md` does not mean the review finished. Decide the outcome in this order:

1. `exit_code` missing → still running or killed; do not read the report as final.
2. `exit_code` non-zero, or no `turn.completed` event in `events.jsonl` → **failed**; read
   `stderr.log` and the tail of `events.jsonl` for the cause.
3. `git status --porcelain` differs from `baseline.status` → Codex edited files during a
   review; report that and discard the review's edits before anything else.
4. Otherwise, for custom-prompt reviews use the `Status:` line at the top of the report:
   `completed`, `partial`, or `blocked`. Built-in reviews (`--uncommitted`, `--base`,
   `--commit`) have no `Status:` line; treat a normal exit as `completed`.

To continue a `partial` or `blocked` review, take the `thread_id` from the `thread.started`
event and run `codex exec resume <thread_id> "<follow-up>"`.

## Review Prompt

The target flags (`--uncommitted`, `--base`, `--commit`) cannot be combined with a custom
prompt — Codex rejects that invocation. Default to a target flag and Codex's built-in
review stance. When the review needs task-specific context (requirements, risky areas,
expected behavior, relevant tests, files Claude is unsure about), use the custom-prompt
form instead and name the target inside the prompt:

```text
You are reviewing code for Claude. You have no access to Claude's conversation or tools;
everything you need is below.

Review the uncommitted changes in this repository (staged, unstaged, and untracked) for
bugs, regressions, missing tests, security issues, and requirement mismatches.

Context:
- <requirements, expected behavior, decisions already made, risky areas>

Prioritize findings over summary. For each finding include:
- severity
- file and line reference
- concrete failure mode
- suggested fix direction

Do not edit files. Do not run commands that modify the repository. If you cannot inspect
something you need (missing file, tool, or permission), say so as a blocker instead of
guessing.

Start the report with `Status: completed | partial | blocked`. If there are no substantive
findings, say so and name any residual test gaps.
```

## Reporting Back

Before relaying a Codex finding, inspect the cited code or diff enough to decide whether the
finding is real. In the user-facing response, separate confirmed issues from Codex
suggestions you did not verify.

If Codex finds nothing, say that clearly and mention what review target it inspected.

If `codex` is not installed or the command fails, report the error and offer to review the
changes directly instead.
