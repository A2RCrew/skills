#!/usr/bin/env node
// a2r-release-review · radio de impacto de los ficheros cambiados.
// Uso: blastRadius.mjs <repo-key> <repo-dir> <merge-base> <head> <out-dir>
// Escribe <out>/blast-radius.json: por cada fichero cambiado, quién lo importa, a cuántos casos de
// uso arrastra, qué símbolos exportados cambian y si el cambio es rompedor, aditivo o interno.
// Solo lectura. No resuelve node_modules: solo importaciones internas (@/… y relativas).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [repoKey, repoDir, base, head, outDir] = process.argv.slice(2);
if (!outDir) { console.error('uso: blastRadius.mjs <repo-key> <repo-dir> <merge-base> <head> <out-dir>'); process.exit(2); }
const HERE = dirname(fileURLToPath(import.meta.url));
const REFS = join(HERE, '..', 'references');
const useCases = JSON.parse(readFileSync(join(REFS, 'use-cases.json'), 'utf8')).use_cases;
const shared = JSON.parse(readFileSync(join(REFS, 'shared-surfaces.json'), 'utf8'));
const git = (...a) => execFileSync('git', a, { cwd: repoDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// ── clasificador de casos de uso (mismo criterio que usecases.mjs) ──────────
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') { if (glob[i + 1] === '*') { i++; if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; } else re += '[^/]*'; }
    else if (c === '?') re += '[^/]';
    else if (c === '{') re += '(?:'; else if (c === '}') re += ')'; else if (c === ',') re += '|';
    else if (c === '[') { const j = glob.indexOf(']', i); re += glob.slice(i, j + 1); i = j; }
    else if ('.+^$()|\\'.includes(c)) re += '\\' + c; else re += c;
  }
  return new RegExp('^' + re + '$');
}
const rules = [];
for (const uc of useCases) for (const g of (uc.globs[repoKey] ?? uc.globs['*'] ?? [])) rules.push({ slug: uc.slug, re: globToRegex(g) });
const useCaseOf = (p) => rules.find((r) => r.re.test(p))?.slug ?? 'plataforma';

// ── grafo de importaciones ──────────────────────────────────────────────────
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP = /(^|\/)(node_modules|\.git|dist|build|coverage|\.next)(\/|$)/;
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e); const rel = relative(repoDir, full);
    if (SKIP.test(rel)) continue;
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, acc); else if (CODE.test(e)) acc.push(rel);
  }
  return acc;
}
const roots = ['src', 'scripts', 'test', 'tests', '__tests__'].filter((d) => existsSync(join(repoDir, d)));
const files = roots.flatMap((r) => walk(join(repoDir, r)));
const fileSet = new Set(files);

