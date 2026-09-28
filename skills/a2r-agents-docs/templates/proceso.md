---
paths:
  - '.agents/**'
  - 'AGENTS.md'
  - '.claude/rules/**'
---

Estás tocando documentación. Lee `.agents/AI-INSTRUCTIONS.md`. En corto: cada documento vive en la
carpeta de su dominio (`.agents/<dominio>/`) y se enlaza desde su ficha `INDEX.md` (un índice de
palabras clave: `- [Título](ruta) · <tipo>` bajo una línea `**Palabras clave**:`) en el mismo
commit; planes en `planes/`, lo que tiene fecha en `registros/`. Topes: ficha 250 tokens, documento
500 (los de `oversized` no crecen). No hay `CLAUDE.md` en la raíz. `pnpm lint:docs` te dice qué
falta.
