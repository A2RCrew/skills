import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { basename, dirname, normalize, relative, resolve } from 'path';

/**
 * Pre-commit check: la documentación de `.agents/` se mantiene sola (A2R-849, A2R-874, A2R-905,
 * A2R-954).
 *
 * Idéntico en nimrod-multitenant, nimrod-api y nimrod-benchmark: lo que cambia entre repos va en
 * `structure-schema.json`. Comprueba, sobre los ficheros trackeados:
 *   1. Estructura: en `.agents/` solo están el fichero de entrada (`AI-INSTRUCTIONS.md`), las
 *      carpetas de dominio del esquema, `scripts/` y `.scratch/` (que nunca se commitea). Dentro
 *      de un dominio hay ficheros, las subcarpetas `planes/`, `registros/` (admite una serie más:
 *      `registros/<serie>/`) y `para-clientes/`, y carpetas de tema (`<tema>/`, un nivel, con su
 *      `INDEX.md`). Cada dominio tiene su ficha `INDEX.md`.
 *   2. Nombres: kebab-case, sin repetir el prefijo del dominio; en `registros/` el nombre empieza
 *      por `AAAA-MM-DD-` salvo dentro de una serie. `INDEX.md` solo en la raíz del dominio y de
 *      un tema; `README.md` solo en una serie de `registros/` o como redirección (`redirects`).
 *   3. Huérfanos: todo fichero del dominio fuera de `registros/` y `para-clientes/` se alcanza
 *      desde su ficha siguiendo enlaces que no salen de la carpeta; si hay `registros/` o
 *      `para-clientes/`, la ficha enlaza algo de dentro (o la carpeta).
 *   4. Enrutado: cada dominio sale en una fila de la tabla de `AGENTS.md` con la ruta de su
 *      ficha, y tiene `.claude/rules/<dominio>.md` (salvo `withoutRule`) que la cita.
 *   5. `docs/` solo contiene los avisos (stubs) del esquema, y cada aviso enlaza su destino en
 *      `.agents/`. En los ficheros congelados (`frozen`: migraciones ejecutadas, copias
 *      literales entre repos) toda cita `docs/…` y `.agents/…` resuelve, salvo `deadCitations`;
 *      en las migraciones (`migrations`) una cita `.agents/…` solo puede ser la carpeta de un
 *      dominio o su ficha, la unidad que no se mueve.
 *   6. Enlaces rotos: todo enlace markdown relativo de un `.md` resuelve a un fichero existente.
 *      Se ignoran los enlaces con esquema, los anclas puras y lo que va en código.
 *   7. Cadenas prohibidas en `.md` (`forbidden`). Una línea con `docs-index-allow` queda exenta.
 *   8. `AGENTS.md` ≤ `router.maxLines` líneas.
 *   9. No hay `CLAUDE.md` en la raíz, ni siquiera sin trackear: Claude Code (≥ 2.1.277) lee
 *      `AGENTS.md` solo si falta, y uno nuevo —`/a2r-git:init` crea uno con su sección de Git— lo
 *      taparía en silencio (A2R-900).
 *  10. Índices por palabras clave: en una ficha o en el `INDEX.md` de un tema, cada entrada de
 *      lista (`- [Título](ruta) · <tipo>`) cuelga de una línea `**Palabras clave**: …` y lleva
 *      una etiqueta de `tipos`.
 *  11. Redirecciones (`redirects`): existen y enlazan su destino.
 *
 * Los topes de tokens, el trinquete de `oversized` y los resúmenes los comprueba `lint-docs.ts`.
 */

export type Schema = {
  root: string;
  entry: string;
  index: string;
  domains: string[];
  withoutRule: string[];
  subfolders: { plans: string; records: string; external: string };
  tools: string;
  scratch: string;
  rulesDir: string;
  limits: {
    entry: number;
    ficha: number;
    subIndex: number;
    doc: number;
    summaryMax: number;
  };
  tipos: string[];
  generated: string[];
  oversized: Record<string, number>;
  redirects: Record<string, string>;
  stubs: string[];
  frozen: string[];
  migrations: string;
  deadCitations: string[];
  forbidden: { pattern: string; why: string }[];
  excluded: string[];
  router: { file: string; maxLines: number };
};

