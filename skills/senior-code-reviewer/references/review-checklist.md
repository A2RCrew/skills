# Review Checklist

Use this as a mental checklist during review. Not every item applies to every change — focus on what's relevant to the diff at hand.

## Correctness and Logic

- Does the code do what the author intended?
- Are conditionals correct? Watch for off-by-one, inverted logic, short-circuit evaluation mistakes.
- Are return values and error codes handled at every call site?
- Are type conversions safe? Watch for implicit coercions, truncation, precision loss.
- Is arithmetic correct? Watch for integer overflow, floating-point comparison, division by zero.
- Are nullable/optional values checked before dereferencing?
- Do loops terminate? Are bounds correct?

## Regressions

- Does this change break any existing behavior that callers or users depend on?
- Are there callers of modified functions that now receive different behavior?
- Does changing a default value, config key, or environment variable affect existing deployments?
- Were any public API signatures or response shapes changed?

## Edge Cases and Error Handling

- What happens with empty input, null, zero, negative, maximum, or unexpected values?
- Are error paths handled, or does the code only cover the happy path?
- Are exceptions/errors caught at the right level? Not too broad, not too narrow.
- Are resources (files, connections, locks) released in error paths?
- Does the code handle partial failure (e.g., 3 of 5 items in a batch fail)?

## Security

- Is user input validated and sanitized before use in queries, commands, or output?
- Are SQL queries parameterized? Are OS commands escaped?
- Is authentication and authorization enforced at the right layer?
- Are secrets hardcoded, logged, or exposed in error messages?
- Are new endpoints or routes properly authenticated?
- Is sensitive data (PII, tokens, credentials) handled according to policy?
- Are cryptographic operations using current, safe primitives?
- Is there SSRF, XSS, CSRF, or path traversal risk?

## Performance

- Are there O(n^2) or worse operations hidden in loops or nested iterations?
- Are database queries efficient? Missing indexes, N+1 queries, full table scans?
- Is there unnecessary work inside hot loops?
- Are large objects or collections loaded when only a subset is needed?
- Is caching used appropriately? Is cache invalidation correct?
- Are file or network I/O operations blocking where they shouldn't be?

## Concurrency and Race Conditions

- Is shared mutable state protected by appropriate synchronization?
- Are there TOCTOU (time-of-check/time-of-use) races?
- Are database operations that should be atomic actually wrapped in transactions?
- Is there potential for deadlock (lock ordering, nested locks)?
- Are concurrent data structures used correctly?
- Is the code safe under retry or re-entrant execution?

## Data Integrity

- Are database migrations safe? Can they be rolled back? Do they lock tables?
- Is data validated at the boundary (API input, file parsing, deserialization)?
- Are schema changes backward-compatible with running code during deployment?
- Is there risk of data corruption from partial writes or concurrent updates?
- Are invariants maintained across related tables or data stores?

## API Contracts and Compatibility

- Are API changes backward-compatible? Can existing clients still work?
- Are new required fields a breaking change for existing consumers?
- Is the API versioned or does the change need a version bump?
- Are response shapes stable? Could clients break on new/removed fields?
- Are gRPC/protobuf contracts updated correctly?
- Is error response format consistent with existing conventions?

## Design Clarity

- Is the responsibility of each function/class/module clear?
- Is there unnecessary coupling between components?
- Are abstractions earning their weight, or adding complexity without value?
- Is the code organized so that the next person can understand it without the author's help?
- Are names descriptive and consistent with the codebase conventions?

## Readability and Maintainability

- Can a new team member understand this code in 6 months?
- Are complex operations explained with comments that say WHY, not WHAT?
- Is the code DRY where it matters, but not over-abstracted?
- Are magic numbers, hardcoded strings, or undocumented thresholds explained?
- Is the control flow straightforward? Deep nesting and early-return soup both hurt.

## Observability

- Are new code paths logged at appropriate levels?
- Are error logs actionable? Do they include enough context to diagnose?
- Are metrics emitted for new operations (latency, error rate, throughput)?
- Is distributed tracing propagated correctly?
- Can an on-call engineer debug a failure in this code at 3am with the available logs and metrics?

## Testing

- Are new code paths covered by tests?
- Are edge cases and error paths tested?
- Are tests testing behavior, not implementation details?
- Are mocks used appropriately? Over-mocking hides real integration issues.
- Are tests deterministic (no time-dependent, order-dependent, or flaky patterns)?
- Is there integration or end-to-end coverage for critical paths?
- If this is a bugfix, is there a regression test that would have caught the original bug?

## Deployment and Operational Risk

- Is this change safe to deploy incrementally (rolling deploy, canary)?
- Does this need a feature flag?
- Is there a rollback plan? What breaks if we roll back?
- Are database migrations forward-only, or can they be reversed?
- Does this change affect background jobs, cron tasks, or async workers?
- Are environment variables, config keys, or secrets managed correctly?

## Dependencies and Supply Chain

- Is a new dependency justified? Could the functionality be implemented without it?
- Is the dependency actively maintained and widely used?
- Is the specific version pinned? Are there known vulnerabilities?
- Does the dependency have a permissive or compatible license?
- Does it increase build time, bundle size, or attack surface significantly?

## Frontend (when applicable)

- Are loading, error, and empty states handled?
- Is the component accessible (keyboard navigation, screen readers, contrast)?
- Does the component handle re-renders efficiently?
- Is user input validated on the client AND the server?
- Are there memory leaks (unsubscribed listeners, unmounted component updates)?
- Does it work across supported browsers and viewports?

## Backend (when applicable)

- Are inputs validated at the API boundary?
- Are operations idempotent where they should be?
- Are retries safe? Is there backoff?
- Are timeouts configured for external calls?
- Are database transactions scoped correctly?
- Is data consistency maintained across services?

## Infra/DevOps (when applicable)

- Are secrets injected securely (not hardcoded, not in source control)?
- Are IAM permissions scoped to minimum required?
- Is monitoring and alerting configured for new infrastructure?
- Can the change be rolled back without downtime?
- Are health checks and readiness probes configured?
- Is there sufficient logging and metrics for operational visibility?
