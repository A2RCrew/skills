---
name: codex-computer-use
description: >
  Ask Codex CLI (gpt-5.6) to run local app verification that needs computer use: browser
  automation, simulators, screenshots, app launching, or independent runtime inspection. This
  is how gpt-5.6 is invoked for computer-use work. Use when the user asks Claude to test a
  flow, verify UI behavior, inspect a running app, capture screenshots, or report
  confirmation and feedback about implemented behavior that benefits from computer use
  functionality.
---

# Codex Computer Use

Use Codex as a separate local verification agent when the task needs real UI interaction,
screenshots, simulator/browser/device state, or an independent runtime check outside Claude's
current context.

Do not use this for ordinary code reading, typechecking, linting, or tests Claude can run
directly. Launching apps, simulators, or browsers to verify the requested work is fine
without asking; ask first only if the run could disrupt the user's environment beyond that
(closing their apps, changing system settings, acting on real accounts or data).

## Workflow

1. Identify what to verify: the flow, UI behavior, or running app, and the expected outcome or
   acceptance criteria.
2. Confirm how to launch or reach the app (dev server already running, simulator, device, or
   browser URL) and note anything that must not be disrupted.
3. Create a temporary artifact directory for Codex's report and screenshots.
4. Run `codex exec` with the access level the verification needs.
5. After Codex exits, read its report and view the screenshots it captured (the Read tool
   renders images).
6. Re-check the key claims yourself when practical (re-run the flow, look at the screenshot).
7. Report what Codex observed, what Claude confirmed, and any remaining risks.

Use this command shape:

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-computer-use.XXXXXX")"
REPORT="$ARTIFACT_DIR/report.md"
PROMPT="$ARTIFACT_DIR/prompt.md"

# Write a self-contained prompt to $PROMPT, then run:
codex exec \
  -C "$PWD" \
  --add-dir "$ARTIFACT_DIR" \
  -s danger-full-access \
  -o "$REPORT" \
  - < "$PROMPT"
```

Use `-s danger-full-access` because launching apps, simulators, or browsers needs machine-level
access beyond the repo. Fall back to `-s workspace-write` when the verification stays inside
the repo. Tell Codex to save screenshots and logs into `$ARTIFACT_DIR`.

These commands use the machine's Codex default model (`~/.codex/config.toml`); this skill
assumes that default is gpt-5.6 or a variant of it. If the local default is a different
model, pass `-m gpt-5.6` explicitly.

Computer-use runs are slow and can exceed the Bash tool's default timeout: pass an explicit
long timeout, or run the command in the background and read `$REPORT` when it exits.

## Prompt Requirements

Tell Codex:

- The exact flow or behavior to verify and the expected outcome.
- How to launch or reach the app (command, URL, simulator, or device).
- Which screens, states, or interactions to exercise.
- To save screenshots and any logs into the artifact directory.
- What it must not disrupt: other open apps, real accounts, or system settings.
- That it must not commit, push, deploy, or edit global config.
- To write a concise report with what it observed, pass/fail per criterion, and screenshot
  paths.

Keep the check bounded. If the request covers several unrelated flows, split it into separate
Codex runs or ask the user to choose the first one.

## Example Prompt

```text
You are verifying a scoped behavior for Claude via computer use.

Repository: /absolute/path/to/repo
Artifact directory: /tmp/codex-computer-use.xxxxxx
App: dev server already running at http://localhost:3000

Verify:
- Command palette keyboard navigation works end to end.

Steps:
- Open http://localhost:3000 and launch the command palette.
- Press ArrowDown twice and confirm the highlight moves.
- Press Enter and confirm the highlighted item is selected.
- Press Escape and confirm the palette closes.

Capture:
- Save a screenshot of each state into the artifact directory.

Constraints:
- Do not disrupt other open apps, accounts, or system settings.
- Do not commit, push, deploy, or edit global config.

Report:
- Pass/fail per step
- Screenshot paths
- Anything blocked or uncertain
```

## Reporting Back

Before telling the user a behavior is verified, open the screenshots or logs Codex produced
and confirm they show what the report claims. In the user-facing response, separate what Codex
confirmed from what it could not check.

If Codex reports a failure, relay the concrete symptom and point to the screenshot that shows
it.

If `codex` is not installed or the command fails, report the error and offer to verify the
change directly instead.
