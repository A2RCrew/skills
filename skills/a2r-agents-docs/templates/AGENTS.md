# <nombre-del-repo>

<Papel del repo en dos o tres frases: qué hace, para quién, con qué stack. Repos hermanos que
ejecuta o cita (`../otro-repo`). Versión de Node y gestor de paquetes.>

**La documentación se lee justo a tiempo, nunca entera**: 1) busca en la tabla de abajo la ruta que
vas a tocar o las palabras de la tarea; 2) abre esa ficha, un índice de palabras clave; 3) busca en
ella tu palabra clave; 4) abre **solo** ese documento. Lo que vive junto al código (`README.md`)
manda sobre `.agents/`. Para escribir, mover o clasificar un documento:
[`.agents/AI-INSTRUCTIONS.md`](.agents/AI-INSTRUCTIONS.md).

## Comandos

- `<pnpm dev>` · `<pnpm build>` · `<pnpm test>` · `<pnpm type-check>` · `<pnpm lint>` · `pnpm lint:docs`

## Las reglas que se rompen en el primer minuto

1. **Nada se toca sin issue de Linear (`A2R-nnn`).** El commit la cita.
2. **<Rama y PR, o push directo a `main`: lo que haga este repo.>** Commits Conventional en
   castellano.
3. **<La que más cuesta romper en este repo: datos de producción, dinero, migraciones…>**
4. **Todo documento nuevo se enlaza desde su ficha en el mismo commit** (`pnpm lint:docs`), y un
   plan ejecutado se cierra en el mismo commit.

## Dónde leer antes de tocar (ficha de dominio)

| Si vas a tocar… | Palabras clave | Lee primero |
| --- | --- | --- |
| `<src/modulo/**>`, `<otra/ruta.ts>` | <término, identificador, english term> | `.agents/<dominio>/INDEX.md` |
| `.env*`, `package.json`, CI, despliegue, entornos | entorno, credenciales, despliegue, CI, local | `.agents/plataforma/INDEX.md` |
| Estilo, tests, revisión de código, qué es el producto, glosario | estilo, testing, revisión, producto, glosario | `.agents/comun/INDEX.md` |
