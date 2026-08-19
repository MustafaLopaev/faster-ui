---
name: design-drift
description: Compare the TapTap Design System variables in Figma against the committed token layer and report drift, suppressing the deviations the extraction records already document. Local only — the Figma connector is authenticated on the developer machine and a CI runner has no path to it. Use before a release, after a design review, or whenever the design source is known to have moved.
---

# Design drift watcher

The token layer's entire premise is fidelity to a source that can change without
telling anyone. This is the check for that.

**This skill runs locally and cannot run in GitHub Actions** (004 research R-12).
The Figma connector is authenticated on the developer machine; a runner has no
path to it. Putting a Figma REST token in repository secrets would compare
against a *differently shaped* source than the one the extraction was performed
through — that is a correctness risk, not merely a cost difference, so it was
rejected rather than deferred.

## Read the extraction records FIRST

Before comparing anything, read both:

- `specs/001-foundation-tooling/figma-extraction.md`
- `specs/002-core-components/figma-extraction.md`

They document **deliberate** deviations from the Figma file. Reporting one of
these as drift is worse than reporting nothing: it teaches the reader that this
report contains noise, and after that they skim it. A scheduled check nobody
reads has negative value — it costs attention and returns none.

Known deviations, which are **never** drift:

| Token / value | Why it deviates |
| ------------- | --------------- |
| `radius-surface` = 4px | The 002 correction. The 8px reading came from a demo artboard; the Dialog panel's node-verified radius is 4px, and the `--fui-radius-8` primitive was deleted with it. |
| Every value in `src/tokens/a11y.css` | The opt-in AA overlay. It deviates from the palette **on purpose** — the TapTap palette does not reach WCAG AA, and the overlay is the resolution. |
| The 27 pinned contrast deviations | Recorded in `src/tokens/tokens.test.ts` → `BASE_DEVIATIONS`. Figma-faithful by design. |
| `Input affix text` below 4.5:1 | Recorded in `AA_DEVIATIONS` and `specs/004-quality-automation/findings.md` F-2. |

If a deviation is deliberate but **not** recorded in one of those files, that is
itself the finding: report it as `undocumented-deviation`, because an
undocumented deviation is indistinguishable from a mistake six months later.

## What to compare

| Figma | Code |
| ----- | ---- |
| Colour variables | `src/tokens/primitives/color.css`, `src/tokens/semantic/light.css`, `src/tokens/semantic/dark.css` |
| Type styles | `src/tokens/primitives/typography.css` |
| Corner radii, spacing | `src/tokens/primitives/geometry.css` |
| Effects / shadows | `src/tokens/primitives/elevation.css` |

Use `mcp__figma__get_variable_defs` on the TapTap file (the link is in
`docs/udc-requirements.md`) and compare resolved values, not names — the two
naming schemes differ by design, and the semantic layer is a deliberate
re-mapping rather than a mirror.

## Outcomes

Every token lands in exactly one of three states.

| Status | Meaning |
| ------ | ------- |
| `drift` | The Figma value changed and the code did not. Report it with both values. |
| `recorded-deviation` | Deliberate, and documented in an extraction record. **Silent.** |
| `unreachable` | The comparison could not be made. |

### `unreachable` is a required outcome, not an error path

If the Figma connector is unavailable — not authenticated, the file moved, the
network is down — **say so, loudly, at the top of the report**. Do not fall back
to a partial comparison and present it as a full one.

> ⚠️ Could not reach the TapTap file. **No drift check was performed.** This is
> not an all-clear.

An all-clear the check did not establish is worse than no report at all: it is
the one output that actively misleads. This is the single behaviour separating a
useful scheduled check from a dangerous one (FR-032).

## Output

A report, or a GitHub issue. **Never a code change.** Fixing drift means either
updating the token layer or updating the extraction record, and which one is
correct is a design decision — the entire point of surfacing it to a human.

```
## Design drift — <date>

Source: TapTap Design System (<file key>)
Status: <compared | UNREACHABLE>

### Drift (N)
- `--fui-primary-600`: Figma `#0f9aa1` → code `#12a4ab`
  …

### Recorded deviations (N, not reported)
…listed by name only, so the reader can see the suppression list is not empty…

### Undocumented deviations (N)
- `--fui-…`: differs from Figma and is recorded nowhere. Either record it or fix it.
```

Listing the suppressed count matters: a report that says "0 drift" and shows no
suppression list is indistinguishable from a report that silently suppressed
everything.
