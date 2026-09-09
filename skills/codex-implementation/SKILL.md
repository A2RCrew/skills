---
name: codex-implementation
description: >
  Ask Codex CLI (gpt-6-astra) to implement scoped code changes in the current repository, then
  have Claude inspect the resulting diff and verification. This is how gpt-6-astra is invoked for
  implementation work. Use when the user asks Claude to delegate implementation to Codex or
  gpt-6-astra, when the model-selection rubric routes the work to gpt-6-astra, or when a bounded task
  would benefit from another coding agent producing a patch.
---

# Codex Implementation

Use Codex as a separate implementation agent for bounded code changes. Claude remains
responsible for scoping the task, reviewing the diff, running or checking verification, and
explaining the final result.

Use this when the user asks for Codex or delegation, or when a bounded task would benefit
from a parallel implementation agent producing a patch. Do not let Codex commit, push,
deploy, or edit global config unless the user explicitly asked for that.

Codex has no access to this conversation or to Claude's tools. Everything it needs (goal,
decisions already made, constraints, files to look at) must be in the prompt.

## Workflow

1. Capture a baseline of the checkout (status, diff, untracked files) so later changes can be
   attributed to Codex or to the user.
2. Define the implementation scope: files or behavior to change, files to avoid, constraints,
   and verification commands.
3. Create a temporary artifact directory for the prompt, report, events, and logs.
4. Run `codex exec` with repo write access and an explicit model.
5. Check the exit code and the `Status:` line of the report before reading anything else.
6. Inspect `git status` and `git diff` against the baseline, and read any new untracked files
   Codex created (`git diff` won't show them).
7. Run the cheapest reliable verification yourself when practical.
8. Report what Codex changed, what Claude verified, and any remaining risks.

Use this command shape:

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-implementation.XXXXXX")"
PROMPT="$ARTIFACT_DIR/prompt.md"
REPORT="$ARTIFACT_DIR/report.md"
MODEL="gpt-6-astra"   # use the model the user asked for, if they named one

# Baseline: attribute later changes to Codex vs. pre-existing user work.
git status --porcelain > "$ARTIFACT_DIR/baseline.status"
git diff > "$ARTIFACT_DIR/baseline.diff"
git ls-files --others --exclude-standard > "$ARTIFACT_DIR/baseline.untracked"

# Write a self-contained prompt to $PROMPT, then run:
codex exec \
  -C "$PWD" \
  --add-dir "$ARTIFACT_DIR" \
  -s workspace-write \
  -m "$MODEL" \
  --json \
  -o "$REPORT" \
  - < "$PROMPT" \
  > "$ARTIFACT_DIR/events.jsonl" \
  2> "$ARTIFACT_DIR/stderr.log"
echo $? > "$ARTIFACT_DIR/exit_code"
```

Use `-s workspace-write` by default. Use `-s danger-full-access` only when the implementation
truly needs access outside the repo, app launch automation, simulator work, package manager
global state, or other machine-level operations.

Always pass `-m` explicitly. Default to `gpt-6-astra`; if the user asked for a specific model
or reasoning effort, use that instead (`-c model_reasoning_effort=<level>` for effort) and
name the configuration you used in the final report.

Codex runs can exceed the Bash tool's default timeout: pass an explicit long timeout, or run
the command in the background and read `$ARTIFACT_DIR/exit_code` when it appears. Run only one
Codex implementation at a time in a given checkout; parallel runs need separate git worktrees
so their edits don't collide.

## Completion Protocol

An existing `report.md` does not mean the task finished. Decide the outcome in this order:

1. `exit_code` missing → still running or killed; do not read the report as final.
2. `exit_code` non-zero, or no `turn.completed` event in `events.jsonl` → **failed**; read
   `stderr.log` and the tail of `events.jsonl` for the cause.
3. Otherwise use the `Status:` line Codex wrote at the top of the report: `completed`,
   `partial`, `blocked`, or `failed`. A report without a `Status:` line is treated as `partial`.

Attribute changes with the baseline: anything in `git diff` not present in `baseline.diff`, and
any untracked file not in `baseline.untracked`, is Codex's. Never revert changes that were in
the baseline.

To continue a `partial` or `blocked` run instead of starting over, take the `thread_id` from
the `thread.started` event and run `codex exec resume <thread_id> "<follow-up>"` with the same
flags (do not use `--ephemeral`, it disables resume).

## Prompt Requirements

Tell Codex:

- The exact implementation goal and acceptance criteria.
- The repo path and current branch context if relevant.
- Relevant context from the conversation: decisions already made, user preferences, constraints.
- Which existing patterns, files, or tests to inspect first.
- Files or behavior that must not be changed.
- That it must preserve unrelated user changes (name them if the baseline is non-empty).
- That it must not commit, push, deploy, or edit global config.
- Which decisions it may resolve on its own, and what counts as a blocker it should stop on.
- Which verification commands to run, or to explain why they were skipped.
- To start the report with `Status: completed | partial | blocked | failed`, then per
  acceptance criterion: met / not met and the evidence (command output, test name, file).

Keep the task bounded. If the requested work bundles several substantial changes, split it
into separate Codex runs or ask the user to choose the first scope.

## Example Prompt

```text
You are implementing a scoped change for Claude. You have no access to Claude's conversation
or tools; everything you need is below.

Repository: /absolute/path/to/repo
Artifact directory: /tmp/codex-implementation.xxxxxx

Goal:
- Add keyboard navigation to the command palette.

Acceptance criteria:
- ArrowUp and ArrowDown move the highlighted item.
- Enter selects the highlighted item.
- Escape closes the palette.
- Existing mouse behavior keeps working.

Context:
- The user prefers small components; do not introduce a new state library.
- Uncommitted user work exists in src/settings/*. Leave it untouched.

Constraints:
- Preserve unrelated user changes.
- Do not commit, push, deploy, or edit global config.
- Follow existing component and test patterns.
- You may choose test names and file layout. Stop and report `blocked` if the palette
  component cannot be found or the test runner is not installed.

Verification:
- Run the focused component tests if available.
- Otherwise run the nearest relevant typecheck or test command and explain the choice.

Report (write to the artifact directory as report.md):
- First line: Status: completed | partial | blocked | failed
- Per acceptance criterion: met / not met, with evidence
- Files changed
- Verification run and result
- Anything blocked or uncertain
```

## Review After Codex

Always inspect Codex's diff before telling the user the work is done. Revert only
Codex-created mistakes (changes absent from the baseline). If Codex leaves the repo in a worse
state or changes unrelated files, stop and report the issue with the diff summary.

If `codex` is not installed or the command fails, report the error and offer to implement the
change directly instead.
