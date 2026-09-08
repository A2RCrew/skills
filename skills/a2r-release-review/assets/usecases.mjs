#!/usr/bin/env node
// a2r-release-review · clasifica ficheros y commits de un rango por caso de uso.
// Uso: node usecases.mjs <repo-key> <repo-root> <merge-base> <head> <out-dir> [use-cases.json]
// Escribe: usecases.tsv (path\tslug), commits-usecases.tsv (sha\tslugs\tissues\tsubject), usecases.json (resumen)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [repoKey, repoRoot, base, head, outDir, ucPathArg] = process.argv.slice(2);
if (!outDir) { console.error('uso: usecases.mjs <repo-key> <repo-root> <merge-base> <head> <out-dir> [use-cases.json]'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const ucPath = ucPathArg ?? join(here, '..', 'references', 'use-cases.json');
const { use_cases } = JSON.parse(readFileSync(ucPath, 'utf8'));

const git = (...a) => execFileSync('git', a, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { i++; if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') re += '(?:';
    else if (c === '}') re += ')';
    else if (c === ',' ) re += '|';
    else if (c === '[') { const j = glob.indexOf(']', i); re += glob.slice(i, j + 1); i = j; }
    else if ('.+^$()|\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

const rules = [];
for (const uc of use_cases) {
  const globs = uc.globs[repoKey] ?? uc.globs['*'] ?? [];
  for (const g of globs) rules.push({ slug: uc.slug, label: uc.label, re: globToRegex(g), glob: g });
}
const classify = (p) => rules.find((r) => r.re.test(p))?.slug ?? 'plataforma';

// Ficheros del rango (renames → destino)
const files = git('diff', '--name-status', base, head).trim().split('\n').filter(Boolean).map((l) => {
  const parts = l.split('\t'); const status = parts[0];
  return { status, path: status.startsWith('R') || status.startsWith('C') ? parts[2] : parts[1] };
});
const byUc = {};
const touch = (slug) => (byUc[slug] ??= { files: [], commits: [], issues: new Set() });
const fileRows = files.map((f) => { const slug = classify(f.path); touch(slug).files.push(f.path); return `${f.path}\t${slug}`; });
writeFileSync(join(outDir, 'usecases.tsv'), fileRows.join('\n') + (fileRows.length ? '\n' : ''));

// Commits del rango → casos de uso por sus ficheros
const commits = git('log', '--no-merges', '--format=%H%x00%s%x00%b%x01', `${base}..${head}`).split('\x01').map((s) => s.trim()).filter(Boolean)
  .map((s) => { const [sha, subject, body = ''] = s.split('\x00'); return { sha, subject, body }; });
const commitRows = [];
for (const c of commits) {
  const changed = git('diff-tree', '--no-commit-id', '-r', '--name-only', c.sha).trim().split('\n').filter(Boolean);
  const slugs = [...new Set(changed.map(classify))];
  const issues = [...new Set(((c.subject + '\n' + c.body).match(/A2R-\d+/gi) ?? []).map((x) => x.toUpperCase()))];
  for (const s of slugs) { const u = touch(s); u.commits.push({ sha: c.sha.slice(0, 8), subject: c.subject, issues }); issues.forEach((i) => u.issues.add(i)); }
  commitRows.push(`${c.sha.slice(0, 8)}\t${slugs.join(',')}\t${issues.join(',')}\t${c.subject}`);
}
writeFileSync(join(outDir, 'commits-usecases.tsv'), commitRows.join('\n') + (commitRows.length ? '\n' : ''));

const order = use_cases.map((u) => u.slug);
const summary = {
  repo: repoKey, base, head, files_total: files.length, commits_total: commits.length,
  use_cases: Object.fromEntries(Object.entries(byUc).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([slug, v]) => [slug, {
    label: use_cases.find((u) => u.slug === slug)?.label ?? slug, owner: use_cases.find((u) => u.slug === slug)?.owner ?? null,
    files: v.files.length, commits: v.commits.length, issues: [...v.issues].sort(), file_list: v.files, commit_list: v.commits,
  }])),
};
writeFileSync(join(outDir, 'usecases.json'), JSON.stringify(summary, null, 2) + '\n');
const line = Object.entries(summary.use_cases).map(([s, v]) => `${s}:${v.files}f/${v.commits}c`).join('  ');
console.log(`${repoKey}: ${files.length} ficheros, ${commits.length} commits → ${line || 'sin cambios'}`);
