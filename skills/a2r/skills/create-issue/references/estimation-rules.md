# Fibonacci Estimation Rules

Quick reference for estimating issues during creation.

## Allowed Scale

| Value | Allowed |
|-------|---------|
| 0 | Yes -- trivial/already resolved |
| 1 | Yes |
| 2 | Yes |
| 3 | Yes |
| 5 | Yes |
| 8 | Yes -- max per individual issue |
| 13 | Only as sum of subtasks |
| 21 | Only as sum of subtasks |

## Criteria by Level (4 AI-era dimensions)

| Points | Architectural complexity | AI reliability | Review/validation | Integration surface |
|--------|--------------------------|----------------|-------------------|---------------------|
| 1 | Isolated change | AI resolves with precision | Trivial verification | No integration |
| 2 | Established pattern, 1-2 components | AI needs little context | Tests + standard review | 1 stable integration |
| 3 | New logic, existing architecture | AI generates base, manual adjustments | New tests, logic review | 1-2 integrations |
| 5 | Multi-component, new logic | AI makes errors, dev corrects | Multi-layer: tests+security+perf | 3+ integrations |
| 8 | Cross-cutting, partial redesign | AI unreliable, human judgment | Critical validation | Cross-team, no docs |

**Key rule:** Final score is the Fibonacci value that best represents the HIGHEST dimension.

## Reference Examples

| Points | Example | Why |
|--------|---------|-----|
| 1 | Fix typo in UI | Isolated change, visual verification, AI resolves with precision |
| 2 | Add field to existing form | Established pattern, AI generates well with schema context, standard review |
| 3 | New API endpoint with business validation | Clear architecture, AI generates good CRUD but validation requires manual adjustments |
| 3 | Add email notification to an existing event | Known integration, verification with existing integration tests |
| 5 | Full frontend + backend feature with new logic | Multi-component coordination, integration requires guidance |
| 8 | Refactor critical service (migrate auth to new provider) | Cross-cutting change, AI unreliable, critical validation |

## Rule >8: Split

Issues estimated at more than 8 points MUST be split into subtasks of 8 or less.
If analyzing the 4 dimensions points to 13+, suggest decomposition.

## Spike Protocol

Create a spike when you CANNOT confidently answer ALL:
1. Can I describe what I need to the code agent?
2. Do I know how to verify the result is correct?
3. Do I know the system constraints?
4. Can I identify when the AI makes mistakes in this domain?

Spike parameters: 1-2 pts, time-box 2-4h, outcome = feasibility + approach + informed estimation.
