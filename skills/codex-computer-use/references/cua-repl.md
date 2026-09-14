# Bundled cua_repl on macOS

Read this for Codex CLI using the Computer Use bundle from the ChatGPT desktop app.
The preferred web route is connected Chrome, then the built-in browser, both through
this MCP. Native Chrome and capture limitations were reported in a macOS session on
2026-09-14 with `gpt-6-astra`; treat them as compatibility notes, not universal API
contracts or reasons to skip the preferred browser integrations.

## Discover and initialize

`codex mcp list --json` avoids the wide human-readable table. Look for enabled
`cua_repl`/Computer Use capabilities, not only Playwright or Chrome DevTools.
`Auth Unsupported` alone is not a failed app-approval check. Inspect the actual tool
result and use `codex features list | rg 'computer_use|browser_use'` as an additional
configuration check. Do not assume enabling a flag installs a backend or grants access.

Within the child, follow the exposed `cua_repl` instructions. A first call should be
exactly one documented entrypoint. If inventory is needed:

```javascript
await cua.getState();
```

Read its result before the next call. For a known URL, start with the named Chrome
integration directly; the default policy already selects the browser:

```javascript
let tab = await cua.createBrowserTab("chrome", "http://localhost:3000", {
  sessionName: "🔎 UI verification"
});
```

If Chrome's integration is unavailable, attempt the same target through the built-in
browser, subject to the permission and session conditions below:

```javascript
let fallbackTab = await cua.createBrowserTab("iab", "http://localhost:3000", {
  visible: true
});
```

These are separate alternatives/calls, not one bootstrap script. Replace the URL with
the task's actual target and read the returned API before taking actions. If the task
names an existing tab, follow the runtime's tab-resolution instructions instead of
creating a replacement. Do not start with generic `cua.getBrowser()` and leave browser
selection implicit. An empty generic inventory is not enough to conclude that a
documented named entrypoint will work or fail; make a bounded attempt and record its
actual result. Do not retry after an explicit permission denial.

The installed `unified-computer-use` plugin launches `@oai/cua-repl` from the desktop
app and exposes `js` through MCP. Its runtime supplies API instructions. It can expose
accessibility, screenshots, and Playwright-style browser operations together; those
operations do not imply a standalone Playwright backend. Do not copy absolute paths
from another machine or force the older `node_repl`/`@oai/sky` integration because a
legacy plugin called `computer-use` is disabled. Report a missing current runtime.

## Browser fallback and session boundaries

Connected Chrome requires the official extension enabled in the intended profile and
a working desktop connection. Chrome merely being open is insufficient. For an
unavailable connection, record the error and attempt `iab`; do not spend the task
installing extensions, changing profiles, or reconfiguring the host without a request.

The built-in browser has a separate profile and does not inherit Chrome's cookies,
login, tabs, or in-progress form. Confirm the intended account and starting state there.
Use an already authorized login method if needed; otherwise return the concrete login
prerequisite. Do not import credentials or substitute another account. When the task
requires one exact Chrome tab/session, state that the fallback cannot verify that
requirement instead of reporting equivalent coverage.

Distinguish a disconnected browser or unsupported operation from a site/app/action
permission denial. Do not use `iab` or native app control to circumvent denied access.
Before switching after a possible mutation, inspect its outcome or request the missing
state; do not submit the same operation again speculatively.

For both integrations, keep track of the task-owned tabs and preserve user tabs. Use
the runtime's ownership/cleanup instructions and close only positively identified task
tabs, unless the requested result is to leave them open. Record the actual surface as
`cua_repl/chrome` or `cua_repl/iab` and any fallback reason in the final report.

## Native Chrome: explicitly authorized alternative

Native Chrome is distinct from connected Chrome and is not the automatic fallback
for empty browser inventory. Use it only for a native-control task or when the handoff
explicitly authorizes this alternative after the preferred browser routes fail:

```javascript
let chrome = await cua.getApp("com.google.Chrome");
```

After app access succeeds:

