# Review Output Format

This is the exact structure the review output must follow. Do not add extra sections. Do not rearrange. Findings first, summary last.

## Structure

```
## Findings

### 1. [Short descriptive title] — [severity]

**File:** `path/to/file.ext`, function `functionName` (line ~NN)
**What:** One or two sentences describing the problem precisely.
**Why it matters:** The practical impact — what breaks, what's at risk, what degrades.
**Evidence:** The relevant code, quoted or referenced. Use code blocks when helpful.
**Recommendation:** A concrete fix or direction. Include a code snippet if it clarifies the intent.

---

### 2. [Short descriptive title] — [severity]

(Same structure. Repeat for each finding.)

---

## Open Questions

> Include this section only when there are unresolved questions that materially affect the review. If you have no open questions, omit the section entirely.

- [Question about an assumption, missing context, or ambiguity that changes the severity or nature of a finding]

## Residual Risks

> Always include this section, even when there are no findings. This is where you document what you could not fully verify.

- [Areas with limited test coverage]
- [Operational behavior you could not verify (e.g., behavior under load, interaction with external services)]
- [Assumptions you made due to limited context]

## Summary

[2-4 sentences. Overall assessment: is this change correct, safe, and maintainable? What are the key themes? Is it ready to merge, ready with changes, or needs significant rework?]
```

## Formatting Rules

1. **Finding titles are short and descriptive.** Good: "Missing null check on user address." Bad: "Potential issue with data handling."

2. **Severity is always one of:** critical, high, medium, low, nit.

3. **File paths are relative to the repository root.** Use backticks.

4. **Code evidence uses fenced code blocks** with the appropriate language tag.

5. **Recommendations include code when it helps.** Don't write 10 lines of prose when a 3-line code snippet makes the fix obvious.

6. **Use horizontal rules** (`---`) between findings for visual separation.

7. **Findings are numbered** starting from 1, ordered by severity (critical first, nit last).

8. **One finding per issue.** Don't bundle multiple unrelated problems into one finding. If a single root cause causes multiple symptoms, group them under the root cause.

## Special Cases

### No findings

When there are no material issues:

```
## Findings

I did not find any material issues in this change.

## Residual Risks

- [What you couldn't fully verify]
- [Areas that depend on assumptions]

## Summary

[Brief positive assessment with any caveats about what you couldn't verify.]
```

### Very large changesets

For changesets over ~500 lines, start with a brief scope note:

```
> This review covers N files and ~M lines of changes. I focused on [areas] given the size. [Other areas] would benefit from a focused follow-up review.
```

Then proceed with the standard format.

### Changesets with mixed severity

When a change has both critical and low-severity findings, make the severity gap visually clear. The critical finding should have enough detail that the author immediately understands the urgency. Low findings can be more concise.

## Anti-Patterns

Avoid these in review output:

- **Leading with a preamble or summary.** Findings first.
- **Vague titles.** "Consider improving error handling" — which error handling? Where?
- **Findings without evidence.** If you can't point to the code, it's not a finding.
- **Recommendations without direction.** "This should be fixed" is not a recommendation.
- **Excessive praise.** One sentence of acknowledgment is fine. A paragraph of compliments wastes the author's time.
- **Exhaustive low-value comments.** Three high-impact findings are more useful than fifteen nits.
- **Duplicating linter output.** If a linter should catch it, say "configure your linter" once. Don't list every instance.
