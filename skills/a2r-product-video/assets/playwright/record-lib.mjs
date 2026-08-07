/**
 * A2R product-video — Playwright recording library (reusable across modules).
 *
 * Records the app VIEWPORT ONLY (no browser chrome) via Playwright `recordVideo`,
 * reusing a logged-in Chrome session persisted in a user-data-dir, and injects a
 * virtual cursor + click ripple so the recording reads like a real demo.
 *
 * Requires (in the recording project, NOT the skills repo):
 *   npm i playwright-core          # uses system Chrome via channel:'chrome' (no bundled Chromium)
 *   npx playwright install ffmpeg  # recordVideo needs Playwright's own ffmpeg
 *
 * Typical use: import these helpers from a per-module record script (see SKILL.md).
 */
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

export const W = 1920, H = 1080;

// Virtual cursor + click ripple, injected on every page/navigation.
const CURSOR_SCRIPT = `
(() => {
  if (window.__a2rCursor) return;
  window.__a2rCursor = true;
  const mk = () => {
    if (document.getElementById('__a2r_cursor')) return;
    const c = document.createElement('div');
    c.id = '__a2r_cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transition:transform .04s linear;will-change:transform;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="#1f2937" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    window.__a2rMove = (x,y) => { c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
    window.__a2rRipple = (x,y) => {
      const r = document.createElement('div');
      r.style.cssText = 'position:fixed;left:'+(x-4)+'px;top:'+(y-4)+'px;width:8px;height:8px;border-radius:50%;background:rgba(39,100,244,.45);border:2px solid rgba(39,100,244,.9);z-index:2147483646;pointer-events:none;transform:scale(1);opacity:1;transition:transform .5s ease-out,opacity .5s ease-out;';
      document.documentElement.appendChild(r);
      requestAnimationFrame(()=>{ r.style.transform='scale(6)'; r.style.opacity='0'; });
      setTimeout(()=>r.remove(), 550);
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mk); else mk();
  document.addEventListener('mousemove', e => { if(window.__a2rMove) window.__a2rMove(e.clientX, e.clientY); }, true);
  new MutationObserver(mk).observe(document.documentElement, {childList:true});
})();
`;

let cursorX = W / 2, cursorY = H / 2;

/**
 * Launch a persistent context (reuses the logged-in session in userDataDir) with
 * viewport-only video recording. Chrome window matches the video size so there is
 * no chrome in the recording.
 */
export async function launchContext(userDataDir, recordDir) {
  fs.mkdirSync(recordDir, { recursive: true });
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
    viewport: null,
    recordVideo: { dir: recordDir, size: { width: W, height: H } },
    args: [
      `--window-size=${W},${H}`, "--window-position=0,0", "--force-device-scale-factor=1",
      "--hide-crash-restore-bubble", "--disable-session-crashed-bubble", "--no-first-run",
      "--no-default-browser-check", "--disable-blink-features=AutomationControlled",
    ],
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = context.pages()[0] || (await context.newPage());
  await page.setViewportSize({ width: W, height: H });
  await page.addInitScript(CURSOR_SCRIPT);
  return { context, page };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Milestone timeline (ms since start) — feed the marks into your Remotion captions. */
export function makeTimeline() {
  const start = Date.now();
  const marks = [];
  return {
    mark(name, extra = {}) {
      const t = Date.now() - start;
      marks.push({ name, t, ...extra });
      console.log(`  [t=${(t / 1000).toFixed(1)}s] ${name}`);
    },
    marks, start,
  };
}

/** Glide the virtual cursor to (x,y) with easing so movement looks human. */
export async function glide(page, x, y, steps = 28) {
  const sx = cursorX, sy = cursorY;
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    await page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e);
    await sleep(8);
  }
  cursorX = x; cursorY = y;
}

async function boxCenter(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const b = await locator.boundingBox();
  if (!b) throw new Error("no bounding box for locator");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Move to an element with a human glide, ripple, then a real click. */
export async function glideClick(page, locator, { pauseBefore = 250, pauseAfter = 500 } = {}) {
  const { x, y } = await boxCenter(locator);
  await glide(page, x, y);
  await sleep(pauseBefore);
  await page.evaluate(([px, py]) => window.__a2rRipple && window.__a2rRipple(px, py), [x, y]).catch(() => {});
  await page.mouse.down(); await sleep(60); await page.mouse.up();
  await sleep(pauseAfter);
}

export async function glideHover(page, locator, { pauseAfter = 350 } = {}) {
  const { x, y } = await boxCenter(locator);
  await glide(page, x, y);
  await sleep(pauseAfter);
}

export async function typeSlow(page, locator, text, delay = 55) {
  await locator.click().catch(() => {});
  await locator.fill("").catch(() => {});
  await locator.pressSequentially(text, { delay });
}

/** Close the context and return the saved video path. */
export async function closeAndGetVideo(context, page) {
  const video = page.video();
  await context.close();
  return video ? await video.path() : null;
}
