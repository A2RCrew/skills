#!/usr/bin/env node
// a2r-release-review · localiza posibles secretos en las líneas AÑADIDAS del rango.
// Uso: scanSecrets.mjs <repo-dir> <merge-base> <head> <out-dir>
// Escribe <out>/signal-secrets.txt con  fichero:línea<TAB>tipo<TAB>huella<TAB>longitud
// NUNCA escribe el valor. La huella (4 hex de sha256) permite ver si el mismo secreto se repite.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact } from './redact.mjs';

const [repoDir, base, head, outDir] = process.argv.slice(2);
if (!outDir) { console.error('uso: scanSecrets.mjs <repo-dir> <merge-base> <head> <out-dir>'); process.exit(2); }

const diff = execFileSync('git', ['diff', '--unified=0', base, head], { cwd: repoDir, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
const rows = [];
let file = null, lineNo = 0;
for (const raw of diff.split('\n')) {
  if (raw.startsWith('+++ b/')) { file = raw.slice(6); continue; }
  if (raw.startsWith('@@')) { const m = raw.match(/\+(\d+)/); lineNo = m ? +m[1] : 0; continue; }
  if (!raw.startsWith('+') || raw.startsWith('+++')) continue;
  const content = raw.slice(1);
  const { inventory } = redact(content);
  for (const i of inventory) rows.push(`${file}:${lineNo}\t${i.kind}\t#${i.fingerprint}\t${i.length}`);
  lineNo++;
}
writeFileSync(join(outDir, 'signal-secrets.txt'), rows.join('\n') + (rows.length ? '\n' : ''));
console.log(`${rows.length} posible(s) secreto(s) en líneas añadidas`);