1. Inspect the current window/profile. Use a new task-owned tab (Cmd+T) and the omnibox
   (Cmd+L) through the returned app API. Follow observed UI state after each short action
   group. Do not navigate or overwrite existing user tabs.
2. Record enough window/tab identity to find the task's tab again. Avoid shortcuts that
   might affect a different tab after a focus change. At cleanup, close only the tab
   created by the task, only when positively identified and the requested final state
   does not require leaving it open. Never quit the user's browser as cleanup.
3. Report the backend as native Chrome through `cua_repl`, not browser DOM/CDP control.
   Native control does not imply DOM access, isolated cookies, or full-page screenshots.

This alternative can solve missing browser integration. It does not bypass app denial, website
restrictions, or a requirement to use a particular isolated profile. If the required
profile cannot be reached without disrupting user state, report the concrete blocker.

## Approval in unattended exec

The error `Computer Use was not approved to use Google Chrome` indicates an app-access
block. A running MCP server, `-s danger-full-access`, and macOS Screen Recording and
Accessibility permissions do not grant that approval. Non-interactive `codex exec`
cannot be assumed to present or answer the app's permission UI.

Recovery:

1. Return `blocked`, preserving the exact app ID, error, and `thread_id` obtained from
   `thread.started`. State that app approval is needed, not an MCP OAuth login.
2. Have the user approve the requested app through ChatGPT's Computer Use permission
   controls. Official documentation describes **Settings > Computer use** and an
   **Always allow** option for future tasks. Persistent approval is a user choice;
   request only the access needed. If approval already exists, diagnose whether the
   child shares the expected host/configuration rather than asking for it again.
3. Resume the exact thread with fresh output files after approval is resolved. Re-check
   app access and current UI state. If the installed host cannot apply that approval
   to the CLI session, report the integration gap instead of looping.

The session report described manually editing
`~/.codex/computer-use/sessions/<thread_id>.toml` to persist an app allowance. This
per-thread storage was not established as a supported configuration interface by the
official documentation reviewed. Do not create or patch approval-state files to make
a denied tool call succeed, or add such a step to the orchestration script. Use the
supported approval surface. The skill does not modify the user's Computer Use settings.

See [official Computer Use permissions](https://learn.chatgpt.com/docs/computer-use#permissions-and-approvals)
for the distinction between OS permissions, app approval, and shell/file permissions.

## Authentication and unexplained changes

State the intended browser profile/account and login plan in the prompt. A new Chrome
tab generally shares its profile's state; it is not a fresh authenticated test context.
If a login screen appears, record it and resolve the agreed login prerequisite before
claiming the target flow was tested. Keep tokens/passwords out of prompts and reports.

If the app becomes logged in, navigates, or otherwise changes without a recorded Codex
action, mark an **external state change, cause unknown** unless evidence identifies the
cause. Record the before/after state, time or action sequence, and affected criteria.
Re-establish the starting state and repeat affected steps when feasible. Otherwise mark
those findings uncertain/not checked. Do not casually attribute the change to the user.

## Capture limits and evidence

A native `<select>` popup caused `getScreenshot` to report `Screenshot unavailable for
/Applications/Google Chrome.app` in the reported session. If capture fails:

- Preserve the exact error and current accessibility tree when available. Accessibility
  evidence can substantiate options, selected values, or focus only if the tree exposes
  those states. It cannot establish colors, spacing, or other visual properties.
- Dismiss the popup with Escape when appropriate, inspect the settled UI, and retry a
  screenshot. Missing visual evidence remains a limitation for visual criteria.
- Do not switch to an unapproved capture mechanism after a permission denial. Follow
  the active backend's rules for exporting observations to local artifacts.

Native screenshots may cover only the window/viewport. Do not claim a full-page capture
unless the backend actually produced one. When assembling scrolled captures, retain the
originals, record their order/overlap, and label the result **composite of multiple
captures**, with source paths. Note sticky headers, layout changes, and content movement;
these images do not depict a single instant or prove off-screen interaction.
