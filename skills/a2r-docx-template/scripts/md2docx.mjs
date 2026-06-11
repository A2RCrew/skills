#!/usr/bin/env node
// Convierte un Markdown en .docx con la plantilla corporativa de A2R llamando al
// endpoint público POST https://voice.a2r.com/api/v1/md2docx
//
// Uso:
//   node md2docx.mjs --markdown doc.md [--out doc.docx] [--locale es]
//        [--authorName "..."] [--subtitle "..."] [--abstract "..."]
//        [--clientName "..."] [--date "..."] [--filename "..."]

import { readFileSync, writeFileSync } from 'node:fs';

const ENDPOINT = 'https://voice.a2r.com/api/v1/md2docx';
const TIMEOUT_MS = 130_000; // el endpoint puede tardar hasta 120 s
const MAX_BYTES = 1024 * 1024; // 1 MB

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv);

if (!args.markdown) {
  console.error('Error: falta --markdown <ruta al fichero .md>');
  process.exit(2);
}

let markdown;
try {
  markdown = readFileSync(args.markdown, 'utf8');
} catch (e) {
  console.error(`Error: no se pudo leer el Markdown "${args.markdown}": ${e.message}`);
  process.exit(2);
}

const bytes = Buffer.byteLength(markdown, 'utf8');
if (bytes === 0) {
  console.error('Error: el Markdown está vacío.');
  process.exit(2);
}
if (bytes > MAX_BYTES) {
  console.error(`Error: el Markdown ocupa ${bytes} bytes y supera el límite de 1 MB.`);
  process.exit(2);
}
if (!/^\s*#\s+\S/m.test(markdown)) {
  console.warn('Aviso: el Markdown no parece tener un "# H1" (se usa como título de portada).');
}

const body = { markdown, locale: args.locale ?? 'es' };
for (const key of ['authorName', 'subtitle', 'abstract', 'clientName', 'date', 'filename']) {
  if (args[key] != null && args[key] !== true) body[key] = args[key];
}

const outPath = args.out ?? args.filename ?? 'a2r-document.docx';

let res;
try {
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
} catch (e) {
  const reason = e.name === 'TimeoutError' ? `timeout (${TIMEOUT_MS} ms)` : e.message;
  console.error(`md2docx failed: error de red/${reason}`);
  process.exit(1);
}

if (!res.ok) {
  let msg;
  try {
    msg = (await res.json()).error;
  } catch {
    try { msg = await res.text(); } catch { msg = '(sin cuerpo)'; }
  }
  console.error(`md2docx failed (${res.status}): ${msg}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
try {
  writeFileSync(outPath, buf);
} catch (e) {
  console.error(`Error: no se pudo escribir "${outPath}": ${e.message}`);
  process.exit(1);
}

console.log(`OK: ${outPath} (${buf.length} bytes)`);
console.log('Nota: al abrir el .docx, Word pedirá actualizar los campos para mostrar los números de página del índice. Acepta.');
