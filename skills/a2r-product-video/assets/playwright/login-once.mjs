/**
 * A2R product-video — one-time login helper.
 *
 * Many A2R apps keep the session in localStorage (not cookies), so copying a
 * Chrome profile does NOT carry the session. The reliable, credential-safe path:
 * open a Playwright-controlled window, let the USER log in once manually, and the
 * session persists into `userDataDir` for all later recording runs.
 *
 * Claude never types credentials. Run this once per app/session; reuse the same
 * userDataDir in the recording scripts.
 *
 * Usage:
 *   node login-once.mjs <userDataDir> <appUrl>
 * Example:
 *   node login-once.mjs ./chrome-auth https://a2r.a2r.studio/panel
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const userDataDir = path.resolve(process.argv[2] || "./chrome-auth");
const appUrl = process.argv[3] || "https://a2r.a2r.studio/";
const loggedInWhen = (url) => url.includes(new URL(appUrl).host) && !url.includes("/login");
const marker = path.join(userDataDir, "..", "login-status.json");

const context = await chromium.launchPersistentContext(userDataDir, {
  channel: "chrome", headless: false, viewport: null,
  args: ["--window-size=1440,900", "--window-position=120,80", "--force-device-scale-factor=1",
    "--hide-crash-restore-bubble", "--disable-session-crashed-bubble", "--no-first-run", "--no-default-browser-check"],
});
const page = context.pages()[0] || (await context.newPage());
await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);

if (loggedInWhen(page.url())) {
  console.log("STATUS: ALREADY_LOGGED_IN");
} else {
  console.log("STATUS: WAITING_FOR_LOGIN — the user must log in in the opened Chrome window.");
  const start = Date.now();
  while (Date.now() - start < 5 * 60 * 1000) {
    if (loggedInWhen(page.url())) break;
    await page.waitForTimeout(1500);
  }
  console.log(loggedInWhen(page.url()) ? "STATUS: LOGIN_DONE " + page.url() : "STATUS: LOGIN_TIMEOUT");
  await page.waitForTimeout(4000); // let localStorage flush before closing
}
fs.writeFileSync(marker, JSON.stringify({ url: page.url(), loggedIn: loggedInWhen(page.url()) }));
await context.close();
console.log("CONTEXT_CLOSED");
