# Crear `.agents/` en un repo

Siete fases. Las fases 1 y 2 no escriben nada; a partir de la 3 todo va en una rama de trabajo
(o en `main` si el repo pushea directo, según su `AGENTS.md` o `.git/a2r.conf`).

`$S` = `${CLAUDE_PLUGIN_ROOT}`.

## 1. Detectar

Sin preguntar, reúne:

- **Stack y comandos**: `package.json` (gestor por el lockfile: `pnpm-lock.yaml`, `package-lock.json`,
  `bun.lockb`), `"type": "module"`, Vitest, ESLint, `tsconfig.json`, `.nvmrc`. Si no hay
  `package.json`, los linters se ejecutan con `npx tsx`, y hace falta Node.
- **Documentación que ya existe**: `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/`, `.cursor/`,
  `.claude/rules/`, `.github/copilot-instructions.md`, `CLAUDE.md`/`AGENTS.md`/`README.md` junto al
  código, y lo que haya en `.agents/`. Si `.agents/` tiene `README.md` o carpetas por tipo, esto es
  una migración: ve a `actualizar.md`.
- **`.agents/skills/` o `skills-lock.json`**: el almacén de skills de `npx skills`. Se queda donde
  está y va en `excluded`.
- **Candidatos a dominio**: las zonas de código que alguien tocaría por separado. Salen de las
  carpetas de primer nivel de `src/`, `app/`, `apps/*`, `packages/*` y `scripts/`, de los módulos
  con README propio y de los temas de la documentación existente. Un dominio es una zona de código,
  no un tipo de documento. Suelen ser de 3 a 10 más `comun` y `plataforma`.
- **Hooks**: `.pre-commit-config.yaml`, `.husky/`, `lefthook.yml`, `.git/hooks/pre-commit` (el de
  `a2r-git` empieza por `# A2R.`).

## 2. Entrevistar

Una sola ronda de `AskUserQuestion`:

1. **Dominios**: la propuesta con sus rutas de código («`src/billing/**` → `facturacion`»). Se puede
   quitar, renombrar o añadir. `comun` y `plataforma` van siempre.
2. **Papel del repo**: una frase para la cabecera de `AGENTS.md`. Propón una sacada del README.
3. **Repos hermanos**: si hay otros repos que este ejecuta o cita (`../otro-repo`), para la cabecera
   y para las citas cruzadas.
4. **Hook**: si se añade el hook `docs-index` al pre-commit (recomendado).

## 3. Crear la estructura

1. **Schema.** Copia `$S/scripts/structure-schema.json` a `.agents/scripts/` y rellena:
   - `domains`: `comun`, `plataforma` y los confirmados;
   - `excluded`: `node_modules/` más las salidas del build (`.next/`, `dist/`, `results/`…), y
     `.agents/skills/` si existe;
   - `docs/`: ver la sección `docs/` de `convenciones.md` (`stubs`, `excluded` o `forbidden`).
2. **Linters.** Copia `lint-structure.ts`, `lint-docs.ts` y `lint.test.ts` de `$S/scripts/` sin
   tocarlos.
3. **Entrada.** `.agents/AI-INSTRUCTIONS.md` desde `$S/templates/AI-INSTRUCTIONS.md`, con los
   huecos `<…>` rellenos.
4. **Por dominio**:
   - `.agents/<dominio>/INDEX.md` desde `templates/INDEX.md`;
   - `.agents/<dominio>/trampas.md` desde `templates/trampas.md`, con lo que ya se sabe que rompe o
     con una sola línea si no hay nada;
   - `.claude/rules/<dominio>.md` desde `templates/regla.md` (salvo `comun`), con los `paths:` del
     dominio.
5. **`.claude/rules/proceso.md`** desde `templates/proceso.md`.
6. **`AGENTS.md`** desde `templates/AGENTS.md`, con una fila por dominio. Si ya existía, conserva lo
   que sirve (comandos, reglas) y reordénalo en las secciones de la plantilla. Si hay bloques
   generados por otra herramienta (`<!-- BEGIN:… -->`), se quedan al final, intactos.
