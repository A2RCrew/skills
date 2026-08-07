# A2R product-video — recording the app with Playwright

Goal: capture the **viewport only** (no browser chrome), already logged in, with a
visible cursor, so the raw footage drops straight into Remotion.

## Project setup (throwaway, outside this repo)

```bash
mkdir a2r-video && cd a2r-video && npm init -y && npm pkg set type=module
npm i playwright-core          # uses system Chrome via channel:'chrome'
npx playwright install ffmpeg  # recordVideo REQUIRES Playwright's own ffmpeg
```

Copy `assets/playwright/record-lib.mjs` and `login-once.mjs` here. Or just run
`bash assets/setup/check-deps.sh <this-dir> <remotion-dir>` to set up and verify
every dependency at once.

## Auth (credential-safe)

A2R apps typically keep the session in **localStorage, not cookies** — so copying
a Chrome profile does NOT transfer the session. Instead:

1. `node login-once.mjs ./chrome-auth https://<app-url>` opens a Chrome window.
2. **The user logs in once, manually.** Claude never types credentials.
3. The session persists in `./chrome-auth` and is reused by every record run.

Reusing a persistent context also means the app behaves exactly as for the user.

## Explore before scripting

You don't know the DOM. First run a short script that logs in (reuses
`./chrome-auth`), navigates the module, and dumps buttons / inputs / roles /
labels + a screenshot. Prefer robust locators: `getByRole`, `getByLabel`,
`getByPlaceholder`, visible text. For icon-only controls, match by column header
position or `aria-label`.

## Recording

Use `record-lib.mjs`:

```js
import { launchContext, sleep, makeTimeline, glide, glideClick, typeSlow, closeAndGetVideo } from "./record-lib.mjs";
const { context, page } = await launchContext("./chrome-auth", "./recordings/flow");
const tl = makeTimeline();
await page.goto("https://<app>/<module>", { waitUntil: "networkidle" });
await sleep(3000); tl.mark("landing");
await glideClick(page, page.getByRole("button", { name: "…" })); tl.mark("step2");
// … drive the real flow, mark each milestone …
const video = await closeAndGetVideo(context, page);
// write { video, marks: tl.marks } to a json — Remotion uses the marks for caption timing
```

Key points:

- `launchContext` records at 1920×1080, viewport-only — **no browser UI in the file**.
- The virtual cursor + click ripple are injected automatically; use `glide`/
  `glideClick` (not raw `.click()`) so movement is visible and human.
- `makeTimeline().mark(name)` records ms offsets — these become your caption times.
- Deliberate pacing: small `sleep`s between actions read better than instant jumps.

## Sensitive data: record clean

If the video must hide real/sensitive data (asked in Paso 0), the best defence is
to never capture it: use **demo / anonymized data**, a test tenant, or scroll past
sensitive rows. Avoid opening screens with client PII you don't need. Only if
something sensitive is unavoidable in a fixed region, mask it later with the
`Redaction` overlay (see `references/remotion.md`); if it moves, trim the moment.

## DRY-run before anything destructive

If the flow triggers a **real, irreversible or costly** action (creating a job,
spending API credits, sending, publishing), gate the submit behind a flag and do
a **DRY run first** (fill everything, screenshot, but DON'T submit). Verify the
screenshots, then run for real. **Get explicit user confirmation before the real
destructive action** — it happens in their production account.

## Async waits

If the module queues work, poll the app (headless is fine) until it reaches the
"done" state, writing status to a file. Record the "done"/result moment in a
short second clip. Bridge the wait in Remotion with the Interstitial scene — never
record real dead time.

## Documents

If the module consumes/produces a document, download it (Playwright download
event → `saveAs`) and run `assets/render/doc-to-images.sh` to get page PNGs for a
DocScroll scene. Show the source before the upload and/or the result at the end.

## Safety checklist

- Never type credentials; the user logs in manually.
- Closing/relaunching the user's browser, or triggering production actions,
  needs explicit consent — ask first.
- Reopen anything you closed when done. Keep recordings in a scratch dir.
