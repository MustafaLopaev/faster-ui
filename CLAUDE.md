# Faster UI — Claude Code Guide

Production-grade React component library (**Button**, **Input**, **Dialog** —
all three shipped, exported with their prop types from `src/index.ts`) for a
design-system engineering task. Full brief: `docs/udc-requirements.md`.
Design source: TapTap Design System Figma file (link in the brief); component
usage and props tables live in `README.md`.

## Governing documents (read in this order)

1. `.specify/memory/constitution.md` — the project constitution. Seven
   principles (token-first styling, a11y by default, consistent API, mandatory
   tests, Storybook contract, library-first packaging, simplicity) plus the
   Definition of Done for components. **All work must comply.**
2. `specs/[###-feature]/` — the active feature's spec, plan, and tasks.

## Workflow

This repo uses **spec-driven development** via GitHub spec-kit:

`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`

- Specs live in `specs/`, one per feature (foundation, components) — not one
  per prop. Templates in `.specify/templates/` are pre-tailored to this repo.
- Never start implementation work that has no spec/tasks backing, except
  trivial fixes.
- Custom skills: `/new-component` scaffolds a complete component contract;
  `/token-audit` checks for hardcoded visual values.

## Architecture decisions (settled — don't re-litigate)

- **Vite stays** (library mode for the build; also powers Storybook and
  Cypress CT). Jest runs standalone with its own transform because the brief
  mandates Jest over Vitest.
- **Tailwind CSS v4**, CSS-first, in `src/tokens/` (the single source of every
  visual value), **split by tier** — `tokens.css` is the entry that wires the
  parts together and owns the two top-level rules (`@layer` order, `@source`).
  Layering: **primitives** are private `--fui-*` custom properties on `:root`
  (deliberately *not* in `@theme`, so no primitive utilities exist);
  **semantics** are purpose-named refs re-declared under `.dark`; a
  `@theme inline` bridge generates the only utilities components may use —
  all `fui:`-prefixed (native `prefix(fui)`).
  - **Import order is load-bearing**: `reset.css` after Tailwind's theme and
    before `bridge.css`; `semantic/dark.css` after `semantic/light.css`
    (`.dark` ties `:root` on specificity, so source order decides).
  - `reset.css` wipes Tailwind's `--color|radius|font|font-weight|text|shadow|container-*`
    namespaces, so no off-system utility exists. Preflight is deliberately not
    imported (the shipped stylesheet must not restyle host elements).
  - **Primitives must avoid Tailwind's prefixed theme namespaces.** With
    `prefix(fui)` every `@theme` key emits as `--fui-<key>`, so typography is
    `--fui-family|weight|size|lh-*` and the pill radius is `--fui-radius-pill`.
    Reusing a namespace makes the bridge emit `--fui-x: var(--fui-x)`.
  - **Tailwind source scanning is explicitly scoped** (`source(none)` +
    `@source`), library components only. Stories, Jest and Cypress specs are
    excluded so their utilities never reach the published stylesheet; the
    playground, Storybook and Cypress each have their own entry stylesheet
    (`src/dev.css`, `.storybook/preview.css`, `cypress/support/component.css`)
    that widens the scope for themselves.
  - **`src/tokens/a11y.css`** is an opt-in overlay published as
    `@mlopaev/faster-ui/a11y.css`. The TapTap palette does not reach WCAG AA
    (white on Primary/600 is 2.12:1); the base layer stays Figma-faithful and
    this layer re-points semantics to reach AA in both modes. Don't "fix" the
    base palette — the deviations are recorded and pinned in tests.
  - **Runtime theming is a public contract**: `@theme inline` keeps `var()`
    live at the use site, so a consumer re-themes by overriding `--fui-*` with
    no rebuild. The supported token list is in README.md#theming.
- **Dialog** wraps the native `<dialog>` element (top-layer, focus handling)
  with a controlled React API (`open`/`onClose`; it never closes itself —
  Escape is intercepted via `onCancel` preventDefault).
- **react / react-dom are peer dependencies.** Public API exports only
  through `src/index.ts`: `Button`/`Input`/`Dialog` + their prop types.
- **No variant library**: styling is plain TS lookup maps of static `fui:*`
  class strings joined by `src/lib/cn.ts` (002 research R-1). Button's
  `iconOnly` constraints are a discriminated union — illegal combinations
  are TS errors with a dev-only `console.warn` backstop.
