# A2R Label Taxonomy

Reference for suggesting correct labels when creating or classifying issues.

Verified against the live workspace on 2026-07-27 with `linear label list --all`.

## Label names have NO prefix

Linear label groups are a parent-child relation, not a naming convention. The group is called `Tipo`, but the label inside it is called `Bug` — **not** `Tipo` + colon + `Bug`. Passing a prefixed name like `Tipo:Bug` fails to resolve.

| Group | Child labels are named |
|-------|------------------------|
| `Tipo` | `Bug`, `Feature`, `Tarea`, `Mejora`, `Spike` |
| `Cliente` | `Sanoma`, `Ilerna`, … (exact client name) |
| `Caso de uso` | `Dashboard`, `Chatbots`, `Auth`, … (exact case name) |
| *(no group)* | `Backend`, `Frontend`, `Infra`, `Docs`, `Framework Candidate` |

There is no `Area` group: the four area labels hang from the root. Accents resolve correctly (`-l "Revisión de estilo"` works).

## Tipo (group, single selection -- ALWAYS apply one)

| Label | When to apply |
|-------|---------------|
| Bug | Defect: something that worked and now fails, or does not work as expected |
| Feature | New capability: functionality that did not exist before |
| Tarea | Operational work: migration, config, refactor, documentation |
| Mejora | Improvement to something existing: better UX, performance, simplification |
| Spike | Investigation: you need to explore before estimating or implementing |

## Area (no group, multi-selection -- apply when obvious)

| Label | When to apply |
|-------|---------------|
| Frontend | UI, components, styles, user interactions |
| Backend | API, services, business logic, database |
| Infra | DevOps, CI/CD, hosting, environment configuration |
| Docs | Documentation, guides, README |

Multiple areas can be applied at once (e.g. Frontend + Backend for a fullstack feature).

## Cliente (group, single selection -- apply when the issue is specific to a client)

Active clients:
ALMA, Anaya, Catsalut (Atención primaria), Catsalut (AXIA SEM), CTTI, Demo,
Edelvives, EMP, IE, Ilerna, Kaizente, McGraw Hill, Osakidetza, OUP Spain,
OUP UK, Sanoma, SM, UOC, Universitas XXI

Use the exact name from the list. If the issue affects several clients, choose the primary one or apply none.

## Framework Candidate (no group)

Apply when a feature developed for a client could benefit the general Framework. Signals that the team should evaluate generalizing it.

## Caso de uso (group, single selection -- MANDATORY in Framework)

Every Framework issue belongs to exactly one case, and the case resolves the assignee. In Precio Cerrado / PoC, apply only when the issue touches the core of a Framework case.

| Label | Owner (Linear username) | Scope |
|-------|------------------------|-------|
| `Dashboard` | `ivan` | Dashboard UI: views, widgets, main navigation |
| `Chatbots` | `ivan` | Conversational engine, conversations, chatbot quality tests |
| `Revisión de estilo` | `ivan` | Style review and correction of generated or edited text |
| `Ingesta` | `alex` | Upload, indexing and exploration of files; semantic ingestion, bulk URL processing |
| `Acciones personalizadas` | `lguisado` | Client-configurable actions over Framework content |
| `Imágenes` | `lguisado` | Image generation, upscale, image-to-video |
| `PDF` | `lguisado` | PDF remediation and accessibility, viewer, verification reports |
| `Evaluaciones` | `luis` | Evaluation engine, correction, criteria, convalidation |
| `Generación de preguntas` | `luis` | Question, activity and educational content generation |
| `SDC` | **TBD** | Schema Driven Chatbot: guided flows, structured validation |
| `Traducciones` | **TBD** (Miguel has no Linear account) | Content translation: markdown, IDML, docx, pptx, xlsx, audio/video; dictionaries |
| `TTS-STT` | `jesus` | Text-to-speech and speech-to-text |
| `Auth` | `jordi` | Login, OAuth, JWT, sessions, roles, user profile |
| `Transversal` | `marcos` | Infrastructure, shared tooling, cross-cutting refactors, issues with no clear case |

Two Luises: `luis` is Luis Anaya (educational content), `lguisado` is Luis Guisado (images, PDF, custom actions). Never write `--assignee luis` meaning Guisado.

For a case whose owner is TBD, apply the case label and leave the issue **unassigned** — do not guess a person. Say so in the preview.

When the case itself is unclear, apply `Transversal` (Marcos's queue) and let the team resolve it in the Monday session.

The owner column above is a convenience copy. The master table is `docs/case-owners.md` in the `a2r-linear-strategy` repo, with `case-owners.md` next to this file as the offline snapshot. Read one of those at runtime (see "Case owners: which table to read" in SKILL.md) so owner changes are picked up without touching this file.

## No `[Caso] X` projects

Earlier versions of this methodology assumed one Linear Project per case. Those projects were never created and the model was dropped: the case lives in the label. Linear Projects are used for scoped, dated work (PAU, FARO), not as a permanent folder per case. Do not pass `--project "[Caso] X"`.

## Selection Rules

1. **Tipo**: mandatory on every issue. If unclear, ask the dev.
2. **Area**: apply when evident from context. Do not force it.
3. **Cliente**: only when the issue is specific to a client. Framework issues carry no Cliente label.
4. **Framework Candidate**: when a client feature has potential for the Framework.
5. **Caso de uso**: mandatory in Framework, optional in Precio Cerrado / PoC. If unclear in Framework, apply `Transversal` rather than leaving it blank.

## Careful: `-l` replaces the whole label set on update

Verified on 2026-07-27. `linear issue update A2R-8 -l "Transversal"` left the issue with **only** `Transversal`, dropping the `Demo` label it already had.

So on any update that touches labels, read the current ones first and pass them all:

```bash
linear api '{ issue(id:"A2R-42"){ labels{ nodes{ name } } } }'
# then repeat every label you want to keep, plus the new ones
linear issue update A2R-42 -l "Bug" -l "Backend" -l "Sanoma" -l "Traducciones"
```

On `issue create` this does not apply: there is nothing to preserve.
