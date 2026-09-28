import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import {
  classify,
  loadSchema,
  type Schema,
  trackedFiles,
} from './lint-structure';

/**
 * Pre-commit check: topes de tokens, trinquete y resúmenes de `.agents/` (A2R-874, A2R-905,
 * A2R-954).
 *
 * - El fichero de entrada no pasa de `limits.entry`; la ficha de cada dominio (`INDEX.md`), de
 *   `limits.ficha`; el `INDEX.md` de un tema, de `limits.subIndex`. Son lo que se lee siempre.
 * - Todo documento de dominio es atómico: `limits.doc` tokens como mucho. Quedan fuera
 *   `registros/` (con fecha, largos por diseño), `para-clientes/` (público externo), `planes/`
 *   (se cierran al ejecutarse) y las redirecciones.
 * - Trinquete: los que ya se pasaban están en `oversized` con su tamaño. Pueden encoger, nunca
 *   crecer; en cuanto caben, salen de la lista (que así solo encoge), y una entrada cuyo fichero
 *   ya no existe se borra. `--write-baseline` la reescribe con el estado actual: solo al
 *   estrenar el trinquete en un repo.
 * - `generated` (lo escribe un script) no tiene tope.
 * - Los que se pasan (de `oversized` o `generated`) abren con un resumen: un bloque `> ` en sus
 *   cinco primeras líneas, de `limits.summaryMax` tokens como mucho, que dice qué es y cuándo
 *   leerlo.
 *
 * Los tokens se estiman como caracteres / 4, sin dependencias: basta para un tope, no es una
 * factura.
 */

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/** El primer bloque `> ` de las cinco primeras líneas, o null. */
export function leadingSummary(text: string): string | null {
  const lines = text.split('\n').slice(0, 5);
  const start = lines.findIndex((l) => l.startsWith('>'));
  if (start === -1) return null;
  const block: string[] = [];
  for (const l of text.split('\n').slice(start)) {
    if (!l.startsWith('>')) break;
    block.push(l.replace(/^>\s?/, ''));
  }
  return block.join('\n').trim() || null;
}

/** Los documentos de dominio sujetos al tope, con sus tokens. */
function atomicDocs(
  schema: Schema,
  tracked: string[],
  read: (file: string) => string,
) {
  return tracked
    .filter((f) => classify(schema, f).kind === 'doc')
    .map((file) => ({ file, tokens: estimateTokens(read(file)) }));
}

export function baseline(
  schema: Schema,
  tracked: string[],
  read: (file: string) => string,
): Record<string, number> {
  return Object.fromEntries(
    atomicDocs(schema, tracked, read)
      .filter(
        ({ file, tokens }) =>
          tokens > schema.limits.doc && !schema.generated.includes(file),
      )
      .sort((a, b) => a.file.localeCompare(b.file))
      .map(({ file, tokens }) => [file, tokens]),
  );
}

export function check(
  schema: Schema,
  tracked: string[],
  read: (file: string) => string,
): string[] {
  const problems: string[] = [];
  const { limits, oversized, generated } = schema;
  const trackedSet = new Set(tracked);

  for (const file of tracked.filter((f) => f.endsWith('.md'))) {
    const kind = classify(schema, file).kind;
    const cap =
      kind === 'entry'
        ? limits.entry
        : kind === 'ficha'
          ? limits.ficha
          : kind === 'subIndex'
            ? limits.subIndex
            : null;
    if (cap === null) continue;
    const tokens = estimateTokens(read(file));
    if (tokens > cap)
      problems.push(
        `${file}: ~${tokens} tokens; el tope es ${cap}. Un índice lleva palabras clave y enlaces: el detalle, en su documento`,
      );
  }

  for (const { file, tokens } of atomicDocs(schema, tracked, read)) {
    const allowed = oversized[file];
    const isGenerated = generated.includes(file);
    if (allowed !== undefined) {
      if (tokens > allowed)
        problems.push(
          `${file}: ~${tokens} tokens y la lista oversized lo congela en ${allowed}; no crece: pártelo (un tema con su INDEX.md) o recórtalo`,
        );
      else if (tokens <= limits.doc)
        problems.push(
          `${file}: ya cabe (~${tokens} ≤ ${limits.doc}); quítalo de oversized en structure-schema.json`,
        );
    } else if (!isGenerated && tokens > limits.doc) {
      problems.push(
        `${file}: ~${tokens} tokens; el tope es ${limits.doc}. Pártelo en documentos de un tema (o una carpeta de tema con su INDEX.md)`,
      );
      continue;
    }
    if (tokens <= limits.doc) continue;
    const summary = leadingSummary(read(file));
    if (summary === null)
      problems.push(
        `${file}: ~${tokens} tokens sin resumen; abre con un bloque «> » (qué es y cuándo leerlo) en sus cinco primeras líneas`,
      );
    else if (estimateTokens(summary) > limits.summaryMax)
      problems.push(
        `${file}: el resumen tiene ~${estimateTokens(summary)} tokens; el tope es ${limits.summaryMax}`,
      );
  }

  for (const file of Object.keys(oversized))
    if (!trackedSet.has(file))
      problems.push(
        `${file}: está en oversized pero ya no existe; quítalo de structure-schema.json`,
      );
  for (const file of generated)
    if (!trackedSet.has(file))
      problems.push(
        `${file}: está en generated pero ya no existe; quítalo de structure-schema.json`,
      );
  return problems;
}

if (require.main === module) {
  const schema = loadSchema();
  const tracked = trackedFiles(schema);
  const read = (f: string) => readFileSync(f, 'utf8');
  if (process.argv.includes('--write-baseline')) {
    schema.oversized = baseline(schema, tracked, read);
    writeFileSync(
      resolve(__dirname, 'structure-schema.json'),
      `${JSON.stringify(schema, null, 2)}\n`,
    );
    console.log(
      `lint-docs: oversized con ${Object.keys(schema.oversized).length} documento(s)`,
    );
    process.exit(0);
  }
  const problems = check(schema, tracked, read);
  if (problems.length === 0) {
    console.log('lint-docs: topes, trinquete y resúmenes en orden');
  } else {
    for (const p of problems) console.error(p);
    console.error(
      `\nlint-docs: ${problems.length} problema(s). Topes en .agents/scripts/structure-schema.json.`,
    );
    process.exit(1);
  }
}