export type Problem = { file: string; line?: number; message: string };

export type DocKind =
  | { kind: 'entry' }
  | { kind: 'ficha'; domain: string }
  | { kind: 'subIndex'; domain: string; topic: string }
  | { kind: 'exempt'; domain: string }
  | { kind: 'doc'; domain: string }
  | { kind: 'other' };

const ALLOW_MARKER = 'docs-index-allow';
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+)+$/;
const KEBAB_DIR = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATED = /^\d{4}-\d{2}-\d{2}-/;
const KEYWORDS = /^\*\*Palabras clave\*\*:\s*\S/;
const ENTRY = /^- \[[^\]]+\]\([^)\s]+\)(.*)$/;

export function loadSchema(): Schema {
  return JSON.parse(
    readFileSync(resolve(__dirname, 'structure-schema.json'), 'utf8'),
  );
}

export function trackedFiles(schema: Schema): string[] {
  return execSync('git ls-files --cached --others --exclude-standard', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .filter(
      (f) =>
        f &&
        existsSync(f) &&
        !schema.excluded.some((p) => f === p || f.startsWith(p)),
    );
}

/** Qué es un fichero de `.agents/` a efectos de topes y formato. */
export function classify(schema: Schema, file: string): DocKind {
  const root = `${schema.root}/`;
  if (file === schema.entry) return { kind: 'entry' };
  if (!file.startsWith(root) || !file.endsWith('.md')) return { kind: 'other' };
  const [domain, ...deeper] = file.slice(root.length).split('/');
  if (!schema.domains.includes(domain)) return { kind: 'other' };
  const { plans, records, external } = schema.subfolders;
  const name = deeper[deeper.length - 1];
  if (deeper.length === 1 && name === schema.index)
    return { kind: 'ficha', domain };
  if (file in schema.redirects) return { kind: 'exempt', domain };
  const sub = deeper.length > 1 ? deeper[0] : null;
  if (sub === plans || sub === records || sub === external)
    return { kind: 'exempt', domain };
  if (sub !== null && deeper.length === 2 && name === schema.index)
    return { kind: 'subIndex', domain, topic: sub };
  return { kind: 'doc', domain };
}

function main() {
  const schema = loadSchema();
  const problems = check(schema, trackedFiles(schema), (f) =>
    readFileSync(f, 'utf8'),
  );
  if (problems.length === 0) {
    console.log('lint-structure: documentación en orden');
    return;
  }
  for (const p of problems) {
    console.error(`${p.file}${p.line ? `:${p.line}` : ''}: ${p.message}`);
  }
  console.error(
    `\nlint-structure: ${problems.length} problema(s). Reglas en ${schema.entry}.`,
  );
  process.exit(1);
}

const toRepo = (abs: string) =>
  relative(process.cwd(), abs).split('\\').join('/');

/** Enlaces markdown relativos de un texto, fuera de bloques y tramos de código. */
export function relativeLinks(
  text: string,
): { target: string; line: number }[] {
  const out: { target: string; line: number }[] = [];
  let inFence = false;
  text.split('\n').forEach((rawLine, i) => {
    if (/^\s*(```|~~~)/.test(rawLine)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const line = rawLine.replace(/`[^`]*`/g, '``');
    for (const match of line.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#'))
        continue;
      out.push({ target, line: i + 1 });
    }
  });
  return out;
}

export function resolveLink(from: string, target: string): string {
  return toRepo(
    normalize(resolve(dirname(from), decodeURIComponent(target.split('#')[0]))),
  );
}

/** Citas `<prefijo>/…` en texto plano que no forman parte de otra ruta (`nimrod-api/.agents/…`). */
function citations(line: string, prefix: 'docs' | '.agents'): string[] {
  const escaped = prefix.replace('.', '\\.');
  const re = new RegExp(`(?<![\\w./-])${escaped}\\/[\\w./-]*[\\w/]`, 'g');
  return [...line.matchAll(re)].map((m) => m[0]);
}

/**
 * Formato de índice: cada entrada de lista cuelga de una línea `**Palabras clave**:` (con solo
 * entradas entre medias) y lleva `· <tipo>` justo después del enlace.
 */
export function indexFormatProblems(
  file: string,
  text: string,
  tipos: string[],
): Problem[] {
  const problems: Problem[] = [];
  let inGroup = false;
  // la línea de palabras clave puede seguir en las siguientes (un párrafo partido)
  let inKeywords = false;
  let inFence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    if (KEYWORDS.test(line)) {
      inGroup = true;
      inKeywords = true;
      return;
    }
    if (inKeywords && line.trim() !== '' && !ENTRY.test(line)) return;
    inKeywords = false;
    if (line.startsWith('**Palabras clave**'))
      problems.push({
        file,
        line: i + 1,
        message: 'línea de palabras clave vacía',
      });
    const entry = line.match(ENTRY);
    if (!entry) {
      if (line.trim() !== '' || !inGroup) inGroup = false;
      return;
    }
    if (!inGroup)
      problems.push({
        file,
        line: i + 1,
        message:
          'entrada sin palabras clave: ponle encima una línea «**Palabras clave**: …»',
      });
    const tag = entry[1].match(/^\s*·\s*([^\s—,;.]+)/);
    if (!tag || !tipos.includes(tag[1]))
      problems.push({
        file,
        line: i + 1,
        message: `la entrada lleva «· <tipo>» tras el enlace; tipos: ${tipos.join(', ')}`,
      });
  });
  return problems;
}

export function check(
  schema: Schema,
  tracked: string[],
  read: (file: string) => string,
  exists: (file: string) => boolean = existsSync,
): Problem[] {
  const problems: Problem[] = [];
  const root = `${schema.root}/`;
  const trackedSet = new Set(tracked);
  const markdownFiles = tracked.filter((f) => f.endsWith('.md'));
  const { plans, records, external } = schema.subfolders;
  const reserved = [plans, records, external];
  const ficha = (domain: string) => `${root}${domain}/${schema.index}`;

  // 1 y 2. estructura y nombres
  if (!trackedSet.has(schema.entry))
    problems.push({
      file: schema.entry,
      message: 'falta el fichero de entrada',
    });
  const topics = new Set<string>();
  for (const file of tracked.filter((f) => f.startsWith(root))) {
    const [top, ...deeper] = file.slice(root.length).split('/');
    if (deeper.length === 0) {
      if (file !== schema.entry)
        problems.push({
          file,
          message: `en ${root} solo está ${basename(schema.entry)}: todo documento vive en la carpeta de su dominio`,
        });
      continue;
    }
    if (top === schema.scratch) {
      problems.push({
        file,
        message: `${schema.scratch}/ es para notas de sesión: nunca se commitea`,
      });
      continue;
    }
    if (top === schema.tools) continue;
    if (!schema.domains.includes(top)) {
      problems.push({
        file,
        message: `carpeta no prevista en structure-schema.json (dominios: ${schema.domains.join(', ')})`,
      });
      continue;
    }
    const name = deeper[deeper.length - 1];
    const sub = deeper.length > 1 ? deeper[0] : null;
    const isTopic = sub !== null && !reserved.includes(sub);
    if (isTopic) {
      if (!KEBAB_DIR.test(sub))
        problems.push({
          file,
          message: 'carpeta de tema en kebab-case y minúsculas',
        });
      topics.add(`${root}${top}/${sub}`);
    }
    const maxDepth = sub === records ? 3 : sub ? 2 : 1;
    if (deeper.length > maxDepth) {
      problems.push({
        file,
        message:
          sub === records
            ? `${records}/ admite una serie (${records}/<serie>/) y nada más hondo`
            : 'sin más niveles de carpeta: un tema es una carpeta con su INDEX.md y ficheros',
      });
      continue;
    }
    const isIndex = name === schema.index;
    const isReadme = name === 'README.md';
    if (!isIndex && !isReadme && !KEBAB.test(name))
      problems.push({ file, message: 'nombre en kebab-case y minúsculas' });
    if (name.startsWith(`${top}-`))
      problems.push({
        file,
        message: `sin el prefijo ${top}-: la carpeta ya dice el dominio`,
      });
    if (sub === records && deeper.length === 2 && !DATED.test(name))
      problems.push({
        file,
        message: `un registro empieza por su fecha (AAAA-MM-DD-<slug>), o va dentro de una serie`,
      });
    if (isIndex && sub !== null && !isTopic)
      problems.push({
        file,
        message: `${sub}/ no lleva ${schema.index}: la ficha del dominio lo enlaza`,
      });
    if (
      isReadme &&
      !(sub === records && deeper.length === 3) &&
      !(file in schema.redirects)
    )
      problems.push({
        file,
        message: `aquí no va un README.md: el índice es ${schema.index} (solo una serie de ${records}/ o una redirección de «redirects» llevan README)`,
      });
  }
  for (const topic of topics) {
    if (!trackedSet.has(`${topic}/${schema.index}`))
      problems.push({
        file: `${topic}/${schema.index}`,
        message: `falta el índice del tema: una carpeta de tema abre con su ${schema.index}`,
      });
  }

  // 11. redirecciones
  for (const [from, to] of Object.entries(schema.redirects)) {
    if (!trackedSet.has(from)) {
      problems.push({
        file: from,
        message: 'redirección declarada en structure-schema.json que no existe',
      });
      continue;
    }
    if (
      !relativeLinks(read(from)).some((l) => resolveLink(from, l.target) === to)
    )
      problems.push({ file: from, message: `la redirección no enlaza ${to}` });
  }

  // 3. huérfanos, por dominio
  for (const domain of schema.domains) {
    const prefix = `${root}${domain}/`;
    const card = ficha(domain);
    if (!trackedSet.has(card)) {
      problems.push({ file: card, message: 'falta la ficha del dominio' });
      continue;
    }
    const reached = new Set<string>([card]);
    const queue = [card];
    while (queue.length) {
      const doc = queue.shift()!;
      if (!doc.endsWith('.md') || !exists(doc)) continue;
      for (const { target } of relativeLinks(read(doc))) {
        const hit = resolveLink(doc, target);
        if (!hit.startsWith(prefix) || reached.has(hit)) continue;
        reached.add(hit);
        queue.push(hit);
      }
    }
    const cardLinks = relativeLinks(read(card)).map((l) =>
      resolveLink(card, l.target),
    );
    for (const sub of [records, external]) {
      const inside = `${prefix}${sub}`;
      const hasFiles = tracked.some((f) => f.startsWith(`${inside}/`));
      if (
        hasFiles &&
        !cardLinks.some((l) => l === inside || l.startsWith(`${inside}/`))
      )
        problems.push({
          file: card,
          message: `no enlaza ${sub}/ (la carpeta o algo de dentro)`,
        });
    }
    for (const file of tracked) {
      if (!file.startsWith(prefix) || reached.has(file)) continue;
      if (file in schema.redirects) continue;
      const sub = file.slice(prefix.length).split('/')[0];
      if (sub === records || sub === external) continue;
      problems.push({
        file,
        message: `huérfano: ${card} no lo alcanza; enlázalo desde la ficha o desde un índice que ella enlace`,
      });
    }
  }

  // 10. formato de índice
  for (const file of markdownFiles) {
    const kind = classify(schema, file).kind;
    if (kind === 'ficha' || kind === 'subIndex')
      problems.push(...indexFormatProblems(file, read(file), schema.tipos));
  }

  // 9. sin CLAUDE.md en la raíz: taparía AGENTS.md
  if (trackedSet.has('CLAUDE.md'))
    problems.push({
      file: 'CLAUDE.md',
      message:
        'bórralo y lleva su contenido a AGENTS.md: si existe, Claude Code deja de leer AGENTS.md (A2R-900)',
    });

  // 4. enrutado: AGENTS.md y .claude/rules
  const routerText = trackedSet.has(schema.router.file)
    ? read(schema.router.file)
    : '';
  const routerRows = routerText.split('\n').filter((l) => l.startsWith('|'));
  for (const domain of schema.domains) {
    const path = ficha(domain);
    const rows = routerRows.filter((l) => l.includes(path)).length;
    if (rows !== 1)
      problems.push({
        file: schema.router.file,
        message: `${path} sale en ${rows} filas de la tabla; tiene que salir en una`,
      });
    if (schema.withoutRule.includes(domain)) continue;
    const rule = `${schema.rulesDir}/${domain}.md`;
    if (!trackedSet.has(rule)) {
      problems.push({
        file: rule,
        message: `falta la regla del dominio (o declara ${domain} en withoutRule)`,
      });
      continue;
    }
    if (!read(rule).includes(path))
      problems.push({ file: rule, message: `no cita ${path}` });
  }

  // 5. docs/ solo con avisos; las citas congeladas resuelven
  for (const file of tracked.filter((f) => f.startsWith('docs/'))) {
    if (!schema.stubs.includes(file))
      problems.push({
        file,
        message:
          'docs/ solo guarda avisos de rutas citadas por migraciones: la documentación va en .agents/',
      });
  }
  for (const stub of schema.stubs) {
    if (!trackedSet.has(stub)) {
      problems.push({
        file: stub,
        message: 'aviso declarado en structure-schema.json que no existe',
      });
      continue;
    }
    if (
      !relativeLinks(read(stub)).some((l) =>
        resolveLink(stub, l.target).startsWith(root),
      )
    )
      problems.push({
        file: stub,
        message: 'el aviso no enlaza su destino en .agents/',
      });
  }
  const resolves = (cited: string) =>
    [
      cited,
      cited.replace(/\/$/, ''),
      `${cited.replace(/\/$/, '')}/README.md`,
    ].some(
      (c) =>
        trackedSet.has(c) ||
        tracked.some((f) => f.startsWith(`${c.replace(/\/$/, '')}/`)),
    );
  const domainCitation = new RegExp(
    `^${root.replace('.', '\\.')}(${schema.domains.join('|')})/((INDEX|README)\\.md)?$`,
  );
  for (const file of tracked.filter((f) =>
    schema.frozen.some((p) => f.startsWith(p)),
  )) {
    read(file)
      .split('\n')
      .forEach((line, i) => {
        for (const prefix of ['docs', '.agents'] as const) {
          for (const cited of citations(line, prefix)) {
            if (schema.deadCitations.includes(cited)) continue;
            if (!resolves(cited))
              problems.push({
                file,
                line: i + 1,
                message: `cita ${cited}, que no existe: un fichero congelado necesita su aviso en docs/ o su redirección`,
              });
            else if (
              prefix === '.agents' &&
              file.startsWith(schema.migrations) &&
              !domainCitation.test(cited)
            )
              problems.push({
                file,
                line: i + 1,
                message: `una migración solo cita la carpeta de un dominio (.agents/<dominio>/) o su ${schema.index}: lo demás se mueve`,
              });
          }
        }
      });
  }

  const forbidden = schema.forbidden.map((f) => ({
    pattern: new RegExp(f.pattern),
    why: f.why,
  }));
  for (const file of markdownFiles) {
    const text = read(file);
    const lines = text.split('\n');

    // 8. tope del router
    if (file === schema.router.file && lines.length > schema.router.maxLines)
      problems.push({
        file,
        message: `${lines.length} líneas; el router no pasa de ${schema.router.maxLines}`,
      });

    // 7. cadenas prohibidas (también dentro de bloques de código: una plantilla
    // que las recomienda es justo lo que hay que cazar)
    lines.forEach((rawLine, i) => {
      if (rawLine.includes(ALLOW_MARKER)) return;
      for (const { pattern, why } of forbidden)
        if (pattern.test(rawLine))
          problems.push({ file, line: i + 1, message: why });
    });

    // 6. enlaces relativos
    for (const { target, line } of relativeLinks(text)) {
      if (!exists(resolveLink(file, target)))
        problems.push({ file, line, message: `enlace roto: ${target}` });
    }
  }
  return problems;
}

if (require.main === module) {
  main();
}
