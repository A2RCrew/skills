# Severity Guidelines

Severity classification drives the order and emphasis of findings in the review. Assign severity based on the **realistic production impact**, not on how much the code offends your sensibilities.

## Severity Levels

### critical

The change will cause a defect, outage, security vulnerability, or data loss in production if shipped as-is. This is not speculative — you can trace the failure path.

Examples:
- SQL injection via unsanitized user input in a query
- Null pointer dereference on a code path that will be hit in normal operation
- Authentication bypass (missing auth check on a new endpoint)
- Data corruption from a migration that runs concurrently with writes
- Race condition that causes double-spend, double-submit, or lost updates
- Secrets (API keys, passwords) committed to source control
- Infinite loop or unbounded recursion under normal input

Guidance: Must fix before merge. No exceptions.

### high

Significant risk of failure, regression, or technical debt with real future cost. Not guaranteed to break immediately, but the probability is high enough that shipping this is reckless.

Examples:
- Missing error handling on a network call that will fail under real conditions
- Breaking change to a public API without versioning or migration path
- N+1 query in a code path that handles user-facing list operations
- Test that always passes due to a mocking error (false confidence)
- Missing input validation on an API endpoint that accepts external data
- Timeout not configured on an external HTTP call (can hang indefinitely)
- Transaction scope too wide or too narrow, risking partial commits

Guidance: Strongly recommend fixing in this PR. If the author pushes back, they should articulate why the risk is acceptable.

### medium

A real concern that makes the code worse — harder to maintain, less reliable, or more fragile — but unlikely to cause immediate production impact.

Examples:
- Logic that works but is significantly harder to understand than necessary
- Missing test for an important edge case (code handles it, but no coverage)
- Deprecated API usage that will need migration later
- Coupling between modules that should be independent
- Inconsistent error handling patterns across related functions
- Missing observability on a new code path (no logs or metrics)
- Config value hardcoded that should be externalized

Guidance: Worth fixing in this PR if the effort is reasonable. Can be deferred with a tracked follow-up if the PR is already large.

### low

A minor improvement that would make the code slightly better. Unlikely to cause problems, but represents a missed opportunity.

Examples:
- Variable name that's technically accurate but slightly confusing
- Comment that's out of date but the code is self-explanatory
- Slight inefficiency in a non-hot path (e.g., unnecessary allocation)
- Missing log context field that would help during debugging
- Code that could be simplified using a language feature the team already uses

Guidance: Mention briefly. No pressure to address. If the author is already touching the area, it's a nice cleanup.

### nit

Pure style or personal preference. Does not affect behavior, risk, readability, or maintainability in any meaningful way.

Examples:
- Preference for one formatting style over another (when both are acceptable)
- Order of function parameters that doesn't affect usability
- Whitespace or import ordering (when linters should handle this)

Guidance: Maximum 2 nits per review. Only include if genuinely useful (e.g., the project has a convention and this breaks it). Prefix with "nit:" so the author knows it's optional. Never block a PR on nits.

## Classification Principles

1. **Severity reflects production impact, not code aesthetics.** Ugly code that works correctly is medium at worst. Clean code that loses data is critical.

2. **Err toward higher severity when the blast radius is large.** A medium-probability bug in a payment flow is high. A high-probability bug in a debug-only endpoint is medium.

3. **Consider the detection window.** A bug that would be caught by monitoring in 5 minutes is less severe than one that silently corrupts data over weeks.

4. **Account for reversibility.** A bug that can be fixed with a config change is less severe than one requiring a data migration.

5. **Distinguish between "this will break" and "this could break under certain conditions."** The former is critical or high. The latter is medium unless those conditions are likely in production.

6. **Never inflate severity to make a review look thorough.** If you only found low-severity issues, that's a good sign. Say so.