// resuelve un especificador a una ruta del repo, o null si es externo
const CANDIDATES = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js'];
function resolveSpec(spec, fromFile) {
  let baseRel;
  if (spec.startsWith('@/')) baseRel = join('src', spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../')) baseRel = relative(repoDir, resolve(dirname(join(repoDir, fromFile)), spec));
  else return null;
  baseRel = baseRel.replace(/\.js$/, ''); // ESM con extensión .js apuntando a .ts
  for (const suf of CANDIDATES) { const c = baseRel + suf; if (fileSet.has(c)) return c; }
  return null;
}
const IMPORT_RE = /(?:from\s+|import\s+|require\(\s*)['"]([^'"]+)['"]/g;
const importers = new Map();       // fichero → Set de ficheros que lo importan (directo)
const importersAll = new Map();    // idem, propagando un nivel a través de barriles
const isBarrel = new Set();
for (const f of files) {
  let src; try { src = readFileSync(join(repoDir, f), 'utf8'); } catch { continue; }
  if (/\/index\.(ts|tsx|js)$/.test(f) && /export\s+\*/.test(src)) isBarrel.add(f);
  for (const m of src.matchAll(IMPORT_RE)) {
    const target = resolveSpec(m[1], f);
    if (!target || target === f) continue;
    if (!importers.has(target)) importers.set(target, new Set());
    importers.get(target).add(f);
  }
}
// un nivel a través de barriles: quien importa el barril usa lo que el barril reexporta.
// Se guarda aparte para no inflar el número directo, que es el honesto.
for (const [t, set] of importers) importersAll.set(t, new Set(set));
for (const barrel of isBarrel) {
  const viaBarrel = importers.get(barrel) ?? new Set();
  for (const [target, set] of importersAll) if (set.has(barrel)) for (const v of viaBarrel) set.add(v);
}

// ── símbolos exportados: base vs head ───────────────────────────────────────
const EXPORT_RE = /^\s*export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/gm;
const EXPORT_LIST_RE = /^\s*export\s*\{([^}]+)\}/gm;
function exportsOf(text) {
  const out = new Set();
  for (const m of text.matchAll(EXPORT_RE)) out.add(m[1]);
  for (const m of text.matchAll(EXPORT_LIST_RE)) for (const part of m[1].split(',')) {
    const name = part.trim().split(/\s+as\s+/i).pop().trim(); if (name && name !== 'default') out.add(name);
  }
  return out;
}
// Campos de interfaces y tipos: "Interfaz.campo" → ¿es opcional?
// Cuenta llaves para no atribuir a una interfaz los campos de la siguiente, y salta los anidados.
function fieldsOf(text) {
  const out = new Map();
  const lines = text.split('\n');
  let current = null, depth = 0;
  for (const line of lines) {
    if (!current) {
      const m = line.match(/^\s*(?:export\s+)?(?:declare\s+)?(?:interface|type)\s+([A-Za-z0-9_$]+)[^=]*[={]/);
      if (m && line.includes('{')) { current = m[1]; depth = 0; }
      else continue;
    }
    const opens = (line.match(/\{/g) || []).length, closes = (line.match(/\}/g) || []).length;
    if (depth === 1) {
      const f = line.match(/^\s*(?:readonly\s+)?['"]?([A-Za-z0-9_$]+)['"]?(\?)?\s*:/);
      if (f) out.set(`${current}.${f[1]}`, !!f[2]);
    }
    depth += opens - closes;
    if (depth <= 0) { current = null; depth = 0; }
  }
  return out;
}
const showAt = (rev, path) => {
  try { return execFileSync('git', ['show', `${rev}:${path}`], { cwd: repoDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }
};
// claves de un JSON, incluidas las anidadas
function jsonKeys(text) {
  const out = new Set();
  try { (function walk(x, pre) { if (x && typeof x === 'object') for (const k of Object.keys(x)) { out.add(pre + k); walk(x[k], pre + k + '.'); } })(JSON.parse(text), ''); } catch {}
  return out;
}

// ── ficheros cambiados ──────────────────────────────────────────────────────
const changed = git('diff', '--name-status', base, head).trim().split('\n').filter(Boolean).map((l) => {
  const p = l.split('\t'); return { status: p[0], path: p[0].startsWith('R') || p[0].startsWith('C') ? p[2] : p[1] };
});

const declared = [...(shared.declared[repoKey] ?? []), ...(repoKey.startsWith('nimrod') ? [] : shared.declared._workers ?? [])];
const declaredFor = (p) => declared.find((d) => d.path.endsWith('/') ? p.startsWith(d.path) : p === d.path);
const TH = shared.thresholds;

const rows = [];
for (const { status, path } of changed) {
  if (status === 'D' || !CODE.test(path) && !path.startsWith('messages/')) {
    if (!declaredFor(path)) continue;
  }
  const impDirect = [...(importers.get(path) ?? [])];
  const impAll = [...(importersAll.get(path) ?? impDirect)];
  const byUc = {};
  for (const i of impAll) { const u = useCaseOf(i); byUc[u] = (byUc[u] || 0) + 1; }
  const ucs = Object.keys(byUc);
  const dec = declaredFor(path);
  if (!dec && (ucs.length < TH.use_cases_min || impAll.length < TH.importers_min)) continue;

  const before = showAt(base, path), after = showAt(head, path);
  const esJson = path.endsWith('.json');
  let kind = 'interno', removedExports = [], addedExports = [], removedFields = [], addedFields = [], nowRequired = [], removedKeys = [], addedKeys = 0;
  if (before !== null && after !== null) {
    if (esJson) {
      const kB = jsonKeys(before), kA = jsonKeys(after);
      removedKeys = [...kB].filter((k) => !kA.has(k));
      addedKeys = [...kA].filter((k) => !kB.has(k)).length;
      kind = removedKeys.length ? 'rompedor' : addedKeys ? 'aditivo' : 'interno';
    } else {
      const eB = exportsOf(before), eA = exportsOf(after);
      removedExports = [...eB].filter((x) => !eA.has(x));
      addedExports = [...eA].filter((x) => !eB.has(x));
      const fB = fieldsOf(before), fA = fieldsOf(after);
      removedFields = [...fB.keys()].filter((k) => !fA.has(k));
      addedFields = [...fA.keys()].filter((k) => !fB.has(k));
      nowRequired = [...fA.keys()].filter((k) => fB.has(k) && fB.get(k) === true && fA.get(k) === false);
      if (removedExports.length || removedFields.length || nowRequired.length) kind = 'rompedor';
      else if (addedExports.length || addedFields.length) kind = 'aditivo';
    }
  } else if (before === null) { kind = 'nuevo'; }

  // El análisis estático solo ve la firma. En una superficie DECLARADA el peligro suele estar en el
  // cuerpo (una proyección, un umbral), así que cualquier cambio va a revisión con su lista rompedor_si.
  const riesgo = kind === 'rompedor' ? 'rompedor' : dec ? 'revisar' : kind === 'aditivo' ? 'aditivo' : 'interno';

  rows.push({
    path, status, declarado: !!dec, nombre: dec?.nombre ?? null, owner: dec?.owner ?? null,
    porque: dec?.porque ?? null, rompedor_si: dec?.rompedor_si ?? null,
    caso_de_uso_del_fichero: useCaseOf(path),
    importadores_directos: impDirect.length, importadores_con_barriles: impAll.length,
    casos_afectados: ucs.length, reparto: byUc,
    cambio: kind, riesgo,
    exports_retirados: removedExports, exports_nuevos: addedExports,
    campos_retirados: removedFields, campos_nuevos: addedFields.length, campos_ahora_obligatorios: nowRequired,
    claves_retiradas: removedKeys, claves_nuevas: addedKeys,
    muestra_importadores: impDirect.slice(0, 8),
  });
}
// Los cinco ficheros de idioma son una sola superficie: agrupa y une sus claves retiradas.
const locales = rows.filter((r) => /^messages\/.*\.json$/.test(r.path));
if (locales.length > 1) {
  const idx = rows.indexOf(locales[0]);
  const retiradas = [...new Set(locales.flatMap((r) => r.claves_retiradas))];
  const merged = {
    ...locales[0], path: 'messages/ (' + locales.length + ' idiomas)',
    nombre: 'Ficheros de idioma', claves_retiradas: retiradas,
    claves_nuevas: Math.max(...locales.map((r) => r.claves_nuevas)),
    cambio: retiradas.length ? 'rompedor' : locales[0].cambio,
    riesgo: retiradas.length ? 'rompedor' : 'revisar',
    ficheros: locales.map((r) => r.path),
  };
  for (const l of locales) rows.splice(rows.indexOf(l), 1);
  rows.splice(Math.min(idx, rows.length), 0, merged);
}

const rank = { rompedor: 0, revisar: 1, aditivo: 2, interno: 3 };
rows.sort((a, b) => rank[a.riesgo] - rank[b.riesgo] || b.casos_afectados - a.casos_afectados || b.importadores_con_barriles - a.importadores_con_barriles);

const out = {
  repo: repoKey, base, head, ficheros_analizados: files.length, cambiados: changed.length,
  umbrales: TH, superficies: rows,
  resumen: {
    rompedoras: rows.filter((r) => r.riesgo === 'rompedor').length,
    a_revisar: rows.filter((r) => r.riesgo === 'revisar').length,
    aditivas: rows.filter((r) => r.riesgo === 'aditivo').length,
    internas: rows.filter((r) => r.riesgo === 'interno').length,
    declaradas_tocadas: rows.filter((r) => r.declarado).length,
    no_declaradas_por_umbral: rows.filter((r) => !r.declarado).length,
  },
};
writeFileSync(join(outDir, 'blast-radius.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${repoKey}: ${rows.length} superficie(s) compartida(s) tocada(s) · ${out.resumen.rompedoras} rompedora(s), ${out.resumen.a_revisar} a revisar, ${out.resumen.aditivas} aditiva(s), ${out.resumen.internas} interna(s)`);
for (const r of rows.slice(0, 14)) console.log(`   [${r.riesgo}/${r.cambio}] ${r.path} · ${r.importadores_directos} importadores (${r.importadores_con_barriles} con barriles) · ${r.casos_afectados} casos${r.declarado ? ' · declarada' : ''}`);
