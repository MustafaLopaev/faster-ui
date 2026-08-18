# Data Model: Foundation & Tooling

**Feature**: `001-foundation-tooling` · **Date**: 2026-08-19

The "data" of this feature is the design-token system and the package surface. No runtime data stores exist.

## Entity: Design Token

A named, reusable design value with a documented origin.

| Field | Description | Rules |
| ----- | ----------- | ----- |
| `name` | CSS custom property name | MUST carry the `fui` prefix (natively via Tailwind `prefix(fui)` for bridged tokens, hand-written `--fui-*` for raw custom properties) |
| `layer` | `primitive` \| `semantic` | Exactly one; see layer rules below |
| `category` | `color` \| `typography` \| `radius` \| `spacing` | Drives which Tailwind namespace the semantic bridge uses (`--color-*`, `--text-*`/`--font-*`/`--leading-*`, `--radius-*`, `--spacing-*`) |
| `value` | Raw value (primitive) or reference (semantic) | Primitive: literal, defined exactly once (FR-002). Semantic: `var(--fui-<primitive>)` only — never a literal (FR-002, edge case) |
| `modes` | `{ light, dark }` for color semantics | Both REQUIRED for semantic colors (FR-013). If Figma defines no dark value: `dark = light` + `gap` note. Non-color tokens are mode-invariant (single value) |
| `source` | Figma traceability record | Figma variable/style name or node reference + inspected value; deviations carry a rationale (FR-004, SC-006) |
| `group` | Token group (below) | Every token belongs to exactly one group |

### Layer rules (validation)

- **primitive**: plain `:root` custom property, `--fui-<scale>-<step>` (e.g. `--fui-blue-500`, `--fui-radius-8`). NOT declared in `@theme` → generates no utility. Referenced only by semantic tokens, never by components.
- **semantic**: purpose-named. Color semantics: `:root` + `.dark` declarations (`--fui-action-primary`) bridged through `@theme inline` (`--color-action-primary`) → utility `fui:bg-action-primary` etc. Non-color semantics: `@theme inline` entries referencing primitives.
- Components consume **semantic utilities only** — enforced structurally (primitive utilities don't exist; Tailwind default palette/radii wiped via `--color-*: initial; --radius-*: initial`) and audited via `/token-audit`.

## Entity: Token Group

Planned groups (names finalized during extraction; spec → Token Dependencies):

| Group | Layer content | Mode-aware |
| ----- | ------------- | ---------- |
| Palette scales | primitives (color) | n/a (raw values) |
| Action colors | semantic: primary/secondary × default/hover/active/disabled + on-action text | yes |
| Feedback colors | semantic: error (+ error surface/border as Figma defines) | yes |
| Surface & background | semantic: page, raised, overlay | yes |
| Text colors | semantic: primary/secondary/inverse/disabled | yes |
| Border & focus | semantic: border-default, focus-ring | yes |
| Typography | primitives (family, sizes, weights, line-heights) + semantic sets used by controls/dialog | no |
| Radius | primitives + semantic `radius-control`, `radius-surface` | no |
| Spacing | scale per Figma grid (`--spacing` base or explicit steps) | no |

## Entity: Mode

| Field | Values | Rules |
| ----- | ------ | ----- |
| `id` | `light` (default) \| `dark` | `light` = `:root`; `dark` = `.dark` class on document root |
| activation | class toggle | No component participation (FR-013); Storybook toolbar + tests toggle the class |

State transition: `light ⇄ dark` — pure CSS variable re-resolution; zero JS in the library.

## Entity: Public API Export

| Field | Rules |
| ----- | ----- |
| Export site | `src/index.ts` only (FR-009); enforced by package `exports` map |
| Members (this feature) | `Smoke` component + its props type — temporary, removed with the first real component |
| Stylesheet | `faster-ui/styles.css` — tokens + compiled utilities; the only CSS consumers load |

## Entity: Smoke Component (temporary)

| Aspect | Contract |
| ------ | -------- |
| Props | extends `ComponentPropsWithoutRef<'div'>`; `className` merge-safe; children rendered |
| Ref | forwarded to the root element |
| Styling | semantic utilities only (action background, on-action text, control radius, token spacing) |
| Evidence | 1+ Jest test (render/children/ref), 1+ Cypress test (mount + computed token style), 1 story (+ mode switch via toolbar) |

## Entity: Command

| Command | Must | Exit |
| ------- | ---- | ---- |
| `dev` | serve locally with token styling live | n/a (long-running) |
| `build` | typecheck + produce `dist/` (JS, d.ts, styles.css) | 0 on success |
| `lint` | lint all source | 0 = clean |
| `typecheck` | check lib + test + cypress + node projects | 0 = clean |
| `test` | run Jest suites once, CI-safe | 0 = all pass |
| `cy:ct` | run Cypress component suites headless | 0 = all pass |
| `storybook` | serve workbench with mode toolbar | n/a (long-running) |
| `build-storybook` | static workbench build | 0 on success |
