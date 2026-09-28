import { describe, expect, it } from 'vitest';

import { check as checkDocs } from './lint-docs';
import { check as checkStructure, type Schema } from './lint-structure';

/**
 * Tests de los linters de `.agents/` (A2R-954) sobre un repo en memoria. Idéntico en
 * nimrod-multitenant, nimrod-api y nimrod-benchmark, como los linters.
 */

const schema: Schema = {
  root: '.agents',
  entry: '.agents/AI-INSTRUCTIONS.md',
  index: 'INDEX.md',
  domains: ['dom'],
  withoutRule: ['dom'],
  subfolders: {
    plans: 'planes',
    records: 'registros',
    external: 'para-clientes',
  },
  tools: 'scripts',
  scratch: '.scratch',
  rulesDir: '.claude/rules',
  limits: { entry: 1000, ficha: 250, subIndex: 200, doc: 500, summaryMax: 80 },
  tipos: ['reglas', 'receta', 'diseño', 'referencia', 'integración'],
  generated: [],
  oversized: {},
  redirects: {},
  stubs: [],
  frozen: ['migrations/'],
  migrations: 'migrations/',
  deadCitations: [],
  forbidden: [],
  excluded: [],
  router: { file: 'AGENTS.md', maxLines: 60 },
};

const CARD = `# Dom

**Palabras clave**: tema, topic

- [Tema](tema.md) · receta
`;

function repo(files: Record<string, string>, overrides: Partial<Schema> = {}) {
  const all: Record<string, string> = {
    'AGENTS.md': '| ruta | palabras | `.agents/dom/INDEX.md` |\n',
    '.agents/AI-INSTRUCTIONS.md': '# Entrada\n',
    '.agents/dom/INDEX.md': CARD,
    '.agents/dom/tema.md': '# Tema\n',
    ...files,
  };
  for (const [k, v] of Object.entries(all)) if (v === '') delete all[k];
  const tracked = Object.keys(all);
  const read = (f: string) => all[f] ?? '';
  const exists = (f: string) =>
    f in all || tracked.some((t) => t.startsWith(`${f}/`));
  const s = { ...schema, ...overrides };
  return {
    structure: checkStructure(s, tracked, read, exists).map((p) => p.message),
    docs: checkDocs(s, tracked, read),
  };
}

const long = (tokens: number) => `# Largo\n\n${'x'.repeat(tokens * 4)}\n`;
const summarized = (tokens: number) =>
  `# Largo\n\n> Qué es y cuándo leerlo.\n\n${'x'.repeat(tokens * 4)}\n`;

describe('lint-structure', () => {
  it('acepta un dominio con su ficha en formato de índice', () => {
    expect(repo({}).structure).toEqual([]);
  });

  it('rechaza una entrada sin palabras clave', () => {
    const { structure } = repo({
      '.agents/dom/INDEX.md': '# Dom\n\n- [Tema](tema.md) · receta\n',
    });
    expect(structure.join()).toMatch(/entrada sin palabras clave/);
  });

  it('rechaza una entrada sin tipo o con un tipo desconocido', () => {
    const { structure } = repo({
      '.agents/dom/INDEX.md': CARD.replace('· receta', '· tutorial'),
    });
    expect(structure.join()).toMatch(/lleva «· <tipo>»/);
  });

  it('acepta palabras clave partidas en varias líneas', () => {
    const { structure } = repo({
      '.agents/dom/INDEX.md':
        '# Dom\n\n**Palabras clave**: una, dos,\ntres\n\n- [Tema](tema.md) · diseño\n',
    });
    expect(structure).toEqual([]);
  });

  it('exige el INDEX.md de una carpeta de tema', () => {
    const { structure } = repo({
      '.agents/dom/INDEX.md': CARD.replace('tema.md', 'tema/parte.md'),
      '.agents/dom/tema.md': '',
      '.agents/dom/tema/parte.md': '# Parte\n',
    });
    expect(structure.join()).toMatch(/falta el índice del tema/);
  });

  it('solo admite un README.md de dominio si es una redirección declarada', () => {
    const readme = {
      '.agents/dom/README.md': 'Ficha: [INDEX.md](INDEX.md)\n',
    };
    expect(repo(readme).structure.join()).toMatch(/aquí no va un README.md/);
    expect(
      repo(readme, {
        redirects: { '.agents/dom/README.md': '.agents/dom/INDEX.md' },
      }).structure,
    ).toEqual([]);
  });

  it('una migración cita la carpeta del dominio o su ficha, no un documento', () => {
    expect(
      repo({ 'migrations/a.ts': '// ver .agents/dom/\n' }).structure,
    ).toEqual([]);
    expect(
      repo({
        'migrations/a.ts': '// ver .agents/dom/tema.md\n',
      }).structure.join(),
    ).toMatch(/una migración solo cita la carpeta/);
  });
});

describe('lint-docs', () => {
  it('rechaza un documento nuevo de más de 500 tokens', () => {
    expect(repo({ '.agents/dom/tema.md': long(600) }).docs.join()).toMatch(
      /el tope es 500/,
    );
  });

  it('deja pasar un documento de oversized que no crece, con su resumen', () => {
    const { docs } = repo(
      { '.agents/dom/tema.md': summarized(600) },
      { oversized: { '.agents/dom/tema.md': 700 } },
    );
    expect(docs).toEqual([]);
  });

  it('rechaza un documento de oversized que crece', () => {
    const { docs } = repo(
      { '.agents/dom/tema.md': summarized(800) },
      { oversized: { '.agents/dom/tema.md': 700 } },
    );
    expect(docs.join()).toMatch(/no crece/);
  });

  it('exige quitar de oversized lo que ya cabe o ya no existe', () => {
    expect(
      repo({}, { oversized: { '.agents/dom/tema.md': 700 } }).docs.join(),
    ).toMatch(/ya cabe/);
    expect(
      repo({}, { oversized: { '.agents/dom/borrado.md': 700 } }).docs.join(),
    ).toMatch(/ya no existe/);
  });

  it('exige el resumen a un documento de oversized', () => {
    const { docs } = repo(
      { '.agents/dom/tema.md': long(600) },
      { oversized: { '.agents/dom/tema.md': 700 } },
    );
    expect(docs.join()).toMatch(/sin resumen/);
  });

  it('pone tope a la ficha y a los índices de tema', () => {
    expect(
      repo({ '.agents/dom/INDEX.md': CARD + 'x'.repeat(1200) }).docs.join(),
    ).toMatch(/el tope es 250/);
  });

  it('deja fuera registros, planes y lo generado', () => {
    const { docs } = repo(
      {
        '.agents/dom/INDEX.md': `${CARD}\n[registros/](registros/)\n`,
        '.agents/dom/registros/2026-01-01-a.md': long(900),
        '.agents/dom/planes/b.md': long(900),
        '.agents/dom/tema.md': summarized(900),
      },
      { generated: ['.agents/dom/tema.md'] },
    );
    expect(docs).toEqual([]);
  });
});