7. **La documentación que ya existe**, a su dominio:
   - `git mv` a `.agents/<dominio>/<tema>.md`. En el commit del movimiento solo cambian los enlaces
     y la cabecera, para que git detecte el renombrado (`git log --follow`). Reescribir el
     contenido va en otro commit.
   - Cada documento movido se enlaza desde su ficha, bajo sus palabras clave y con su tipo.
   - Si pasa de 500 tokens, pártelo (`actualizar.md`, «Partir un documento»). Si partirlo hoy es
     demasiado, deja que el trinquete lo congele (paso 8).
   - Lo que tiene fecha o retrata un momento va a `registros/AAAA-MM-DD-<slug>.md`; los planes
     abiertos, a `planes/`.
   - Lo que es de un módulo y ya vive junto a su código se queda allí y se enlaza desde la ficha.
   - `.cursor/rules` genéricas que contradicen el repo se proponen para borrar; las útiles pasan a
     su dominio.
   - **`CLAUDE.md` en la raíz**: su contenido pasa a `AGENTS.md` (lo que cabe en 60 líneas) o a
     `comun/` y `plataforma/`. Pide OK antes de borrarlo. Si alguien lo necesita para
     `@`-imports, `.claude/rules/` cubre el caso.
   - No escribas documentos nuevos de relleno. Una ficha con solo `trampas` es válida; el contenido
     llega cuando alguien lo escribe contra el código.
8. **Trinquete.** Con todo movido y enlazado:
   `npx tsx .agents/scripts/lint-docs.ts --write-baseline`. Escribe en `oversized` los que se pasan.
   Cada uno necesita su resumen `> ` de ≤80 tokens en las cinco primeras líneas; escríbelo.

## 4. `.gitignore`

Añade, si no están:

```gitignore
# Notas de una sesión de agente (.agents/AI-INSTRUCTIONS.md).
.agents/.scratch/
```

Si `.gitignore` ignora `.claude/` entero, cámbialo a `.claude/*` + `!.claude/rules/` (y
`!.claude/skills/` si se versionan skills), y enséñalo antes: toca lo que se versiona.

## 5. `package.json`

- Script: `"lint:docs": "npx tsx .agents/scripts/lint-structure.ts && npx tsx .agents/scripts/lint-docs.ts"`.
  Si `tsx` ya es dependencia, sin `npx`.
- Vitest: añade `'.agents/scripts/**/*.test.ts'` al `include` (o al del proyecto `node` si hay
  varios).
- `tsconfig.json`: `.agents/scripts/**/*.ts` en `include` si `type-check` debe cubrirlos.
- ESLint: `.agents/scripts/**` en los ignorados si las reglas del repo chocan con un script de
  consola.
- Con `"type": "module"`: los linters usan `__dirname` y `require.main`, y fallan con
  `__dirname is not defined`. No los edites: crea `.agents/scripts/package.json` con
  `{ "type": "commonjs" }`, que vale solo para esa carpeta.

## 6. Hook (si se aceptó)

Con el framework pre-commit (el de los repos de A2R), añade la entrada de
`$S/templates/pre-commit-config.yaml` a `.pre-commit-config.yaml`, creándolo si no existe, y di
que cada persona lo activa con `pre-commit install`. Si ya hay un `.git/hooks/pre-commit` de
`a2r-git`, pre-commit lo conserva como `pre-commit.legacy` y lo sigue ejecutando.

Con husky o lefthook, añade `pnpm run lint:docs` al hook de pre-commit que ya usan.

**Nunca sobrescribas `.git/hooks/pre-commit`.**

## 7. Informe

Ejecuta `pnpm lint:docs` (y `pnpm test` si hay Vitest) y arregla hasta que pasen. Luego enseña:

```
## Documentación de agentes creada

**Repo**: <nombre> · **Papel**: <una frase>
**Dominios**: comun, plataforma, <…>

### Creado
- AGENTS.md (<n> líneas) · .agents/AI-INSTRUCTIONS.md
- .agents/<dominio>/INDEX.md + trampas.md, por dominio
- .claude/rules/<dominio>.md + proceso.md
- .agents/scripts/ (linters + structure-schema.json)
- .gitignore · package.json (lint:docs, vitest) · hook docs-index (si se aceptó)

### Movido
- <origen> → <destino>

### En oversized
- <ruta> (~<tokens>): partir en un tema cuando se toque

### Siguientes pasos
1. Escribir las recetas que más se echan en falta, contra el código.
2. Prueba de humo: dos o tres tareas reales llegan a su ficha y a ≤2 documentos.
```

Commit: `docs(agents): documentación de agentes por dominio en .agents/ (A2R-nnn)`.