- **`radius-surface` is 4px** (002 correction: the Dialog panel's
  node-verified corner radius; the foundation's 8px reading came from a demo
  artboard, and the `--fui-radius-8` primitive was deleted with it).
- **`src/tokens/tokens.test.ts` is the token layer's contract test**: bridge ↔
  semantics bijection, no dangling `var()`, no dark/a11y override of a
  nonexistent token, no bridge-key/token-name collision, no raw colour literal
  in a semantic block, and the full WCAG contrast matrix for both modes and
  both layers. Add a new rendered colour pair to its `PAIRS` table.
- **No preflight means components own every property**: border/outline
  *style* must be set explicitly (`fui:border-solid`, `fui:outline-solid`),
  headings/paragraphs need `fui:m-0`, buttons/inputs reset their UA styling.
- **jsdom has no `<dialog>` methods** (jsdom 26): `jest.setup.ts` carries a
  minimal `show/showModal/close` shim; real modal behavior (top layer,
  inertness, trap) is asserted in Cypress only.
- **Pseudo-state matrix cells** (hover/active) are asserted in Cypress with
  `cypress-real-events` + computed-color checks against resolved token
  values. The CDP mouse persists between tests — park it on a spacer
  (`data-cy="park"`) before asserting rest-state colors.

## Layout

```text
src/tokens/            tokens.css      entry: layer order, imports, @source
                       reset.css       wipes Tailwind's default theme namespaces
                       primitives/     color, typography, geometry, elevation
                       semantic/       light.css then dark.css (order matters)
                       bridge.css      @theme inline — the only utility surface
                       a11y.css        opt-in WCAG AA overlay (shipped separately)
                       tokens.test.ts  drift guard + contrast matrix
                       tokens.cy.tsx   real-browser proof of the theming contract
                       Tokens.stories.tsx  live catalogue read from the stylesheet
src/components/<Name>/ <Name>.tsx + .test.tsx (Jest) + .cy.tsx (Cypress)
                       + .stories.tsx + index.ts   (co-located contract)
                       Button/, Input/, Dialog/ (+ Dialog.journey.cy.tsx —
                       the US4 keyboard-only composition spec)
src/lib/               shared internals: cn.ts (falsy-filtering class join)
src/index.ts           the only public export surface
src/main.tsx           dev playground (not part of the library build)
src/dev.css            playground stylesheet (widens @source; not shipped)
scripts/postbuild.mjs  copies a11y.css into dist + enforces the size budget
```

TypeScript is split into four referenced projects (Jest and Cypress globals
collide): `tsconfig.lib.json` (shipping code), `tsconfig.test.json`
(*.test.tsx, stories, playground, .storybook/preview.tsx), `tsconfig.cypress.json`
(*.cy.tsx + cypress/), `tsconfig.node.json` (config files).

## Commands

```bash
npm run dev              # Vite dev playground (live token styling)
npm run build            # tsc -b && vite build → dist/ (ESM + d.ts + styles.css)
npm run lint             # oxlint (a11y + correctness; zero warnings allowed)
npm run typecheck        # tsc -b (all four TS projects)
npm test                 # Jest (test:watch for TDD)
npm run test:coverage    # Jest with thresholds enforced (jest.config.ts)
npm run cy:ct            # Cypress component tests headless (cy:open interactive)
npm run storybook        # Storybook dev at :6006 (light/dark toolbar)
npm run build-storybook  # static workbench build
```

Quirk: in shells where `ELECTRON_RUN_AS_NODE=1` is exported (e.g. VS Code
extension terminals), Cypress must run with it unset:
`env -u ELECTRON_RUN_AS_NODE npm run cy:ct`.

## Conventions

- TypeScript strict; props extend the native element via
  `ComponentPropsWithoutRef<'...'>`; forward refs; set an explicit
  `displayName`; `variant`/`size` as typed unions with defaults; `className`
  merge-safe escape hatch. Every public prop carries JSDoc — it is what
  IntelliSense and Storybook autodocs render.
- Tests assert user-observable behavior (roles, accessible names, keyboard
  flows) — never class names as behavior proofs.
- No hardcoded colors/spacing/radii in components — semantic tokens only.
  `bg-[#hex]`-style arbitrary values are constitution violations.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Anything a consumer would notice gets a bullet under `## [Unreleased]` in
  `CHANGELOG.md` — the release workflow refuses to publish a version with no
  changelog section. Contributor-facing process lives in `CONTRIBUTING.md`.
