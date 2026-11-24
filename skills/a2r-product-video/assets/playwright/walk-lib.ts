// Grabación de A2R Studio para los walkthroughs: cursor visible, renombres a DEMO en el navegador
// y la sesión de la cuenta de la e2e (rol Default), sin teclear credenciales.
// Se copia a e2e/ del repo nimrod-multitenant junto al guion de la toma (importa ./lib/directus,
// que hace login con E2E_EMAIL y su contraseña de e2e/.env.e2e) y se borra al acabar: no se commitea.
// A2R_BASE (obligatoria): URL del front que se graba, normalmente el de PRE; pídesela al equipo.
// LEAK_RE: expresión con lo que no debe quedar en pantalla. Añade los clientes y compañeros de tu caso.
import { chromium, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { login } from './lib/directus';

export const W = 1600,
  H = 900;
const base = process.env.A2R_BASE?.replace(/\/+$/, '');
if (!base) throw new Error('Falta A2R_BASE: la URL del front que se graba (PRE).');
export const BASE = base;
const LEAK_RE = new RegExp(process.env.LEAK_RE ?? 'A2R-\\d|E2E|humo|prueba|local ·', 'i');

// Reescribe en el navegador los nombres reales a DEMO (PRE no cambia) y pinta el cursor.
// Cadena y no función: tsx envuelve las funciones con __name, que no existe en el navegador.
const INIT = (
  renames: [string, string][],
  regexes: [string, string, string][],
) => `
(function(){
  var renames = ${JSON.stringify(renames)};
  var regexes = ${JSON.stringify(regexes)}.map(function(r){ return [new RegExp(r[0], r[2] || 'g'), r[1]]; });
  function fix(s){
    var out = s;
    for (var i=0;i<renames.length;i++){ if (out.indexOf(renames[i][0])>=0) out = out.split(renames[i][0]).join(renames[i][1]); }
    for (var j=0;j<regexes.length;j++){ out = out.replace(regexes[j][0], regexes[j][1]); }
    return out;
  }
  // React repone el valor de los campos al volver a pintar: se reescribe en el propio setter.
  [window.HTMLInputElement, window.HTMLTextAreaElement].forEach(function(K){
    var d = Object.getOwnPropertyDescriptor(K.prototype, 'value');
    Object.defineProperty(K.prototype, 'value', { configurable: true, get: function(){ return d.get.call(this); }, set: function(v){ d.set.call(this, typeof v === 'string' ? fix(v) : v); } });
  });
  function walk(root){
    if (!root) return;
    if (root.nodeType === 3) { var f0 = fix(root.nodeValue||''); if (f0 !== root.nodeValue) root.nodeValue = f0; return; }
    if (!root.querySelectorAll && root.nodeType !== 9) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); var n;
    while ((n = tw.nextNode())) { var v = n.nodeValue||''; var f = fix(v); if (f !== v) n.nodeValue = f; }
    var els = (root.querySelectorAll ? root : document).querySelectorAll('input, [title], [aria-label]');
    for (var j=0;j<els.length;j++){ var e = els[j];
      if (e.tagName === 'INPUT' && e.value) { var fv = fix(e.value); if (fv !== e.value) e.value = fv; }
      ['title','aria-label'].forEach(function(a){ var av = e.getAttribute(a); if (av) { var fa = fix(av); if (fa !== av) e.setAttribute(a, fa); } });
    }
  }
  new MutationObserver(function(ms){ ms.forEach(function(m){ if (m.type === 'characterData') walk(m.target); m.addedNodes.forEach(function(x){ walk(x); }); }); })
    .observe(document, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', function(){ walk(document.body); });
  setInterval(function(){ if (document.body) walk(document.body); }, 400);
  // Los DEMO de otra grabación no salen: HIDE=id1,id2 oculta su fila o su tarjeta.
  var hide = ${JSON.stringify((process.env.HIDE ?? '').split(',').filter(Boolean))};
  if (hide.length) {
    var css = hide.map(function(id){ var a = 'a[href*="' + id + '"]'; return 'tr:has(' + a + '),[role=row]:has(' + a + '),[data-slot=card]:has(' + a + '),.card:has(' + a + '),article:has(' + a + '){display:none !important}'; }).join('\\n');
    var addCss = function(){ if (document.head && !document.getElementById('__hide')) { var st = document.createElement('style'); st.id = '__hide'; st.textContent = css; document.head.appendChild(st); } };
    addCss(); setInterval(addCss, 200);
    // En cuadrícula la tarjeta no tiene clase fija: se sube desde el enlace hasta el hijo de la rejilla.
    var hideCards = function(){
      hide.forEach(function(id){
        document.querySelectorAll('a[href*="' + id + '"]').forEach(function(a){
          var el = a;
          while (el && el.parentElement && el.parentElement !== document.body) {
            var d = getComputedStyle(el.parentElement).display;
            if (d === 'grid' || d === 'inline-grid' || el.tagName === 'TR' || el.getAttribute('role') === 'row') break;
            el = el.parentElement;
          }
          if (el && el.style.display !== 'none') el.style.setProperty('display', 'none', 'important');
        });
      });
    };
    setInterval(hideCards, 100);
  }
  var cx = 800, cy = 450;
  function ensure(){
    if (window !== window.top || !document.body || document.getElementById('__cur')) return;
    var c = document.createElement('div'); c.id = '__cur';
    c.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;will-change:transform;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="#1f2937" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    document.body.appendChild(c);
  }
  setInterval(ensure, 100);
  document.addEventListener('mousemove', function(e){ cx = e.clientX; cy = e.clientY; ensure(); var c = document.getElementById('__cur'); if (c) c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; }, true);
  window.__mv = function(x, y){ cx = x; cy = y; ensure(); var c = document.getElementById('__cur'); if (c) c.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
  window.__rip = function(x, y){
    var r = document.createElement('div');
    r.style.cssText = 'position:fixed;left:' + (x-5) + 'px;top:' + (y-5) + 'px;width:10px;height:10px;border-radius:50%;background:rgba(39,100,244,.45);border:2px solid rgba(39,100,244,.9);z-index:2147483646;pointer-events:none;transition:transform .5s ease-out,opacity .5s ease-out;';
    document.body.appendChild(r); requestAnimationFrame(function(){ r.style.transform = 'scale(6)'; r.style.opacity = '0'; }); setTimeout(function(){ r.remove(); }, 600);
  };
})();
`;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let cur = { x: 800, y: 450 };
export async function glide(page: Page, x: number, y: number, ms = 600) {
  await page.mouse.move(x, y, { steps: Math.max(8, Math.round(ms / 25)) });
  cur = { x, y };
}
export async function center(l: Locator) {
  await l.first().waitFor({ state: 'visible' });
  await l
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  const b = await l.first().boundingBox();
  if (!b) throw new Error('sin caja');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
export async function hover(page: Page, l: Locator, ms = 600) {
  const c = await center(l);
  await glide(page, c.x, c.y, ms);
}
export async function click(page: Page, l: Locator, ms = 600) {
  const c = await center(l);
  await glide(page, c.x, c.y, ms);
  await sleep(120);
  await page.evaluate(([a, b]) => (window as any).__rip?.(a, b), [c.x, c.y]);
  await l.first().click();
}
/** Un paso que puede fallar sin tirar la toma: se registra y se sigue. */
export async function soft(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.warn('   ! paso', name, (e as Error).message.split('\n')[0]);
  }
}
export async function scrollBy(page: Page, dy: number, ms = 800) {
  const n = Math.max(6, Math.round(ms / 40));
  for (let i = 0; i < n; i++) {
    await page.mouse.wheel(0, dy / n);
    await sleep(ms / n);
  }
}
export const at = (t0: number) => async (t: number) => {
  const d = t * 1000 - (Date.now() - t0);
  if (d > 0) await sleep(d);
};

export async function type(page: Page, l: Locator, text: string, delay = 45) {
  await click(page, l, 600);
  await l.first().pressSequentially(text, { delay });
}
export const dlg = (p: Page) => p.getByRole('dialog').last();

export type Clip = {
  url: string;
  ready: (p: Page) => Locator;
  dark?: boolean;
  /** Se ejecuta antes de que empiece la toma (p. ej. filtrar un listado). */
  prep?: (page: Page) => Promise<void>;
  run: (page: Page) => Promise<void>;
};

export async function record(
  clips: Record<string, Clip>,
  which: string,
  OUT: string,
  renames: [string, string][],
  regexes: [string, string, string][],
) {
  fs.mkdirSync(OUT, { recursive: true });
  const { access_token, refresh_token } = await login();
  const browser = await chromium.launch({ channel: 'chromium' });
  const wanted = which === 'all' ? Object.keys(clips) : which.split(',');
  const u = new URL(BASE);
  for (const name of wanted) {
    const clip = clips[name];
    if (!clip) {
      console.error('no existe', name);
      continue;
    }
    const context = await browser.newContext({
      viewport: { width: W, height: H },
      colorScheme: clip.dark ? 'dark' : 'light',
      recordVideo: {
        dir: path.join(OUT, `raw-${name}`),
        size: { width: W, height: H },
      },
    });
    await context.addCookies([
      {
        name: 'directus_session_token',
        value: access_token,
        domain: u.hostname,
        path: '/',
        secure: true,
      },
      {
        name: 'directus_refresh_token',
        value: refresh_token,
        domain: u.hostname,
        path: '/',
        secure: true,
      },
    ]);
    await context.addInitScript({
      content:
        INIT(renames, regexes) +
        (clip.dark
          ? `setInterval(function(){var h=document.documentElement;if(!h.classList.contains('dark')){h.classList.add('dark');h.setAttribute('data-theme','dark');h.style.colorScheme='dark';}},50);`
          : ''),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    const t0 = Date.now();
    (globalThis as any).__t0 = t0; // para registrar hitos dentro de la toma
    await page.goto(clip.url.startsWith('file://') ? clip.url : `${BASE}${clip.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 180000,
    });
    await clip
      .ready(page)
      .first()
      .waitFor({ timeout: 120000 })
      .catch((e) =>
        console.error(name, 'no está lista:', e.message.split('\n')[0]),
      );
    await page
      .waitForLoadState('networkidle', { timeout: 20000 })
      .catch(() => {});
    if (clip.prep) await clip.prep(page).catch((e) => console.warn('   ! prep', name, (e as Error).message.split('\n')[0]));
    await sleep(2500);
    await page.mouse.move(800, 450);
    const start = (Date.now() - t0) / 1000;
    try {
      await clip.run(page);
    } catch (e) {
      console.error(name, 'falló:', (e as Error).message.split('\n')[0]);
      await page.screenshot({ path: path.join(OUT, `${name}-error.png`) });
    }
    const end = (Date.now() - t0) / 1000;
    const leaks = await page
      .evaluate((src) => {
        const re = new RegExp(src, 'i');
        const t = document.body.innerText;
        const v = Array.from(document.querySelectorAll('input,textarea'))
          .map((e) => (e as HTMLInputElement).value)
          .join(' | ');
        return (t + ' | ' + v)
          .split(/\n| \| /)
          .filter((l) => re.test(l));
      }, LEAK_RE.source)
      .catch(() => []);
    if (leaks.length)
      console.warn('   ! nombres reales en', name, leaks.slice(0, 6));
    await page.screenshot({ path: path.join(OUT, `${name}-final.png`) });
    const finalUrl = page.url();
    const video = page.video();
    await context.close();
    fs.renameSync(await video!.path(), path.join(OUT, `${name}.webm`));
    fs.rmSync(path.join(OUT, `raw-${name}`), { recursive: true, force: true });
    fs.writeFileSync(
      path.join(OUT, `${name}.json`),
      JSON.stringify({ start, end, url: finalUrl }),
    );
    console.log(name, 'ok', start.toFixed(1), end.toFixed(1), finalUrl);
  }
  await browser.close();
}
