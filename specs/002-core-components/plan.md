# Implementation Plan: Core Components — Button, Input, Dialog

**Branch**: `002-core-components` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-core-components/spec.md`

## Summary

Ship the library's three components strictly from the TapTap Figma extraction
([figma-extraction.md](figma-extraction.md)): **Button** (primary/outline/
ghost/link × default/danger × sm/md/lg, icon slots, `iconOnly` circular mode,
loading spinner), **Input** (five states × three sizes with label/error ARIA
wiring plus all seven Figma adornment sets: in-field icons, prefix/suffix,
number steppers, clearable), and **Dialog** (controlled `open`/`onClose` on
the native `<dialog>`, focus trap/restore, Escape-to-close, inert background,
sizes + dividers + scrollable body). Technical approach: prop-driven class
maps over `fui:*` semantic-token utilities (18 new semantic tokens + the
`radius-surface` 8→4 correction), native-platform behavior wherever it exists
(`showModal`, `stepUp/stepDown`, label association), zero new runtime
dependencies, full co-located Jest/Cypress/Storybook contract per component,
Smoke gate component retired. Design details: [research.md](research.md)
(R-1…R-15), [data-model.md](data-model.md), [contracts/](contracts/).

## Technical Context

**Language/Version**: TypeScript (strict) on React 19

**Styling**: Tailwind CSS v4, CSS-first `@theme` tokens (primitive → semantic CSS variables)

**Build**: Vite library mode (ESM output, type declarations, `react`/`react-dom` externalized as peers)

**Testing**: Jest + React Testing Library (unit, standalone transform) · Cypress Component Testing (Vite-mounted)

**Documentation**: Storybook (Vite builder) with full controls

**CI/CD**: GitHub Actions (install → lint → typecheck → Jest → Cypress → Storybook build → library build → release) — pipeline itself is a later feature; local gates apply now

**Target Platform**: Modern evergreen browsers; consumed as an npm package

**Project Type**: React component library (single package)

**Design Source**: TapTap copy `7OfpQVe2pYpE9MF5pQeXhH` — Button `15:12480`, Input `11:7661`, Dialog `12:11244`; all values pre-extracted in [figma-extraction.md](figma-extraction.md)

**Feature-Specific Dependencies**: `cypress-real-events` (devDependency only — real hover/active events for matrix-cell assertions, research R-11). Runtime dependencies: **none added**.

**Constraints**: no visual literals in components (Principle I); no layout shift between interactive states (borders present in all outline states, loading spinner occupies the icon slot); Button min-widths 106/98/62; `<dialog>` support in jsdom verified with shim fallback (R-10); `error+focus` precedence fixed by class-branch construction (R-5)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Token-First Styling** — every matrix cell maps to a semantic token; 18 new semantics + radius correction specified in [contracts/tokens-delta.md](contracts/tokens-delta.md); zero literals planned in components (the only non-token CSS is behavioral `appearance` resets, R-6); `/token-audit` is a quickstart gate
- [x] **II. Accessibility by Default** — A11Y-001…005 mapped to test-asserted guarantees (contracts B3–B6, I2–I4/I8, D2–D6); native semantics first (`button`, `label`, `dialog.showModal`), ARIA only for gaps; US4 keyboard journey is a dedicated Cypress spec
- [x] **III. One Consistent Component API** — all three: `ComponentPropsWithoutRef` + `forwardRef`, typed `variant`/`size` unions with defaults, merge-safe `className`, no context/global state; collisions resolved via `Omit` (R-2); `iconOnly` illegal states unrepresentable (R-4)
- [x] **IV. Tested Evidence** — every matrix cell asserted: prop-reachable states in Jest, pseudo-states via real events + computed colors in Cypress (R-11); no class-name assertions
- [x] **V. Storybook Contract** — per-variant grid stories + Playground per component (R-14); a11y addon on; zero-console-error gate (SC-003)
- [x] **VI. Library-First Packaging** — public API only via `src/index.ts` (Smoke removed, R-13); **zero new runtime deps**; one new devDependency justified (R-11, ships nothing)
- [x] **VII. Simplicity** — no variant library (R-1), no portal/focus-trap reimplementation (R-8), Warning preset as composition not API (R-15), no scroll-lock/RTL/pseudo-state addons beyond spec

**Post-Phase-1 re-check**: PASS — design artifacts introduce no violations; Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-core-components/
├── spec.md              # Feature specification (complete, checklist green)
├── figma-extraction.md  # Node-level design evidence (all values pre-extracted)
├── plan.md              # This file
├── research.md          # Phase 0 — decisions R-1…R-15
├── data-model.md        # Phase 1 — prop models, state machines, token delta
├── quickstart.md        # Phase 1 — validation guide
├── contracts/
│   ├── button-api.md    # ButtonProps + guarantees B1–B10
│   ├── input-api.md     # InputProps + guarantees I1–I10
│   ├── dialog-api.md    # DialogProps + guarantees D1–D10
│   └── tokens-delta.md  # 18 new semantics + radius-surface correction
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── tokens/
│   └── tokens.css                 # MODIFIED: +18 semantics (§2/§3), radius-surface→4px, drop --fui-radius-8
├── components/
│   ├── Button/
│   │   ├── Button.tsx             # variant/tone/size class maps, iconOnly union, spinner
│   │   ├── Button.test.tsx        # B1–B6, B8–B10 (Jest)
│   │   ├── Button.cy.tsx          # B7 hover/active computed colors, dark flips
│   │   ├── Button.stories.tsx     # 8 grids + IconOnly + WithIcons + Playground
│   │   └── index.ts
│   ├── Input/
│   │   ├── Input.tsx              # field-wrapper anatomy, adornments, steppers, clear
│   │   ├── Input.test.tsx         # I1–I6, I8(behavior), I10
│   │   ├── Input.cy.tsx           # I5 hover/focus colors, I7 steppers, I8 real typing
│   │   ├── Input.stories.tsx      # states + Adornments + Sizes + Playground
│   │   └── index.ts
│   ├── Dialog/
│   │   ├── Dialog.tsx             # controlled <dialog>, focus restore, close button
│   │   ├── Dialog.test.tsx        # D1, D3, D4, D6, D10 (jsdom; shim if needed, R-10)
│   │   ├── Dialog.cy.tsx          # D2, D5, D7–D9 + US4 keyboard journey spec
│   │   ├── Dialog.stories.tsx     # presets + Sizes + Playground
│   │   └── index.ts
│   └── Smoke/                     # DELETED (R-13)
├── lib/
│   └── cn.ts                      # NEW: falsy-filtering class join (R-1)
└── index.ts                       # MODIFIED: exports Button/Input/Dialog (+Props types) only
```

**Structure Decision**: canonical Faster UI layout, unchanged. Touched
surfaces beyond components: `tokens.css` (token delta), `src/index.ts`
(export swap), `package.json` (one devDependency), possibly `jest.setup.ts`
(dialog shim only if jsdom lacks it, R-10). Build order for implementation:
tokens → cn → Button (Dialog composes it in stories) → Input → Dialog →
US4 journey spec → Smoke retirement is part of the Button landing.

## Complexity Tracking

> No constitution violations — table intentionally empty. (The single new
> package, `cypress-real-events`, is a devDependency and does not trip
> Principle VI's runtime-dependency gate; justification in research R-11.)
