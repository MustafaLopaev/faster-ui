# Faster UI Constitution

Faster UI is a production-grade React component library (Button, Input, Dialog)
built as a design-system foundation. Every artifact in this repository —
specs, plans, tasks, and code — is governed by the principles below.

## Core Principles

### I. Token-First Styling (NON-NEGOTIABLE)

No color, radius, spacing, or typography value may be hardcoded inside a
component. All visual values flow through the design token system:

- **Primitive tokens** (raw palette, e.g. `--color-blue-500`) are defined once
  in the token layer and never referenced by components directly.
- **Semantic tokens** (purpose-named, e.g. `--color-action-primary`,
  `--color-feedback-error`) map primitives to intent. Components consume
  semantic tokens only, via Tailwind utilities generated from them.
- Adding a theme or rebranding must be possible by changing token values only,
  with zero component edits.

Raw hex/rgb/hsl values, arbitrary Tailwind values like `bg-[#3b82f6]`, and
non-token spacing literals in component files are constitution violations.

### II. Accessibility by Default (NON-NEGOTIABLE)

Components must be usable by everyone, out of the box:

- WCAG 2.1 AA is the baseline. Interactive elements are fully keyboard
  operable, with visible focus indicators driven by tokens.
- Semantic HTML first (`button`, `input`, `dialog`), ARIA only to fill gaps.
- Dialog manages focus correctly: trap while open, restore on close,
  `Escape` closes, background is inert.
- Inputs are always labelled; error states are announced
  (`aria-invalid` + `aria-describedby`), never conveyed by color alone.
- Accessibility behavior is asserted in tests, not assumed.

### III. One Consistent Component API

All components share the same API contract so learning one means knowing all:

- Typed props extending the native element
  (`ComponentPropsWithoutRef<'button'>` etc.) with full passthrough.
- `ref` is forwarded to the underlying interactive element.
- Visual variants are expressed via `variant` / `size` props with typed
  unions and sensible defaults; state via native attributes (`disabled`)
  or explicit props (`error`) — never via className contracts.
- `className` is accepted as a merge-safe escape hatch, never required
  for correct rendering.
- No component reaches outside itself (no global state, no context
  requirements) — each is independently usable.

### IV. Tested Evidence, Not Claimed Quality

A component does not exist until it ships with its full test contract:

- **Jest + React Testing Library**: rendering, every variant and state,
  user interactions, and accessibility assertions (roles, names,
  keyboard flows).
- **Cypress component tests**: mounting, rendering validation, and real
  interaction flows (Dialog open/close, Input typing, Button clicking).
- Tests assert observable behavior from the user's perspective, never
  implementation details (no class-name assertions as behavior proofs).
- All tests pass locally and in CI before a task is marked complete.

### V. Storybook Is the Contract's Documentation

Every component ships stories in the same structure:

- One story per variant and per meaningful state (disabled, error,
  loading, open/closed) so reviewers see the full matrix.
- A **Playground** story exposing every public prop as a control.
- Stories render with zero console errors or warnings.
- Stories are written for the consuming developer: realistic usage,
  not test fixtures.

### VI. Library-First Packaging

This is a consumable npm library, not an app:

- `react` and `react-dom` are peer dependencies; runtime dependencies are
  kept to the minimum and each must be justified.
- Public API is exported only through `src/index.ts`; internals are private.
- Semantic versioning; releases are automated through CI, never manual.

### VII. Simplicity Within the Mandate

The tech stack is fixed by the task brief (see Mandated Stack). Within it,
prefer the simplest solution that satisfies the spec: no speculative
abstractions, no extra components, no configuration options nobody asked
for. Complexity must be justified in the plan's Complexity Tracking table.

## Mandated Stack

These choices are fixed by the task brief and are not revisited per-feature:

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Framework          | React 19 + TypeScript (strict)                     |
| Styling            | Tailwind CSS v4 (CSS-first `@theme` tokens)        |
| Tokens             | CSS variables (primitive → semantic) + Tailwind    |
| Build              | Vite (library mode, ESM + type declarations)       |
| Unit tests         | Jest + React Testing Library (standalone from Vite)|
| Component tests    | Cypress Component Testing (Vite-mounted)           |
| Documentation      | Storybook (Vite builder)                           |
| CI/CD              | GitHub Actions                                     |
| Design source      | TapTap Design System Figma file                    |

## Development Workflow

Work follows the spec-kit lifecycle: constitution → `/speckit-specify` →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Specs stay at
feature granularity (foundation, components) — not one spec per prop.

**Definition of Done for any component:**

1. Matches the Figma specification (typography, color, radius, spacing,
   states) via tokens.
2. Implements the API contract of Principle III.
3. Jest suite and Cypress component suite both pass.
4. Stories cover all variants/states plus a Playground.
5. Lint, typecheck, and production build pass.
6. No console errors anywhere.

**Quality gates (CI):** install → lint → typecheck → Jest → Cypress →
Storybook build → library build → release. A red pipeline blocks merge.

## Governance

This constitution supersedes ad-hoc practices. Every plan must pass the
Constitution Check gate before implementation; violations require an entry
in Complexity Tracking with a justification, or the plan is reworked.
Amendments are made by editing this file with a version bump and a dated
rationale in the commit message.

**Version**: 1.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19
