---
name: codex-computer-use
description: >
  Ask Codex CLI (gpt-6-astra) to run local app verification that needs computer use: browser
  automation, simulators, screenshots, app launching, or independent runtime inspection. This
  is how gpt-6-astra is invoked for computer-use work. Use when the user asks Claude to test a
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

Codex has no access to this conversation or to Claude's tools. The flow, expected outcome,
and how to reach the app must be in the prompt.

## Preflight: Which Tool Drives the UI

`-s danger-full-access` widens what Codex may touch; it does not give it a browser or desktop
driver. Before running, identify the backend Codex will actually use, and put it in the prompt:

- `codex mcp list` — look for a browser or desktop automation server (Playwright, Chrome
  DevTools, or similar). Web flows without one of these are usually not verifiable.
- Shell tools available on the machine: `xcrun simctl` (iOS simulator), `adb` (Android),
  `screencapture` and `osascript` (macOS desktop), `open`.

If no suitable backend exists, do not run the verification. Tell the user what is missing and
offer to verify the change directly instead.

## Workflow

1. Identify what to verify: the flow, UI behavior, or running app, and the expected outcome or
   acceptance criteria.
2. Confirm how to launch or reach the app (dev server already running, simulator, device, or
   browser URL) and note anything that must not be disrupted.
3. Run the preflight above and pick the backend.
4. Create a temporary artifact directory for the prompt, report, screenshots, events, and logs.
5. Run `codex exec` with the access level the verification needs and an explicit model.
6. Check the exit code and the `Status:` line of the report before reading anything else.
7. View the screenshots Codex captured (the Read tool renders images) and re-check the key
   claims yourself when practical.
8. Report what Codex observed, what Claude confirmed, and any remaining risks.

Use this command shape:

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-computer-use.XXXXXX")"
PROMPT="$ARTIFACT_DIR/prompt.md"
REPORT="$ARTIFACT_DIR/report.md"
MODEL="gpt-6-astra"   # use the model the user asked for, if they named one
git status --porcelain > "$ARTIFACT_DIR/baseline.status"   # verification must not edit the product

# Write a self-contained prompt to $PROMPT, then run:
codex exec \
  -C "$PWD" \
  --add-dir "$ARTIFACT_DIR" \
  -s danger-full-access \
  -m "$MODEL" \
  --json \
  -o "$REPORT" \
  - < "$PROMPT" \
  > "$ARTIFACT_DIR/events.jsonl" \
  2> "$ARTIFACT_DIR/stderr.log"
echo $? > "$ARTIFACT_DIR/exit_code"
```

Use `-s danger-full-access` because launching apps, simulators, or browsers needs machine-level
access beyond the repo. Fall back to `-s workspace-write` when the verification stays inside
the repo. Tell Codex to save screenshots and logs into `$ARTIFACT_DIR`.

Always pass `-m` explicitly. Default to `gpt-6-astra`; if the user asked for a specific model
or reasoning effort, use that instead (`-c model_reasoning_effort=<level>` for effort) and
name the configuration you used in the final report.

Computer-use runs are slow and can exceed the Bash tool's default timeout: pass an explicit
long timeout, or run the command in the background and read `$ARTIFACT_DIR/exit_code` when it
appears.

## Completion Protocol

An existing `report.md` does not mean the verification finished. Decide the outcome in this
order:

1. `exit_code` missing → still running or killed; do not read the report as final.
2. `exit_code` non-zero, or no `turn.completed` event in `events.jsonl` → **failed**; read
   `stderr.log` and the tail of `events.jsonl` for the cause.
3. `git status --porcelain` differs from `baseline.status` → Codex modified the product during
   verification; report that, discard those edits, and treat the run as invalid.
4. Otherwise use the `Status:` line at the top of the report: `completed`, `partial`,
   `blocked`, or `failed`. A report without a `Status:` line is treated as `partial`.

A criterion counts as verified only if its evidence is a screenshot, log, or command output of
the running app. "Verified by reading the code" is `blocked`, not `completed`.

To continue a `partial` or `blocked` run, take the `thread_id` from the `thread.started` event
and run `codex exec resume <thread_id> "<follow-up>"`.

## Prompt Requirements

Tell Codex:

- The exact flow or behavior to verify and the expected outcome.
- How to launch or reach the app (command, URL, simulator, or device).
- Which backend to use (the MCP server or shell tools found in preflight).
- Which screens, states, or interactions to exercise.
- To save a screenshot of each intermediate state, not only the final one: a final screenshot
  shows appearance, not that keyboard, focus, or a transition worked.
- To save screenshots and any logs into the artifact directory.
- What it must not disrupt: other open apps, real accounts, or system settings.
- That it must not edit the product under test, commit, push, deploy, or edit global config.
- That if a needed capability is missing (no browser driver, simulator won't boot, app won't
  start), it must report `blocked` with the concrete gap, not infer the result from code.
- To start the report with `Status: completed | partial | blocked | failed`, then per
  criterion: pass / fail / not checked, with the screenshot or log path as evidence.

Keep the check bounded. If the request covers several unrelated flows, split it into separate
Codex runs or ask the user to choose the first one.

## Example Prompt

```text
You are verifying a scoped behavior for Claude via computer use. You have no access to
Claude's conversation or tools; everything you need is below.

Repository: /absolute/path/to/repo
Artifact directory: /tmp/codex-computer-use.xxxxxx
App: dev server already running at http://localhost:3000
Backend: use the Playwright MCP server for browser control.

Verify:
- Command palette keyboard navigation works end to end.

Steps:
- Open http://localhost:3000 and launch the command palette.
- Press ArrowDown twice and confirm the highlight moves.
- Press Enter and confirm the highlighted item is selected.
- Press Escape and confirm the palette closes.

Capture:
- Save a screenshot after each step into the artifact directory (01-open.png,
  02-arrowdown.png, ...). Do not rely on a single final screenshot.

Constraints:
- Do not edit the product under test; only observe it.
- Do not disrupt other open apps, accounts, or system settings.
- Do not commit, push, deploy, or edit global config.
- If the browser driver is unavailable or the app does not load, stop and report `blocked`
  with the exact error. Do not infer results from the source code.

Report (write to the artifact directory as report.md):
- First line: Status: completed | partial | blocked | failed
- Pass / fail / not checked per step, with the screenshot path as evidence
- Anything blocked or uncertain
```

## Reporting Back

Before telling the user a behavior is verified, open the screenshots or logs Codex produced
and confirm they show what the report claims. In the user-facing response, separate what Codex
confirmed with evidence from what it could not check, and name the model and backend used.

If Codex reports a failure, relay the concrete symptom and point to the screenshot that shows
it.

If `codex` is not installed or the command fails, report the error and offer to verify the
change directly instead.
